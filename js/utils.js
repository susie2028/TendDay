/* 공용 도구: 날짜 계산, 글자 안전 처리, 아이디 만들기 */
window.TD = window.TD || {};
TD.views = {};
TD.actions = {};

(function () {
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  TD.util = {
    DOW,
    MON,
    ymd,
    parse,
    today: () => ymd(),
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    esc: (s) =>
      String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    addDays(s, n) {
      const d = parse(s);
      d.setDate(d.getDate() + n);
      return ymd(d);
    },
    dow: (s) => parse(s).getDay(),
    /** 월요일 시작 주의 첫날 */
    weekStart(s) {
      const d = parse(s);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return ymd(d);
    },
    fmtLong(s) {
      const d = parse(s);
      return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
    },
    fmtShort(s) {
      const d = parse(s);
      return `${MON[d.getMonth()]} ${d.getDate()}`;
    },
    fmtMonth(s) {
      const d = parse(s);
      return `${MON[d.getMonth()]} ${d.getFullYear()}`;
    },
    /** ISO 시각 → "11월 17일" */
    fmtCreated(iso) {
      const d = new Date(iso);
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    },
  };

  /** 유튜브 링크면 영상 ID를 돌려줘요 */
  TD.util.youtubeId = (url) => {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  TD.util.youtubeThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  /** 카테고리 색 */
  TD.COLORS = {
    green: '#7A8B57',  
    teal: '#93A383',   
    brown: '#8A6A52',  
    orange: '#B5714F', 
    yellow: '#C29A5B', 
    pink: '#B08079',   
    purple: '#8D7D8F', 
    blue: '#6F8C97',   
    gray: '#B0A08A',   
  };
  TD.COLOR_NAMES = {
    green: 'Moss', teal: 'Sage', brown: 'Bark', orange: 'Terracotta', yellow: 'Dry leaf',
    pink: 'Clay rose', purple: 'Wildflower', blue: 'Lake', gray: 'Sand',
  };
})();
