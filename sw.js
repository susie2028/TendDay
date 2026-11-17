/* 오프라인에서도 열리게: 항상 인터넷에서 최신 파일을 먼저 받고, 안 되면 저장해 둔 걸 써요 */
const CACHE = 'tendday-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const cacheable = sameOrigin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com' || url.host === 'cdn.jsdelivr.net';
  if (!cacheable) return; // Supabase, 유튜브 썸네일 등은 그대로
  // 우리 파일은 항상 서버에 새 버전이 있는지 확인해요 (수정한 게 바로 보이게)
  const fresh = sameOrigin ? fetch(req, { cache: 'no-cache' }) : fetch(req);
  e.respondWith(
    fresh
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
