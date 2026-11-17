/* 웹사이트 시작 파일: 메뉴, 화면 그리기, 단축키, 잉크 색 */
(function () {
  const U = TD.util;

  const ROUTES = [
    { id: 'home', label: 'Today', icon: 'sun' },
    { id: 'todo', label: 'Tasks', icon: 'todo' },
    { id: 'habits', label: 'Habits', icon: 'repeat' },
    { id: 'notes', label: 'Notes', icon: 'note' },
    { id: 'focus', label: 'Focus', icon: 'timer' },
    { id: 'glimmers', label: 'Glimmers', icon: 'gift' },
  ];

  TD.state = {
    todoDate: U.today(),
    todoView: 'week',
    addingCat: null,
    openHabit: null,
    habitMonth: U.today().slice(0, 8) + '01',
    notesTab: 'message',
    homeMsgId: null,
    decisionId: null,
    glimmerId: null,
  };

  const current = () => {
    const h = location.hash.slice(1);
    return ROUTES.some((r) => r.id === h) ? h : 'home';
  };

  TD.applyInk = () => {
    const ink = TD.store.get().settings.ink;
    if (ink && ink !== 'black') document.documentElement.dataset.ink = ink;
    else delete document.documentElement.dataset.ink;
  };

  function renderNav() {
    const cur = current();
    const s = TD.store.get();
    document.getElementById('nav').innerHTML = `
      <div class="nav-top"><b>TendDay</b><span>${s.todos.filter((t) => !t.done).length} open</span></div>
      ${ROUTES.map(
        (r) => `<a href="#${r.id}" class="${r.id === cur ? 'active' : ''}" ${r.id === cur ? 'aria-current="page"' : ''} aria-label="${r.label}"><i class="nav-ic">${TD.icon(r.icon, 23)}</i><span>${r.label}</span></a>`
      ).join('')}
      <hr>
      <a href="#" data-action="open-settings"><span>Settings</span></a>`;
  }

  function render() {
    const r = current();
    const v = TD.views[r]();
    document.getElementById('main').innerHTML = `
      <header class="top">
        <h1>${v.title}</h1>
        ${v.meta ? `<span class="meta">${v.meta}</span>` : ''}
        <div class="actions">${v.actions || ''}</div>
      </header>
      <div class="cols ${v.layout || ''}"><div class="col">${v.left}</div><div class="col">${v.right}</div></div>`;
    renderNav();
    TD.media.hydrate(document.getElementById('main'));
    const add = document.querySelector('#main .add-input');
    if (add) add.focus({ preventScroll: true });
    document.title = `${ROUTES.find((x) => x.id === r).label} · TendDay`;
  }
  TD.app = { render };

  TD.store.subscribe(() => {
    TD.applyInk();
    render();
    TD.ui.refresh();
  });

  window.addEventListener('hashchange', () => {
    TD.state.addingCat = null;
    render();
    window.scrollTo(0, 0);
  });

  let lastDay = U.today();
  const checkDay = () => {
    const t = U.today();
    if (t !== lastDay) {
      if (TD.state.todoDate === lastDay) TD.state.todoDate = t;
      TD.state.habitMonth = t.slice(0, 8) + '01';
      lastDay = t;
      render();
    }
  };
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkDay());
  setInterval(checkDay, 60 * 1000);

  /* 클릭·입력 */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = TD.actions[el.dataset.action];
    if (fn) {
      e.preventDefault();
      fn(el, e);
    }
  });

  document.addEventListener('keydown', (e) => {
    const el = e.target;
    const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
    // 단축키: 숫자 키로 메뉴 이동, , 설정
    if (!typing && !TD.ui.isOpen() && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const n = Number(e.key);
      if (n >= 1 && n <= ROUTES.length) return (location.hash = '#' + ROUTES[n - 1].id);
      if (e.key === ',') return TD.actions['open-settings']();
    }
    if (!el.dataset) return;
    if (e.isComposing || e.keyCode === 229) return; // 한글 입력 중 Enter 무시
    if (el.classList.contains('add-input') && e.key === 'Escape') {
      e.stopPropagation();
      return TD.actions['add-input-escape']();
    }
    if (el.dataset.enter && e.key === 'Enter') {
      if (el.tagName === 'INPUT' || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        TD.actions[el.dataset.enter](el, e);
      }
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el) TD.actions[el.dataset.change](el, e);
  });

  document.addEventListener('focusout', (e) => {
    if (e.target.classList && e.target.classList.contains('add-input')) TD.actions['add-input-blur'](e.target);
  });

  TD.applyInk();
  render();

  // 앱으로 설치·오프라인 사용 (인터넷 주소로 열었을 때만)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
