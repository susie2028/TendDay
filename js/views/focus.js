/* 뽀모도로: 집중 시간과 쉬는 시간을 직접 정해요.
   진행 중인 타이머는 이 기기에만 저장하고, 설정·기록은 동기화돼요. */
(function () {
  const U = TD.util, A = TD.actions;
  const KEY = 'tendday:pomo';
  const LIMITS = { focus: [1, 120], brk: [1, 60] };

  const conf = () => Object.assign({ focus: 25, brk: 5 }, TD.store.get().settings.pomo || {});
  const total = (mode) => (mode === 'focus' ? conf().focus : conf().brk) * 60000;

  let st;
  try { st = JSON.parse(localStorage.getItem(KEY)); } catch (e) { st = null; }
  if (!st || !st.mode) st = { mode: 'focus', running: false, endAt: null, left: null };
  const save = () => localStorage.setItem(KEY, JSON.stringify(st));

  const remaining = () => {
    if (st.running) return Math.max(0, st.endAt - Date.now());
    return st.left != null ? st.left : total(st.mode);
  };
  const fmt = (ms) => {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const todayLog = () => (TD.store.get().focusLog || {})[U.today()] || { n: 0, min: 0 };
  const logFocus = (min) =>
    TD.store.update((s) => {
      s.focusLog = s.focusLog || {};
      const d = s.focusLog[U.today()] || { n: 0, min: 0 };
      s.focusLog[U.today()] = { n: d.n + 1, min: d.min + min };
    });

  /* 끝났을 때 알림: 소리 + 진동 + (허용했으면) 알림 */
  let audio;
  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach((t) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, audio.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.3);
        o.connect(g).connect(audio.destination);
        o.start(audio.currentTime + t);
        o.stop(audio.currentTime + t + 0.32);
      });
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
  }
  function notify(text) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    const opts = { body: text, icon: 'img/icon-192.png', tag: 'tendday-pomo' };
    if (navigator.serviceWorker && navigator.serviceWorker.controller)
      navigator.serviceWorker.ready.then((r) => r.showNotification('TendDay', opts)).catch(() => {});
    else try { new Notification('TendDay', opts); } catch (e) {}
  }

  function start() {
    st.endAt = Date.now() + remaining();
    st.running = true;
    st.left = null;
    save();
    if (audio && audio.state === 'suspended') audio.resume();
    else if (!audio) try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  }
  function pause() {
    st.left = remaining();
    st.running = false;
    st.endAt = null;
    save();
  }
  function setMode(mode, run) {
    st = { mode, running: false, endAt: null, left: null };
    if (run) start();
    save();
  }

  /* 시간이 다 됐을 때. 집중이 끝나면 쉬는 시간이 바로 시작되고, 쉬는 시간이 끝나면 멈춰서 기다려요 */
  function finish(live) {
    if (st.mode === 'focus') {
      setMode('brk', live);
      logFocus(conf().focus);
      if (live) { chime(); notify(TD.t('Focus done. {n} min break.', { n: conf().brk })); TD.ui.toast(TD.t('Focus done — break time')); }
    } else {
      setMode('focus', false);
      TD.app.render();
      if (live) { chime(); notify(TD.t('Break over.')); TD.ui.toast(TD.t('Break over')); }
    }
  }

  // 앱을 꺼둔 사이에 끝났으면 조용히 다음 단계로
  if (st.running && st.endAt <= Date.now()) {
    const wasFocus = st.mode === 'focus';
    st = { mode: wasFocus ? 'brk' : 'focus', running: false, endAt: null, left: null };
    save();
    if (wasFocus) setTimeout(() => logFocus(conf().focus), 0);
  }

  function tick() {
    if (st.running && st.endAt <= Date.now()) return finish(true);
    const left = remaining();
    const t = document.getElementById('pomo-time');
    if (t) {
      t.textContent = fmt(left);
      const bar = document.getElementById('pomo-bar');
      if (bar) bar.style.width = `${Math.max(0, 1 - left / total(st.mode)) * 100}%`;
    }
    if (st.running) document.title = `${fmt(left)} · ${TD.t(st.mode === 'focus' ? 'Focus' : 'Break')}`;
  }
  setInterval(tick, 500);
  document.addEventListener('visibilitychange', tick);

  const stepper = (key, val) => `
    <div class="stepper">
      <button class="icon-btn" data-action="pomo-step" data-key="${key}" data-d="-5" aria-label="Minus 5">−5</button>
      <button class="icon-btn" data-action="pomo-step" data-key="${key}" data-d="-1" aria-label="Minus 1">−</button>
      <input class="input num" type="number" inputmode="numeric" min="${LIMITS[key][0]}" max="${LIMITS[key][1]}" value="${val}" data-change="pomo-set" data-key="${key}" aria-label="${TD.t(key === 'focus' ? 'Focus minutes' : 'Break minutes')}">
      <button class="icon-btn" data-action="pomo-step" data-key="${key}" data-d="1" aria-label="Plus 1">+</button>
      <button class="icon-btn" data-action="pomo-step" data-key="${key}" data-d="5" aria-label="Plus 5">+5</button>
    </div>`;

  TD.views.focus = () => {
    const c = conf(), left = remaining(), log = todayLog();
    const fresh = !st.running && st.left == null;
    const left_ = `
      <section class="panel pomo">
        <div class="ph"><span>${TD.t(st.mode === 'focus' ? 'focus' : 'break')}</span><span class="r">${TD.t('{n} min', { n: st.mode === 'focus' ? c.focus : c.brk })}</span></div>
        <div class="pb">
          <div class="pomo-time" id="pomo-time">${fmt(left)}</div>
          <div class="pomo-track"><div class="pomo-bar" id="pomo-bar" style="width:${Math.max(0, 1 - left / total(st.mode)) * 100}%"></div></div>
          <div class="pomo-btns">
            <button class="btn primary" data-action="pomo-toggle">${TD.t(st.running ? 'Pause' : fresh ? 'Start' : 'Resume')}</button>
            <button class="btn" data-action="pomo-reset" ${fresh ? 'disabled' : ''}>${TD.t('Reset')}</button>
            <button class="btn" data-action="pomo-skip">${TD.t(st.mode === 'focus' ? 'Skip to break' : 'Skip break')}</button>
          </div>
        </div>
      </section>`;
    const right = `
      <section class="panel">
        <div class="ph"><span>${TD.t('minutes')}</span></div>
        <div class="pb pomo-set">
          <div class="field"><span class="label">${TD.t('Focus')}</span>${stepper('focus', c.focus)}</div>
          <div class="field"><span class="label">${TD.t('Break')}</span>${stepper('brk', c.brk)}</div>
          <p class="help">${TD.t('Break starts on its own after focus.')}</p>
        </div>
      </section>
      <section class="panel">
        <div class="ph"><span>${TD.t('today')}</span><span class="r">${TD.t('{n} · {m} min', { n: log.n, m: log.min })}</span></div>
        <div class="pb">${log.n ? `<div class="pomo-dots">${'<i></i>'.repeat(Math.min(log.n, 40))}</div>` : `<p class="empty">${TD.t('No sessions yet')}</p>`}</div>
      </section>`;
    return { title: TD.t('Focus'), meta: st.running ? TD.t(st.mode === 'focus' ? 'focusing' : 'on break') : '', left: left_, right };
  };

  A['pomo-toggle'] = () => { st.running ? pause() : start(); TD.app.render(); };
  A['pomo-reset'] = () => { setMode(st.mode, false); TD.app.render(); };
  A['pomo-skip'] = () => { setMode(st.mode === 'focus' ? 'brk' : 'focus', false); TD.app.render(); };

  const setMin = (key, v) => {
    v = Math.round(Number(v));
    if (!v) return TD.app.render();
    v = Math.min(LIMITS[key][1], Math.max(LIMITS[key][0], v));
    // 멈춰 있고 아직 시작 안 한 상태면 새 시간이 바로 보여요. 진행 중이면 다음 회차부터 적용돼요
    TD.store.update((s) => { s.settings.pomo = Object.assign(conf(), { [key]: v }); });
  };
  A['pomo-step'] = (el) => setMin(el.dataset.key, conf()[el.dataset.key] + Number(el.dataset.d));
  A['pomo-set'] = (el) => setMin(el.dataset.key, el.value);

  // 스페이스바로 시작/멈춤 (Focus 화면에서)
  document.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || location.hash !== '#focus' || TD.ui.isOpen()) return;
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
    e.preventDefault();
    A['pomo-toggle']();
  });
})();
