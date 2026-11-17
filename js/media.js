/* 사진·영상 저장소 (IndexedDB). localStorage는 용량이 작아서 파일은 여기에 따로 둬요. */
(function () {
  const DB = 'tendday-media', STORE = 'blobs';
  let dbp = null;
  const urls = new Map();

  function db() {
    if (!dbp)
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    return dbp;
  }
  const tx = async (mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, mode);
      const out = fn(t.objectStore(STORE));
      t.oncomplete = () => res(out && out.result);
      t.onerror = () => rej(t.error);
    });
  };

  /** 사진은 긴 변 1600px JPEG로 줄여서 저장 */
  async function shrink(file) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const img = await createImageBitmap(file);
    const s = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.85));
  }

  TD.media = {
    async put(file) {
      const blob = await shrink(file);
      const key = TD.util.uid();
      await tx('readwrite', (s) => s.put(blob, key));
      if (TD.sync && TD.sync.configured()) TD.sync.queueUpload(key);
      return { key, kind: file.type.startsWith('video/') ? 'video' : 'image' };
    },
    blob: (key) => tx('readonly', (s) => s.get(key)),
    async url(key) {
      if (urls.has(key)) return urls.get(key);
      let blob = await tx('readonly', (s) => s.get(key));
      if (!blob && TD.sync && TD.sync.user) {
        // 다른 기기에서 올린 사진·영상은 서버에서 받아서 이 기기에 저장해요
        blob = await TD.sync.download(key);
        if (blob) await tx('readwrite', (s) => s.put(blob, key));
      }
      if (!blob) return null;
      const u = URL.createObjectURL(blob);
      urls.set(key, u);
      return u;
    },
    async del(key) {
      if (urls.has(key)) URL.revokeObjectURL(urls.get(key));
      urls.delete(key);
      await tx('readwrite', (s) => s.delete(key));
      if (TD.sync && TD.sync.configured()) TD.sync.remove(key);
    },
    /** 화면의 [data-media] 요소에 실제 파일을 연결 */
    hydrate(root) {
      root.querySelectorAll('[data-media]').forEach(async (el) => {
        const u = await TD.media.url(el.dataset.media);
        if (u && el.isConnected) el.src = u;
        else if (!u) el.replaceWith(Object.assign(document.createElement('span'), { className: 'muted', textContent: 'file missing' }));
      });
    },
  };
})();
