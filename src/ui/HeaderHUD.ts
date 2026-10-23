import { Icons } from './icons';
import { NearestFaultResult } from '../types';

export interface HeaderHUDCallbacks {
  onSearchChange: (query: string) => void;
  onLocateMe: () => void;
  onToggleSeismic: () => void;
  onToggleSOS: () => void;
  onToggleBag: () => void;
  onToggleFamily: () => void;
  onToggleLayers: () => void;
  onSelectProvince: (province: string) => void;
}

export class HeaderHUD {
  private container: HTMLElement;
  private isOnline = navigator.onLine;
  private callbacks: HeaderHUDCallbacks;
  private seismicCount = 0;
  private nearestFault: NearestFaultResult | null = null;

  constructor(parent: HTMLElement, callbacks: HeaderHUDCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('header');
    this.container.className =
      'absolute top-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-auto max-w-[calc(100vw-32px)] sm:max-w-md';
    parent.appendChild(this.container);

    window.addEventListener('online', () => this.setOnlineState(true));
    window.addEventListener('offline', () => this.setOnlineState(false));

    this.render();
  }

  public setOnlineState(online: boolean): void {
    this.isOnline = online;
    const badge = this.container.querySelector('#connection-badge');
    if (badge) {
      if (online) {
        badge.className =
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400';
        badge.innerHTML = `${Icons.wifi('w-3 h-3')} <span>Çevrimiçi Canlı</span>`;
      } else {
        badge.className =
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300';
        badge.innerHTML = `${Icons.wifiOff('w-3 h-3')} <span>Çevrimdışı Koruma</span>`;
      }
    }
  }

  public updateSeismicCount(count: number): void {
    this.seismicCount = count;
    const el = this.container.querySelector('#seismic-badge-count');
    if (el) el.textContent = String(count);
  }

  public updateNearestFault(faultResult: NearestFaultResult | null): void {
    this.nearestFault = faultResult;
    const faultBadge = this.container.querySelector('#fault-proximity-badge');
    if (faultBadge && faultResult) {
      faultBadge.classList.remove('hidden');
      faultBadge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="truncate max-w-[140px] sm:max-w-[200px]" title="${faultResult.fault.name}">
          ${faultResult.fault.name.split('(')[0]}
        </span>
        <span class="font-mono text-rose-300 font-bold">${faultResult.distanceKm} km</span>
      `;
    }
  }

  public populateProvinces(provinces: string[]): void {
    const select = this.container.querySelector('#province-select') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML =
      '<option value="">Türkiye Geneli (Tüm İller)</option>' +
      provinces.map((p) => `<option value="${p}">${p}</option>`).join('');
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all">
        <!-- Marka & Bağlantı Başlığı -->
        <div class="flex items-center justify-between gap-2 mb-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 class="text-xs sm:text-sm font-bold tracking-wider text-white uppercase font-sans">
                Türkiye Afet Atlası
              </h1>
              <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">afet.live</span>
            </div>
            <p class="text-[10px] text-gray-400 tracking-wide font-normal">3B Sismik & Toplanma Koordinasyon Ağı</p>
          </div>

          <div id="connection-badge" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            this.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
          }">
            ${this.isOnline ? Icons.wifi('w-3 h-3') : Icons.wifiOff('w-3 h-3')}
            <span>${this.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
          </div>
        </div>

        <!-- Fay Hattı Yakınlık Göstergesi -->
        <div
          id="fault-proximity-badge"
          class="hidden mb-2 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 flex items-center justify-between gap-1.5 font-medium cursor-pointer"
          title="En yakın diri fay hattı mesafesi"
        ></div>

        <!-- Arama Çubuğu & GPS -->
        <div class="flex items-center gap-2 mb-2">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
              ${Icons.search('w-3.5 h-3.5')}
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="Toplanma alanı veya ilçe ara..."
              class="w-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 bg-white/5 rounded-xl outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          <button
            id="btn-locate-me"
            title="Konumuma Git ve En Yakın 3 Alanı Göster"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 rounded-xl transition-all"
          >
            ${Icons.crosshair('w-4 h-4 text-emerald-400')}
            <span class="hidden sm:inline text-[11px] font-medium text-emerald-300">Konumum</span>
          </button>
        </div>

        <!-- İl Seçici & Hızlı Butonlar -->
        <div class="flex flex-wrap items-center gap-1.5">
          <select
            id="province-select"
            class="flex-1 min-w-[120px] px-2 py-1.5 text-xs text-gray-300 bg-white/5 rounded-xl outline-none cursor-pointer hover:bg-white/10 transition-colors appearance-none"
          >
            <option value="">İl Seçiniz...</option>
          </select>

          <button
            id="btn-toggle-bag"
            title="72 Saatlik Afet Çantası Kontrol Listesi"
            class="px-2 py-1.5 text-xs text-gray-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1"
          >
            <span>🎒</span>
            <span class="hidden sm:inline text-[11px]">Çanta</span>
          </button>

          <button
            id="btn-toggle-family"
            title="Ailem Güvende / Durum Bildir"
            class="px-2 py-1.5 text-xs text-gray-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1"
          >
            <span>👨‍👩‍👦</span>
            <span class="hidden sm:inline text-[11px]">Ailem</span>
          </button>

          <button
            id="btn-toggle-layers"
            title="Harita Katmanları"
            class="p-1.5 text-gray-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            ${Icons.layers('w-4 h-4')}
          </button>

          <button
            id="btn-toggle-seismic"
            class="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
          >
            ${Icons.seismic('w-3.5 h-3.5')}
            <span id="seismic-badge-count">${this.seismicCount}</span>
          </button>

          <button
            id="btn-open-sos"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl transition-colors shadow-glow-red"
          >
            ${Icons.whistle('w-3.5 h-3.5 text-rose-400')}
            <span>SOS Düdük</span>
          </button>
        </div>
      </div>
    `;

    const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.callbacks.onSearchChange((e.target as HTMLInputElement).value);
    });

    const locateBtn = this.container.querySelector('#btn-locate-me') as HTMLButtonElement;
    locateBtn?.addEventListener('click', () => {
      this.callbacks.onLocateMe();
    });

    const provinceSelect = this.container.querySelector('#province-select') as HTMLSelectElement;
    provinceSelect?.addEventListener('change', (e) => {
      this.callbacks.onSelectProvince((e.target as HTMLSelectElement).value);
    });

    const bagBtn = this.container.querySelector('#btn-toggle-bag') as HTMLButtonElement;
    bagBtn?.addEventListener('click', () => {
      this.callbacks.onToggleBag();
    });

    const familyBtn = this.container.querySelector('#btn-toggle-family') as HTMLButtonElement;
    familyBtn?.addEventListener('click', () => {
      this.callbacks.onToggleFamily();
    });

    const layersBtn = this.container.querySelector('#btn-toggle-layers') as HTMLButtonElement;
    layersBtn?.addEventListener('click', () => {
      this.callbacks.onToggleLayers();
    });

    const seismicBtn = this.container.querySelector('#btn-toggle-seismic') as HTMLButtonElement;
    seismicBtn?.addEventListener('click', () => {
      this.callbacks.onToggleSeismic();
    });

    const sosBtn = this.container.querySelector('#btn-open-sos') as HTMLButtonElement;
    sosBtn?.addEventListener('click', () => {
      this.callbacks.onToggleSOS();
    });
  }
}
