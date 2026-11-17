/* 설정: 글자 색, 동기화(Supabase), 백업 */
(function () {
  const U = TD.util, esc = U.esc;
  const A = TD.actions;
  const INKS = [['black', 'Ink'], ['blue', 'Blue'], ['brown', 'Sepia']];
  const T = (s, v) => TD.t(s, v);
  const LANGS = [['ko', '한국어'], ['en', 'English']];

  function syncSection() {
    const S = TD.sync;
    if (!S || !S.configured()) return `<div class="field"><span class="label"><span>${T('Sync')}</span><span>${T('not set up')}</span></span></div>`;
    if (!S.ready) return `<div class="field"><span class="label"><span>${T('Sync')}</span><span>${esc(T(S.status === 'offline' ? 'offline' : 'connecting…'))}</span></span></div>`;
    if (!S.user)
      return `<div class="field"><span class="label"><span>${T('Sync')}</span><span>${T('signed out')}</span></span>
          <input class="input" id="sy-email" type="email" placeholder="${T('Email')}" autocomplete="email">
          <input class="input" id="sy-pass" type="password" placeholder="${T('Password')}" autocomplete="current-password">
          <button class="btn primary" data-action="sy-signin">${T('Sign in')}</button>
          ${S.error ? `<span class="help">${esc(S.error)}</span>` : ''}
        </div>`;
    const when = S.lastSync ? S.lastSync.toTimeString().slice(0, 5) : '—';
    const label = { syncing: T('syncing…'), synced: T('synced {t}', { t: when }), error: T('error'), offline: T('offline') }[S.status] || S.status;
    return `<div class="field"><span class="label"><span>${T('Sync')}</span><span>${esc(label)}</span></span>
        <p class="help">${esc(S.user.email || '')}</p>
        <div class="row"><button class="btn" style="flex:1" data-action="sy-now">${T('Sync now')}</button><button class="btn" style="flex:1" data-action="sy-out">${T('Sign out')}</button></div>
        ${S.status === 'error' && S.error ? `<span class="help">${esc(S.error)}</span>` : ''}
      </div>`;
  }

  const body = () => `
    <div class="field"><span class="label">${T('Language')}</span>
      <div class="chips">${LANGS.map(([k, name]) => `<button class="chip ${TD.lang() === k ? 'on' : ''}" data-action="set-lang" data-lang="${k}">${name}</button>`).join('')}</div>
    </div>
    <div class="field"><span class="label">${T('Text color')}</span>
      <div class="chips">${INKS.map(([k, name]) => `<button class="chip ${(TD.store.get().settings.ink || 'black') === k ? 'on' : ''}" data-action="set-ink" data-ink="${k}">${T(name)}</button>`).join('')}</div>
    </div>
    ${syncSection()}
    <div class="field"><span class="label"><span>${T('Backup')}</span><span>${T('photos not included')}</span></span>
      <div class="row"><button class="btn" style="flex:1" data-action="bk-export">${T('Export')}</button><button class="btn" style="flex:1" data-action="bk-import">${T('Import')}</button></div>
      <input type="file" accept="application/json,.json" hidden id="bk-file">
    </div>
    <button class="btn danger" data-action="bk-reset">${T('Delete everything')}</button>`;

  A['open-settings'] = () => TD.ui.modal({ title: T('Settings'), body });

  A['set-lang'] = (el) => TD.store.update((s) => (s.settings.lang = el.dataset.lang));
  A['set-ink'] = (el) => TD.store.update((s) => (s.settings.ink = el.dataset.ink));

  const creds = () => {
    const email = document.getElementById('sy-email').value.trim();
    const pass = document.getElementById('sy-pass').value;
    if (!email || pass.length < 6) {
      TD.ui.toast(T('Email and 6+ char password'));
      return null;
    }
    return [email, pass];
  };
  A['sy-signin'] = async (el) => {
    const c = creds();
    if (!c) return;
    el.disabled = true;
    try { await TD.sync.signIn(...c); } catch (e) { TD.ui.toast(e.message || T('Sign in failed')); el.disabled = false; }
  };
  A['sy-out'] = () => TD.sync.signOut();
  A['sy-now'] = () => TD.sync.syncNow();

  A['bk-export'] = () => {
    const blob = new Blob([TD.store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tendday-${U.today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  A['bk-import'] = () => document.getElementById('bk-file').click();
  document.addEventListener('change', async (e) => {
    if (e.target.id !== 'bk-file') return;
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.todos) || !Array.isArray(data.habits)) throw new Error();
      TD.ui.confirm(T('Import'), T('This replaces your current data.'), T('Import'), () => TD.store.replaceAll(data));
    } catch (err) {
      TD.ui.toast(T('Not a TendDay backup'));
    }
  });
  A['bk-reset'] = () => TD.ui.confirm(T('Delete everything'), T('This cannot be undone.'), T('Delete'), () => TD.store.reset());
})();
