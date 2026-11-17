/* 습관 */
(function () {
  const U = TD.util, M = TD.model, esc = U.esc, icon = TD.icon;
  const A = TD.actions;

  TD.views.habitRow = (h, date, compact) => {
    const v = M.hval(h, date), g = M.goal(h), done = v >= g;
    const st = M.streak(h);
    const partial = !done && v > 0 && g > 1;
    return `
      <li class="habit ${done ? 'done' : ''} ${!compact && TD.state.openHabit === h.id ? 'sel' : ''}">
        <button class="hcheck ${partial ? 'partial' : ''}" ${partial ? `style="--p:${Math.round((v / g) * 100)}%"` : ''} data-action="habit-toggle" data-id="${h.id}" data-date="${date}" aria-pressed="${done}" aria-label="${esc(h.name)}">${icon('check', 11)}</button>
        <button class="habit-main" data-action="${compact ? 'go-habits' : 'habit-open'}" data-id="${h.id}">
          <span class="habit-name">${esc(h.name)}</span>
          <span class="habit-meta">${M.daysLabel(h.days)}${st ? ` · ${TD.t('{n}d', { n: st })}` : ''}</span>
        </button>
        ${g > 1
          ? `<div class="counter">
              <button class="icon-btn" data-action="habit-dec" data-id="${h.id}" data-date="${date}" aria-label="${TD.t('Minus')}">${icon('minus', 13)}</button>
              <span class="cnt">${v}/${g}${h.unit ? esc(h.unit) : ''}</span>
              <button class="icon-btn" data-action="habit-inc" data-id="${h.id}" data-date="${date}" aria-label="${TD.t('Plus')}">${icon('plus', 13)}</button>
            </div>`
          : ''}
      </li>`;
  };

  function monthCalendar(h) {
    const today = U.today();
    const m = TD.state.habitMonth;
    const d0 = U.parse(m);
    const y = d0.getFullYear(), mo = d0.getMonth();
    const last = new Date(y, mo + 1, 0).getDate();
    let cells = '<span></span>'.repeat((d0.getDay() + 6) % 7);
    let done = 0, due = 0;
    for (let day = 1; day <= last; day++) {
      const ds = U.ymd(new Date(y, mo, day));
      const sched = M.isScheduled(h, ds), isDone = M.isDone(h, ds), v = M.hval(h, ds), future = ds > today;
      const counted = sched && !future && ds >= h.createdAt;
      let cls = isDone ? 'on' : v > 0 ? 'part' : counted ? 'miss' : 'off';
      if (counted) { due++; if (isDone) done++; }
      if (ds === today) cls += ' today';
      cells += future
        ? `<span class="c ${cls}">${day}</span>`
        : `<button class="c ${cls}" data-action="habit-toggle" data-id="${h.id}" data-date="${ds}" aria-label="${U.fmtLong(ds)}">${day}</button>`;
    }
    const thisMonth = today.slice(0, 8) + '01';
    return `
      <div class="cal-head">
        <button class="icon-btn" data-action="habit-month" data-n="-1" aria-label="${TD.t('Previous month')}">${icon('left', 14)}</button>
        <span>${U.fmtMonth(m)}</span>
        <button class="icon-btn" data-action="habit-month" data-n="1"  aria-label="${TD.t('Next month')}" ${m >= thisMonth ? 'disabled style="opacity:.3"' : ''}>${icon('right', 14)}</button>
        <span class="rate">${due ? `${done}/${due} · ${Math.round((done / due) * 100)}%` : ''}</span>
      </div>
      <div class="cal">${U.DOW_HEAD.map((d) => `<span class="dh">${d}</span>`).join('')}${cells}</div>`;
  }

  function stats(h) {
    const today = U.today();
    const log = TD.store.get().habitLogs[h.id] || {};
    const total = Object.keys(log).filter((d) => M.isDone(h, d)).length;
    let best = 0, run = 0;
    for (let d = h.createdAt; d <= today; d = U.addDays(d, 1)) {
      if (!M.isScheduled(h, d)) continue;
      if (M.isDone(h, d)) best = Math.max(best, ++run);
      else if (d < today) run = 0;
    }
    return { streak: M.streak(h), best, total };
  }

  TD.views.habits = () => {
    const today = U.today();
    const all = M.habits();
    const todays = all.filter((h) => M.isScheduled(h, today));
    const rest = all.filter((h) => !M.isScheduled(h, today));
    if (!all.some((h) => h.id === TD.state.openHabit)) TD.state.openHabit = all.length ? (todays[0] || all[0]).id : null;
    const sel = all.find((h) => h.id === TD.state.openHabit);

    const left = `
      <section class="panel">
        <div class="ph"><span>${TD.t('today')}</span><span>${todays.filter((h) => M.isDone(h, today)).length}/${todays.length}</span></div>
        <div class="pb">${todays.length ? `<ul>${todays.map((h) => TD.views.habitRow(h, today, false)).join('')}</ul>` : `<p class="empty">${TD.t('Nothing today')}</p>`}</div>
      </section>
      ${rest.length ? `<section class="panel"><div class="ph"><span>${TD.t('rest')}</span></div><div class="pb"><ul>${rest.map((h) => TD.views.habitRow(h, today, false)).join('')}</ul></div></section>` : ''}
    `;

    let right = '';
    if (sel) {
      const s = stats(sel);
      right = `
        <section class="panel">
          <div class="ph"><span>${M.daysLabel(sel.days)} · ${M.TIMES[sel.time]}${M.goal(sel) > 1 ? ` · ${M.goal(sel)}${esc(sel.unit || '')}` : ''}</span><span class="r"><button class="link" data-action="habit-edit" data-id="${sel.id}">${TD.t('edit')}</button></span></div>
          <div class="pb">
            <p class="detail-name">${esc(sel.name)}</p>
            <div class="stats"><span class="tag">${TD.t('streak {n}', { n: s.streak })}</span><span class="tag">${TD.t('best {n}', { n: s.best })}</span><span class="tag">${TD.t('total {n}', { n: s.total })}</span><span class="tag">${TD.t('since {d}', { d: sel.createdAt.replace(/-/g, '.') })}</span></div>
            ${monthCalendar(sel)}
          </div>
        </section>`;
    }

    return { title: TD.t('Habits'), actions: `<button class="btn primary" data-action="habit-new">${icon('plus', 14)} ${TD.t('New habit')}</button>`, left, right };
  };

  /* 동작 */
  A['habit-toggle'] = (el) => M.toggleHabit(M.habit(el.dataset.id), el.dataset.date);
  A['habit-inc'] = (el) => { const h = M.habit(el.dataset.id); M.setHval(h, el.dataset.date, M.hval(h, el.dataset.date) + 1); };
  A['habit-dec'] = (el) => { const h = M.habit(el.dataset.id); M.setHval(h, el.dataset.date, M.hval(h, el.dataset.date) - 1); };
  A['habit-open'] = (el) => {
    if (TD.state.openHabit !== el.dataset.id) TD.state.habitMonth = U.today().slice(0, 8) + '01';
    TD.state.openHabit = el.dataset.id;
    TD.app.render();
  };
  A['habit-month'] = (el) => {
    const d = U.parse(TD.state.habitMonth);
    d.setMonth(d.getMonth() + +el.dataset.n);
    TD.state.habitMonth = U.ymd(d);
    TD.app.render();
  };
  A['habit-new'] = () => habitForm();
  A['habit-edit'] = (el) => habitForm(M.habit(el.dataset.id));

  function habitForm(h) {
    const f = h
      ? { name: h.name, days: [...h.days], time: h.time, target: h.target || '', unit: h.unit || '' }
      : { name: '', days: [0, 1, 2, 3, 4, 5, 6], time: 'any', target: '', unit: '' };
    const ORDER = [1, 2, 3, 4, 5, 6, 0];
    TD.ui.modal({
      title: TD.t(h ? 'Edit habit' : 'New habit'),
      body: `
        <div class="field"><label for="hf-name">${TD.t('Name')}</label><input id="hf-name" class="input" value="${esc(f.name)}" maxlength="40" autofocus></div>
        <div class="field">
          <span class="label"><span>${TD.t('Days')}</span><span><button class="chip text" data-preset="0123456">${TD.t('daily')}</button><button class="chip text" data-preset="12345">${TD.t('weekdays')}</button><button class="chip text" data-preset="06">${TD.t('weekends')}</button></span></span>
          <div class="chips" id="hf-days">${ORDER.map((d) => `<button class="chip" data-d="${d}">${U.DOW[d]}</button>`).join('')}</div>
        </div>
        <div class="field"><span class="label">${TD.t('Time')}</span><div class="chips" id="hf-time">${Object.entries(M.TIMES).map(([k, v]) => `<button class="chip" data-t="${k}">${v}</button>`).join('')}</div></div>
        <div class="field"><label for="hf-target"><span>${TD.t('Daily goal')}</span><span>${TD.t('optional')}</span></label>
          <div class="row"><input id="hf-target" class="input" type="number" min="1" max="99" inputmode="numeric" value="${f.target}" placeholder="8"><input id="hf-unit" class="input" value="${esc(f.unit)}"  placeholder="${TD.t('cups')}" maxlength="6"></div>
        </div>
        <div class="sheet-foot">
          ${h ? `<button class="btn danger" data-del>${TD.t('Delete')}</button>` : `<button class="btn" data-close>${TD.t('Cancel')}</button>`}
          <button class="btn primary" data-ok>${TD.t(h ? 'Save' : 'Create')}</button>
        </div>`,
      onMount(sheet) {
        const paint = () => {
          sheet.querySelectorAll('#hf-days .chip').forEach((b) => b.classList.toggle('on', f.days.includes(+b.dataset.d)));
          sheet.querySelectorAll('#hf-time .chip').forEach((b) => b.classList.toggle('on', f.time === b.dataset.t));
        };
        paint();
        sheet.querySelectorAll('#hf-days .chip').forEach((b) => b.addEventListener('click', () => { const d = +b.dataset.d; f.days = f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d]; paint(); }));
        sheet.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { f.days = b.dataset.preset.split('').map(Number); paint(); }));
        sheet.querySelectorAll('#hf-time .chip').forEach((b) => b.addEventListener('click', () => { f.time = b.dataset.t; paint(); }));
        const save = () => {
          const name = sheet.querySelector('#hf-name').value.trim();
          if (!name) return sheet.querySelector('#hf-name').focus();
          if (!f.days.length) return;
          const t = parseInt(sheet.querySelector('#hf-target').value, 10);
          TD.ui.close();
          M.saveHabit({ name, days: f.days.sort(), time: f.time, target: t > 1 ? t : null, unit: t > 1 ? sheet.querySelector('#hf-unit').value.trim() : '' }, h && h.id);
        };
        sheet.querySelector('[data-ok]').addEventListener('click', save);
        sheet.querySelector('#hf-name').addEventListener('keydown', (e) => { if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') save(); });
        const del = sheet.querySelector('[data-del]');
        if (del) del.addEventListener('click', () => TD.ui.confirm(TD.t('Delete habit'), TD.t("'{h}' and its history will be deleted.", { h: h.name }), TD.t('Delete'), () => M.removeHabit(h.id)));
      },
    });
  }
})();
