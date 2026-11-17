/* 오늘 */
(function () {
  const U = TD.util, M = TD.model, esc = U.esc, icon = TD.icon;
  const BOX = `<svg class="box-svg" viewBox="0 0 120 96" aria-hidden="true">
    <g fill="var(--panel)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M19 45 L101 45 L97 88 L23 88 Z"/><path d="M60 45 V88" fill="none"/>
      <g class="lid">
        <path d="M60 31 C51 17 38 21 44 29 C47 32 54 32 60 31 Z"/><path d="M60 31 C69 17 82 21 76 29 C73 32 66 32 60 31 Z"/>
        <path d="M13 31 H107 V45 H13 Z"/><path d="M60 31 V45" fill="none"/>
      </g>
    </g></svg>`;

  TD.views.home = () => {
    const today = U.today();
    const d = U.parse(today);

    let msg = TD.state.homeMsgId && M.note(TD.state.homeMsgId);
    if (!msg || msg.hidden || msg.kind !== 'message') {
      msg = M.randomMessage();
      TD.state.homeMsgId = msg && msg.id;
    }
    const msgCount = M.notes('message').filter((n) => !n.hidden).length;
    const minds = M.pinnedMindsets();
    const todos = M.todosOn(today);
    const over = M.overdue();
    const habits = M.todayHabits();

    const left = `
      <section class="panel">
        <div class="ph"><span>note to self</span><span class="r">${msgCount > 1 ? `<button class="icon-btn" data-action="shuffle-msg" aria-label="Another">${icon('shuffle', 15)}</button>` : ''}</span></div>
        <div class="pb">
          ${msg
            ? `<p class="quote-text">${esc(msg.text)}</p><p class="quote-date">${U.fmtCreated(msg.createdAt)}</p>`
            : `<p class="empty">Nothing yet · <a href="#notes">add</a></p>`}
        </div>
      </section>

      ${minds.length
        ? `<section class="panel"><div class="ph"><span>principles</span></div><div class="pb">${minds.map((n) => `<p class="mind-line">${esc(n.text)}</p>`).join('')}</div></section>`
        : ''}

      <section class="panel">
        <div class="ph"><span>glimmers</span><span>${TD.store.get().glimmers.length}</span></div>
        <div class="pb"><button class="box-btn" data-action="open-box" aria-label="Open a random glimmer">${BOX}</button></div>
      </section>
    `;

    const right = `
      <section class="panel">
        <div class="ph"><span>tasks</span><span>${todos.filter((t) => t.done).length}/${todos.length}</span><span class="r"><a href="#todo">all</a></span></div>
        <div class="pb">
          ${over.length ? `<div class="row-line"><span>${over.length} overdue</span><button class="btn" data-action="move-overdue">Move to today</button></div>` : ''}
          ${todos.length ? `<ul>${todos.map((t) => TD.views.todoItem(t)).join('')}</ul>` : `<p class="empty">Nothing yet · <a href="#todo">add</a></p>`}
        </div>
      </section>

      <section class="panel">
        <div class="ph"><span>habits</span><span>${habits.filter((h) => M.isDone(h, today)).length}/${habits.length}</span><span class="r"><a href="#habits">all</a></span></div>
        <div class="pb">
          ${habits.length ? `<ul>${habits.map((h) => TD.views.habitRow(h, today, true)).join('')}</ul>` : `<p class="empty">Nothing yet · <a href="#habits">add</a></p>`}
        </div>
      </section>
    `;

    return { title: 'Today', meta: U.fmtLong(today), actions: `<button class="icon-btn nav-gear" data-action="open-settings" aria-label="Settings">${icon('settings', 17)}</button>`, left, right };
  };

  /** 상자 열기: 행복 상자에서 랜덤으로 하나 */
  function showGlimmer(exceptId) {
    const all = TD.store.get().glimmers;
    const pool = all.length > 1 ? all.filter((x) => x.id !== exceptId) : all;
    const g = pool[Math.floor(Math.random() * pool.length)];
    TD.ui.modal({
      title: U.fmtCreated(g.createdAt),
      small: true,
      body: `${TD.views.glimmerBody(g)}
        ${all.length > 1 ? `<div class="sheet-foot"><button class="btn" data-another>Another</button></div>` : ''}`,
      onMount(sheet) {
        TD.media.hydrate(sheet);
        const b = sheet.querySelector('[data-another]');
        if (b) b.addEventListener('click', () => showGlimmer(g.id));
      },
    });
  }

  TD.actions['open-box'] = (el) => {
    if (!TD.store.get().glimmers.length)
      return TD.ui.modal({
        title: 'glimmers',
        small: true,
        body: `<p class="box-empty">The box is empty.</p><a class="btn" href="#glimmers" data-close>Add something good</a>`,
      });
    el.classList.add('opening');
    setTimeout(() => {
      el.classList.remove('opening');
      showGlimmer();
    }, 380);
  };

  TD.actions['shuffle-msg'] = () => {
    const next = M.randomMessage(TD.state.homeMsgId);
    TD.state.homeMsgId = next && next.id;
    TD.app.render();
  };
  TD.actions['go-habits'] = (el) => {
    TD.state.openHabit = el.dataset.id;
    location.hash = '#habits';
  };
})();
