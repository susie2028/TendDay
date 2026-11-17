/* 주간 보드: 세부 할 일과 따로, 이번 주의 큰 일들을 덩어리(카드)로 요일마다 놓아요 */
(function () {
  const U = TD.util, M = TD.model, esc = U.esc, icon = TD.icon;
  const A = TD.actions;

  const card = (c) => `
    <div class="chunk ${c.done ? 'done' : ''} ${c.color ? 'tinted' : ''}" data-id="${c.id}" ${c.color ? `style="--c:${TD.COLORS[c.color]}"` : ''}>
      <div class="chunk-text" data-action="chunk-edit" data-id="${c.id}">${esc(c.text)}</div>
      <div class="chunk-foot">
        <button class="chunk-check" data-action="chunk-done" data-id="${c.id}" aria-pressed="${c.done}" aria-label="${TD.t('Done')}">${c.done ? icon('check', 11) : ''}</button>
        <button class="icon-btn" data-action="chunk-menu" data-id="${c.id}" aria-label="${TD.t('More')}">${icon('more', 14)}</button>
      </div>
    </div>`;

  TD.views.board = (sel, today) => {
    const ws = U.weekStart(sel);
    const days = Array.from({ length: 7 }, (_, i) => U.addDays(ws, i));
    const we = days[6];
    const range = U.fmtRange(ws, we);
    const all = days.flatMap(M.chunksOn);
    const col = (d) => {
      const list = M.chunksOn(d);
      const dt = U.parse(d);
      return `
        <section class="bday ${d === today ? 'today' : ''}" data-date="${d}">
          <div class="bday-h"><b>${U.DOW[dt.getDay()]}</b> <span>${dt.getDate()}</span></div>
          <div class="bday-list" data-date="${d}">${list.map(card).join('')}</div>
          <textarea class="board-add" rows="1" data-date="${d}" maxlength="300" placeholder="+" aria-label="${TD.t('Add on {d}', { d: U.fmtLong(d) })}"></textarea>
        </section>`;
    };
    return `
      <div class="board-bar">
        <button class="icon-btn" data-action="week" data-n="-7" aria-label="${TD.t('Previous week')}">${icon('left', 15)}</button>
        <span class="board-range">${range}</span>
        <button class="icon-btn" data-action="week" data-n="7" aria-label="${TD.t('Next week')}">${icon('right', 15)}</button>
        ${all.length ? `<span class="board-sum">${all.filter((c) => c.done).length}/${all.length}</span>` : ''}
      </div>
      <div class="board">${days.map(col).join('')}</div>`;
  };

  /* 추가: Enter로 넣고, Shift+Enter는 줄바꿈 */
  const grow = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('board-add') || e.target.classList.contains('chunk-input')) grow(e.target);
  });
  document.addEventListener('keydown', (e) => {
    const ta = e.target;
    if (!ta.classList || !ta.classList.contains('board-add')) return;
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') { ta.value = ''; ta.blur(); return; }
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) return;
    const date = ta.dataset.date;
    M.addChunk(text, date);
    const next = document.querySelector(`.board-add[data-date="${date}"]`);
    if (next) next.focus({ preventScroll: true });
  });

  A['chunk-done'] = (el) => { const c = M.chunk(el.dataset.id); M.updateChunk(c.id, { done: !c.done }); };

  /* 글자를 누르면 그 자리에서 고쳐요 */
  A['chunk-edit'] = (el) => {
    const c = M.chunk(el.dataset.id);
    if (!c) return;
    const ta = document.createElement('textarea');
    ta.className = 'chunk-input';
    ta.value = c.text;
    ta.maxLength = 300;
    ta.setAttribute('aria-label', 'Edit');
    el.replaceWith(ta);
    grow(ta);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const v = ta.value.trim();
      if (save && v && v !== c.text) M.updateChunk(c.id, { text: v });
      else TD.app.render();
    };
    ta.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    ta.addEventListener('blur', () => finish(true));
  };

  const move = (c, date) => M.updateChunk(c.id, { date, order: Date.now() });
  A['chunk-menu'] = (el) => {
    const c = M.chunk(el.dataset.id);
    if (!c) return;
    const ws = U.weekStart(c.date);
    const dayLabel = (d) => `${U.DOW[U.parse(d).getDay()]} ${U.parse(d).getDate()}`;
    TD.ui.menu(TD.t('Block'), [
      { label: TD.t('Move to…'), run: () => TD.ui.menu(TD.t('Move to'), [
        ...Array.from({ length: 7 }, (_, i) => U.addDays(ws, i)).filter((d) => d !== c.date).map((d) => ({ label: dayLabel(d), run: () => move(c, d) })),
        { label: TD.t('Next week, same day'), run: () => move(c, U.addDays(c.date, 7)) },
      ]) },
      { label: TD.t('Color'), run: () => TD.ui.menu(TD.t('Color'), [
        { label: (c.color ? '' : '✓ ') + TD.t('None'), run: () => M.updateChunk(c.id, { color: null }) },
        ...Object.keys(TD.COLORS).map((k) => ({ label: (c.color === k ? '✓ ' : '') + TD.t(TD.COLOR_NAMES[k]), run: () => M.updateChunk(c.id, { color: k }) })),
      ]) },
      { label: TD.t('Delete'), danger: true, run: () => M.removeChunk(c.id) },
    ]);
  };

})();
