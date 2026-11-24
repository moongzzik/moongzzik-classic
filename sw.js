// 클래식에 관한 소고 — 서비스 워커
// 고칠 때마다 VERSION 숫자를 1씩 올린다 (설치한 폰이 새 버전을 받도록)
const VERSION = "moongzzik-classic-v15";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  // AI(Gemini)·유튜브·글꼴 등 다른 주소 요청은 건드리지 않는다
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // 화면(html)은 인터넷 먼저 → 실패하면 저장본 (새 버전을 빨리 받도록)
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // 아이콘 등은 저장본 먼저
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
});
