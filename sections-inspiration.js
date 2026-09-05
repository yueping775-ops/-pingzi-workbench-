/* ============================================================
   板块九 · 日常分享与灵感   板块十 · 自我关怀
   ============================================================ */
(function () {
  const SECTIONS = (window.SECTIONS = window.SECTIONS || {});

  const sharingFields = [
    { key: 'kind', label: '感悟类型', type: 'select', options: ['他人作品', '自己工作'] },
    { key: 'source', label: '来源', type: 'select', options: ['小红书', '微信公众号', '手动'] },
    { key: 'title', label: '标题', type: 'text' },
    { key: 'content', label: '内容 / 摘要', type: 'textarea' },
    { key: 'url', label: '原文链接', type: 'text' },
    { key: 'tags', label: '标签(逗号分隔)', type: 'text' },
    { key: 'likes', label: '点赞数', type: 'number' },
    { key: 'collects', label: '收藏数', type: 'number' }
  ];

  const SUGGEST = [
    { title: '心理老师如何做破冰活动', content: '高赞破冰游戏合集，适合社团课与主题班会。', tags: '心理老师,活动', source: '小红书' },
    { title: '咨询中的共情话术', content: '收藏过万的共情回应模板，注意结合本土语境使用。', tags: '心理咨询,话术', source: '微信公众号' },
    { title: '职场情绪耗竭自救', content: '教师职业倦怠识别与自我关怀清单。', tags: '职场,自愈', source: '小红书' },
    { title: '一分钟正念小练习', content: '可嵌入课堂的简易正念引导词。', tags: '正念,课堂', source: '微信公众号' }
  ];

  /* ---------- 日常分享与灵感 ---------- */
  SECTIONS.sharing = {
    name: 'sharing',
    computed: {
      list() { return Store.state.data.sharing || []; },
      inspiration() { return Store.state.data.inspiration || []; }
    },
    data() {
      return { modal: false, draft: null, fields: sharingFields,
        newInsp: '', suggestPool: SUGGEST.slice(), suggestIdx: 0 };
    },
    methods: {
      open(s) { this.draft = s ? U.clone(s) : null; this.modal = true; },
      onSave(o) { if (Store.get('sharing', o.id)) Store.update('sharing', o.id, o); else Store.add('sharing', o); this.modal = false; this.$root.toast('已加入选题库'); },
      del(s) { Store.remove('sharing', s.id); },
      pullSuggest() {
        const s = this.suggestPool[this.suggestIdx % this.suggestPool.length]; this.suggestIdx++;
        Store.add('sharing', { kind: '他人作品', source: s.source, title: s.title, content: s.content, tags: s.tags, likes: 0, collects: 0, url: '' });
        this.$root.toast('已抓取示例选题（可联网补充）');
      },
      addInsp() {
        const v = this.newInsp.trim(); if (!v) return;
        Store.add('inspiration', { content: v, createdAt: new Date().toISOString() });
        this.newInsp = '';
      },
      delInsp(i) { Store.remove('inspiration', i.id); }
    },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">日常分享与<span class="accent">灵感</span></div>
        <div class="page-desc">联网选题库 · 他人/自己感悟分区 · 闪念笔记随时捕获</div></div>
        <div class="spacer"></div><button class="btn btn-ghost" @click="open(null)">+ 添加选题</button></div>

      <div class="section-title-bar"><h4>🔥 联网资源库（选题库）</h4><div class="line"></div>
        <button class="btn btn-line btn-sm" @click="pullSuggest">⚡ 获取灵感示例</button></div>
      <div class="grid grid-2">
        <div class="insp-card" v-for="s in list" :key="s.id">
          <div class="ic-head">
            <span class="tag" :style="{background: s.kind==='自己工作'?'var(--c-primary-deep)':'#7aa7e0'}">{{ s.kind }}</span>
            <span class="ic-source">{{ s.source }}</span>
            <div class="spacer" style="flex:1"></div>
            <button class="btn btn-line btn-sm" @click="open(s)">编辑</button>
            <button class="btn btn-danger btn-sm" @click="del(s)">删</button>
          </div>
          <div class="ic-title">{{ s.title }}</div>
          <div class="ic-body">{{ s.content }}</div>
          <div class="ic-foot">
            <span v-if="s.likes">👍 {{ s.likes }}</span><span v-if="s.collects">⭐ {{ s.collects }}</span>
            <span v-if="s.tags">#{{ s.tags }}</span>
            <a v-if="s.url" :href="s.url" target="_blank" style="color:var(--c-primary-deep);margin-left:auto">原文 ↗</a>
          </div>
        </div>
        <div v-if="!list.length" class="empty" style="grid-column:1/-1"><span class="big">💡</span>暂无选题，点「获取灵感示例」或手动添加</div>
      </div>

      <div class="section-title-bar" style="margin-top:18px"><h4>⚡ 灵感捕获（闪念笔记）</h4><div class="line"></div></div>
      <div class="card">
        <div class="row" style="margin-bottom:10px">
          <input class="input" v-model="newInsp" placeholder="随时记录脱敏后的工作感悟…" @keyup.enter="addInsp" />
          <button class="btn btn-primary" @click="addInsp">捕获</button>
        </div>
        <div class="list">
          <div class="item" v-for="i in inspiration" :key="i.id">
            <div class="body"><div class="title" style="font-weight:500">{{ i.content }}</div>
              <div class="meta">{{ U.fmtDateTime(i.createdAt) }}</div></div>
            <button class="btn btn-danger btn-sm" @click="delInsp(i)">删</button>
          </div>
          <div v-if="!inspiration.length" class="empty">还没有闪念，记录第一个吧</div>
        </div>
      </div>

      <record-editor :show="modal" title="选题 / 感悟" module-key="sharing" :fields="fields" :value="draft" @save="onSave" @close="modal=false"></record-editor>
    </div>`
  };

  /* ---------- 自我关怀 ---------- */
  SECTIONS.selfcare = {
    name: 'selfcare',
    data() {
      return {
        qIdx: 0, relaxModal: false, relaxDraft: null,
        breathing: false, phase: '准备', timer: null, secLeft: 4, round: 0
      };
    },
    computed: {
      quotes() { return Store.state.data.selfcare_quotes || []; },
      relax() { return Store.state.data.selfcare_relax || []; },
      curQuote() { return this.quotes.length ? this.quotes[this.qIdx % this.quotes.length] : { q: '照顾好自己，才能更好地照顾他人。', a: '' }; }
    },
    methods: {
      nextQuote() { this.qIdx = (this.qIdx + 1) % Math.max(1, this.quotes.length); },
      // 4-4-4-4 盒式呼吸
      startBreath() {
        if (this.breathing) { this.stopBreath(); return; }
        this.breathing = true; this.round = 0; this.runPhase('吸气', 4);
      },
      runPhase(text, secs) {
        this.phase = text; this.secLeft = secs;
        this.timer = setInterval(() => {
          this.secLeft--;
          if (this.secLeft <= 0) {
            if (text === '吸气') this.runPhase('屏息', 4);
            else if (text === '屏息') this.runPhase('呼气', 4);
            else if (text === '呼气') { this.round++; this.runPhase('屏息2', 4); }
            else this.runPhase('吸气', 4);
          }
        }, 1000);
      },
      stopBreath() { this.breathing = false; clearInterval(this.timer); this.phase = '准备'; this.secLeft = 4; },
      openRelax(r) { this.relaxDraft = r ? U.clone(r) : { id: Store.uid(), title: '', type: 'audio', ico: '🎧', url: '' }; this.relaxModal = true; },
      saveRelax() {
        if (!this.relaxDraft.title.trim()) { this.$root.toast('请填写名称'); return; }
        if (Store.get('selfcare_relax', this.relaxDraft.id)) Store.update('selfcare_relax', this.relaxDraft.id, this.relaxDraft);
        else Store.add('selfcare_relax', this.relaxDraft);
        this.relaxModal = false; this.$root.toast('已保存放松组件');
      },
      delRelax(r) { Store.remove('selfcare_relax', r.id); }
    },
    beforeUnmount() { clearInterval(this.timer); },
    template: `
    <div>
      <div class="page-head"><div><div class="page-title">自我关怀 · <span class="accent">能量蓄水池</span></div>
        <div class="page-desc">情绪疗愈金句 · 正念呼吸 · 放松音视频，清空认知负荷</div></div></div>

      <div class="grid grid-2">
        <div>
          <div class="quote-box">
            <div class="q">“{{ curQuote.q }}”</div>
            <div class="a">{{ curQuote.a }}</div>
            <button class="btn btn-ghost" style="margin-top:14px" @click="nextQuote">🔁 换一句</button>
          </div>

          <div class="card" style="margin-top:14px">
            <div class="card-h"><span class="ic">🌬️</span><h3>正念呼吸（盒式 4-4-4-4）</h3></div>
            <div style="text-align:center;padding:10px 0">
              <div :style="{width:'120px',height:'120px',borderRadius:'50%',margin:'0 auto',background:'radial-gradient(circle,var(--c-primary),var(--c-primary-deep))',transition:'transform 1s ease',transform: (phase==='吸气'?'scale(1.25)':(phase==='呼气'?'scale(.75)':'scale(1)')), opacity:.85}"></div>
              <div style="margin-top:14px;font-size:20px;font-weight:800;color:var(--c-primary-deep)">{{ phase }} <span v-if="breathing" class="countdown">{{ secLeft }}</span></div>
              <div class="muted" style="font-size:12px">第 {{ round }} 轮 · 点击开始/停止</div>
              <button class="btn btn-primary" style="margin-top:10px" @click="startBreath">{{ breathing? '停止' : '开始呼吸' }}</button>
            </div>
          </div>
        </div>

        <div>
          <div class="card-h"><span class="ic">🎧</span><h3>放松组件</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="openRelax(null)">+ 新增</button></div>
          <div class="relax-grid">
            <div class="relax-card" v-for="r in relax" :key="r.id">
              <div class="rc-ico">{{ r.ico || '🎵' }}</div>
              <div class="rc-title">{{ r.title }}</div>
              <div class="rc-sub">{{ r.type==='video'?'视频':'音频' }}</div>
              <audio v-if="r.url && r.type==='audio'" :src="r.url" controls style="width:100%;margin-top:8px"></audio>
              <video v-if="r.url && r.type==='video'" :src="r.url" controls style="width:100%;margin-top:8px;border-radius:8px"></video>
              <div class="row" style="margin-top:8px;gap:4px">
                <button class="btn btn-line btn-sm" style="flex:1" @click="openRelax(r)">编辑</button>
                <button class="btn btn-danger btn-sm" style="flex:1" @click="delRelax(r)">删</button>
              </div>
            </div>
            <div v-if="!relax.length" class="empty" style="grid-column:1/-1"><span class="big">🌿</span>添加白噪音 / 冥想音频链接</div>
          </div>
        </div>
      </div>

      <modal :show="relaxModal" title="放松组件" @close="relaxModal=false">
        <div class="field"><label>名称</label><input class="input" v-model="relaxDraft.title" placeholder="如 雨声白噪音" /></div>
        <div class="row">
          <div class="field" style="flex:1"><label>类型</label><select class="select" v-model="relaxDraft.type"><option>audio</option><option>video</option></select></div>
          <div class="field" style="flex:1"><label>图标(emoji)</label><input class="input" v-model="relaxDraft.ico" placeholder="🎧" /></div>
        </div>
        <div class="field"><label>音视频链接（URL）</label><input class="input" v-model="relaxDraft.url" placeholder="https://..." /></div>
        <template #foot><button class="btn btn-primary" @click="saveRelax">保存</button><button class="btn btn-line" @click="relaxModal=false">取消</button></template>
      </modal>
    </div>`
  };
})();
