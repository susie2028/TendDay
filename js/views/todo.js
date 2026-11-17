/* 할 일 */
(function () {
  const U = TD.util, M = TD.model, esc = U.esc, icon = TD.icon;
  const A = TD.actions;

  TD.views.todoItem = (t, showDate) => `
    <li class="todo ${t.done ? 'done' : ''}" style="--c:${M.catColor(t.categoryId)}">
      <button class="check" data-action="toggle-todo" data-id="${t.id}" aria-pressed="${t.done}" aria-label="${esc(t.text)}">${icon('check', 11)}</button>
      <button class="todo-text" data-action="todo-edit" data-id="${t.id}">${esc(t.text)}${showDate ? `<span class="todo-date">${U.fmtShort(t.date)}</span>` : ''}</button>
      <button class="icon-btn todo-more" data-action="todo-menu" data-id="${t.id}" aria-label="More">${icon('more', 15)}</button>
    </li>`;

  function dayStamp(d, sel, today, withLeft) {
    const st = M.dayStatus(d);
    const p = st.total ? Math.round(((st.total - st.left) / st.total) * 100) : 0;
    const cls = !st.total ? 'empty' : st.left ? '' : 'full';
    return `<button class="day ${d === sel ? 'sel' : ''} ${d === today ? 'today' : ''}" data-action="pick-day" data-date="${d}" aria-label="${U.fmtLong(d)}" aria-pressed="${d === sel}">
        <span class="stamp ${cls}" style="--p:${p}%"><span class="num">${U.parse(d).getDate()}</span></span>
        ${withLeft ? `<span class="day-left">${st.left || ''}</span>` : ''}
      </button>`;
  }
  const DOW_HEAD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="dh">${d}</span>`).join('');
  const ym = (s) => U.fmtMonth(s);

  function weekCal(sel, today) {
    const ws = U.weekStart(sel);
    const days = Array.from({ length: 7 }, (_, i) => U.addDays(ws, i));
    return `
      <div class="cal-nav">
        <button class="icon-btn" data-action="week" data-n="-7" aria-label="Previous week">${icon('left', 15)}</button>
        <span>${ym(sel)}</span>
        <button class="icon-btn" data-action="week" data-n="7" aria-label="Next week">${icon('right', 15)}</button>
      </div>
      <div class="days">${DOW_HEAD}${days.map((d) => dayStamp(d, sel, today, true)).join('')}</div>`;
  }

  function monthCal(sel, today) {
    const d0 = U.parse(sel);
    const y = d0.getFullYear(), mo = d0.getMonth();
    const last = new Date(y, mo + 1, 0).getDate();
    const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
    let cells = '<span></span>'.repeat(lead);
    for (let day = 1; day <= last; day++) cells += dayStamp(U.ymd(new Date(y, mo, day)), sel, today, false);
    const list = TD.store.get().todos.filter((t) => t.date.startsWith(sel.slice(0, 7)));
    const doneN = list.filter((t) => t.done).length;
    const fullN = [...new Set(list.map((t) => t.date))].filter((d) => M.dayStatus(d).left === 0).length;
    return `
      <div class="cal-nav">
        <button class="icon-btn" data-action="month" data-n="-1" aria-label="Previous month">${icon('left', 15)}</button>
        <span>${ym(sel)}</span>
        <button class="icon-btn" data-action="month" data-n="1" aria-label="Next month">${icon('right', 15)}</button>
      </div>
      <div class="days">${DOW_HEAD}${cells}</div>
      ${list.length ? `<p class="month-sum">${doneN}/${list.length} done · ${fullN} full days</p>` : ''}`;
  }

  /* 주간 보드: 월~일을 한눈에 크게 */
  function board(sel, today) {
    const ws = U.weekStart(sel);
    const days = Array.from({ length: 7 }, (_, i) => U.addDays(ws, i));
    const cats = M.categories();
    const cur = cats.find((c) => c.id === TD.state.boardCat) || cats[0];
    const we = days[6];
    const range = `${U.fmtShort(ws)} – ${ws.slice(5, 7) === we.slice(5, 7) ? U.parse(we).getDate() : U.fmtShort(we)}`;
    const col = (d) => {
      const list = M.todosOn(d);
      const left = list.filter((t) => !t.done).length;
      const dt = U.parse(d);
      return `
        <section class="panel bday ${d === today ? 'today' : ''}">
          <div class="ph"><span><b>${U.DOW[dt.getDay()]}</b> ${dt.getDate()}</span><span class="r">${list.length ? (left ? left : 'done') : ''}</span></div>
          <div class="pb">
            <ul>${list.map((t) => TD.views.todoItem(t)).join('')}</ul>
            <input class="board-add" data-enter="board-add" data-date="${d}" maxlength="200" placeholder="+" aria-label="Add task on ${U.fmtLong(d)}">
          </div>
        </section>`;
    };
    return `
      <div class="board-bar">
        <button class="icon-btn" data-action="week" data-n="-7" aria-label="Previous week">${icon('left', 15)}</button>
        <span class="board-range">${range}</span>
        <button class="icon-btn" data-action="week" data-n="7" aria-label="Next week">${icon('right', 15)}</button>
        ${cats.length > 1 ? `<div class="board-cats"><span>add to</span>${cats.map((c) => `<button class="cat-pill ${c.id === (cur && cur.id) ? 'on' : ''}" style="--c:${TD.COLORS[c.color] || TD.COLORS.gray}" data-action="board-cat" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>` : ''}
      </div>
      <div class="board">${days.map(col).join('')}</div>`;
  }

  TD.views.todo = () => {
    const sel = TD.state.todoDate;
    const today = U.today();
    const list = M.todosOn(sel);
    const cats = M.categories();
    const over = sel === today ? M.overdue() : [];
    const mode = TD.state.todoView;
    const d = U.parse(sel);

    const catBlocks = cats
      .map((c) => {
        const items = list.filter((t) => t.categoryId === c.id);
        const adding = TD.state.addingCat === c.id;
        const col = TD.COLORS[c.color] || TD.COLORS.gray;
        return `
          <div class="cat" style="--c:${col}">
            <div class="cat-head">
              <button class="cat-pill" data-action="cat-quick" data-id="${c.id}">${esc(c.name)}</button>
              <button class="icon-btn" data-action="add-todo-open" data-cat="${c.id}" aria-label="Add to ${esc(c.name)}">${icon('plus', 14)}</button>
            </div>
            <ul>
              ${items.map((t) => TD.views.todoItem(t)).join('')}
              ${adding ? `<li class="todo" style="--c:${col}"><span class="check ghost"></span><input class="add-input" data-enter="add-todo" data-cat="${c.id}" maxlength="200" aria-label="New ${esc(c.name)} task"></li>` : ''}
            </ul>
          </div>`;
      })
      .join('');

    const left = `
      <section class="panel">
        <div class="ph"><span>${mode === 'month' ? 'month' : 'week'}</span></div>
        <div class="pb">${mode === 'month' ? monthCal(sel, today) : weekCal(sel, today)}</div>
      </section>
      ${over.length ? `<div class="row-line"><span>${over.length} overdue</span><button class="btn" data-action="move-overdue">Move to today</button></div>` : ''}
    `;
    const right = `
      <section class="panel">
        <div class="ph"><span>${U.fmtLong(sel)}${sel === today ? ' · today' : ''}</span></div>
        <div class="pb">${cats.length ? catBlocks : `<button class="btn" data-action="cat-new">Add category</button>`}</div>
      </section>
    `;
    const showToday = mode === 'board' ? U.weekStart(sel) !== U.weekStart(today) : sel !== today;
    const actions = `
      ${showToday ? `<button class="btn" data-action="go-today">Today</button>` : ''}
      <div class="seg"><button class="${mode === 'week' ? 'on' : ''}" data-action="todo-view" data-v="week">Week</button><button class="${mode === 'month' ? 'on' : ''}" data-action="todo-view" data-v="month">Month</button><button class="${mode === 'board' ? 'on' : ''}" data-action="todo-view" data-v="board">Board</button></div>
      <button class="btn" data-action="edit-cats">Categories</button>`;
    if (mode === 'board') return { title: 'Tasks', actions, layout: 'full', left: board(sel, today), right: '' };
    return { title: 'Tasks', actions, left, right };
  };

  /* 동작 */
  A['toggle-todo'] = (el) => M.toggleTodo(el.dataset.id);
  A['pick-day'] = (el) => { TD.state.todoDate = el.dataset.date; TD.state.addingCat = null; TD.app.render(); };
  A['week'] = (el) => { TD.state.todoDate = U.addDays(TD.state.todoDate, +el.dataset.n); TD.state.addingCat = null; TD.app.render(); };
  A['month'] = (el) => { const d = U.parse(TD.state.todoDate); TD.state.todoDate = U.ymd(new Date(d.getFullYear(), d.getMonth() + +el.dataset.n, 1)); TD.app.render(); };
  A['go-today'] = () => { TD.state.todoDate = U.today(); TD.app.render(); };
  A['todo-view'] = (el) => { TD.state.todoView = el.dataset.v; TD.app.render(); };

  A['board-cat'] = (el) => { TD.state.boardCat = el.dataset.id; TD.app.render(); };
  A['board-add'] = (el) => {
    const text = el.value.trim();
    if (!text) return;
    const cats = M.categories();
    const cat = cats.find((c) => c.id === TD.state.boardCat) || cats[0];
    const date = el.dataset.date;
    M.addTodo(text, date, cat ? cat.id : null);
    const next = document.querySelector(`.board-add[data-date="${date}"]`);
    if (next) next.focus({ preventScroll: true });
  };
  A['add-todo-open'] = (el) => { TD.state.addingCat = el.dataset.cat; TD.app.render(); };
  A['add-todo'] = (el) => { const text = el.value.trim(); if (text) M.addTodo(text, TD.state.todoDate, el.dataset.cat); };
  A['add-input-escape'] = () => { TD.state.addingCat = null; TD.app.render(); };
  A['add-input-blur'] = (el) => {
    if (el.value.trim()) return;
    const cat = el.dataset.cat;
    setTimeout(() => {
      if (TD.state.addingCat === cat && !document.activeElement.classList.contains('add-input')) {
        TD.state.addingCat = null;
        TD.app.render();
      }
    }, 150);
  };
  A['move-overdue'] = () => M.moveOverdueToToday();

  A['todo-menu'] = (el) => {
    const t = M.todo(el.dataset.id);
    if (!t) return;
    const today = U.today();
    const items = [];
    if (t.date !== today) items.push({ label: 'Move to today', run: () => M.moveTodo(t.id, today) });
    items.push(
      { label: 'Tomorrow', run: () => M.moveTodo(t.id, U.addDays(t.date, 1)) },
      { label: 'Change date', run: () => pickDate(t) },
      { label: 'Change category', run: () => TD.ui.menu('Category', M.categories().map((c) => ({ label: (c.id === t.categoryId ? '✓ ' : '') + c.name, run: () => M.updateTodo(t.id, { categoryId: c.id }) }))) },
      { label: 'Delete', danger: true, run: () => M.removeTodo(t.id) }
    );
    TD.ui.menu('Task', items);
  };

  /* 글자를 누르면 그 자리에서 바로 고쳐요. Enter·바깥 누르면 저장, Esc는 취소 */
  A['todo-edit'] = (el) => {
    const t = M.todo(el.dataset.id);
    if (!t) return;
    const input = document.createElement('input');
    input.className = 'todo-input';
    input.value = t.text;
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Edit task');
    el.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const v = input.value.trim();
      if (save && v && v !== t.text) M.updateTodo(t.id, { text: v });
      else TD.app.render();
    };
    input.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  };

  function pickDate(t) {
    TD.ui.modal({
      title: 'Change date',
      body: `<input type="date" class="input" value="${t.date}" autofocus>
        <div class="sheet-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>Move</button></div>`,
      onMount(sheet) {
        sheet.querySelector('[data-ok]').addEventListener('click', () => {
          const v = sheet.querySelector('input').value;
          if (!v) return;
          TD.ui.close();
          M.moveTodo(t.id, v);
        });
      },
    });
  }

  /* 카테고리 */
  const countIn = (id) => TD.store.get().todos.filter((t) => t.categoryId === id).length;
  const catList = () => `
    <div>${M.categories()
      .map((c) => `<button class="cat-row" style="--c:${TD.COLORS[c.color] || TD.COLORS.gray}" data-action="cat-quick" data-id="${c.id}"><span class="dot"></span><span class="name">${esc(c.name)}</span><span class="n">${countIn(c.id)}</span></button>`)
      .join('')}</div>
    <button class="btn block" data-action="cat-new">${icon('plus', 14)} Add</button>`;
  A['edit-cats'] = () => TD.ui.modal({ title: 'Categories', body: catList });

  function catForm(c) {
    const used = M.categories().map((x) => x.color);
    const f = c ? { name: c.name, color: c.color } : { name: '', color: Object.keys(TD.COLORS).find((k) => !used.includes(k)) || 'green' };
    TD.ui.modal({
      title: c ? 'Edit category' : 'New category',
      body: `
        <div class="field"><label for="cf-name">Name</label><input id="cf-name" class="input" value="${esc(f.name)}" maxlength="12" autofocus></div>
        <div class="field"><span class="label">Color</span><div class="swatches">${Object.entries(TD.COLORS)
          .map(([k, v]) => `<button class="swatch" style="--c:${v}" data-color="${k}" aria-label="${TD.COLOR_NAMES[k]}" title="${TD.COLOR_NAMES[k]}"></button>`)
          .join('')}</div></div>
        <div class="sheet-foot">
          ${c ? `<button class="btn danger" data-del>Delete</button>` : `<button class="btn" data-close>Cancel</button>`}
          <button class="btn primary" data-ok>${c ? 'Save' : 'Add'}</button>
        </div>`,
      onMount(sheet) {
        const name = sheet.querySelector('#cf-name');
        const paint = () => sheet.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('on', b.dataset.color === f.color));
        paint();
        sheet.querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', () => { f.color = b.dataset.color; paint(); }));
        const save = () => {
          const v = name.value.trim();
          if (!v) return name.focus();
          TD.ui.close();
          if (c) M.updateCategory(c.id, { name: v, color: f.color });
          else M.addCategory(v, f.color);
        };
        sheet.querySelector('[data-ok]').addEventListener('click', save);
        name.addEventListener('keydown', (e) => { if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') save(); });
        const del = sheet.querySelector('[data-del]');
        if (del)
          del.addEventListener('click', () => {
            const n = countIn(c.id);
            if (!n) return TD.ui.close(), M.removeCategory(c.id);
            TD.ui.confirm('Delete category', `'${c.name}' and its ${n} tasks will be deleted.`, 'Delete', () => M.removeCategory(c.id));
          });
      },
    });
  }
  A['cat-quick'] = (el) => catForm(M.cat(el.dataset.id));
  A['cat-new'] = () => catForm(null);
})();
