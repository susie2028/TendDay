/* 저장소: 지금은 브라우저(localStorage)에 저장해요.
   2단계에서 폰·PC 동기화를 붙일 때 이 파일만 바꾸면 되도록 분리해 뒀어요. */
(function () {
  const KEY = 'tendday:v1';

  const defaults = () => ({
    version: 1,
    categories: [
      { id: 'c-work', name: '일', color: 'brown', order: 0 },
      { id: 'c-study', name: '공부', color: 'green', order: 1 },
      { id: 'c-life', name: '생활', color: 'orange', order: 2 },
    ],
    todos: [],
    habits: [],
    habitLogs: {},
    notes: [],
    decisions: [],
    glimmers: [],
    settings: {},
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      return Object.assign(defaults(), data || {});
    } catch (e) {
      console.error('저장된 데이터를 읽지 못했어요', e);
      return defaults();
    }
  }

  let state = load();
  const listeners = [];

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('저장하지 못했어요', e);
      TD.ui && TD.ui.toast(TD.t('Could not save — storage full'));
    }
    listeners.forEach((fn) => fn());
  }

  TD.store = {
    get: () => state,
    /** 데이터를 바꾸고 저장한 뒤 화면을 다시 그려요 */
    update(fn) {
      fn(state);
      state.modifiedAt = Date.now(); // 동기화: 마지막으로 바뀐 시각
      save();
    },
    /** 서버에서 받은 데이터로 바꿀 때 (modifiedAt 유지) */
    applyRemote(data) {
      state = Object.assign(defaults(), data);
      save();
    },
    subscribe: (fn) => listeners.push(fn),
    replaceAll(data) {
      state = Object.assign(defaults(), data, { modifiedAt: Date.now() });
      save();
    },
    reset() {
      state = Object.assign(defaults(), { modifiedAt: Date.now() });
      save();
    },
    exportJSON: () => JSON.stringify(state, null, 2),
  };

  // 다른 탭에서 바뀌면 이 탭도 맞춰요
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((fn) => fn());
    }
  });
})();
