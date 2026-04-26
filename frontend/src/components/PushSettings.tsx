import { useEffect, useState } from 'react'
import { pushApi } from '../api/push'

type Status = 'unsupported' | 'needs-install' | 'idle' | 'subscribed' | 'denied' | 'error'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return view
}

function subscriptionPayload(sub: PushSubscription) {
  const json = sub.toJSON()
  const keys = json.keys ?? {}
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: keys.p256dh ?? '', auth: keys.auth ?? '' },
    user_agent: navigator.userAgent,
  }
}

export function PushSettings() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void refreshStatus()
  }, [])

  const refreshStatus = async () => {
    if (!pushSupported()) {
      setStatus('unsupported')
      return
    }
    if (!isStandalone()) {
      setStatus('needs-install')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setStatus(sub ? 'subscribed' : 'idle')
  }

  const enable = async () => {
    setBusy(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle')
        return
      }
      const vapidKey = await pushApi.getVapidPublicKey()
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }))
      await pushApi.subscribe(subscriptionPayload(sub))
      setStatus('subscribed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable notifications')
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint).catch(() => {
          // Best effort — even if backend cleanup fails, unsubscribe locally.
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable notifications')
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Lineup change notifications</h2>
      <p className="text-sm text-gray-600 mb-4">
        Get a push when a concert you favorited is rescheduled or cancelled.
      </p>

      {status === 'unsupported' && (
        <p className="text-sm text-gray-700">
          This browser doesn&apos;t support push notifications.
        </p>
      )}

      {status === 'needs-install' && (
        <p className="text-sm text-gray-700">
          Install Hellfest Planner to your home screen first (on iPhone: Safari → Share → Add to
          Home Screen). Notifications only work from the installed app.
        </p>
      )}

      {status === 'denied' && (
        <p className="text-sm text-red-700">
          Notifications are blocked. Enable them in your browser/system settings, then come back.
        </p>
      )}

      {(status === 'idle' || status === 'error') && (
        <button
          onClick={enable}
          disabled={busy}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded cursor-pointer"
        >
          {busy ? 'Enabling…' : 'Enable notifications'}
        </button>
      )}

      {status === 'subscribed' && (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center text-sm text-green-700">
            ✅ Notifications enabled on this device
          </span>
          <button
            onClick={disable}
            disabled={busy}
            className="text-sm text-gray-700 hover:text-gray-900 underline cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Disabling…' : 'Disable'}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}
