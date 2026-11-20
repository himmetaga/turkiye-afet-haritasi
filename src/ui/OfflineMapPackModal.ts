import { Icons } from './icons';
import { escapeHtml } from '../utils/safeText';
import { hasUsableLocation } from '../utils/locationState';
import { syncCurrentRegionOffline, SyncResult } from '../services/offlineSyncService';

/**
 * Çevrimdışı kayıt ekranı.
 *
 * Tek bir gerçek işlem sunar: temel verileri ve (konum biliniyorsa) çevredeki
 * harita karolarını bu cihaza kaydeden syncCurrentRegionOffline çağrısı.
 * Sonuç, servisin döndürdüğü sayılarla olduğu gibi gösterilir; "bölge paketi",
 * tahmini boyut ya da çevrimdışı çalışma garantisi gösterilmez.
 */
export class OfflineMapPackModal {
  private container: HTMLElement;
  private getCenter?: () => [number, number] | null;
  private totalUsedMb: number | null = null;
  private isSyncing = false;
  private progressText = '';
  private lastResult: SyncResult | null = null;

  constructor(parent: HTMLElement, getCenter?: () => [number, number] | null) {
    this.getCenter = getCenter;
    this.container = document.createElement('div');
    this.container.id = 'offline-map-pack-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.cleanupLegacyPackData();
    this.render();
  }

  /** Eski sürümün hiçbir yerde okunmayan "paket" kayıtlarını temizler. */
  private cleanupLegacyPackData(): void {
    try {
      localStorage.removeItem('afet_downloaded_map_packs_v1');
    } catch {}
    try {
      if ('caches' in window) caches.delete('afet-live-offline-packs-v1').catch(() => {});
    } catch {}
  }

  private async updateStorageEstimate(): Promise<void> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (typeof est.usage === 'number') {
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

  /** Karoların indirileceği merkez: yalnızca gerçek bir konum ölçümü varsa kullanılır. */
  private async resolveCenter(): Promise<[number, number] | null> {
    if (this.getCenter && hasUsableLocation()) {
      const c = this.getCenter();
      if (c && Number.isFinite(c[0]) && Number.isFinite(c[1])) return c;
    }
    if (!('geolocation' in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        () => resolve(null),
        { timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  private async runSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.lastResult = null;
    this.progressText = 'Konum kontrol ediliyor...';
    this.render();

    const center = await this.resolveCenter();
    const result = await syncCurrentRegionOffline(center, (p) => {
      this.progressText = `%${p.progress} — ${p.stage}`;
      const el = this.container.querySelector('#offline-sync-progress');
      if (el) el.textContent = this.progressText;
    });

    this.isSyncing = false;
    this.lastResult = result;
    await this.updateStorageEstimate();
    this.render();
  }

  private getLastSyncedText(): string {
    try {
      const stamp = Number(localStorage.getItem('afet_offline_synced_at'));
      if (Number.isFinite(stamp) && stamp > 0) {
        return new Date(stamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
      }
    } catch {}
    return 'Henüz kaydedilmedi';
  }

  private renderResult(): string {
    const r = this.lastResult;
    if (!r) return '';

    const tileLine =
      r.tilesTotal > 0
        ? `Harita karoları: ${r.tilesCached}/${r.tilesTotal} kaydedildi.`
        : 'Harita karosu kaydedilmedi (konum alınamadı ya da karo adresi okunamadı). Daha önce gezdiğiniz bölgeler tarayıcı önbelleğinde kalmış olabilir.';

    if (r.success) {
      return `
        <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-[11.5px] space-y-1">
          <strong class="block">Kaydedilen: ${r.cachedItems}/${r.totalItems} dosya</strong>
          <p>Temel veriler (toplanma alanları, hastaneler, fay hatları) bu cihaza kaydedildi.</p>
          <p>${tileLine}</p>
        </div>
      `;
    }

    return `
      <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-[11.5px] space-y-1">
        <strong class="block">Çevrimdışı kayıt tamamlanamadı (${r.cachedItems}/${r.totalItems} dosya)</strong>
        <p>Temel verilerin tamamı kaydedilemedi. İnternet bağlantınızı kontrol edip yeniden deneyin.</p>
      </div>
    `;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              ${Icons.download('w-5 h-5')}
            </span>
            <div>
              <h2 class="text-sm sm:text-base font-bold text-white">Çevrimdışı Kullanım İçin Kaydet</h2>
              <p class="text-[11px] text-gray-400">İnternet varken temel verileri ve çevrenizdeki haritayı bu cihaza kaydedin.</p>
            </div>
          </div>
          <button id="btn-close-map-pack-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
            <div>
              <div class="text-[10px] text-gray-400 font-medium">BU SİTENİN CİHAZDA KULLANDIĞI ALAN</div>
              <div class="font-mono text-xl font-bold text-cyan-400 mt-0.5">
                ${this.totalUsedMb !== null ? `${this.totalUsedMb} MB` : 'Bilinmiyor'}
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-gray-400 font-medium">SON KAYIT</div>
              <div class="font-mono text-xs font-bold text-gray-200 mt-0.5">${escapeHtml(this.getLastSyncedText())}</div>
            </div>
          </div>

          <p class="text-[11.5px] text-gray-300 leading-relaxed">
            Temel veriler (toplanma alanları, hastaneler, fay hatları) ve bulunduğunuz konumun çevresindeki harita karoları bu cihaza kaydedilir.
            Tarayıcı depolamayı silebilir; çevrimdışı açılış garanti edilmez.
          </p>

          <button
            id="btn-run-offline-sync"
            type="button"
            class="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            ${this.isSyncing ? 'disabled' : ''}
          >
            ${Icons.download('w-4 h-4')}
            <span>${this.isSyncing ? 'Kaydediliyor...' : 'Verileri ve çevremdeki haritayı kaydet'}</span>
          </button>

          ${
            this.isSyncing
              ? `<div id="offline-sync-progress" class="text-center text-[11px] text-cyan-300 font-mono">${escapeHtml(this.progressText)}</div>`
              : ''
          }

          ${this.renderResult()}

          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-gray-400 text-[11px] leading-relaxed">
            Kaydı internetiniz varken ve bulunduğunuz yerde yapın. Bölge değiştirirseniz yeniden kaydedin.
            İnternet yokken haritanın yalnızca kaydedilmiş bölümleri görünür; canlı deprem listesi güncellenmez.
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-map-pack-modal')?.addEventListener('click', () => this.hide());
    q<HTMLButtonElement>('#btn-run-offline-sync')?.addEventListener('click', () => this.runSync());
  }
}
