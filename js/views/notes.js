/* 기록: 나에게 남기는 말, 마음가짐 */
(function () {
  const U = TD.util, M = TD.model, esc = U.esc, icon = TD.icon;
  const A = TD.actions;

  function noteItem(n) {
    const isMind = n.kind === 'mindset';
    return `
      <li class="note ${n.hidden ? 'hidden' : ''}">
        <div class="body">
          <p class="text" data-action="note-edit" data-id="${n.id}">${esc(n.text)}</p>
          <p class="meta"><span>${U.fmtCreated(n.createdAt)}</span>${isMind && n.pinned ? '<span>pinned</span>' : ''}${n.hidden ? '<span>hidden</span>' : ''}</p>
        </div>
        ${isMind ? `<button class="icon-btn pin-btn ${n.pinned ? 'on' : ''}" data-action="note-pin" data-id="${n.id}" aria-pressed="${n.pinned}" aria-label="Pin">${icon('pin', 15)}</button>` : ''}
        <button class="icon-btn" data-action="note-menu" data-id="${n.id}" aria-label="More">${icon('more', 15)}</button>
      </li>`;
  }

  TD.views.notes = () => {
    const tab = TD.state.notesTab;
    const list = M.notes(tab);
    const left = `
      <section class="panel composer">
        <div class="ph"><span>write</span>${tab === 'mindset' ? `<span class="r">pinned ${M.pinnedMindsets().length}/${M.MAX_PINNED}</span>` : ''}</div>
        <div class="pb">
          <textarea id="note-input" data-enter="note-add" maxlength="500" aria-label="Write"></textarea>
          <div class="foot"><span>⌘ + Enter</span><button class="btn primary" data-action="note-add">Save</button></div>
        </div>
      </section>`;
    const right = `
      <section class="panel">
        <div class="ph"><span>${tab === 'message' ? 'notes to self' : 'principles'}</span><span>${list.length}</span></div>
        <div class="pb">${list.length ? `<ul>${list.map(noteItem).join('')}</ul>` : `<p class="empty">Nothing yet</p>`}</div>
      </section>`;
    const actions = `<div class="seg"><button class="${tab === 'message' ? 'on' : ''}" data-action="notes-tab" data-tab="message">Notes to self</button><button class="${tab === 'mindset' ? 'on' : ''}" data-action="notes-tab" data-tab="mindset">Principles</button></div>`;
    return { title: 'Notes', actions, left, right };
  };

  A['notes-tab'] = (el) => { TD.state.notesTab = el.dataset.tab; TD.app.render(); };
  A['note-add'] = () => {
    const ta = document.getElementById('note-input');
    const text = ta.value.trim();
    if (!text) return ta.focus();
    M.addNote(text, TD.state.notesTab);
  };
  A['note-pin'] = (el) => { if (!M.togglePin(el.dataset.id)) TD.ui.toast(`Max ${M.MAX_PINNED} pinned`); };
  /* 글자를 누르면 그 자리에서 고쳐요. 바깥 누르거나 ⌘Enter면 저장, Esc는 취소 */
  A['note-edit'] = (el) => {
    const n = M.note(el.dataset.id);
    if (!n) return;
    const ta = document.createElement('textarea');
    ta.className = 'note-input';
    ta.value = n.text;
    ta.maxLength = 500;
    ta.setAttribute('aria-label', 'Edit');
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    el.replaceWith(ta);
    fit();
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const v = ta.value.trim();
      if (save && v && v !== n.text) M.updateNote(n.id, { text: v });
      else TD.app.render();
    };
    ta.addEventListener('input', fit);
    ta.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    ta.addEventListener('blur', () => finish(true));
  };
  A['note-menu'] = (el) => {
    const n = M.note(el.dataset.id);
    TD.ui.menu(n.kind === 'message' ? 'Note to self' : 'Principle', [
      { label: n.hidden ? 'Show' : 'Hide', run: () => M.updateNote(n.id, { hidden: !n.hidden }) },
      { label: 'Delete', danger: true, run: () => TD.ui.confirm('Delete', 'Delete this?', 'Delete', () => M.removeNote(n.id)) },
    ]);
  };
})();
