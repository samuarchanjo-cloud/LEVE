self.addEventListener('install', function(e){ self.skipWaiting() })
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', function(e){
  e.respondWith(
    fetch(e.request).catch(function(){ return caches.match(e.request) })
  )
})

self.addEventListener('push', function(event){
  var data = {}
  try { data = event.data ? event.data.json() : {} } catch(e) {}
  var title = data.title || 'Metodo LEVE'
  var options = {
    body: data.body || 'Voce tem lembretes pendentes no Diario LEVE.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || data.targetUrl || '/app', notificationId: data.notificationId || data.id }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event){
  event.notification.close()
  var data = event.notification.data || {}
  var url = data.url || '/app'
  if (data.notificationId) url += (url.indexOf('?') === -1 ? '?' : '&') + 'notification=' + encodeURIComponent(data.notificationId)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList){
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.indexOf(url) !== -1 && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
