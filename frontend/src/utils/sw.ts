import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  registerSW({
    immediate: true,
    onNeedRefresh() {
      // The SW is in `autoUpdate` mode; this fires when a new version is waiting.
      // Reloading on the next navigation picks it up — no UI prompt for v1.
    },
    onOfflineReady() {
      // App shell is cached; lineup will work offline on next visit.
    },
  })
}
