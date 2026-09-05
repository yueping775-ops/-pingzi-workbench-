/* ============================================================
   板块一 · 首页（核心指挥舱）
   ============================================================ */
(function () {
  const SECTIONS = (window.SECTIONS = window.SECTIONS || {});

  SECTIONS.home = {
    name: 'home',
    computed: {
      todos() { return Store.state.data.home_todos || []; },
      reschedules() { return Store.state.data.home_reschedules || []; },
      holidays() { return Store.settings.holidays || []; },
      weekday() { const d = new Date().getDay(); return d === 0 ? 7 : d; },
      isWeekend() { return this.weekday > 5; },
      todayCourses() {
        if (this.isWeekend) return [];
        return Store.dayCourses(this.weekday);
      },
      pendingTodos() { return this.todos.filter(t => !t.done); },
      urgentCount() { return this.todos.filter(t => !t.done && U.daysLeft(t.due) !== null && U.daysLeft(t.due) <= 1).length; },
      nearestHoliday() {
        const arr = this.holidays.map(h => ({ ...h, d: U.daysLeft(h.date) })).filter(h => h.d !== null).sort((a, b) => a.d - b.d);
        return arr[0] || null;
      },
      sortedHolidays() {
        return this.holidays.map(h => ({ ...h, d: U.daysLeft(h.date) })).filter(h => h.d !== null).sort((a, b) => a.d - b.d);
      }
    },
    data() {
      return {
        newTodo: { title: '', priority: '中', due: Store.todayStr() },
        newResch: { from: '', to: '', cls: '', notified: false, note: '' },
        showTodoForm: false
      };
    },
    methods: {
      isUrgent(t) { return !t.done && U.daysLeft(t.due) !== null && U.daysLeft(t.due) <= 1; },
      cdText(d) { if (d === null) return ''; if (d < 0) return '已逾期' + (-d) + '天'; if (d === 0) return '今天截止'; return '剩 ' + d + ' 天'; },
      prioClass(p) { return { '高': 'cd-danger', '中': 'cd-warn', '低': 'cd-ok' }[p] || 'cd-ok'; },
      addTodo() {
        const t = this.newTodo.title.trim();
        if (!t) { this.$root.toast('请输入待办内容'); return; }
        Store.add('home_todos', { title: t, priority: this.newTodo.priority, due: this.newTodo.due, done: false, note: '' });
        this.newTodo = { title: '', priority: '中', due: Store.todayStr() };
        this.showTodoForm = false;
        this.$root.toast('已添加待办');
      },
      toggleTodo(t) { t.done = !t.done; },
      delTodo(t) { Store.remove('home_todos', t.id); },
      editTodo(t) { this.$root.promptEdit('待办', t.title, (v) => { if (v !== null) { t.title = v; this.$root.toast('已更新'); } }); },
      addResch() {
        const r = this.newResch;
        if (!r.from.trim() || !r.to.trim()) { this.$root.toast('请填写原定/调至时间'); return; }
        Store.add('home_reschedules', { from: r.from, to: r.to, cls: r.cls, notified: !!r.notified, note: r.note });
        this.newResch = { from: '', to: '', cls: '', notified: false, note: '' };
        this.$root.toast('已记录调课');
      },
      delResch(r) { Store.remove('home_reschedules', r.id); }
    },
    template: `
    <div>
      <div class="page-head">
        <div>
          <div class="page-title">核心<span class="accent">指挥舱</span></div>
          <div class="page-desc">一屏掌握今日节奏 · 临近任务自动标红 · 调课一手掌控</div>
        </div>
        <div class="spacer"></div>
        <span class="chip">📡 实时云端同步</span>
      </div>

      <div class="grid grid-4">
        <div class="stat"><div class="label">未完成待办</div><div class="value">{{ pendingTodos.length }}</div><div class="sub">今日待推进</div></div>
        <div class="stat stat-accent"><div class="label">今日课程</div><div class="value">{{ todayCourses.length }}</div><div class="sub">{{ isWeekend ? '周末休息日' : '第'+weekday+'天' }}</div></div>
        <div class="stat"><div class="label">临近任务(≤1天)</div><div class="value" :class="urgentCount? 'cd-danger':''">{{ urgentCount }}</div><div class="sub">需重点关注</div></div>
        <div class="stat"><div class="label">最近假期</div><div class="value" style="font-size:18px">{{ nearestHoliday? nearestHoliday.name : '—' }}</div><div class="sub" :class="nearestHoliday? U.cdClass(nearestHoliday.d):''">{{ nearestHoliday? cdText(nearestHoliday.d) : '未设置' }}</div></div>
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <!-- 今日课程 -->
        <div class="card">
          <div class="card-h"><span class="ic">📚</span><h3>今日课程</h3><div class="spacer"></div><span class="card-link" @click="$root.go('teaching')">查看周课表 ›</span></div>
          <div v-if="!todayCourses.length" class="empty"><span class="big">🌙</span>今日无排课，享受属于自己的节奏</div>
          <div v-else class="list">
            <div class="item" v-for="c in todayCourses" :key="c.period.i">
              <div class="body">
                <div class="title course-name" :class="'ctype-'+c.course.type">{{ c.course.name }}</div>
                <div class="meta">{{ c.period.name }} · {{ c.period.start }}-{{ c.period.end }} · {{ c.course.cls || '—' }} <span v-if="c.overridden" class="pill" style="background:#fbd5e0;color:#c0395e">调</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 今日待办 -->
        <div class="card">
          <div class="card-h"><span class="ic">✅</span><h3>今日待办</h3><div class="spacer"></div><button class="btn btn-ghost btn-sm" @click="showTodoForm=!showTodoForm">+ 新增</button></div>
          <div v-if="showTodoForm" class="card" style="background:var(--c-primary-faint);margin-bottom:10px">
            <div class="row">
              <input class="input" v-model="newTodo.title" placeholder="任务内容" @keyup.enter="addTodo" />
              <select class="select" v-model="newTodo.priority" style="flex:0 0 90px"><option>高</option><option>中</option><option>低</option></select>
            </div>
            <div class="row" style="margin-top:8px">
              <input class="input" type="date" v-model="newTodo.due" />
              <button class="btn btn-primary btn-sm" @click="addTodo">添加</button>
            </div>
          </div>
          <div v-if="!todos.length" class="empty"><span class="big">🍃</span>暂无待办，心情舒畅</div>
          <div v-else class="list">
            <div class="item" v-for="t in todos" :key="t.id" :class="{done:t.done, urgent:isUrgent(t)}">
              <input type="checkbox" :checked="t.done" @change="toggleTodo(t)" style="margin-top:4px" />
              <div class="body">
                <div class="title">{{ t.title }}</div>
                <div class="meta">优先级 <b :class="prioClass(t.priority)">{{ t.priority }}</b> · <span class="countdown" :class="U.cdClass(U.daysLeft(t.due))">{{ cdText(U.daysLeft(t.due)) }}</span></div>
              </div>
              <div class="ops">
                <button class="btn btn-line btn-sm" @click="editTodo(t)">改</button>
                <button class="btn btn-danger btn-sm" @click="delTodo(t)">删</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <!-- 调课管理 -->
        <div class="card">
          <div class="card-h"><span class="ic">🔄</span><h3>调课管理</h3></div>
          <div class="row" style="margin-bottom:10px">
            <input class="input" v-model="newResch.from" placeholder="原定时间(如 周一第3节)" />
            <input class="input" v-model="newResch.to" placeholder="调至时间" />
          </div>
          <div class="row" style="margin-bottom:10px">
            <input class="input" v-model="newResch.cls" placeholder="涉及班级" />
            <label class="chip" style="flex:0 0 auto;cursor:pointer"><input type="checkbox" v-model="newResch.notified" /> 已通知到位</label>
          </div>
          <div class="row" style="margin-bottom:10px"><input class="input" v-model="newResch.note" placeholder="备注(可选)" /></div>
          <button class="btn btn-primary btn-sm" @click="addResch">记录调课</button>
          <div class="list" style="margin-top:10px">
            <div class="item" v-for="r in reschedules" :key="r.id">
              <div class="body">
                <div class="title">{{ r.from }} → {{ r.to }}</div>
                <div class="meta">{{ r.cls || '—' }} · <span :class="r.notified?'cd-ok':'cd-warn'">{{ r.notified? '✓ 已通知':'⚠ 未通知' }}</span> <span v-if="r.note">· {{ r.note }}</span></div>
              </div>
              <button class="btn btn-danger btn-sm" @click="delResch(r)">删</button>
            </div>
            <div v-if="!reschedules.length" class="empty">暂无调课记录</div>
          </div>
        </div>

        <!-- 假期倒计时 -->
        <div class="card">
          <div class="card-h"><span class="ic">🏖️</span><h3>假期倒计时</h3><div class="spacer"></div><span class="card-link" @click="$root.go('settings')">管理 ›</span></div>
          <div class="list">
            <div class="item" v-for="h in sortedHolidays" :key="h.name">
              <div class="body">
                <div class="title">{{ h.name }}</div>
                <div class="meta">{{ h.date }}</div>
              </div>
              <div class="countdown" :class="U.cdClass(h.d)" style="font-size:18px">{{ h.d<0? '已过'+(-h.d)+'天' : (h.d===0?'今天':'剩 '+h.d+' 天') }}</div>
            </div>
            <div v-if="!sortedHolidays.length" class="empty">前往「设置」添加假期</div>
          </div>
        </div>
      </div>
    </div>`
  };
})();
