/* Decide: 고민을 Yes/No 흐름도로 정리 */
(function () {
  const U = TD.util, M = TD.model, S = TD.store, esc = U.esc, icon = TD.icon;
  const A = TD.actions;

  const PICKS = ['Can I control it?', 'Will it matter in a year?', 'Is it urgent?', 'Do I actually want this?', 'Can I undo it?', 'Is it worth the cost?'];

  /* data */
  const all = () => [...S.get().decisions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const get = (id) => S.get().decisions.find((d) => d.id === id);
  const node = (q, kind, text) => ({ id: U.uid(), kind, text, yes: null, no: null });

  function create(text) {
    const root = node(null, 'q', text);
    const d = { id: U.uid(), createdAt: new Date().toISOString(), root: root.id, nodes: { [root.id]: root }, chosen: null, outcome: '' };
    S.update((s) => s.decisions.push(d));
    TD.state.decisionId = d.id;
    TD.app.render();
  }
  function parentOf(d, id) {
    for (const n of Object.values(d.nodes)) {
      if (n.yes === id) return [n.id, 'yes'];
      if (n.no === id) return [n.id, 'no'];
    }
    return null;
  }
  function pathTo(d, id) {
    const set = new Set();
    let cur = id;
    while (cur) {
      set.add(cur);
      const p = parentOf(d, cur);
      cur = p && p[0];
    }
    return set;
  }
  function subtree(d, id, out = []) {
    const n = d.nodes[id];
    if (!n) return out;
    out.push(id);
    if (n.yes) subtree(d, n.yes, out);
    if (n.no) subtree(d, n.no, out);
    return out;
  }

  /* render */
  function nodeHTML(d, id, onPath) {
    const n = d.nodes[id];
    const on = onPath.has(id) ? 'on' : '';
    if (n.kind === 'a') {
      const chosen = d.chosen === id;
      return `<div class="tn"><div class="node a ${on} ${chosen ? 'chosen' : ''}">
          <button class="node-text" data-action="dn-edit" data-d="${d.id}" data-n="${id}">${esc(n.text)}</button>
          <button class="node-more" data-action="dn-menu" data-d="${d.id}" data-n="${id}" aria-label="More">${icon('more', 13)}</button>
        </div></div>`;
    }
    const branch = (b) => `<div class="br"><span class="edge">${b}</span>${n[b] ? nodeHTML(d, n[b], onPath) : slot(d, id, b)}</div>`;
    return `<div class="tn"><div class="node q ${on}">
        <button class="node-text" data-action="dn-edit" data-d="${d.id}" data-n="${id}">${esc(n.text)}</button>
        <button class="node-more" data-action="dn-menu" data-d="${d.id}" data-n="${id}" aria-label="More">${icon('more', 13)}</button>
      </div><div class="branches">${branch('yes')}${branch('no')}</div></div>`;
  }
  const slot = (d, id, b) => `<div class="slot">
      <button data-action="dn-add" data-kind="q" data-d="${d.id}" data-n="${id}" data-b="${b}">+ question</button>
      <button data-action="dn-add" data-kind="a" data-d="${d.id}" data-n="${id}" data-b="${b}">+ then</button>
    </div>`;

  TD.views.decide = () => {
    const list = all();
    if (TD.state.decisionId !== '__new' && !list.some((d) => d.id === TD.state.decisionId)) TD.state.decisionId = list[0] && list[0].id;
    const cur = get(TD.state.decisionId);

    const left = `
      <section class="panel">
        <div class="ph"><span>decisions</span><span>${list.length}</span></div>
        <div class="pb">${list.length
          ? `<ul class="dlist">${list
              .map((d) => `<li><button class="${d.id === TD.state.decisionId ? 'on' : ''}" data-action="dn-open" data-d="${d.id}"><span>${esc(d.nodes[d.root].text)}</span><span class="meta">${U.fmtShort(d.createdAt.slice(0, 10))}${d.chosen ? ' · decided' : ''}</span></button></li>`)
              .join('')}</ul>`
          : `<p class="empty">Nothing yet</p>`}</div>
      </section>`;

    let right;
    if (!cur) {
      right = `
        <section class="panel">
          <div class="ph"><span>new</span></div>
          <div class="pb"><div class="row"><input class="input" id="dn-new" data-enter="dn-create" placeholder="Should I…?" maxlength="120"><button class="btn primary" data-action="dn-create">Start</button></div></div>
        </section>`;
    } else {
      const onPath = cur.chosen ? pathTo(cur, cur.chosen) : new Set();
      const chosen = cur.chosen && cur.nodes[cur.chosen];
      right = `
        <section class="panel">
          <div class="ph"><span>${U.fmtCreated(cur.createdAt)}</span><span class="r"><button class="link" data-action="dn-delete" data-d="${cur.id}">delete</button></span></div>
          <div class="pb"><div class="tree">${nodeHTML(cur, cur.root, onPath)}</div></div>
        </section>
        ${chosen
          ? `<section class="panel">
              <div class="ph"><span>decided</span><span class="r"><button class="link" data-action="dn-to-task" data-d="${cur.id}" data-n="${chosen.id}">add to tasks</button></span></div>
              <div class="pb">
                <p class="decided">${esc(chosen.text)}</p>
                <textarea class="input outcome" data-change="dn-outcome" data-d="${cur.id}" placeholder="How did it go?" rows="2">${esc(cur.outcome || '')}</textarea>
              </div>
            </section>`
          : ''}`;
    }

    return {
      title: 'Decide',
      layout: 'wide',
      actions: `<button class="btn primary" data-action="dn-new">${icon('plus', 14)} New</button>`,
      left,
      right,
    };
  };

  /* actions */
  A['dn-open'] = (el) => { TD.state.decisionId = el.dataset.d; TD.app.render(); };
  A['dn-new'] = () => {
    TD.state.decisionId = '__new';
    TD.app.render();
    setTimeout(() => { const i = document.getElementById('dn-new'); if (i) i.focus(); }, 0);
  };
  A['dn-create'] = () => {
    const i = document.getElementById('dn-new');
    const v = i.value.trim();
    if (!v) return i.focus();
    create(v);
  };

  function askQuestion(title, value, onOk) {
    TD.ui.modal({
      title,
      body: `<input class="input" id="dq" value="${esc(value)}" placeholder="…?" maxlength="120" autofocus>
        <div class="chips">${PICKS.map((p) => `<button class="chip" data-pick="${esc(p)}">${esc(p)}</button>`).join('')}</div>
        <div class="sheet-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>Save</button></div>`,
      onMount(sheet) {
        const inp = sheet.querySelector('#dq');
        sheet.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.pick; inp.focus(); }));
        const ok = () => { const v = inp.value.trim(); if (!v) return inp.focus(); TD.ui.close(); onOk(v); };
        sheet.querySelector('[data-ok]').addEventListener('click', ok);
        inp.addEventListener('keydown', (e) => { if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') ok(); });
      },
    });
  }

  A['dn-add'] = (el) => {
    const { d, n, b, kind } = el.dataset;
    const add = (text) =>
      S.update((s) => {
        const dec = s.decisions.find((x) => x.id === d);
        const nn = node(null, kind, text);
        dec.nodes[nn.id] = nn;
        dec.nodes[n][b] = nn.id;
      });
    if (kind === 'q') askQuestion('New question', '', add);
    else TD.ui.prompt('Then…', { placeholder: 'Do it / Wait a week / Ask someone' }, add);
  };

  A['dn-edit'] = (el) => {
    const dec = get(el.dataset.d), n = dec.nodes[el.dataset.n];
    const save = (v) => S.update((s) => (s.decisions.find((x) => x.id === dec.id).nodes[n.id].text = v));
    if (n.kind === 'q') askQuestion('Edit question', n.text, save);
    else TD.ui.prompt('Edit', { value: n.text }, save);
  };

  A['dn-menu'] = (el) => {
    const dec = get(el.dataset.d), n = dec.nodes[el.dataset.n];
    const upd = (fn) => S.update((s) => fn(s.decisions.find((x) => x.id === dec.id)));
    const items = [{ label: 'Edit', run: () => A['dn-edit'](el) }];
    if (n.kind === 'a') {
      items.push({ label: dec.chosen === n.id ? 'Undo decision' : 'Choose this', run: () => upd((d) => (d.chosen = d.chosen === n.id ? null : n.id)) });
      items.push({ label: 'Add to tasks', run: () => toTask(n.text) });
      items.push({ label: 'Change to question', run: () => upd((d) => (d.nodes[n.id].kind = 'q')) });
    } else if (n.id !== dec.root) {
      items.push({ label: 'Change to action', run: () => upd((d) => {
        subtree(d, n.id).slice(1).forEach((k) => delete d.nodes[k]);
        Object.assign(d.nodes[n.id], { kind: 'a', yes: null, no: null });
        if (d.chosen && !d.nodes[d.chosen]) d.chosen = null;
      }) });
    }
    if (n.id !== dec.root)
      items.push({ label: 'Delete', danger: true, run: () => upd((d) => {
        const p = parentOf(d, n.id);
        if (p) d.nodes[p[0]][p[1]] = null;
        subtree(d, n.id).forEach((k) => delete d.nodes[k]);
        if (d.chosen && !d.nodes[d.chosen]) d.chosen = null;
      }) });
    TD.ui.menu(n.kind === 'q' ? 'Question' : 'Action', items);
  };

  function toTask(text) {
    const cat = M.categories()[0];
    if (!cat) return TD.ui.toast('Add a category first');
    M.addTodo(text, U.today(), cat.id);
    TD.ui.toast('Added to today');
  }
  A['dn-to-task'] = (el) => toTask(get(el.dataset.d).nodes[el.dataset.n].text);
  A['dn-outcome'] = (el) => S.update((s) => (s.decisions.find((x) => x.id === el.dataset.d).outcome = el.value));
  A['dn-delete'] = (el) =>
    TD.ui.confirm('Delete decision', 'This cannot be undone.', 'Delete', () => S.update((s) => (s.decisions = s.decisions.filter((x) => x.id !== el.dataset.d))));
})();
