import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

function dutyPharmaciesDevPlugin() {
  return {
    name: 'duty-pharmacies-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/duty-pharmacies')) {
          try {
            const url = new URL(req.url, 'http://localhost:5173');
            const province = (url.searchParams.get('province') || 'istanbul').toLowerCase().trim();
            const district = (url.searchParams.get('district') || '').toLowerCase().trim();
            const provSlug = province
              .replace(/ı/g, 'i')
              .replace(/ğ/g, 'g')
              .replace(/ü/g, 'u')
              .replace(/ş/g, 's')
              .replace(/ö/g, 'o')
              .replace(/ç/g, 'c');
            const todayStr = new Date().toISOString().slice(0, 10);

            if (provSlug === 'izmir') {
              const apiRes = await fetch('https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler');
              if (apiRes.ok) {
                const data = await apiRes.json();
                const pharmacies = (Array.isArray(data) ? data : [])
                  .map((item: any, idx: number) => {
                    const lat = parseFloat(item.LokasyonX);
                    const lon = parseFloat(item.LokasyonY);
                    if (isNaN(lat) || isNaN(lon)) return null;
                    return {
                      id: `pharm-live-izmir-${idx + 1}`,
                      name: item.Adi || 'Nöbetçi Eczane',
                      city: 'İzmir',
                      district: item.Bolge || 'Merkez',
                      neighborhood: item.BolgeAciklama || '',
                      address: (item.Adres || '').trim(),
                      phone: item.Telefon || '',
                      isDuty: true,
                      dutyDate: item.Tarih ? item.Tarih.slice(0, 10) : todayStr,
                      coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
                    };
                  })
                  .filter(Boolean);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ province: 'izmir', date: todayStr, count: pharmacies.length, pharmacies }));
                return;
              }
            }

            const distParam = district ? `&district=${encodeURIComponent(district)}` : '';
            const targetUrl = `https://eczanebul.co/v1/duty-pharmacies/?province=${encodeURIComponent(provSlug)}${distParam}&ordering=-date&limit=50`;
            const apiRes = await fetch(targetUrl, {
              headers: { 'User-Agent': 'afet.live/2.0' }
            });
            if (apiRes.ok) {
              const data = await apiRes.json();
              const pharmacies = (data.results || [])
                .map((item: any, idx: number) => {
                  const p = item.pharmacy;
                  if (!p) return null;
                  const lat = parseFloat(p.latitude);
                  const lon = parseFloat(p.longitude);
                  if (isNaN(lat) || isNaN(lon)) return null;
                  return {
                    id: `pharm-live-${provSlug}-${idx + 1}`,
                    name: `${p.name} (Nöbetçi)`,
                    city: province.charAt(0).toUpperCase() + province.slice(1),
                    district: p.district || district || '',
                    neighborhood: p.neighborhood || '',
                    address: p.address || '',
                    phone: p.phone || '',
                    isDuty: true,
                    dutyDate: item.date || todayStr,
                    coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
                  };
                })
                .filter(Boolean);
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ province: provSlug, date: todayStr, count: pharmacies.length, pharmacies }));
              return;
            }
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'dev proxy error' }));
            return;
          }
        }
        next();
      });
    }
  };
}

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
    dutyPharmaciesDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'data/turkey-fault-lines.geojson', 'data/turkey-assembly-points.geojson'],
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        globIgnores: ['**/emergency-facilities.geojson'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/emergency-facilities\.geojson.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'emergency-facilities-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
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
