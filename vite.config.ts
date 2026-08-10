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
      workbox: {
        runtimeCaching: [{
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'travelcalc-ocr-v1',
            expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        }],
      },
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
