import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const DISMISS_KEY = 'hf_install_hint_dismissed'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS Safari exposes this non-standard flag.
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua)
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isAppleMobile || isIpadOs
}

export function InstallPrompt() {
  const [androidPrompt, setAndroidPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setAndroidPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (isIos()) setShowIosHint(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setAndroidPrompt(null)
    setShowIosHint(false)
  }

  const triggerAndroidInstall = async () => {
    if (!androidPrompt) return
    await androidPrompt.prompt()
    const choice = await androidPrompt.userChoice
    if (choice.outcome === 'accepted') {
      dismiss()
    } else {
      setAndroidPrompt(null)
    }
  }

  if (androidPrompt) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md mb-[env(safe-area-inset-bottom)]">
        <div className="m-3 rounded-lg bg-gray-900 text-white shadow-lg flex items-center gap-3 px-4 py-3">
          <span className="text-2xl" aria-hidden>🔥</span>
          <div className="flex-1 text-sm">
            <div className="font-semibold">Install Hellfest Planner</div>
            <div className="opacity-80">Add to your home screen for quick access.</div>
          </div>
          <button
            onClick={triggerAndroidInstall}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-3 py-1.5 rounded cursor-pointer"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-white text-xl leading-none cursor-pointer px-1"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  if (showIosHint) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md mb-[env(safe-area-inset-bottom)]">
        <div className="m-3 rounded-lg bg-gray-900 text-white shadow-lg flex items-start gap-3 px-4 py-3">
          <span className="text-2xl" aria-hidden>📲</span>
          <div className="flex-1 text-sm">
            <div className="font-semibold">Install Hellfest Planner</div>
            <div className="opacity-80">
              In Safari, tap <span aria-label="Share">⎙</span> Share, then <strong>Add to Home Screen</strong>.
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-white text-xl leading-none cursor-pointer px-1"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return null
}
