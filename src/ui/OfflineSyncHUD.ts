import { bindPressAndHold } from './pressAndHold';
import { syncCurrentRegionOffline, isOfflineProtected } from '../services/offlineSyncService';
import { Icons } from './icons';

export class OfflineSyncHUD {
  private container: HTMLElement;
  private isProtected = isOfflineProtected();
  private isSyncing = false;
  private centerCoordsGetter: () => [number, number];

  constructor(parent: HTMLElement, centerCoordsGetter: () => [number, number]) {
    this.centerCoordsGetter = centerCoordsGetter;
    this.container = document.createElement('div');
    this.container.className =
      'absolute bottom-[82px] sm:bottom-6 right-3 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto';
    parent.appendChild(this.container);

    this.render();
  }

  private render(): void {
    const isReady = this.isProtected;

    this.container.innerHTML = `
      <div class="relative group">
        <button
          id="btn-sync-offline"
          class="relative overflow-hidden flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl ${
            isReady
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-obsidian-950/80 text-gray-200 hover:bg-obsidian-950 border border-white/10'
          } text-xs font-medium shadow-2xl backdrop-blur-xl transition-all cursor-pointer select-none"
        >
          <!-- SVG Circular or Linear Progress Fill -->
          <div
            id="sync-progress-fill"
            class="absolute inset-0 bg-emerald-500/25 origin-left scale-x-0 transition-transform duration-75 pointer-events-none"
          ></div>

          <span class="relative z-10">
            ${isReady ? Icons.checkCircle('w-4 h-4 text-emerald-400') : Icons.offlineCloud('w-4 h-4')}
          </span>

          <div class="relative z-10 text-left">
            <span class="block text-xs font-semibold">
              ${isReady ? 'Çevrimdışı Aktif' : 'Çevrimdışı Kaydet'}
            </span>
            <span id="sync-subtext" class="hidden sm:block text-[10px] text-gray-400">
              ${isReady ? 'Karolar & Alanlar Önbellekte' : '0.8 sn basılı tutun'}
            </span>
          </div>
        </button>
      </div>
    `;

    const btn = this.container.querySelector('#btn-sync-offline') as HTMLElement;
    const progressFill = this.container.querySelector('#sync-progress-fill') as HTMLElement;
    const subtext = this.container.querySelector('#sync-subtext') as HTMLElement;

    bindPressAndHold(btn, {
      durationMs: 800,
      onProgress: (ratio) => {
        if (progressFill) {
          progressFill.style.transform = `scaleX(${ratio})`;
        }
        if (subtext && !this.isSyncing) {
          subtext.textContent = ratio > 0 ? `Kaydediliyor... %${Math.round(ratio * 100)}` : (this.isProtected ? 'Karolar & Alanlar Önbellekte' : '0.8 sn basılı tutun');
        }
      },
      onComplete: async () => {
        if (this.isSyncing) return;
        this.isSyncing = true;
        if (subtext) subtext.textContent = 'Önbelleğe alınıyor...';

        const center = this.centerCoordsGetter();
        const result = await syncCurrentRegionOffline(center, (p) => {
          if (subtext) subtext.textContent = p.stage;
        });

        this.isSyncing = false;
        if (result.success) {
          this.isProtected = true;
          this.render();
        } else {
          if (subtext) subtext.textContent = 'Yeniden deneyin';
        }
      },
      onCancel: () => {
        if (progressFill) progressFill.style.transform = 'scaleX(0)';
      }
    });
  }
}
