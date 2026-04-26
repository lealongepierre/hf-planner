/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

interface PushPayload {
  title: string
  body?: string
  url?: string
  icon?: string
  tag?: string
}

const ONE_HOUR = 60 * 60
const ONE_WEEK = 7 * 24 * ONE_HOUR

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const apiMatcher = (pathPrefix: string) => ({ url, request }: { url: URL; request: Request }) =>
  request.method === 'GET' && url.pathname.startsWith(pathPrefix)

registerRoute(
  apiMatcher('/api/v1/concerts'),
  new NetworkFirst({
    cacheName: 'hf-concerts',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: ONE_WEEK }),
    ],
  }),
)

const shortLivedAuthCache = new NetworkFirst({
  cacheName: 'hf-user-data',
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: ONE_HOUR }),
  ],
})

registerRoute(apiMatcher('/api/v1/favorites'), shortLivedAuthCache)
registerRoute(apiMatcher('/api/v1/users'), shortLivedAuthCache)
registerRoute(apiMatcher('/api/v1/config'), shortLivedAuthCache)

registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'hf-pages',
      networkTimeoutSeconds: 3,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
    }),
  ),
)

self.addEventListener('push', (event: PushEvent) => {
  const payload = parsePushPayload(event)
  const title = payload.title || 'Hellfest Planner'
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag,
    data: { url: payload.url || '/concerts' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data?.url as string | undefined) || '/concerts'
  event.waitUntil(focusOrOpen(targetUrl))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

function parsePushPayload(event: PushEvent): PushPayload {
  if (!event.data) return { title: 'Hellfest Planner' }
  try {
    return event.data.json() as PushPayload
  } catch {
    return { title: 'Hellfest Planner', body: event.data.text() }
  }
}

async function focusOrOpen(url: string): Promise<void> {
  const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of allClients) {
    if ('focus' in client) {
      await client.focus()
      if ('navigate' in client) {
        try {
          await client.navigate(url)
        } catch {
          // Cross-origin or navigation blocked — focus alone is fine.
        }
      }
      return
    }
  }
  await self.clients.openWindow(url)
}
