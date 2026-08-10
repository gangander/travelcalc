import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let installPrompt: InstallPromptEvent | null = null
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
let registered = false

export function usePwaStatus() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [canInstall, setCanInstall] = useState(() => Boolean(installPrompt))
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault()
      installPrompt = event as InstallPromptEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      installPrompt = null
      setCanInstall(false)
    }
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    if (!registered) {
      registered = true
      updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh: () => setNeedRefresh(true),
        onOfflineReady: () => setOfflineReady(true),
        onRegisteredSW: (_url, registration) => {
          if (!registration) return
          window.setInterval(() => { void registration.update() }, 60 * 60 * 1000)
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') void registration.update()
          })
        },
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  async function install() {
    if (!installPrompt) return false
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      installPrompt = null
      setCanInstall(false)
      return true
    }
    return false
  }

  return {
    needRefresh,
    offlineReady,
    isOnline,
    canInstall,
    isInstalled,
    isIos,
    install,
    update: () => updateServiceWorker?.(true),
    dismissRefresh: () => setNeedRefresh(false),
    dismissOfflineReady: () => setOfflineReady(false),
  }
}
