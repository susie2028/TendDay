/* 꾹 눌러서(폰) 또는 끌어서(마우스) 순서 바꾸기.
   할 일: 같은 날 안에서 순서·카테고리 이동 / 보드 카드: 요일 사이 이동 */
(function () {
  const M = TD.model;
  const KINDS = [
    { item: '.sort-list > .todo[data-id]', list: '.sort-list', drop: (ids, list) => M.reorder('todos', ids, { categoryId: list.dataset.cat }) },
    { item: '.bday-list > .chunk[data-id]', list: '.bday-list', drop: (ids, list) => M.reorder('board', ids, { date: list.dataset.date }) },
  ];

  const LONG = 380, SLOP = 8;
  let pend = null, drag = null, swallowClick = false;

  const kindOf = (el) => KINDS.find((k) => el.closest(k.item));
  const noDrag = (t) => t.closest('input, textarea, .todo-input, .chunk-input, .board-add, .add-input');

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag || noDrag(e.target)) return;
    const kind = kindOf(e.target);
    if (!kind) return;
    const el = e.target.closest(kind.item);
    pend = { kind, el, x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType !== 'mouse' };
    if (pend.touch) pend.timer = setTimeout(() => pend && begin(pend.x, pend.y), LONG);
  });

  document.addEventListener('pointermove', (e) => {
    if (drag) return move(e.clientX, e.clientY);
    if (!pend || e.pointerId !== pend.id) return;
    const far = Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > SLOP;
    if (!far) return;
    if (pend.touch) cancelPend(); // 손가락이 움직이면 스크롤
    else begin(e.clientX, e.clientY); // 마우스는 바로 끌기
  });

  const end = () => {
    cancelPend();
    if (drag) finish();
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', () => { cancelPend(); if (drag) finish(true); });

  // 끌고 있을 땐 화면이 스크롤되지 않게, 꾹 누를 때 메뉴·선택이 뜨지 않게
  document.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', (e) => { if (pend || drag || kindOf(e.target)) e.preventDefault(); });
  document.addEventListener('click', (e) => { if (swallowClick) { e.stopPropagation(); e.preventDefault(); swallowClick = false; } }, true);
  document.addEventListener('selectstart', (e) => { if (pend || drag) e.preventDefault(); });

  function cancelPend() {
    if (pend) clearTimeout(pend.timer);
    pend = null;
  }

  function begin(x, y) {
    const { kind, el } = pend;
    cancelPend();
    const r = el.getBoundingClientRect();
    const ph = document.createElement(el.tagName);
    ph.className = 'sort-ph';
    ph.style.height = r.height + 'px';
    el.after(ph);
    el.classList.add('sort-ghost');
    const keep = el.getAttribute('style') || '';
    Object.assign(el.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
    document.body.classList.add('sorting');
    drag = { keep, kind, el, ph, dx: x - r.left, dy: y - r.top, y };
    if (navigator.vibrate) navigator.vibrate(12);
    window.getSelection && window.getSelection().removeAllRanges();
    move(x, y);
    autoScroll();
  }

  function move(x, y) {
    const { el, ph, kind } = drag;
    drag.x = x; drag.y = y;
    el.style.left = x - drag.dx + 'px';
    el.style.top = y - drag.dy + 'px';
    el.style.visibility = 'hidden';
    const under = document.elementFromPoint(x, y);
    el.style.visibility = '';
    if (!under) return;
    const list = under.closest(kind.list) || (under.closest('.cat, .bday') || { querySelector: () => null }).querySelector(kind.list);
    if (!list) return;
    const items = [...list.querySelectorAll(kind.item.split('>').pop().trim())].filter((n) => n !== el);
    const before = items.find((n) => {
      const r = n.getBoundingClientRect();
      // 보드 카드(폰에선 2열)는 가로 위치도 봐요
      if (r.top <= y && y <= r.bottom && list.classList.contains('bday-list')) return x < r.left + r.width / 2;
      return y < r.top + r.height / 2;
    });
    if (before) { if (before.previousElementSibling !== ph) list.insertBefore(ph, before); }
    else {
      const tail = list.querySelector('.todo:not([data-id])'); // 새 할 일 입력칸은 항상 맨 끝
      if (tail) list.insertBefore(ph, tail);
      else if (list.lastElementChild !== ph) list.appendChild(ph);
    }
  }

  function autoScroll() {
    if (!drag) return;
    const edge = 70, h = window.innerHeight, bottomBar = document.querySelector('.sidebar').getBoundingClientRect().top < h / 2 ? 0 : 60;
    const y = drag.y;
    if (y < edge) window.scrollBy(0, -Math.ceil((edge - y) / 6));
    else if (y > h - edge - bottomBar) window.scrollBy(0, Math.ceil((y - (h - edge - bottomBar)) / 6));
    requestAnimationFrame(autoScroll);
  }

  function finish(cancel) {
    const { kind, el, ph, keep } = drag;
    drag = null;
    document.body.classList.remove('sorting');
    swallowClick = true;
    setTimeout(() => (swallowClick = false), 50);
    const list = ph.parentElement;
    if (!cancel && list) {
      el.setAttribute('style', keep);
      el.classList.remove('sort-ghost');
      ph.replaceWith(el);
      const ids = [...list.querySelectorAll('[data-id]')].filter((n) => n.matches(kind.item)).map((n) => n.dataset.id);
      kind.drop(ids, list);
    } else {
      ph.remove();
      TD.app.render();
    }
  }
})();
