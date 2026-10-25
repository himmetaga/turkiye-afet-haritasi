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

            const genTrUrl = `https://www.eczaneler.gen.tr/nobetci-${encodeURIComponent(provSlug)}`;
            const genRes = await fetch(genTrUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
              }
            });

            if (genRes.ok) {
              const html = await genRes.text();
              const rows = html.split('<tr><td colspan="3" class="border-bottom">');
              if (rows.length > 1) {
                const parsedList: any[] = [];
                for (let i = 1; i < rows.length; i++) {
                  const row = rows[i];
                  const linkMatch = row.match(/<a href="([^"]+)">\s*<span class="isim">([^<]+)<\/span>/);
                  const addressMatch = row.match(/<div class=['"]col-lg-6['"]>([^<]+)/);
                  const landmarkMatch = row.match(/<span class=['"]font-italic['"]>([^<]+)<\/span>/);
                  const districtMatch = row.match(/<span class="px-2 py-1 rounded bg-info text-white font-weight-bold">([^<]+)<\/span>/);
                  const phoneMatch = row.match(/<div class=['"]col-lg-3 py-lg-2['"]>([^<]+)<\/div>/);

                  if (linkMatch) {
                    const detailHref = linkMatch[1];
                    const name = linkMatch[2].trim();
                    const address = addressMatch ? addressMatch[1].trim() : '';
                    const landmark = landmarkMatch ? landmarkMatch[1].trim() : '';
                    const rowDistrict = districtMatch ? districtMatch[1].trim() : '';
                    const phone = phoneMatch ? phoneMatch[1].trim() : '';

                    if (district && rowDistrict && !rowDistrict.toLowerCase().includes(district)) {
                      continue;
                    }

                    parsedList.push({
                      name: name.includes('Eczanesi') ? name : `${name} Eczanesi`,
                      detailHref,
                      address: landmark ? `${address} (${landmark})` : address,
                      district: rowDistrict,
                      phone
                    });

                    if (parsedList.length >= 40) break;
                  }
                }

                // Top items get coordinates from detail
                await Promise.allSettled(
                  parsedList.slice(0, 6).map(async (item) => {
                    try {
                      const dRes = await fetch(`https://www.eczaneler.gen.tr${item.detailHref}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                      });
                      if (dRes.ok) {
                        const dHtml = await dRes.text();
                        const coordMatch = dHtml.match(/maps\?daddr=([0-9]{2}\.[0-9]+),([0-9]{2}\.[0-9]+)/);
                        if (coordMatch) {
                          item.coordinates = [parseFloat(coordMatch[2]), parseFloat(coordMatch[1])];
                        }
                      }
                    } catch {}
                  })
                );

                const cityCap = province.charAt(0).toUpperCase() + province.slice(1);
                const pharmacies = parsedList.map((p, idx) => ({
                  id: `pharm-gen-${provSlug}-${idx + 1}`,
                  name: `${p.name} (Nöbetçi)`,
                  city: cityCap,
                  district: p.district,
                  neighborhood: '',
                  address: p.address,
                  phone: p.phone,
                  isDuty: true,
                  dutyDate: todayStr,
                  source: 'eczaneler.gen.tr',
                  coordinates: p.coordinates || [28.9784, 41.0082]
                }));

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                  province: provSlug,
                  date: todayStr,
                  count: pharmacies.length,
                  totalRegistered: 31172,
                  source: 'https://www.eczaneler.gen.tr/',
                  pharmacies
                }));
                return;
              }
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
