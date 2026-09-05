/* ============================================================
   板块五 · 教研培训学习   板块六 · 论文和课题
   板块七 · 比赛           板块八 · 7年级事务性工作
   ============================================================ */
(function () {
  const SECTIONS = (window.SECTIONS = window.SECTIONS || {});

  const researchFields = [
    { key: 'type', label: '类型', type: 'select', options: ['听课记录', '外出培训'] },
    { key: 'title', label: '主题', type: 'text' },
    { key: 'date', label: '日期', type: 'date' },
    { key: 'link', label: '工具链接(WPS/飞书/IMA)', type: 'text' },
    { key: 'content', label: '笔记 / 收获', type: 'textarea' }
  ];
  const paperFields = [
    { key: 'title', label: '题目', type: 'text' },
    { key: 'stage', label: '阶段', type: 'select', options: ['申报', '开题', '中期检查', '结题'] },
    { key: 'progress', label: '进度(%)', type: 'number' },
    { key: 'link', label: '写作链接(WPS)', type: 'text' },
    { key: 'submit', label: '投稿状态', type: 'select', options: ['未投稿', '已投稿', '审稿中', '录用', '见刊'] },
    { key: 'note', label: '备注', type: 'textarea' }
  ];
  const grade7Fields = [
    { key: 'title', label: '任务', type: 'text' },
    { key: 'status', label: '状态', type: 'select', options: ['未开始', '进行中', '已完成'] },
    { key: 'progress', label: '进度(%)', type: 'number' },
    { key: 'due', label: '截止日期', type: 'date' },
    { key: 'note', label: '说明', type: 'textarea' }
  ];

  /* ---------- 教研培训学习 ---------- */
  SECTIONS.research = {
    name: 'research',
    computed: { list() { return Store.state.data.research || []; } },
    data() { return { modal: false, draft: null, fields: researchFields, tool: Store.settings.toolLinks }; },
    methods: {
      open(r) { this.draft = r ? U.clone(r) : null; this.modal = true; },
      onSave(o) { if (Store.get('research', o.id)) Store.update('research', o.id, o); else Store.add('research', o); this.modal = false; this.$root.toast('已沉淀'); },
      del(r) { Store.remove('research', r.id); },
      deepLink(t) { const u = (this.tool[t] || '').trim(); if (u) window.open(u, '_blank'); else this.$root.toast('请先在「设置」配置 ' + t + ' 链接'); }
    },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">教研培训 · <span class="accent">能力输入</span></div>
        <div class="page-desc">听课记录 / 外出培训笔记 · 调用工具打造心理学知识库</div></div>
        <div class="spacer"></div><button class="btn btn-ghost" @click="open(null)">+ 新增笔记</button></div>

      <div class="card">
        <div class="card-h"><span class="ic">📚</span><h3>知识沉淀</h3></div>
        <div class="list">
          <div class="item" v-for="r in list" :key="r.id">
            <div class="body">
              <div class="title">{{ r.title }} <span class="tag" style="background:var(--c-primary-deep)">{{ r.type }}</span> <span class="muted" style="font-weight:400;font-size:12px">{{ r.date }}</span></div>
              <div class="meta">{{ r.content }}</div>
              <div class="meta" v-if="r.link"><a :href="r.link" target="_blank" style="color:var(--c-primary-deep)">🔗 {{ r.link }}</a></div>
              <div class="meta" v-if="r.fields && Object.keys(r.fields).length"><span v-for="(v,k) in r.fields" :key="k" class="chip" style="margin-right:5px">{{ k }}: {{ v }}</span></div>
            </div>
            <div class="ops"><button class="btn btn-line btn-sm" @click="open(r)">编辑</button><button class="btn btn-danger btn-sm" @click="del(r)">删</button></div>
          </div>
          <div v-if="!list.length" class="empty"><span class="big">📖</span>暂无笔记</div>
        </div>
      </div>

      <div class="row" style="margin-top:12px">
        <button class="btn btn-line" @click="deepLink('wps')">🔗 深度链接 WPS</button>
        <button class="btn btn-line" @click="deepLink('feishu')">🔗 深度链接 飞书</button>
        <button class="btn btn-line" @click="deepLink('ima')">🔗 深度链接 IMA</button>
      </div>

      <record-editor :show="modal" title="教研/培训笔记" module-key="research" :fields="fields" :value="draft" :with-files="true" @save="onSave" @close="modal=false"></record-editor>
    </div>`
  };

  /* ---------- 论文和课题 ---------- */
  SECTIONS.paper = {
    name: 'paper',
    computed: {
      papers() { return Store.state.data.papers || []; },
      stages() { return ['申报', '开题', '中期检查', '结题']; },
      literature() { return Store.state.data.literature || []; }
    },
    data() {
      return { modal: false, draft: null, fields: paperFields,
        litModal: false, lit: { title: '', cat: '', url: '' } };
    },
    methods: {
      open(p) { this.draft = p ? U.clone(p) : null; this.modal = true; },
      onSave(o) { if (Store.get('papers', o.id)) Store.update('papers', o.id, o); else Store.add('papers', o); this.modal = false; this.$root.toast('已更新课题'); },
      del(p) { Store.remove('papers', p.id); },
      byStage(s) { return this.papers.filter(p => p.stage === s); },
      addLit() { if (!this.lit.title.trim()) { this.$root.toast('请填写文献标题'); return; } Store.add('literature', Object.assign({}, this.lit)); this.lit = { title: '', cat: '', url: '' }; this.litModal = false; },
      delLit(l) { Store.remove('literature', l.id); }
    },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">论文和课题 · <span class="accent">学术输出</span></div>
        <div class="page-desc">申报→开题→中期→结题全流程看板 · 文献库 · 写作追踪</div></div>
        <div class="spacer"></div><button class="btn btn-ghost" @click="open(null)">+ 新增课题</button></div>

      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><span class="ic">📊</span><h3>课题进度看板</h3></div>
        <div class="kanban">
          <div class="kanban-col" v-for="s in stages" :key="s">
            <div class="kc-title">{{ s }} <span class="kc-count">{{ byStage(s).length }}</span></div>
            <div class="kcard" v-for="p in byStage(s)" :key="p.id" style="border-left-color:var(--c-primary)">
              <div class="kt">{{ p.title }}</div>
              <div class="km">进度 {{ p.progress||0 }}% · {{ p.submit||'未投稿' }}</div>
              <div class="progress" style="margin-top:6px"><i :style="{width:(p.progress||0)+'%'}"></i></div>
              <div class="kops"><button class="btn btn-line btn-sm" @click="open(p)">编辑</button><button class="btn btn-danger btn-sm" @click="del(p)">删</button></div>
            </div>
            <div v-if="!byStage(s).length" class="muted" style="font-size:12px;text-align:center;padding:8px">—</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><span class="ic">📚</span><h3>文献区（参考文献与资料分类库）</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="litModal=true">+ 添加文献</button></div>
        <div class="list">
          <div class="item" v-for="l in literature" :key="l.id">
            <div class="body"><div class="title">{{ l.title }} <span class="chip">{{ l.cat||'未分类' }}</span></div>
              <div class="meta" v-if="l.url"><a :href="l.url" target="_blank" style="color:var(--c-primary-deep)">🔗 {{ l.url }}</a></div></div>
            <button class="btn btn-danger btn-sm" @click="delLit(l)">删</button>
          </div>
          <div v-if="!literature.length" class="empty">暂无文献</div>
        </div>
      </div>

      <record-editor :show="modal" title="课题 / 论文" module-key="paper" :fields="fields" :value="draft" @save="onSave" @close="modal=false"></record-editor>

      <modal :show="litModal" title="添加文献" @close="litModal=false">
        <div class="field"><label>标题</label><input class="input" v-model="lit.title" /></div>
        <div class="row"><div class="field" style="flex:1"><label>分类</label><input class="input" v-model="lit.cat" placeholder="如 认知行为" /></div>
          <div class="field" style="flex:2"><label>链接/出处</label><input class="input" v-model="lit.url" /></div></div>
        <template #foot><button class="btn btn-primary" @click="addLit">添加</button><button class="btn btn-line" @click="litModal=false">取消</button></template>
      </modal>
    </div>`
  };

  /* ---------- 比赛 ---------- */
  SECTIONS.competition = {
    name: 'competition',
    computed: { list() { return Store.state.data.competitions || []; } },
    data() {
      return { modal: false, draft: null };
    },
    methods: {
      open(c) {
        this.draft = c ? U.clone(c) : { id: Store.uid(), name: '', deadline: Store.offsetDate(30), milestone: '', notifyFile: '', note: '', materials: [] };
        this.modal = true;
      },
      save() {
        if (!this.draft.name.trim()) { this.$root.toast('请填写比赛名称'); return; }
        if (Store.get('competitions', this.draft.id)) Store.update('competitions', this.draft.id, this.draft);
        else Store.add('competitions', this.draft);
        this.modal = false; this.$root.toast('已保存赛事');
      },
      del(c) { Store.remove('competitions', c.id); },
      addMat() { this.draft.materials.push({ id: Store.uid(), name: '', version: 'v1', file: null }); },
      delMat(i) { this.draft.materials.splice(i, 1); },
      cd(d) { const x = U.daysLeft(d); return x < 0 ? '已过期' : (x === 0 ? '今天' : '剩 ' + x + ' 天'); }
    },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">比赛 · <span class="accent">职业发展</span></div>
        <div class="page-desc">通知归档 · 备赛倒计时里程碑 · 参赛材料版本控制</div></div>
        <div class="spacer"></div><button class="btn btn-ghost" @click="open(null)">+ 新增赛事</button></div>

      <div class="grid grid-2">
        <div class="card" v-for="c in list" :key="c.id">
          <div class="card-h"><span class="ic">🏆</span><h3>{{ c.name }}</h3><div class="spacer"></div>
            <button class="btn btn-line btn-sm" @click="open(c)">编辑</button><button class="btn btn-danger btn-sm" @click="del(c)">删</button></div>
          <div class="meta">倒计时：<b class="countdown" :class="U.cdClass(U.daysLeft(c.deadline))">{{ cd(c.deadline) }}</b> · 截止 {{ c.deadline }}</div>
          <div class="meta">里程碑：{{ c.milestone || '—' }}</div>
          <div class="meta" v-if="c.notifyFile">📎 通知文件已归档</div>
          <div class="meta">参赛材料 {{ (c.materials||[]).length }} 份：
            <span v-for="m in (c.materials||[])" :key="m.id" class="chip" style="margin-right:5px">{{ m.name }} {{ m.version }}</span>
          </div>
        </div>
        <div v-if="!list.length" class="empty" style="grid-column:1/-1"><span class="big">🏅</span>暂无赛事</div>
      </div>

      <modal :show="modal" title="赛事管理" @close="modal=false">
        <div class="field"><label>比赛名称</label><input class="input" v-model="draft.name" /></div>
        <div class="row">
          <div class="field" style="flex:1"><label>截止日期</label><input class="input" type="date" v-model="draft.deadline" /></div>
          <div class="field" style="flex:1"><label>备赛里程碑</label><input class="input" v-model="draft.milestone" placeholder="如 校内选拔" /></div>
        </div>
        <div class="field"><label>比赛通知文件归档</label><file-uploader :rec-id="(draft?draft.id:'') + '_notify'"></file-uploader></div>
        <div class="field"><label>参赛材料版本控制库</label>
          <div v-for="(m,i) in draft.materials" :key="m.id" class="card" style="background:var(--c-primary-faint);margin-bottom:8px">
            <div class="row">
              <input class="input" v-model="m.name" placeholder="材料名(课件/视频/教案)" />
              <input class="input" v-model="m.version" placeholder="版本 v1" style="flex:0 0 90px" />
              <button class="btn btn-danger btn-sm" @click="delMat(i)">×</button>
            </div>
            <div style="margin-top:6px"><file-uploader :rec-id="m.id"></file-uploader></div>
          </div>
          <button class="btn btn-line btn-sm" @click="addMat">+ 添加材料版本</button>
        </div>
        <div class="field"><label>备注</label><textarea class="textarea" v-model="draft.note"></textarea></div>
        <template #foot><button class="btn btn-primary" @click="save">保存</button><button class="btn btn-line" @click="modal=false">取消</button></template>
      </modal>
    </div>`
  };

  /* ---------- 7年级事务性工作 ---------- */
  SECTIONS.grade7 = {
    name: 'grade7',
    computed: { list() { return Store.state.data.grade7_tasks || []; }, cols() { return ['未开始', '进行中', '已完成']; } },
    data() { return { modal: false, draft: null, fields: grade7Fields }; },
    methods: {
      open(t) { this.draft = t ? U.clone(t) : null; this.modal = true; },
      onSave(o) { if (Store.get('grade7_tasks', o.id)) Store.update('grade7_tasks', o.id, o); else Store.add('grade7_tasks', o); this.modal = false; this.$root.toast('已保存'); },
      del(t) { Store.remove('grade7_tasks', t.id); },
      byCol(c) { return this.list.filter(t => t.status === c); },
      cd(d) { if (!d) return ''; const x = U.daysLeft(d); return x < 0 ? '逾期' + (-x) : (x === 0 ? '今天' : '剩' + x + '天'); }
    },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">7年级 · <span class="accent">事务性工作</span></div>
        <div class="page-desc">心理测评整理 / 心育活动 / 迎检材料… 进度看板全掌握</div></div>
        <div class="spacer"></div><button class="btn btn-ghost" @click="open(null)">+ 新增任务</button></div>

      <div class="kanban">
        <div class="kanban-col" v-for="c in cols" :key="c">
          <div class="kc-title">{{ c }} <span class="kc-count">{{ byCol(c).length }}</span></div>
          <div class="kcard" v-for="t in byCol(c)" :key="t.id" :style="{borderLeftColor: c==='已完成'?'var(--c-ok)':(c==='进行中'?'var(--c-primary)':'var(--c-text-faint)')}">
            <div class="kt">{{ t.title }}</div>
            <div class="km">{{ t.note || '' }}</div>
            <div class="km" v-if="t.due">截止：<span class="countdown" :class="U.cdClass(U.daysLeft(t.due))">{{ cd(t.due) }}</span></div>
            <div class="progress" style="margin-top:6px"><i :style="{width:(t.progress||0)+'%'}"></i></div>
            <div class="kops"><button class="btn btn-line btn-sm" @click="open(t)">编辑</button><button class="btn btn-danger btn-sm" @click="del(t)">删</button></div>
          </div>
          <div v-if="!byCol(c).length" class="muted" style="font-size:12px;text-align:center;padding:8px">—</div>
        </div>
      </div>

      <record-editor :show="modal" title="7年级事务" module-key="grade7" :fields="fields" :value="draft" @save="onSave" @close="modal=false"></record-editor>
    </div>`
  };
})();
