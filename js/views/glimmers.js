/* Glimmers: 행복했던 순간을 모아두고 꺼내 보기 */
(function () {
  const U = TD.util, S = TD.store, esc = U.esc, icon = TD.icon;
  const A = TD.actions;
  let draftFiles = [];
  const fileCount = () => (draftFiles.length ? TD.t(draftFiles.length > 1 ? '{n} files' : '{n} file', { n: draftFiles.length }) : '');

  const list = () => [...S.get().glimmers].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const get = (id) => S.get().glimmers.find((g) => g.id === id);
  const pickRandom = (except) => {
    const l = S.get().glimmers;
    if (!l.length) return null;
    const pool = l.length > 1 ? l.filter((g) => g.id !== except) : l;
    return pool[Math.floor(Math.random() * pool.length)].id;
  };

  const mediaHTML = (m, thumb) =>
    m.kind === 'video'
      ? `<video data-media="${m.key}" ${thumb ? 'muted' : 'controls'} playsinline preload="metadata"></video>`
      : `<img data-media="${m.key}" alt="">`;

  /** 하나 크게 보기 (Today 상자에서도 같이 써요) */
  TD.views.glimmerBody = (g) => {
    const yt = U.youtubeId(g.link);
    return `<div class="glimmer">
      ${(g.media || []).map((m) => `<div class="g-media">${mediaHTML(m, false)}</div>`).join('')}
      ${yt ? `<a class="g-yt" href="https://www.youtube.com/watch?v=${yt}" target="_blank" rel="noopener" aria-label="${TD.t('Play on YouTube')}"><img src="${U.youtubeThumb(yt)}" alt=""><span class="g-play">${icon('play', 26)}</span></a>` : ''}
      ${g.text ? `<p class="g-text">${esc(g.text)}</p>` : ''}
      ${g.link && !yt ? `<a class="g-link" href="${esc(g.link)}" target="_blank" rel="noopener">${esc(g.link)}</a>` : ''}
      ${g.note ? `<p class="g-note">— ${esc(g.note)}</p>` : ''}
    </div>`;
  };

  TD.views.glimmers = () => {
    const items = list();
    if (!get(TD.state.glimmerId)) TD.state.glimmerId = pickRandom();
    const g = get(TD.state.glimmerId);

    const left = `
      <section class="panel">
        <div class="ph"><span>${g ? U.fmtCreated(g.createdAt) : TD.t('open')}</span><span class="r">${g ? `${items.length > 1 ? `<button class="link" data-action="gl-another">${TD.t('another')}</button>` : ''}<button class="link" data-action="gl-delete" data-id="${g.id}">${TD.t('delete')}</button>` : ''}</span></div>
        <div class="pb">
          ${g
            ? TD.views.glimmerBody(g)
            : `<p class="empty">${TD.t('Nothing yet')}</p>`}
        </div>
      </section>`;

    const right = `
      <section class="panel">
        <div class="ph"><span>${TD.t('add')}</span></div>
        <div class="pb gl-form">
          <textarea class="input" id="gl-text" rows="3" placeholder="${TD.t('Something good…')}" maxlength="1000"></textarea>
          <input class="input" id="gl-note" placeholder="${TD.t('Note to future me')}" maxlength="200">
          <input class="input" id="gl-link" placeholder="${TD.t('Link (YouTube shows a thumbnail)')}" maxlength="500">
          <div class="foot">
            <label class="btn"><input type="file" id="gl-files" accept="image/*,video/*" multiple hidden>${icon('plus', 13)} ${TD.t('Photo / video')}</label>
            <span id="gl-count">${fileCount()}</span>
            <button class="btn primary" data-action="gl-save">${TD.t('Save')}</button>
          </div>
        </div>
      </section>
      ${items.length
        ? `<section class="panel">
            <div class="ph"><span>${TD.t('all')}</span><span>${items.length}</span></div>
            <div class="pb"><div class="g-grid">${items
              .map((x) => {
                const m = (x.media || [])[0];
                const yt = U.youtubeId(x.link);
                const inner = m ? mediaHTML(m, true) : yt ? `<img src="${U.youtubeThumb(yt)}" alt="">` : `<span>${esc((x.text || x.link || '').slice(0, 60))}</span>`;
                return `<button class="g-tile ${x.id === TD.state.glimmerId ? 'on' : ''}" data-action="gl-open" data-id="${x.id}">${inner}</button>`;
              })
              .join('')}</div></div>
          </section>`
        : ''}`;

    return { title: TD.t('Glimmers'), left, right };
  };

  document.addEventListener('change', (e) => {
    if (e.target.id !== 'gl-files') return;
    const all = [...e.target.files];
    draftFiles = all.filter((f) => f.size <= 50 * 1024 * 1024);
    if (draftFiles.length < all.length) TD.ui.toast(TD.t('Max 50MB per file'));
    const c = document.getElementById('gl-count');
    if (c) c.textContent = fileCount();
  });

  A['gl-save'] = async (el) => {
    const text = document.getElementById('gl-text').value.trim();
    const note = document.getElementById('gl-note').value.trim();
    let link = document.getElementById('gl-link').value.trim();
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    if (!text && !link && !draftFiles.length) return document.getElementById('gl-text').focus();
    el.disabled = true;
    try {
      const media = [];
      for (const f of draftFiles) media.push(await TD.media.put(f));
      const g = { id: U.uid(), text, note, link, media, createdAt: new Date().toISOString() };
      draftFiles = [];
      TD.state.glimmerId = g.id;
      S.update((s) => s.glimmers.push(g));
    } catch (e) {
      console.error(e);
      el.disabled = false;
      TD.ui.toast(TD.t('Could not save file'));
    }
  };
  A['gl-open'] = (el) => { TD.state.glimmerId = el.dataset.id; TD.app.render(); };
  A['gl-another'] = () => { TD.state.glimmerId = pickRandom(TD.state.glimmerId); TD.app.render(); };
  A['gl-delete'] = (el) =>
    TD.ui.confirm(TD.t('Delete'), TD.t('Delete this glimmer?'), TD.t('Delete'), () => {
      const g = get(el.dataset.id);
      (g.media || []).forEach((m) => TD.media.del(m.key));
      TD.state.glimmerId = null;
      S.update((s) => (s.glimmers = s.glimmers.filter((x) => x.id !== g.id)));
    });
})();
