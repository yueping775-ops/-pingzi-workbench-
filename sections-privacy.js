/* ============================================================
   板块三 · 个辅（隐私红线区）   板块四 · 危机干预（隐私红线区）
   ============================================================ */
(function () {
  const SECTIONS = (window.SECTIONS = window.SECTIONS || {});

  const counselFields = [
    { key: 'code', label: '化名/编号', type: 'text', placeholder: '如 X-07（强制脱敏）' },
    { key: 'type', label: '类型', type: 'select', options: ['预约登记', '访谈记录'] },
    { key: 'date', label: '日期', type: 'date' },
    { key: 'content', label: '内容记录', type: 'textarea' }
  ];
  const crisisFields = [
    { key: 'code', label: '化名/编号', type: 'text', placeholder: '如 G-03（强制脱敏）' },
    { key: 'level', label: '风险等级', type: 'select', options: ['低', '中', '高', '极高'] },
    { key: 'followup', label: '跟进计划', type: 'textarea' },
    { key: 'note', label: '备注', type: 'textarea' }
  ];

  /* ---------- 个辅 ---------- */
  SECTIONS.counsel = {
    name: 'counsel',
    computed: {
      records() { return Store.state.data.counsel_records || []; }
    },
    data() {
      return { modal: false, draft: null, fields: counselFields };
    },
    methods: {
      open(r) { this.draft = r ? U.clone(r) : null; this.modal = true; },
      onSave(obj) {
        if (Store.get('counsel_records', obj.id)) Store.update('counsel_records', obj.id, obj);
        else Store.add('counsel_records', obj);
        this.modal = false; this.$root.toast('已保存（脱敏）');
      },
      del(r) { Store.remove('counsel_records', r.id); }
    },
    template: `
    <div class="privacy-zone">
      <div class="privacy-banner"><span class="lock">🔒</span>隐私数据，绝对保密<span class="warn">本地/私有管理 · 严禁外传</span></div>
      <div class="privacy-content">
        <div class="page-head">
          <div><div class="page-title">个辅 · <span class="accent">隐私红线区</span></div>
          <div class="page-desc">所有记录强制使用化名/编号 · 纯本地管理 · 绝不自动化分享</div></div>
          <div class="spacer"></div>
          <button class="btn btn-ghost" @click="open(null)">+ 新增脱敏记录</button>
        </div>

        <div class="card">
          <div class="card-h"><span class="ic">🛡️</span><h3>脱敏预约登记 / 访谈记录</h3></div>
          <div class="list">
            <div class="item" v-for="r in records" :key="r.id">
              <div class="body">
                <div class="title">{{ r.code || '未编号' }} <span class="tag" style="background:var(--c-primary-deep)">{{ r.type }}</span> <span class="muted" style="font-weight:400;font-size:12px">{{ r.date }}</span></div>
                <div class="meta">{{ r.content }}</div>
                <div class="meta" v-if="r.fields && Object.keys(r.fields).length"><span v-for="(v,k) in r.fields" :key="k" class="chip" style="margin-right:5px">{{ k }}: {{ v }}</span></div>
              </div>
              <div class="ops">
                <button class="btn btn-line btn-sm" @click="open(r)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="del(r)">删</button>
              </div>
            </div>
            <div v-if="!records.length" class="empty"><span class="big">🔐</span>暂无记录，点击右上角新增</div>
          </div>
        </div>
      </div>

      <record-editor :show="modal" title="脱敏个辅记录" module-key="counsel" :fields="fields" :value="draft" @save="onSave" @close="modal=false"></record-editor>
    </div>`
  };

  /* ---------- 危机干预 ---------- */
  SECTIONS.crisis = {
    name: 'crisis',
    computed: {
      docs() { return (Store.state.data.crisis_docs || []).filter(d => d.type === '制度'); },
      high() { return (Store.state.data.crisis_docs || []).filter(d => d.type === '高危档案'); }
    },
    data() {
      return {
        fields: crisisFields,
        highModal: false, highDraft: null,
        docModal: false, docDraft: { id: '', name: '', note: '' }
      };
    },
    methods: {
      openHigh(r) { this.highDraft = r ? U.clone(r) : null; this.highModal = true; },
      onHighSave(obj) {
        if (Store.get('crisis_docs', obj.id)) Store.update('crisis_docs', obj.id, obj);
        else Store.add('crisis_docs', obj);
        this.highModal = false; this.$root.toast('高危档案已保存（脱敏）');
      },
      delHigh(r) { Store.remove('crisis_docs', r.id); },
      openDoc(d) { this.docDraft = d ? U.clone(d) : { id: Store.uid(), name: '', note: '' , type:'制度'}; this.docModal = true; },
      saveDoc() {
        if (!this.docDraft.name.trim()) { this.$root.toast('请填写文件名'); return; }
        if (Store.get('crisis_docs', this.docDraft.id)) Store.update('crisis_docs', this.docDraft.id, this.docDraft);
        else Store.add('crisis_docs', Object.assign({ type: '制度' }, this.docDraft));
        this.docModal = false; this.$root.toast('制度文件已归档');
      },
      delDoc(d) { Store.remove('crisis_docs', d.id); },
      lvClass(l) { return { '低': 'cd-ok', '中': 'cd-warn', '高': 'cd-danger', '极高': 'cd-danger' }[l] || ''; }
    },
    template: `
    <div class="privacy-zone">
      <div class="privacy-banner"><span class="lock">🔒</span>隐私数据，绝对保密<span class="warn">最高级隔离 · 仅私有访问</span></div>
      <div class="privacy-content">
        <div class="page-head">
          <div><div class="page-title">危机干预 · <span class="accent">隐私红线区</span></div>
          <div class="page-desc">制度归档 · 高危档案脱敏跟进 · 单条档案支持多附件（量表/转介单）</div></div>
        </div>

        <div class="card" style="margin-bottom:14px">
          <div class="card-h"><span class="ic">📜</span><h3>制度区（学校 / 上级危机干预制度文件）</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="openDoc(null)">+ 归档制度</button></div>
          <div class="list">
            <div class="item" v-for="d in docs" :key="d.id">
              <div class="body">
                <div class="title">{{ d.name }}</div>
                <div class="meta">{{ d.note || '—' }} <span v-if="d.files&&d.files.length">· 📎{{ d.files.length }}</span></div>
              </div>
              <div class="ops">
                <button class="btn btn-line btn-sm" @click="openDoc(d)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="delDoc(d)">删</button>
              </div>
            </div>
            <div v-if="!docs.length" class="empty">暂无制度文件</div>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><span class="ic">🚩</span><h3>高危档案（脱敏跟进）</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="openHigh(null)">+ 新增高危档案</button></div>
          <div class="list">
            <div class="item" v-for="r in high" :key="r.id">
              <div class="body">
                <div class="title">{{ r.code || '未编号' }} <span class="pill" :class="lvClass(r.level)" style="background:rgba(0,0,0,.06)">{{ r.level||'未评级' }}</span></div>
                <div class="meta">跟进：{{ r.followup || '—' }}</div>
                <div class="meta" v-if="r.files&&r.files.length">📎 附件 {{ r.files.length }} 个（量表截图 / 转介单等）</div>
                <div class="meta" v-if="r.fields && Object.keys(r.fields).length"><span v-for="(v,k) in r.fields" :key="k" class="chip" style="margin-right:5px">{{ k }}: {{ v }}</span></div>
              </div>
              <div class="ops">
                <button class="btn btn-line btn-sm" @click="openHigh(r)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="delHigh(r)">删</button>
              </div>
            </div>
            <div v-if="!high.length" class="empty"><span class="big">🛡️</span>暂无高危档案</div>
          </div>
        </div>
      </div>

      <record-editor :show="highModal" title="高危档案（脱敏）" module-key="crisis" :fields="fields" :value="highDraft" :with-files="true" @save="onHighSave" @close="highModal=false"></record-editor>

      <modal :show="docModal" title="归档制度文件" @close="docModal=false">
        <div class="field"><label>文件名称</label><input class="input" v-model="docDraft.name" placeholder="如《校园心理危机干预预案》" /></div>
        <div class="field"><label>说明</label><textarea class="textarea" v-model="docDraft.note"></textarea></div>
        <div class="field"><label>上传制度文件（PDF/图片等）</label><file-uploader :rec-id="docDraft.id"></file-uploader></div>
        <template #foot><button class="btn btn-primary" @click="saveDoc">归档</button><button class="btn btn-line" @click="docModal=false">取消</button></template>
      </modal>
    </div>`
  };
})();
