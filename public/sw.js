self.addEventListener('push', function(event) {
  let data = {}
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    try {
      data = { title: 'Dasma ERP', body: event.data ? event.data.text() : '' }
    } catch (_) {}
  }

  const title = data.title || 'Dasma ERP'
  const body = data.body || 'Njoftim i ri'
  const url = data.url || '/dashboard'
  const options = {
    body,
    icon: '/placeholder-logo.png',
    badge: '/placeholder-logo.png',
    data: { url },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
