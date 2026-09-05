/* ============================================================
   平子的工作台 · 根应用 + 全局组件
   ============================================================ */
(function () {
  const { createApp, reactive } = Vue;

  /* ---------- 全局组件：modal ---------- */
  const Modal = {
    name: 'Modal',
    props: ['show', 'title'],
    emits: ['close'],
    template: `
    <div class="modal-mask" v-if="show" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head"><h3>{{ title }}</h3><button class="icon-btn" @click="$emit('close')">✕</button></div>
        <div class="modal-body"><slot/></div>
        <div class="modal-foot" v-if="$slots.foot"><slot name="foot"/></div>
      </div>
    </div>`
  };

  /* ---------- 全局组件：file-uploader（IndexedDB） ---------- */
  const FileUploader = {
    name: 'FileUploader',
    props: ['recId'],
    emits: ['change'],
    data() { return { files: [], busy: false }; },
    watch: { recId() { this.refresh(); } },
    mounted() { this.refresh(); },
    methods: {
      async refresh() {
        if (!this.recId) { this.files = []; return; }
        this.files = await Store.FileDB.list(this.recId);
        this.$emit('change', this.files.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.mime })));
      },
      async onPick(e) {
        const list = e.target.files; if (!list || !list.length) return;
        this.busy = true;
        for (const f of list) {
          const id = Store.uid();
          await Store.FileDB.put(this.recId, { id, name: f.name, size: f.size, type: f.type, blob: f });
        }
        e.target.value = ''; this.busy = false; await this.refresh();
      },
      async onDownload(f) {
        const rec = await Store.FileDB.get(this.recId + '__' + f.id);
        if (rec && rec.blob) { const url = URL.createObjectURL(rec.blob); const a = document.createElement('a'); a.href = url; a.download = f.name; a.click(); URL.revokeObjectURL(url); }
      },
      async onDel(f) { await Store.FileDB.delete(f.fid); await this.refresh(); }
    },
    template: `
    <div>
      <label class="btn btn-line btn-sm" style="margin-bottom:8px">📎 选择文件上传<input type="file" multiple style="display:none" @change="onPick" /></label>
      <div v-if="busy" class="muted" style="font-size:12px">上传中…</div>
      <div class="file-list" v-if="files.length">
        <div class="file-chip" v-for="f in files" :key="f.fid">
          <span class="fi">{{ U.fileIcon(f.name) }}</span>
          <span class="fn" :title="f.name">{{ f.name }}</span>
          <span class="muted">{{ U.fmtSize(f.size) }}</span>
          <span class="fd" @click="onDownload(f)" title="下载">⬇</span>
          <span class="fd" @click="onDel(f)" title="删除">✕</span>
        </div>
      </div>
      <div v-else class="muted" style="font-size:12px">支持 PDF / PPT / WORD / 图片 / 音视频（本地存储，不外传）</div>
    </div>`
  };

  /* ---------- 全局组件：record-editor（基础字段 + 自定义字段 + 多附件） ---------- */
  const RecordEditor = {
    name: 'RecordEditor',
    props: ['show', 'title', 'moduleKey', 'fields', 'value', 'withFiles'],
    emits: ['save', 'close'],
    data() {
      return {
        draftId: '', draft: {}, cfOpen: false,
        newCf: { label: '', type: 'text', options: '' }, ftypes: ['text', 'textarea', 'date', 'number', 'select', 'checkbox']
      };
    },
    watch: { show(v) { if (v) this.init(); } },
    computed: { customFields() { return Store.customFields(this.moduleKey); } },
    methods: {
      defVal(f, v) {
        if (v && v[f.key] !== undefined && v[f.key] !== null && v[f.key] !== '') return v[f.key];
        if (f.type === 'checkbox') return false;
        if (f.type === 'number') return 0;
        if (f.type === 'select') return (f.options && f.options[0]) || '';
        if (f.type === 'date') return Store.todayStr();
        return '';
      },
      init() {
        const v = this.value;
        this.draftId = (v && v.id) ? v.id : Store.uid();
        this.draft = {};
        (this.fields || []).forEach(f => { this.draft[f.key] = this.defVal(f, v); });
        this.customFields.forEach(f => { this.draft[f.key] = (v && v.fields && v.fields[f.key] !== undefined) ? v.fields[f.key] : this.defVal(f, null); });
      },
      save() {
        const r = { id: this.draftId };
        (this.fields || []).forEach(f => { r[f.key] = this.draft[f.key]; });
        if (this.customFields.length) {
          r.fields = {};
          this.customFields.forEach(f => { r.fields[f.key] = this.draft[f.key]; });
        }
        this.$emit('save', r);
      },
      addCf() {
        const lbl = this.newCf.label.trim(); if (!lbl) return;
        Store.addCustomField(this.moduleKey, { key: 'cf_' + Store.uid().slice(3, 9), label: lbl, type: this.newCf.type, options: this.newCf.options, placeholder: '' });
        this.newCf = { label: '', type: 'text', options: '' };
      },
      delCf(idx) { Store.removeCustomField(this.moduleKey, idx); this.init(); }
    },
    template: `
    <modal :show="show" :title="title" @close="$emit('close')">
      <div v-for="f in fields" :key="f.key" class="field">
        <label>{{ f.label }}</label>
        <textarea v-if="f.type==='textarea'" class="textarea" v-model="draft[f.key]" :placeholder="f.placeholder"></textarea>
        <select v-else-if="f.type==='select'" class="select" v-model="draft[f.key]">
          <option v-for="o in (f.options||[])" :key="o" :value="o">{{ o }}</option>
        </select>
        <input v-else-if="f.type==='date'" type="date" class="input" v-model="draft[f.key]" />
        <input v-else-if="f.type==='number'" type="number" class="input" v-model.number="draft[f.key]" />
        <input v-else-if="f.type==='checkbox'" type="checkbox" v-model="draft[f.key]" />
        <input v-else class="input" v-model="draft[f.key]" :placeholder="f.placeholder" />
      </div>

      <div v-if="customFields.length" class="section-title-bar"><h4>自定义字段</h4><div class="line"></div></div>
      <div v-for="f in customFields" :key="f.key" class="field">
        <label>{{ f.label }} <span class="chip">{{ f.type }}</span></label>
        <textarea v-if="f.type==='textarea'" class="textarea" v-model="draft[f.key]"></textarea>
        <select v-else-if="f.type==='select'" class="select" v-model="draft[f.key]">
          <option v-for="o in (f.options? f.options.split(','): [])" :key="o" :value="o.trim()">{{ o.trim() }}</option>
        </select>
        <input v-else-if="f.type==='date'" type="date" class="input" v-model="draft[f.key]" />
        <input v-else-if="f.type==='number'" type="number" class="input" v-model.number="draft[f.key]" />
        <input v-else-if="f.type==='checkbox'" type="checkbox" v-model="draft[f.key]" />
        <input v-else class="input" v-model="draft[f.key]" />
      </div>

      <div v-if="withFiles" class="field"><label>📎 附件（量表截图 / 转介单等，可多份）</label><file-uploader :rec-id="draftId"></file-uploader></div>

      <div style="margin-top:6px"><button class="btn btn-line btn-sm" @click="cfOpen=!cfOpen">🧩 管理本板块自定义字段</button></div>
      <div v-if="cfOpen" class="card" style="background:var(--c-primary-faint);margin-top:8px">
        <div class="row" style="margin-bottom:8px">
          <input class="input" v-model="newCf.label" placeholder="字段名" />
          <select class="select" v-model="newCf.type" style="flex:0 0 110px"><option v-for="t in ftypes" :key="t" :value="t">{{ t }}</option></select>
          <input class="input" v-model="newCf.options" placeholder="select选项,逗号分隔" />
          <button class="btn btn-primary btn-sm" style="flex:0 0 auto" @click="addCf">+ 加</button>
        </div>
        <div class="list">
          <div class="item" v-for="(f,idx) in customFields" :key="f.key">
            <div class="body"><div class="title">{{ f.label }} <span class="chip">{{ f.type }}</span></div><div class="meta" v-if="f.options">选项：{{ f.options }}</div></div>
            <button class="btn btn-danger btn-sm" @click="delCf(idx)">删</button>
          </div>
          <div v-if="!customFields.length" class="empty">暂无自定义字段</div>
        </div>
      </div>

      <template #foot>
        <button class="btn btn-primary" @click="save">保存</button>
        <button class="btn btn-line" @click="$emit('close')">取消</button>
      </template>
    </modal>`
  };

  /* ---------- 根应用 ---------- */
  const App = {
    name: 'App',
    data() {
      return {
        current: 'home',
        drawerOpen: false,
        searchOpen: false, searchKey: '',
        toastMsg: '', _toastT: null,
        now: new Date(),
        navGroups: [
          { title: '指挥舱', items: [{ key: 'home', ico: '🏠', label: '首页' }] },
          { title: '教务', items: [{ key: 'teaching', ico: '📚', label: '上课' }] },
          { title: '隐私红线区', items: [{ key: 'counsel', ico: '🔐', label: '个辅', flag: '🔒' }, { key: 'crisis', ico: '🚩', label: '危机干预', flag: '🔒' }] },
          { title: '成长', items: [
            { key: 'research', ico: '📖', label: '教研培训' },
            { key: 'paper', ico: '📝', label: '论文课题' },
            { key: 'competition', ico: '🏆', label: '比赛' },
            { key: 'grade7', ico: '🗂️', label: '7年级事务' }
          ] },
          { title: '能量', items: [
            { key: 'sharing', ico: '💡', label: '分享灵感' },
            { key: 'selfcare', ico: '🌿', label: '自我关怀' }
          ] },
          { title: '系统', items: [{ key: 'settings', ico: '⚙️', label: '设置' }] }
        ],
        tabbar: ['home', 'teaching', 'counsel', 'crisis', 'grade7', 'selfcare', 'settings'],
        tabIcons: { home: '🏠', teaching: '📚', counsel: '🔐', crisis: '🚩', grade7: '🗂️', selfcare: '🌿', settings: '⚙️' },
        tabLabels: { home: '首页', teaching: '上课', counsel: '个辅', crisis: '危机', grade7: '7年级', selfcare: '关怀', settings: '设置' }
      };
    },
    computed: {
      settings() { return Store.settings; },
      currentComponent() { return (window.SECTIONS || {})[this.current]; },
      activePrivacy() { return this.current === 'counsel' || this.current === 'crisis'; },
      nowText() { return U.nowParts(this.now).time; },
      todayText() { return U.nowParts(this.now).date; },
      currentTeachingWeek() { return U.teachingWeek(Store.settings.weekStart); },
      envMode() { return '云端 · 实时模式'; },
      syncText() { return Store.lastSaved ? '已同步' : '实时'; },
      searchResults() {
        const k = this.searchKey.trim().toLowerCase(); if (!k) return [];
        const out = [];
        const push = (module, color, title, sub, id) => { if ((title + ' ' + sub).toLowerCase().includes(k)) out.push({ module, color, title, sub, id }); };
        (Store.state.data.home_todos || []).forEach(t => push('待办', '#b6a6dd', t.title, (t.priority || '') + ' ' + (t.due || ''), t.id));
        (Store.state.data.reschedules || []).forEach(r => push('调课', '#7aa7e0', r.from + '→' + r.to, r.cls, r.id));
        (Store.state.data.lesson_preps || []).forEach(p => push('备课', '#8e79c4', p.title, p.cls, p.id));
        (Store.state.data.counsel_records || []).forEach(r => push('个辅', '#6f6886', r.code, r.content, r.id));
        (Store.state.data.crisis_docs || []).forEach(r => push('危机', '#c0395e', r.name || r.code, r.note, r.id));
        (Store.state.data.research || []).forEach(r => push('教研', '#b6a6dd', r.title, r.content, r.id));
        (Store.state.data.papers || []).forEach(p => push('论文', '#8e79c4', p.title, p.stage, p.id));
        (Store.state.data.competitions || []).forEach(c => push('比赛', '#e8a23d', c.name, c.milestone, c.id));
        (Store.state.data.grade7_tasks || []).forEach(t => push('7年级', '#6fc6a6', t.title, t.note, t.id));
        (Store.state.data.sharing || []).forEach(s => push('分享', '#7aa7e0', s.title, s.content, s.id));
        return out.slice(0, 30);
      }
    },
    methods: {
      go(key) { this.current = key; this.drawerOpen = false; window.scrollTo(0, 0); },
      openSearch() { this.searchOpen = true; this.searchKey = ''; },
      jumpTo(r) {
        const map = { '待办': 'home', '调课': 'home', '备课': 'teaching', '个辅': 'counsel', '危机': 'crisis', '教研': 'research', '论文': 'paper', '比赛': 'competition', '7年级': 'grade7', '分享': 'sharing' };
        this.current = map[r.module] || 'home'; this.searchOpen = false;
      },
      toast(msg) {
        this.toastMsg = msg; clearTimeout(this._toastT);
        this._toastT = setTimeout(() => { this.toastMsg = ''; }, 1800);
      },
      promptEdit(title, val, cb) { const v = window.prompt(title, val); cb(v); }
    },
    mounted() {
      this._timer = setInterval(() => { this.now = new Date(); }, 1000);
      // 隐私区进入即提示
      this.toast('欢迎回来，平子');
    },
    beforeUnmount() { clearInterval(this._timer); }
  };

  const app = createApp(App);
  app.config.warnHandler = () => {};
  app.config.errorHandler = (err, instance, info) => { console.log('VUE_ERR [' + ((instance && instance.$options && instance.$options.name) || '?') + '] ' + err.message + ' @ ' + info); };
  app.config.globalProperties.U = window.U;
  app.config.globalProperties.Store = window.Store;
  // 全局注册，确保各板块组件均可使用
  app.component('Modal', Modal);
  app.component('FileUploader', FileUploader);
  app.component('RecordEditor', RecordEditor);
  app.mount('#app');
})();
