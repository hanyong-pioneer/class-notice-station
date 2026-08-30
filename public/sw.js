// 缓存策略:静态资源 cache-first;notices.json network-first(保证数据最新,离线时退回缓存)
const CACHE = 'class-notice-station-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  const put = (res) => {
    const copy = res.clone()
    caches.open(CACHE).then((cc) => cc.put(req, copy))
    return res
  }

  if (url.pathname.endsWith('notices.json')) {
    e.respondWith(
      fetch(req)
        .then(put)
        .catch(() => caches.match(req))
    )
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(put)))
})
