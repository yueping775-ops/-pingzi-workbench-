/* ============================================================
   平子的工作台 · 数据层（本地优先 + 可选云同步）
   - 结构化数据：localStorage（实时读写，无 SW 缓存）
   - 二进制附件：IndexedDB
   - 跨端：一键导出/导入 JSON + 可选 sync-server
   ============================================================ */
(function () {
  const { reactive, ref, watch } = Vue;
  const LS_KEY = 'pingzi_workbench_v1';

  /* ---------- 工具 ---------- */
  function uid() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- 默认设置 ---------- */
  function defaultSettings() {
    return {
      logoEmoji: '🪷',
      logoText: '平子的工作台',
      weekStart: todayStr(),          // 学期第一教学周周一
      periods: [
        { i: 1, name: '第1节', start: '08:00', end: '08:45' },
        { i: 2, name: '第2节', start: '08:55', end: '09:40' },
        { i: 3, name: '第3节', start: '10:00', end: '10:45' },
        { i: 4, name: '第4节', start: '10:55', end: '11:40' },
        { i: 5, name: '第5节', start: '14:30', end: '15:15' },
        { i: 6, name: '第6节', start: '15:25', end: '16:10' },
        { i: 7, name: '第7节', start: '16:30', end: '17:15' },
        { i: 8, name: '延时服务', start: '17:25', end: '18:10' }
      ],
      holidays: [
        { name: '中秋节', date: new Date(new Date().getFullYear(), 8, 17).toISOString().slice(0, 10) },
        { name: '国庆节', date: new Date(new Date().getFullYear(), 9, 1).toISOString().slice(0, 10) },
        { name: '寒假', date: new Date(new Date().getFullYear(), 11, 25).toISOString().slice(0, 10) },
        { name: '暑假', date: new Date(new Date().getFullYear() + 1, 5, 1).toISOString().slice(0, 10) }
      ],
      semesterBase: {},               // "wd-p" -> {name, cls, type}
      privacyWatermark: '隐私数据 · 绝对保密',
      toolLinks: { wps: '', feishu: '', ima: '' },
      customFields: {}                // moduleKey -> [{key,label,type,options,placeholder}]
    };
  }

  /* ---------- 默认数据（让界面开箱即用） ---------- */
  function seed() {
    const t = todayStr();
    return {
      home_todos: [
        { id: uid(), title: '完成 7 班心理测评数据汇总', priority: '高', due: t, done: false, note: '需脱敏后归档' },
        { id: uid(), title: '准备周三社团课材料', priority: '中', due: offsetDate(3), done: false, note: '' }
      ],
      home_reschedules: [
        { id: uid(), from: '周一第3节', to: '周三第5节', cls: '7(2)班', notified: true, note: '因运动会冲突' }
      ],
      schedule_overrides: {},         // 当周调课：key "wd-p" -> 课程
      lesson_preps: [
        { id: uid(), title: '《认识情绪》教案', link: '', type: '教案', cls: '7年级', date: t, files: [], note: 'WPS 链接可填入' }
      ],
      classroom_tracks: [
        { id: uid(), cls: '7(1)班', situation: '整体参与度良好，3 名学生需重点关注', missed: '无' }
      ],
      counsel_records: [
        { id: uid(), code: 'X-07', type: '预约登记', date: t, content: '（化名）来访，主诉学业压力，已做初步倾听。', fields: {} }
      ],
      crisis_docs: [
        { id: uid(), name: '学校心理危机干预预案(2024)', type: '制度', level: '', code: '', followup: '', note: '上级部门下发', files: [] }
      ],
      research: [
        { id: uid(), type: '听课', title: '听王老师《人际交往》公开课', date: t, link: '', content: '小组活动设计值得借鉴。', files: [] }
      ],
      papers: [
        { id: uid(), title: '初中生情绪调节的校本课程研究', stage: '中期', progress: 55, link: '', note: '已提交中期报告', refs: '' }
      ],
      competitions: [
        { id: uid(), name: '市心理健康优质课评比', deadline: offsetDate(20), milestone: '校内选拔', notifyFile: '', materials: [], note: '' }
      ],
      grade7_tasks: [
        { id: uid(), title: '心理测评数据整理', status: '进行中', progress: 60, note: '7个班', due: offsetDate(5) },
        { id: uid(), title: '心育活动月策划', status: '未开始', progress: 0, note: '', due: offsetDate(12) },
        { id: uid(), title: '迎检材料归档', status: '已完成', progress: 100, note: '', due: t }
      ],
      sharing: [
        { id: uid(), kind: '他人作品', source: '小红书', title: '心理老师如何做破冰活动', content: '点赞高的破冰游戏合集，可用于社团课。', likes: 3200, collects: 1100, tags: '心理老师,活动', url: '' },
        { id: uid(), kind: '自己工作', source: '手动', title: '本周工作复盘', content: '个辅节奏稳定，需在危机档案上补充转介单。', likes: 0, collects: 0, tags: '复盘', url: '' }
      ],
      inspiration: [
        { id: uid(), content: '闪念：把"情绪天气预报"做成每周固定仪式。', createdAt: new Date().toISOString() }
      ],
      selfcare_quotes: [
        { id: uid(), q: '你不需要把所有人的情绪都扛在肩上。', a: '—— 写给疲惫的自己' },
        { id: uid(), q: '照顾他人之前，先确认自己还站着。', a: '—— 自我关怀第一条' },
        { id: uid(), q: '慢一点，呼吸还在，事情就会过去。', a: '—— 正念练习' }
      ],
      selfcare_relax: [
        { id: uid(), title: '5 分钟正念呼吸', type: 'audio', ico: '🧘', url: '' },
        { id: uid(), title: '雨声白噪音', type: 'audio', ico: '🌧️', url: '' },
        { id: uid(), title: '身体扫描放松', type: 'video', ico: '🌿', url: '' }
      ]
    };
  }
  function offsetDate(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  /* ---------- 载入/合并 ---------- */
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { saved = {}; }
  const defaults = seed();
  const data = Object.assign({}, defaults, saved.data || {});
  const settings = reactive(Object.assign(defaultSettings(), saved.settings || {}));

  const state = reactive({ data });

  /* ---------- 持久化（防抖） ---------- */
  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const payload = { v: 1, savedAt: new Date().toISOString(), settings: JSON.parse(JSON.stringify(settings)), data: JSON.parse(JSON.stringify(state.data)) };
      try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); Store.lastSaved = payload.savedAt; } catch (e) { console.warn('保存失败', e); }
    }, 250);
  }
  watch(settings, persist, { deep: true });
  watch(state.data, persist, { deep: true });

  /* ---------- 通用集合操作 ---------- */
  const Store = {
    uid, todayStr, offsetDate, deepClone,
    state, settings,
    lastSaved: saved.savedAt || null,
    collection(key) { return state.data[key]; },
    all(key) { return state.data[key] || []; },
    add(key, item) { const arr = state.data[key] || (state.data[key] = []); const it = Object.assign({ id: uid() }, item); arr.unshift(it); return it; },
    update(key, id, patch) { const arr = state.data[key] || []; const i = arr.findIndex(x => x.id === id); if (i >= 0) { arr[i] = Object.assign({}, arr[i], patch); return arr[i]; } },
    remove(key, id) { const arr = state.data[key] || []; const i = arr.findIndex(x => x.id === id); if (i >= 0) { const [r] = arr.splice(i, 1); FileDB.deleteAll(r.id); } },
    get(key, id) { return (state.data[key] || []).find(x => x.id === id); },

    /* 课表：合并学期固定课表 + 当周调课覆盖 */
    dayCourses(wd) {
      const out = [];
      (settings.periods || []).forEach(p => {
        const key = wd + '-' + p.i;
        const ov = state.data.schedule_overrides ? state.data.schedule_overrides[key] : null;
        const base = settings.semesterBase ? settings.semesterBase[key] : null;
        const c = ov || base;
        if (c) out.push({ period: p, course: c, overridden: !!ov });
      });
      return out;
    },

    /* 设置项 */
    setSetting(k, v) { settings[k] = v; },
    saveSettings() { persist(); },

    /* 自定义字段 */
    customFields(moduleKey) { return settings.customFields[moduleKey] || []; },
    addCustomField(moduleKey, def) { if (!settings.customFields[moduleKey]) settings.customFields[moduleKey] = []; settings.customFields[moduleKey].push(def); },
    removeCustomField(moduleKey, idx) { if (settings.customFields[moduleKey]) settings.customFields[moduleKey].splice(idx, 1); },

    /* 导入导出（跨端/备份） */
    exportAll() {
      return JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), settings: JSON.parse(JSON.stringify(settings)), data: JSON.parse(JSON.stringify(state.data)) }, null, 2);
    },
    importAll(json) {
      const obj = typeof json === 'string' ? JSON.parse(json) : json;
      if (obj.settings) Object.assign(settings, obj.settings);
      if (obj.data) { for (const k in obj.data) state.data[k] = obj.data[k]; }
      persist();
    },
    resetAll() {
      if (!confirm('确认清空全部本地数据并恢复默认？此操作不可撤销。')) return false;
      localStorage.removeItem(LS_KEY);
      Object.keys(state.data).forEach(k => delete state.data[k]);
      Object.assign(state.data, seed());
      Object.assign(settings, defaultSettings());
      persist();
      return true;
    },

    /* 可选云端同步（手动上传/下载） */
    async syncPush(server, token) {
      if (!server || !token) throw new Error('请填写同步服务器地址和令牌');
      const url = server.replace(/\/$/, '') + '/sync?token=' + encodeURIComponent(token);
      const resp = await fetch(url, { method: 'POST', body: this.exportAll(), headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) throw new Error('上传失败：' + (await resp.text()));
      return await resp.json();
    },
    async syncPull(server, token) {
      if (!server || !token) throw new Error('请填写同步服务器地址和令牌');
      const url = server.replace(/\/$/, '') + '/sync?token=' + encodeURIComponent(token);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('下载失败：' + (await resp.text()));
      this.importAll(await resp.text());
      return true;
    }
  };

  /* ---------- IndexedDB 文件存储 ---------- */
  const FileDB = (function () {
    const DB = 'pingzi_files', STORE = 'files';
    let dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: 'fid' }); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      return dbp;
    }
    return {
      async put(recId, file) {
        const db = await open();
        const fid = recId + '__' + file.id;
        return new Promise((res, rej) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put({ fid, recId, id: file.id, name: file.name, size: file.size, mime: file.type, blob: file.blob });
          tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
        });
      },
      async list(recId) {
        const db = await open();
        return new Promise((res, rej) => {
          const out = [];
          const tx = db.transaction(STORE, 'readonly');
          const rq = tx.objectStore(STORE).openCursor();
          rq.onsuccess = () => { const c = rq.result; if (c) { if (c.value.recId === recId) out.push(c.value); c.continue(); } else res(out); };
          rq.onerror = () => rej(rq.error);
        });
      },
      async get(fid) {
        const db = await open();
        return new Promise((res, rej) => { const rq = db.transaction(STORE, 'readonly').objectStore(STORE).get(fid); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
      },
      async delete(fid) {
        const db = await open();
        return new Promise((res, rej) => { const rq = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(fid); rq.onsuccess = () => res(true); rq.onerror = () => rej(rq.error); });
      },
      async deleteAll(recId) {
        const all = await this.list(recId);
        for (const f of all) await this.delete(f.fid);
      }
    };
  })();
  Store.FileDB = FileDB;

  window.Store = Store;
})();
