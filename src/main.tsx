import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh: () => { void updateSW(true) },
  onNeedReload: () => window.location.reload(),
  onRegisteredSW: (_url, registration) => {
    if (!registration) return
    window.setInterval(() => { void registration.update() }, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration.update()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
