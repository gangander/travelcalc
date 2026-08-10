import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/travelcalc/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'TravelCalc 旅行換算',
        short_name: 'TravelCalc',
        description: '旅行中的快速匯率換算工具',
        lang: 'zh-TW',
        id: '/travelcalc/',
        start_url: '/travelcalc/',
        scope: '/travelcalc/',
        theme_color: '#081018',
        background_color: '#081018',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['travel', 'finance', 'utilities'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      }
    })
  ]
})
