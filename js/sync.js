/* 동기화 (Supabase): 로그인하면 폰·PC가 같은 데이터를 써요.
   - 할 일·습관·기록 등 전체 데이터: tendday_state 테이블 (계정당 한 줄)
   - Glimmers 사진·영상: glimmers 스토리지 버킷
   충돌하면 가장 최근에 바뀐 쪽이 이겨요. */
(function () {
  const cfg = TD.CONFIG || {};
  const PENDING = 'tendday:pending-uploads';
  const LINKED = 'tendday:synced-user'; // 이 기기가 처음 동기화한 계정
  let client = null, pushTimer = null, applying = false;

  const listeners = [];
  const emit = () => listeners.forEach((f) => f());

  const S = (TD.sync = {
    ready: false,
    user: null,
    status: 'off', // off | signed-out | syncing | synced | error | offline
    lastSync: null,
    error: '',
    onChange: (f) => listeners.push(f),
    configured: () => !!(cfg.supabaseUrl && cfg.supabaseKey),
  });

  const set = (status, error = '') => {
    S.status = status;
    S.error = error;
    emit();
  };

  async function init() {
    if (!S.configured()) return set('off');
    if (!window.supabase) return set('offline', 'Could not load Supabase');
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await client.auth.getSession();
    S.user = data.session ? data.session.user : null;
    S.ready = true;
    client.auth.onAuthStateChange((_e, session) => {
      const was = S.user && S.user.id;
      S.user = session ? session.user : null;
      if (S.user && S.user.id !== was) pull();
      if (!S.user) set('signed-out');
    });
    if (S.user) pull();
    else set('signed-out');

    TD.store.subscribe(() => {
      if (applying || !S.user) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(push, 1200);
    });
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && S.user && pull());
    window.addEventListener('online', () => S.user && pull());
    setInterval(() => document.visibilityState === 'visible' && S.user && pull(), 60 * 1000);
  }

  async function pull() {
    if (!client || !S.user) return;
    set('syncing');
    try {
      const { data, error } = await client.from('tendday_state').select('data, updated_at').eq('user_id', S.user.id).maybeSingle();
      if (error) throw error;
      const local = TD.store.get();
      const localAt = local.modifiedAt || 0;
      const remoteAt = data ? new Date(data.updated_at).getTime() : 0;
      const firstTime = localStorage.getItem(LINKED) !== S.user.id;
      if (data && (remoteAt > localAt || firstTime)) {
        // 이 기기에서 처음 로그인하면 서버 데이터를 우선해요
        applying = true;
        TD.store.applyRemote(Object.assign({}, data.data, { modifiedAt: remoteAt }));
        applying = false;
      } else if (!data || localAt > remoteAt) {
        await push();
        return;
      }
      localStorage.setItem(LINKED, S.user.id);
      await flushUploads();
      S.lastSync = new Date();
      set('synced');
    } catch (e) {
      applying = false;
      console.error(e);
      set(navigator.onLine ? 'error' : 'offline', e.message || String(e));
    }
  }

  async function push() {
    if (!client || !S.user) return;
    set('syncing');
    try {
      const st = TD.store.get();
      const at = new Date(st.modifiedAt || Date.now()).toISOString();
      const { error } = await client.from('tendday_state').upsert({ user_id: S.user.id, data: st, updated_at: at });
      if (error) throw error;
      localStorage.setItem(LINKED, S.user.id);
      await flushUploads();
      S.lastSync = new Date();
      set('synced');
    } catch (e) {
      console.error(e);
      set(navigator.onLine ? 'error' : 'offline', e.message || String(e));
    }
  }

  /* ---------- 사진·영상 ---------- */
  const pending = () => { try { return JSON.parse(localStorage.getItem(PENDING)) || []; } catch (e) { return []; } };
  const setPending = (l) => { try { localStorage.setItem(PENDING, JSON.stringify(l)); } catch (e) {} };
  const path = (key) => `${S.user.id}/${key}`;

  async function flushUploads() {
    if (!client || !S.user) return;
    const list = pending();
    if (!list.length) return;
    const left = [];
    for (const key of list) {
      try {
        const blob = await TD.media.blob(key);
        if (!blob) continue;
        const { error } = await client.storage.from('glimmers').upload(path(key), blob, { upsert: true, contentType: blob.type || undefined });
        if (error) throw error;
      } catch (e) {
        console.error(e);
        left.push(key);
      }
    }
    setPending(left);
  }

  S.queueUpload = (key) => {
    setPending([...new Set([...pending(), key])]);
    if (S.user) flushUploads();
  };
  S.download = async (key) => {
    if (!client || !S.user) return null;
    const { data, error } = await client.storage.from('glimmers').download(path(key));
    if (error) return null;
    return data;
  };
  S.remove = async (key) => {
    setPending(pending().filter((k) => k !== key));
    if (client && S.user) await client.storage.from('glimmers').remove([path(key)]);
  };

  /* ---------- 로그인 ---------- */
  S.signIn = async (email, password) => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  S.signUp = async (email, password) => {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return !!data.session; // false면 이메일 인증이 필요해요
  };
  S.signOut = async () => {
    await client.auth.signOut();
    S.user = null;
    set('signed-out');
  };
  S.syncNow = () => pull();

  S.onChange(() => TD.ui && TD.ui.refresh());
  init();
})();
