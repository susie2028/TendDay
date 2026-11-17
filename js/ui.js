/* 화면 공용 부품: 아이콘, 모달(바텀시트), 메뉴, 확인창, 토스트 */
(function () {
  const esc = TD.util.esc;

  const PATHS = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
    todo: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M8.5 12.2l2.5 2.5 4.6-5"/>',
    habit: '<path d="M12 21c-4 0-7.5-2.8-7.5-7 0-2.6 1.6-4.5 3-6 .3 1.7 1.2 2.7 2.3 3 .2-3.2 1.8-5.6 4.2-7.5-.2 3 1.3 4.6 2.8 6.3 1.3 1.4 2.7 3 2.7 5.2 0 3.8-3.4 6-7.5 6z"/>',
    note: '<path d="M6 3.5h8.5l4 4V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4"/>',
    mind: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    left: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    right: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    shuffle: '<path d="M3.5 7H7c4.5 0 5.5 10 10 10h3.5M3.5 17H7c1.5 0 2.6-1.1 3.4-2.6M13.6 9.6C14.4 8.1 15.5 7 17 7h3.5M18 4.5 20.5 7 18 9.5M18 14.5l2.5 2.5-2.5 2.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    mushroom: '<path d="M3 12.5C3 7.5 7 4 12 4s9 3.5 9 8.5c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1z"/><path d="M9 13.5c-.4 2.5-.6 4.6-.3 6.3.1.4.4.7.8.7h5c.4 0 .7-.3.8-.7.3-1.7.1-3.8-.3-6.3"/><circle cx="9" cy="8.5" r="1"/><circle cx="14.5" cy="7.5" r="1.3"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    tag: '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.4 1.4 0 0 1 0 2l-6.6 6.6a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.3"/>',
    pin: '<path d="M9 3.5h6M10 3.5v5.2L7 12v1.5h10V12l-3-3.3V3.5M12 13.5v7"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    tree: '<rect x="9" y="3" width="6" height="5" rx="1.5"/><rect x="3" y="16" width="6" height="5" rx="1.5"/><rect x="15" y="16" width="6" height="5" rx="1.5"/><path d="M12 8v4M6 16v-4h12v4"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-7.5M12 8.5v12M12 8.5S11 4 8.5 4C7 4 6.5 5 6.5 6c0 2 3 2.5 5.5 2.5zM12 8.5S13 4 15.5 4c1.5 0 2 1 2 2 0 2-3 2.5-5.5 2.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    handshake: '<path d="M3 12l4-4 5 1 3-2 6 5-6 6-4-3-3 2z"/>',
  };

  /** 다이어리 꾸미기: 마스킹테이프, 말린 잎 */
  TD.deco = {
    /** n: 1~11, style: 위치·회전 CSS */
    tape: (n, style) => `<img class="tape-img" src="img/tape-blue-${n}.png" alt="" style="${style}">`,
    leaf: (name, style) => `<img class="deco" src="img/leaf-${name}.png" alt="" style="${style}">`,
  };

  TD.icon = (name, size = 20) =>
    `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;

  const root = () => document.getElementById('modal-root');
  let refreshFn = null;
  let lastFocus = null;

  function onKey(e) {
    if (e.key === 'Escape') TD.ui.close();
  }

  TD.ui = {
    /**
     * 모달 열기
     * @param {object} o  title, body(html 또는 html을 돌려주는 함수), onMount(sheet)
     *  body가 함수면 데이터가 바뀔 때 자동으로 다시 그려요.
     */
    modal(o) {
      lastFocus = document.activeElement;
      refreshFn = typeof o.body === 'function' ? o.body : null;
      const body = refreshFn ? refreshFn() : o.body;
      root().innerHTML = `
        <div class="overlay">
          <div class="sheet ${o.wide ? 'wide' : ''} ${o.small ? 'small' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}">
            <div class="sheet-head">
              <span>${esc(o.title)}</span>
              ${o.small
                ? `<button class="x" data-close aria-label="Close">${TD.icon('close', 16)}</button>`
                : `<button class="close" data-close aria-label="Close"><span class="key">Esc</span>Close ×</button>`}
            </div>
            <div class="sheet-body">${body}</div>
          </div>
        </div>`;
      const ov = root().firstElementChild;
      requestAnimationFrame(() => ov.classList.add('show'));
      ov.addEventListener('click', (e) => {
        if (e.target === ov || e.target.closest('[data-close]')) TD.ui.close();
      });
      document.addEventListener('keydown', onKey);
      const sheet = ov.querySelector('.sheet');
      o.onMount && o.onMount(sheet);
      const f = sheet.querySelector('[autofocus]');
      if (f) setTimeout(() => f.focus(), 30);
      return sheet;
    },
    refresh() {
      const b = root().querySelector('.sheet-body');
      if (b && refreshFn) b.innerHTML = refreshFn();
    },
    isOpen: () => !!root().firstElementChild,
    close() {
      root().innerHTML = '';
      refreshFn = null;
      document.removeEventListener('keydown', onKey);
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    },

    /** 선택 메뉴: items = [{label, danger, run}] */
    menu(title, items) {
      TD.ui.modal({
        title,
        body: `<div class="menu">${items
          .map((it, i) => `<button data-i="${i}" class="${it.danger ? 'danger' : ''}">${esc(it.label)}</button>`)
          .join('')}</div>`,
        onMount(sheet) {
          sheet.querySelectorAll('.menu button').forEach((b) =>
            b.addEventListener('click', () => {
              TD.ui.close();
              items[+b.dataset.i].run();
            })
          );
        },
      });
    },

    confirm(title, message, okLabel, onOk) {
      TD.ui.modal({
        title,
        body: `<p class="help">${esc(message)}</p>
          <div class="sheet-foot">
            <button class="btn" data-close>Cancel</button>
            <button class="btn danger" data-ok>${esc(okLabel)}</button>
          </div>`,
        onMount(sheet) {
          sheet.querySelector('[data-ok]').addEventListener('click', () => {
            TD.ui.close();
            onOk();
          });
        },
      });
    },

    /** 한 줄 또는 여러 줄 입력창 */
    prompt(title, { value = '', placeholder = '', multiline = false, okLabel = 'Save' }, onOk) {
      TD.ui.modal({
        title,
        body: `${
          multiline
            ? `<textarea class="input" autofocus placeholder="${esc(placeholder)}" maxlength="1000">${esc(value)}</textarea>`
            : `<input class="input" autofocus value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="200">`
        }
          <div class="sheet-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>${esc(okLabel)}</button></div>`,
        onMount(sheet) {
          const inp = sheet.querySelector('.input');
          const ok = () => {
            const v = inp.value.trim();
            if (!v) return inp.focus();
            TD.ui.close();
            onOk(v);
          };
          sheet.querySelector('[data-ok]').addEventListener('click', ok);
          inp.addEventListener('keydown', (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              ok();
            }
          });
          if (!multiline) setTimeout(() => inp.select(), 40);
        },
      });
    },

    toast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(TD.ui._t);
      TD.ui._t = setTimeout(() => t.classList.remove('show'), 1800);
    },
  };
})();
