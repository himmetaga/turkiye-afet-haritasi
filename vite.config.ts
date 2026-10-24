import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre': ['maplibre-gl']
        }
      }
    },
    chunkSizeWarningLimit: 1200
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'data/*.geojson'],
      manifest: {
        id: '/',
        name: 'afet.live — Türkiye 3D Afet ve Deprem Atlası',
        short_name: 'afet.live',
        description: '3B Harita, Deprem Erken Uyarı, Gece Sismograf Nöbeti, En Yakın Toplanma Alanları ve Çevrimdışı Acil Durum Atlası',
        lang: 'tr-TR',
        dir: 'ltr',
        categories: ['utilities', 'navigation', 'weather'],
        theme_color: '#090a0f',
        background_color: '#090a0f',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/?source=pwa',
        scope: '/',
        shortcuts: [
          { name: 'Gece Sismograf Nöbeti', short_name: 'Gece Nöbeti', url: '/?mod=gece-nobeti', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }] },
          { name: 'Bina Sismik Risk Kartı', short_name: 'Bina Riski', url: '/?mod=bina-risk', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }] },
          { name: 'Çevrimdışı QR Durum Paketi', short_name: 'QR Durum', url: '/?mod=qr', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }] },
          { name: 'Afet Düdüğü', short_name: 'Düdük', url: '/?mod=duduk', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }] }
        ],
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,geojson,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'openfreemap-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.orhanaydogdu\.com\.tr\/deprem\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'earthquake-api-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 6
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
