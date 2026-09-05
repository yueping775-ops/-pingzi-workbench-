/* ============================================================
   平子的工作台 · 工具函数
   ============================================================ */
(function () {
  const U = {};

  U.pad = (n) => String(n).padStart(2, '0');

  U.nowParts = function (d) {
    d = d || new Date();
    const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return {
      time: U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + ':' + U.pad(d.getSeconds()),
      date: d.getFullYear() + '年' + U.pad(d.getMonth() + 1) + '月' + U.pad(d.getDate()) + '日 星期' + wk
    };
  };

  // 第 X 教学周（以 settings.weekStart 为第1周周一）
  U.teachingWeek = function (weekStartStr) {
    if (!weekStartStr) return 1;
    const start = new Date(weekStartStr + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / 86400000);
    if (diff < 0) return 1 - Math.floor((-diff - 1) / 7) === 0 ? 1 : Math.ceil(-diff / 7) * -1; // 学期前
    return Math.floor(diff / 7) + 1;
  };

  // 距离某日期的天数（含正负：负数表示已过）
  U.daysLeft = function (dateStr) {
    if (!dateStr) return null;
    const t = new Date(dateStr + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((t - now) / 86400000);
  };

  U.fmtSize = function (b) {
    if (!b) return '0 B';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  };

  U.fileIcon = function (name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['pdf'].includes(ext)) return '📕';
    if (['ppt', 'pptx'].includes(ext)) return '📊';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📗';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return '🎵';
    if (['mp4', 'mov', 'webm'].includes(ext)) return '🎬';
    if (['zip', 'rar'].includes(ext)) return '🗜️';
    return '📎';
  };

  U.cdClass = function (days) {
    if (days === null || days === undefined) return '';
    if (days < 0) return 'cd-ok';
    if (days <= 1) return 'cd-danger';
    if (days <= 3) return 'cd-warn';
    return 'cd-ok';
  };

  U.highlight = function (kw, text) {
    if (!kw || !text) return text;
    try {
      const re = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return text.replace(re, '<span class="hl">$1</span>');
    } catch (e) { return text; }
  };

  U.fmtDateTime = function (iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()) + ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };

  // 安全深拷贝（用于表单编辑草稿）
  U.clone = (o) => JSON.parse(JSON.stringify(o));

  window.U = U;
})();
