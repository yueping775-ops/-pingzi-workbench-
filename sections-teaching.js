/* ============================================================
   板块二 · 上课（教务管理）
   ============================================================ */
(function () {
  const SECTIONS = (window.SECTIONS = window.SECTIONS || {});
  const WD = ['周一', '周二', '周三', '周四', '周五'];
  const TYPES = ['心理', '社团', '延时', '劳动', '其他'];

  SECTIONS.teaching = {
    name: 'teaching',
    computed: {
      periods() { return Store.settings.periods || []; },
      preps() { return Store.state.data.lesson_preps || []; },
      tracks() { return Store.state.data.classroom_tracks || []; },
      currentWeek() { return U.teachingWeek(Store.settings.weekStart); }
    },
    data() {
      return {
        types: TYPES, wd: WD,
        editCell: null,            // {wd, p}
        cellForm: { name: '', cls: '', type: '心理', onlyThisWeek: false },
        showPeriodEditor: false,
        periodDraft: [],
        prepModal: false,
        prepDraft: null,
        trackModal: false,
        trackDraft: { cls: '', situation: '', missed: '' },
        tool: Store.settings.toolLinks
      };
    },
    methods: {
      cellCourse(wd, p) {
        const key = wd + '-' + p.i;
        const ov = Store.state.data.schedule_overrides ? Store.state.data.schedule_overrides[key] : null;
        return ov || (Store.settings.semesterBase ? Store.settings.semesterBase[key] : null);
      },
      openCell(wd, p) {
        const key = wd + '-' + p.i;
        const c = this.cellCourse(wd, p);
        this.editCell = { wd, p };
        this.cellForm = c ? { name: c.name, cls: c.cls || '', type: c.type || '心理', onlyThisWeek: !!Store.state.data.schedule_overrides[key] }
                          : { name: '', cls: '', type: '心理', onlyThisWeek: false };
      },
      saveCell() {
        if (!this.cellForm.name.trim()) { this.$root.toast('请填写课程名称'); return; }
        const key = this.editCell.wd + '-' + this.editCell.p.i;
        const val = { name: this.cellForm.name.trim(), cls: this.cellForm.cls.trim(), type: this.cellForm.type };
        if (this.cellForm.onlyThisWeek) { Store.state.data.schedule_overrides = Store.state.data.schedule_overrides || {}; Store.state.data.schedule_overrides[key] = val; }
        else { Store.settings.semesterBase = Store.settings.semesterBase || {}; Store.settings.semesterBase[key] = val; delete (Store.state.data.schedule_overrides || {})[key]; }
        this.editCell = null; this.$root.toast('已保存课表');
      },
      clearCell() {
        const key = this.editCell.wd + '-' + this.editCell.p.i;
        delete (Store.settings.semesterBase || {})[key];
        delete (Store.state.data.schedule_overrides || {})[key];
        this.editCell = null; this.$root.toast('已清除该格');
      },
      openPeriodEditor() { this.periodDraft = U.clone(this.periods); this.showPeriodEditor = true; },
      savePeriods() { Store.settings.periods = this.periodDraft; this.showPeriodEditor = false; this.$root.toast('节次时间已更新'); },

      openPrep(p) {
        this.prepDraft = p ? U.clone(p) : { id: Store.uid(), title: '', type: '教案', link: '', cls: '', date: Store.todayStr(), note: '', files: [] };
        this.prepModal = true;
      },
      savePrep() {
        if (!this.prepDraft.title.trim()) { this.$root.toast('请填写标题'); return; }
        if (Store.get('lesson_preps', this.prepDraft.id)) Store.update('lesson_preps', this.prepDraft.id, this.prepDraft);
        else Store.add('lesson_preps', this.prepDraft);
        this.prepModal = false; this.$root.toast('已保存备课');
      },
      delPrep(p) { Store.remove('lesson_preps', p.id); },
      openTrack(t) { this.trackDraft = t ? U.clone(t) : { cls: '', situation: '', missed: '' }; this.trackModal = true; },
      saveTrack() {
        if (!this.trackDraft.cls.trim()) { this.$root.toast('请填写班级'); return; }
        if (Store.get('classroom_tracks', this.trackDraft.id)) Store.update('classroom_tracks', this.trackDraft.id, this.trackDraft);
        else Store.add('classroom_tracks', this.trackDraft);
        this.trackModal = false; this.$root.toast('已记录课堂追踪');
      },
      delTrack(t) { Store.remove('classroom_tracks', t.id); },
      deepLink(t) { const u = (this.tool[t] || '').trim(); if (u) window.open(u, '_blank'); else this.$root.toast('请先在「设置」配置 ' + t + ' 链接'); }
    },
    template: `
    <div>
      <div class="page-head">
        <div>
          <div class="page-title">上课 · <span class="accent">教务管理</span></div>
          <div class="page-desc">心理 / 社团 / 延时 / 劳动 合并课表 · 备课归档 · 课堂追踪</div>
        </div>
        <div class="spacer"></div>
        <button class="btn btn-line btn-sm" @click="openPeriodEditor">⏱ 编辑节次时间</button>
      </div>

      <!-- 聚合周课表 -->
      <div class="card">
        <div class="card-h"><span class="ic">🗓️</span><h3>聚合周课表</h3><div class="spacer"></div><span class="chip">第 {{ currentWeek }} 教学周</span></div>
        <div style="overflow-x:auto">
        <table class="timetable">
          <thead><tr><th class="period-col">节次 / 时间</th><th v-for="(w,i) in wd" :key="i">{{ w }}</th></tr></thead>
          <tbody>
            <tr v-for="p in periods" :key="p.i">
              <td class="period-col">{{ p.name }}<div class="pt">{{ p.start }}-{{ p.end }}</div></td>
              <td v-for="(w,wi) in wd" :key="wi" @click="openCell(wi+1, p)" style="cursor:pointer">
                <div v-if="cellCourse(wi+1, p)" class="course-cell" :class="'ctype-'+cellCourse(wi+1,p).type">
                  <div class="course-name">{{ cellCourse(wi+1,p).name }}</div>
                  <div class="course-class">{{ cellCourse(wi+1,p).cls }}</div>
                  <span v-if="Store.state.data.schedule_overrides && Store.state.data.schedule_overrides[(wi+1)+'-'+p.i]" class="pill" style="background:#fbd5e0;color:#c0395e">调</span>
                </div>
                <div v-else class="course-cell empty">＋</div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="muted" style="font-size:11.5px;margin-top:8px">点击任意格编辑课程；勾选「仅本周调课」即生成当周覆盖，不影响学期固定课表。</div>
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <!-- 备课区 -->
        <div class="card">
          <div class="card-h"><span class="ic">📁</span><h3>备课区</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="openPrep(null)">+ 新增</button></div>
          <div class="list">
            <div class="item" v-for="p in preps" :key="p.id">
              <div class="body">
                <div class="title">{{ p.title }} <span class="tag" style="background:var(--c-primary-deep)">{{ p.type }}</span></div>
                <div class="meta">{{ p.cls || '—' }} · {{ p.date }} <span v-if="p.files&&p.files.length">· 📎{{ p.files.length }}</span></div>
                <div class="meta" v-if="p.link"><a :href="p.link" target="_blank" style="color:var(--c-primary-deep)">🔗 教案/课件链接(WPS·IMA)</a></div>
              </div>
              <div class="ops">
                <button class="btn btn-line btn-sm" @click="openPrep(p)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="delPrep(p)">删</button>
              </div>
            </div>
            <div v-if="!preps.length" class="empty">暂无备课记录</div>
          </div>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-line btn-sm" @click="deepLink('wps')">🔗 WPS</button>
            <button class="btn btn-line btn-sm" @click="deepLink('ima')">🔗 IMA</button>
            <button class="btn btn-line btn-sm" @click="deepLink('feishu')">🔗 飞书</button>
          </div>
        </div>

        <!-- 课堂追踪 -->
        <div class="card">
          <div class="card-h"><span class="ic">🎯</span><h3>课堂追踪</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="openTrack(null)">+ 新增</button></div>
          <div class="list">
            <div class="item" v-for="t in tracks" :key="t.id">
              <div class="body">
                <div class="title">{{ t.cls }}</div>
                <div class="meta">情况：{{ t.situation || '—' }}</div>
                <div class="meta">未上课程：{{ t.missed || '无' }}</div>
              </div>
              <div class="ops">
                <button class="btn btn-line btn-sm" @click="openTrack(t)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="delTrack(t)">删</button>
              </div>
            </div>
            <div v-if="!tracks.length" class="empty">暂无追踪记录</div>
          </div>
        </div>
      </div>

      <!-- 节次时间编辑 -->
      <modal :show="showPeriodEditor" title="编辑节次时间" @close="showPeriodEditor=false">
        <div v-for="(p,i) in periodDraft" :key="i" class="row" style="margin-bottom:8px">
          <input class="input" v-model="p.name" style="flex:1.2" />
          <input class="input" type="time" v-model="p.start" />
          <input class="input" type="time" v-model="p.end" />
        </div>
        <template #foot><button class="btn btn-primary" @click="savePeriods">保存节次</button><button class="btn btn-line" @click="showPeriodEditor=false">取消</button></template>
      </modal>

      <!-- 备课编辑 -->
      <modal :show="prepModal" :title="(Store.get('lesson_preps',prepDraft?.id)?'编辑':'新增')+'备课'" @close="prepModal=false">
        <div class="field"><label>标题</label><input class="input" v-model="prepDraft.title" placeholder="如《认识情绪》教案" /></div>
        <div class="row">
          <div class="field" style="flex:1"><label>类型</label><select class="select" v-model="prepDraft.type"><option>教案</option><option>课件</option></select></div>
          <div class="field" style="flex:1"><label>班级/对象</label><input class="input" v-model="prepDraft.cls" /></div>
          <div class="field" style="flex:1"><label>日期</label><input class="input" type="date" v-model="prepDraft.date" /></div>
        </div>
        <div class="field"><label>教案/课件链接（WPS · IMA 超链接）</label><input class="input" v-model="prepDraft.link" placeholder="https://..." /></div>
        <div class="field"><label>课件归档库（上传 PDF / PPT / WORD）</label><file-uploader :rec-id="prepDraft.id"></file-uploader></div>
        <div class="field"><label>备注</label><textarea class="textarea" v-model="prepDraft.note"></textarea></div>
        <template #foot><button class="btn btn-primary" @click="savePrep">保存</button><button class="btn btn-line" @click="prepModal=false">取消</button></template>
      </modal>

      <!-- 课堂追踪编辑 -->
      <modal :show="trackModal" title="课堂追踪" @close="trackModal=false">
        <div class="field"><label>班级</label><input class="input" v-model="trackDraft.cls" /></div>
        <div class="field"><label>课堂情况</label><textarea class="textarea" v-model="trackDraft.situation"></textarea></div>
        <div class="field"><label>未上课程</label><input class="input" v-model="trackDraft.missed" /></div>
        <template #foot><button class="btn btn-primary" @click="saveTrack">保存</button><button class="btn btn-line" @click="trackModal=false">取消</button></template>
      </modal>
    </div>`
  };
})();
