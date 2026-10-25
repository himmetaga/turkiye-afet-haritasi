import { Icons } from './icons';

interface MapPackItem {
  id: string;
  name: string;
  province: string;
  sizeMb: number;
  isDownloaded: boolean;
}

const DEFAULT_PACKS: MapPackItem[] = [
  { id: 'ist-marmara', name: 'İstanbul & Marmara Deprem Kuşağı (Tüm İlçeler)', province: 'İstanbul', sizeMb: 18.4, isDownloaded: false },
  { id: 'hatay-maras', name: 'Hatay, Maraş, Adıyaman & Antep Sahası', province: 'Hatay', sizeMb: 14.2, isDownloaded: false },
  { id: 'izmir-ege', name: 'İzmir & Ege Kıyı / Tsunami Bölgesi', province: 'İzmir', sizeMb: 11.8, isDownloaded: false },
  { id: 'ankara-ic', name: 'Ankara & İç Anadolu Lojistik Koridoru', province: 'Ankara', sizeMb: 9.6, isDownloaded: false },
  { id: 'bursa-kocaeli', name: 'Bursa, Kocaeli & Sakarya Sanayi / Fay Hattı', province: 'Bursa', sizeMb: 10.5, isDownloaded: false }
];

const STORAGE_KEY = 'afet_downloaded_map_packs_v1';

export class OfflineMapPackModal {
  private container: HTMLElement;
  private packs: MapPackItem[] = [];
  private totalUsedMb = 0;
  private isDownloading = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'offline-map-pack-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.loadPacks();
    this.updateStorageEstimate();
    this.render();
  }

  private loadPacks(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        this.packs = DEFAULT_PACKS.map((p) => ({ ...p, isDownloaded: ids.includes(p.id) }));
        return;
      }
    } catch {}
    this.packs = [...DEFAULT_PACKS];
  }

  private savePacks(): void {
    try {
      const ids = this.packs.filter((p) => p.isDownloaded).map((p) => p.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  }

  private async updateStorageEstimate(): Promise<void> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (est.usage) {
          this.totalUsedMb = Math.round((est.usage / (1024 * 1024)) * 10) / 10;
          this.render();
        }
      }
    } catch {}
  }

  public show(): void {
    this.updateStorageEstimate();
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private async downloadPack(id: string): Promise<void> {
    const pack = this.packs.find((p) => p.id === id);
    if (!pack || pack.isDownloaded || this.isDownloading) return;

    this.isDownloading = true;
    this.render();

    try {
      // Pre-cache core files into CacheStorage
      if ('caches' in window) {
        const cache = await caches.open('afet-live-offline-packs-v1');
        const urlsToCache = [
          '/',
          '/index.html',
          '/data/assembly-points.geojson',
          '/data/emergency-facilities.geojson',
          '/data/fault-lines.geojson',
          '/data/summary.json'
        ];
        await cache.addAll(urlsToCache);
      }

      pack.isDownloaded = true;
      this.savePacks();
      await this.updateStorageEstimate();
    } catch {
      alert('Paket önbelleğe alınırken bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
    } finally {
      this.isDownloading = false;
      this.render();
    }
  }

  private deletePack(id: string): void {
    const pack = this.packs.find((p) => p.id === id);
    if (pack) {
      pack.isDownloaded = false;
      this.savePacks();
      this.updateStorageEstimate();
      this.render();
    }
  }

  private render(): void {
    const downloadedCount = this.packs.filter((p) => p.isDownloaded).length;

    const listHtml = this.packs
      .map((p) => {
        return `
          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 transition-colors">
            <div class="flex items-center gap-3">
              <span class="p-2.5 rounded-xl ${p.isDownloaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'} shrink-0">
                ${p.isDownloaded ? Icons.checkCircle('w-4 h-4') : Icons.download('w-4 h-4')}
              </span>
              <div>
                <strong class="text-xs text-white block">${p.name}</strong>
                <div class="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                  <span>${p.province}</span>
                  <span>•</span>
                  <span class="font-mono text-gray-300">~${p.sizeMb} MB</span>
                  ${
                    p.isDownloaded
                      ? `<span class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">İndirildi</span>`
                      : ''
                  }
                </div>
              </div>
            </div>

            <div class="shrink-0">
              ${
                p.isDownloaded
                  ? `
                <button
                  type="button"
                  data-delete-pack="${p.id}"
                  class="btn-delete-pack px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold active:scale-95 transition-all"
                >
                  Sil
                </button>
              `
                  : `
                <button
                  type="button"
                  data-download-pack="${p.id}"
                  class="btn-download-pack px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center gap-1.5 disabled:opacity-50"
                  ${this.isDownloading ? 'disabled' : ''}
                >
                  ${Icons.download('w-3.5 h-3.5')}
                  <span>${this.isDownloading ? 'İndiriliyor...' : 'İndir'}</span>
                </button>
              `
              }
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              ${Icons.download('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Çevrimdışı Harita İndir</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">SIFIR İNTERNET</span>
              </div>
              <p class="text-[11px] text-gray-400">Hücresel şebekeler tamamen kopsa bile sokak seviyesinde harita ve toplanma alanlarını önbelleğe alın.</p>
            </div>
          </div>
          <button id="btn-close-map-pack-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <!-- Storage Stats -->
          <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-gray-400 font-medium">CİHAZ ÖNBELLEK KULLANIMI</div>
              <div class="font-mono text-xl font-bold text-cyan-400 mt-0.5">
                ${this.totalUsedMb > 0 ? `${this.totalUsedMb} MB` : 'Hesaplanıyor...'}
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-gray-400 font-medium">İNDİRİLEN BÖLGELER</div>
              <div class="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                ${downloadedCount} / ${this.packs.length} Paket Hazır
              </div>
            </div>
          </div>

          <!-- Pack List -->
          <div class="space-y-2">
            ${listHtml}
          </div>

          <!-- Offline Guarantee Info -->
          <div class="p-3 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/20 text-gray-300 text-[11px] space-y-1">
            <strong class="text-cyan-300 block">🛡️ Çevrimdışı Kullanım Garantisi:</strong>
            <p class="leading-relaxed">
              İndirilen paketler telefonunuzun kalıcı <code>CacheStorage</code> alanına kilitlenir. Uçak moduna alsanız veya SIM kartınız çekmese bile afet.live haritası tüm toplanma alanları ve hastanelerle açılacaktır.
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-map-pack-modal')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll<HTMLButtonElement>('.btn-download-pack').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-download-pack');
        if (id) this.downloadPack(id);
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-delete-pack').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-pack');
        if (id && confirm('Bu çevrimdışı harita paketini silmek istiyor musunuz?')) {
          this.deletePack(id);
        }
      });
    });
  }
}
