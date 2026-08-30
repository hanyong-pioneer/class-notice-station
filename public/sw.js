// 缓存策略:
// - 页面(navigation)与 notices.json:网络优先,离线时退回缓存 —— 保证新版本/新数据及时生效
// - 带 hash 的静态资源(JS/CSS/图片):缓存优先,文件名含内容指纹,更新后自动指向新文件
const CACHE = 'class-notice-station-v2'

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

  if (req.mode === 'navigate' || url.pathname.endsWith('notices.json')) {
    e.respondWith(
      fetch(req)
        .then(put)
        .catch(() => caches.match(req))
    )
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(put)))
})
