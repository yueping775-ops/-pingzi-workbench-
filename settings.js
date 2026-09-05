/* ============================================================
   全局设置中心 · 自定义权限（Logo / 字段 / 时间节点）
   ============================================================ */
(function () {
  const SECTIONS = (window.SECTIONS = window.SECTIONS || {});

  const MODULES = [
    { key: 'counsel', label: '个辅' },
    { key: 'crisis', label: '危机干预' },
    { key: 'research', label: '教研培训' },
    { key: 'paper', label: '论文课题' },
    { key: 'competition', label: '比赛' },
    { key: 'grade7', label: '7年级事务' },
    { key: 'sharing', label: '分享灵感' }
  ];
  const FTYPES = ['text', 'textarea', 'date', 'number', 'select', 'checkbox'];

  SECTIONS.settings = {
    name: 'settings',
    data() {
      return {
        modules: MODULES, ftypes: FTYPES,
        newHoliday: { name: '', date: '' },
        cfModule: 'counsel',
        cfForm: { label: '', type: 'text', options: '' },
        showSync: false,
        importMsg: '',
        syncMsg: '',
        syncForm: { server: '', token: '' }
      };
    },
    computed: {
      settings() { return Store.settings; },
      periods() { return Store.settings.periods; },
      holidays() { return Store.settings.holidays; },
      tools() { return Store.settings.toolLinks; },
      lastSaved() { return Store.lastSaved ? U.fmtDateTime(Store.lastSaved) : '尚未保存'; }
    },
    methods: {
      addHoliday() {
        if (!this.newHoliday.name.trim() || !this.newHoliday.date) { this.$root.toast('请填写名称与日期'); return; }
        Store.settings.holidays.push(U.clone(this.newHoliday));
        this.newHoliday = { name: '', date: '' }; this.$root.toast('已添加假期');
      },
      delHoliday(i) { Store.settings.holidays.splice(i, 1); },
      savePeriod(i) { this.$root.toast('节次已更新'); },
      addField() {
        const lbl = this.cfForm.label.trim(); if (!lbl) { this.$root.toast('请填写字段名'); return; }
        Store.addCustomField(this.cfModule, { key: 'cf_' + Store.uid().slice(3, 9), label: lbl, type: this.cfForm.type, options: this.cfForm.options, placeholder: '' });
        this.cfForm = { label: '', type: 'text', options: '' };
      },
      delField(m, idx) { Store.removeCustomField(m, idx); },
      exportData() {
        const json = Store.exportAll();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pingzi_backup_' + Store.todayStr() + '.json'; a.click();
        URL.revokeObjectURL(url); this.$root.toast('已导出备份');
      },
      importData(e) {
        const f = e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { try { Store.importAll(rd.result); this.importMsg = '导入成功'; this.$root.toast('导入成功，数据已恢复'); } catch (err) { this.importMsg = '导入失败：格式错误'; } };
        rd.readAsText(f); e.target.value = '';
      },
      resetAll() { if (Store.resetAll()) this.$root.toast('已恢复默认数据'); },
      async syncPush() {
        try { const r = await Store.syncPush(this.syncForm.server, this.syncForm.token); this.syncMsg = '上传成功：' + r.bytes + ' 字节'; this.$root.toast(this.syncMsg); }
        catch (e) { this.syncMsg = e.message; this.$root.toast(e.message); }
      },
      async syncPull() {
        try { await Store.syncPull(this.syncForm.server, this.syncForm.token); this.syncMsg = '下载并恢复成功'; this.$root.toast(this.syncMsg); }
        catch (e) { this.syncMsg = e.message; this.$root.toast(e.message); }
      }
    },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">设置 · <span class="accent">全局自定义</span></div>
        <div class="page-desc">Logo / 字段 / 时间节点 均可自行调整 · 数据本地优先 · 实时同步</div></div></div>

      <!-- 基础 -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><span class="ic">🎨</span><h3>品牌与标识</h3></div>
        <div class="row">
          <div class="field" style="flex:0 0 120px"><label>Logo（emoji）</label><input class="input" v-model="settings.logoEmoji" placeholder="🪷" style="font-size:20px;text-align:center" /></div>
          <div class="field" style="flex:1"><label>工作台名称</label><input class="input" v-model="settings.logoText" /></div>
        </div>
        <div class="row">
          <div class="field" style="flex:1"><label>学期第一教学周（周一）</label><input class="input" type="date" v-model="settings.weekStart" /></div>
          <div class="field" style="flex:1"><label>隐私水印文字</label><input class="input" v-model="settings.privacyWatermark" /></div>
        </div>
        <div class="muted" style="font-size:12px">当前：第 {{ U.teachingWeek(settings.weekStart) }} 教学周 · 上次保存 {{ lastSaved }}</div>
      </div>

      <!-- 课表节次时间 -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><span class="ic">⏱️</span><h3>课表节次与时间段（可改）</h3></div>
        <div v-for="(p,i) in periods" :key="p.i" class="row" style="margin-bottom:8px">
          <input class="input" v-model="p.name" style="flex:1.3" />
          <input class="input" type="time" v-model="p.start" />
          <input class="input" type="time" v-model="p.end" />
        </div>
        <div class="muted" style="font-size:12px">修改后即时生效，课表左侧「第几节 + 时间段」随之更新。</div>
      </div>

      <!-- 假期倒计时 -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><span class="ic">🏖️</span><h3>假期倒计时</h3></div>
        <div class="row" style="margin-bottom:10px">
          <input class="input" v-model="newHoliday.name" placeholder="如 中秋节" />
          <input class="input" type="date" v-model="newHoliday.date" />
          <button class="btn btn-primary btn-sm" style="flex:0 0 auto" @click="addHoliday">添加</button>
        </div>
        <div class="list">
          <div class="item" v-for="(h,i) in holidays" :key="h.name">
            <div class="body"><div class="title">{{ h.name }}</div><div class="meta">{{ h.date }} · 剩 {{ U.daysLeft(h.date) }} 天</div></div>
            <button class="btn btn-danger btn-sm" @click="delHoliday(i)">删</button>
          </div>
          <div v-if="!holidays.length" class="empty">暂无假期</div>
        </div>
      </div>

      <!-- 工具链接 -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><span class="ic">🔗</span><h3>深度链接（WPS / 飞书 / IMA）</h3></div>
        <div class="field"><label>WPS 主页/空间链接</label><input class="input" v-model="tools.wps" placeholder="https://www.kdocs.cn/..." /></div>
        <div class="row">
          <div class="field" style="flex:1"><label>飞书链接</label><input class="input" v-model="tools.feishu" placeholder="https://www.feishu.cn/..." /></div>
          <div class="field" style="flex:1"><label>IMA 链接</label><input class="input" v-model="tools.ima" placeholder="https://ima.qq.com/..." /></div>
        </div>
      </div>

      <!-- 自定义字段 -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><span class="ic">🧩</span><h3>各板块自定义字段（可自行增删）</h3></div>
        <div class="row" style="margin-bottom:10px">
          <select class="select" v-model="cfModule" style="flex:0 0 160px">
            <option v-for="m in modules" :key="m.key" :value="m.key">{{ m.label }}</option>
          </select>
          <input class="input" v-model="cfForm.label" placeholder="新字段名，如 转介去向" />
          <select class="select" v-model="cfForm.type" style="flex:0 0 120px">
            <option v-for="t in ftypes" :key="t" :value="t">{{ t }}</option>
          </select>
          <input class="input" v-model="cfForm.options" placeholder="select时选项,逗号分隔" />
          <button class="btn btn-primary btn-sm" style="flex:0 0 auto" @click="addField">+ 增加</button>
        </div>
        <div class="list">
          <div class="item" v-for="(f,idx) in (Store.customFields(cfModule)||[])" :key="f.key">
            <div class="body"><div class="title">{{ f.label }} <span class="chip">{{ f.type }}</span></div>
              <div class="meta" v-if="f.options">选项：{{ f.options }}</div></div>
            <button class="btn btn-danger btn-sm" @click="delField(cfModule, idx)">删</button>
          </div>
          <div v-if="!(Store.customFields(cfModule)||[]).length" class="empty">该板块暂无自定义字段</div>
        </div>
      </div>

      <!-- 数据与同步 -->
      <div class="card">
        <div class="card-h"><span class="ic">💾</span><h3>数据 · 云端同步</h3></div>
        <div class="muted" style="font-size:12.5px;margin-bottom:10px">
          数据默认存储于本设备（隐私区仅本地，绝不外传）。跨设备/备份请用「导出/导入」；如需多端实时同步，可将本静态站点部署到任意支持公网访问的服务器（如 Nginx / 对象存储 / 云服务），并在同域下启用可选 sync-server（见仓库内 sync-server.py）。Service Worker 已彻底关闭，每次均实时拉取服务器最新文件。
        </div>
        <div class="row">
          <button class="btn btn-primary" @click="exportData">⬇️ 导出备份(JSON)</button>
          <label class="btn btn-line">⬆️ 导入备份<input type="file" accept="application/json" style="display:none" @change="importData" /></label>
          <button class="btn btn-danger" @click="resetAll">🗑 恢复默认</button>
        </div>
        <div v-if="importMsg" class="muted" style="margin-top:8px">{{ importMsg }}</div>

        <div style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--c-line)">
          <div class="row">
            <div class="field" style="flex:1"><label>同步服务器地址</label><input class="input" v-model="syncForm.server" placeholder="如 https://pingzi.example.com/sync" /></div>
            <div class="field" style="flex:1"><label>同步令牌</label><input class="input" v-model="syncForm.token" placeholder="强 token，请勿泄露" /></div>
          </div>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-primary" @click="syncPush">☁️ 上传到云端</button>
            <button class="btn btn-ghost" @click="syncPull">☁️ 从云端下载</button>
          </div>
          <div v-if="syncMsg" class="muted" style="margin-top:8px">{{ syncMsg }}</div>
        </div>
      </div>
    </div>`
  };
})();
