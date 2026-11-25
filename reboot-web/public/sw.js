// RE:BOOT 서비스 워커: 한 번 본 화면은 인터넷이 끊겨도 열리게 한다.
// - 같은 사이트의 GET 요청만 다룬다 (Supabase · 쿠팡 등 외부 요청은 건드리지 않음 → 로그인 · 글은 늘 최신)
// - 페이지(HTML): 네트워크 먼저, 실패하면 저장본 → 그것도 없으면 오프라인 안내
// - 빌드 파일(_next/static) · 아이콘 · 이미지: 저장본 먼저 (파일 이름에 버전이 들어 있어 안전)
const VERSION = "reboot-v1";
const SHELL = ["/", "/routine/", "/goals/", "/my/", "/offline/", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline/"))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/_next/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
