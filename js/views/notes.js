/* 기록: 나에게 남기는 말, 마음가짐 */
(function () {
  const U = TD.util, M = TD.model, esc = U.esc, icon = TD.icon;
  const A = TD.actions;

  function noteItem(n) {
    const isMind = n.kind === 'mindset';
    return `
      <li class="note ${n.hidden ? 'hidden' : ''}">
        <div class="body">
          <p class="text">${esc(n.text)}</p>
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
  A['note-menu'] = (el) => {
    const n = M.note(el.dataset.id);
    TD.ui.menu(n.kind === 'message' ? 'Note to self' : 'Principle', [
      { label: 'Edit', run: () => TD.ui.prompt('Edit', { value: n.text, multiline: true }, (v) => M.updateNote(n.id, { text: v })) },
      { label: n.hidden ? 'Show' : 'Hide', run: () => M.updateNote(n.id, { hidden: !n.hidden }) },
      { label: 'Delete', danger: true, run: () => TD.ui.confirm('Delete', 'Delete this?', 'Delete', () => M.removeNote(n.id)) },
    ]);
  };
})();
