import { useEffect, useState } from 'react'
import { loadStored, saveStored } from './storage'

export type ThemePreference = 'system' | 'light' | 'dark'

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemePreference>(() => loadStored('travelcalc:theme', 'system'))

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }

    applyTheme()
    saveStored('travelcalc:theme', theme)
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  return [theme, setTheme] as const
}
