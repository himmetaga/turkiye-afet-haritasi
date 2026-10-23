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
  onToggleEarlyWarning: () => void;
  onToggleSeismograph: () => void;
  onToggleWhistle: () => void;
  onToggleFelt: () => void;
  onToggleCrisis: () => void;
  onToggleSaaS: () => void;
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
      'absolute top-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-auto max-w-[calc(100vw-32px)] sm:max-w-lg';
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
        badge.innerHTML = `${Icons.wifi('w-3 h-3')} <span>Canlı</span>`;
      } else {
        badge.className =
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300';
        badge.innerHTML = `${Icons.wifiOff('w-3 h-3')} <span>Çevrimdışı</span>`;
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
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0"></span>
          <span class="truncate" title="${faultResult.fault.name}">
            ${faultResult.fault.name.split('(')[0]}
          </span>
        </div>
        <span class="font-mono text-rose-300 font-bold flex-shrink-0">${faultResult.distanceKm} km</span>
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
      <div class="hud-glass rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl transition-all">
        <!-- Brand Header with Official Vector Logo -->
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <div class="flex items-center gap-2.5">
            <a href="/" class="flex items-center gap-2 group">
              <img src="/logo-horizontal.svg" alt="afet.live" class="h-7 sm:h-8 w-auto object-contain group-hover:scale-105 transition-transform" />
            </a>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              id="btn-open-saas"
              title="Kurumsal Afet API & Widget Portalı"
              class="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1 active:scale-95"
            >
              <span>⚡</span>
              <span class="hidden sm:inline">SaaS / API</span>
            </button>

            <div id="connection-badge" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              this.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
            }">
              ${this.isOnline ? Icons.wifi('w-3 h-3') : Icons.wifiOff('w-3 h-3')}
              <span>${this.isOnline ? 'Canlı' : 'Çevrimdışı'}</span>
            </div>
          </div>
        </div>

        <!-- Fault Proximity Indicator -->
        <div
          id="fault-proximity-badge"
          class="hidden mb-2 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 flex items-center justify-between gap-1.5 font-medium cursor-pointer"
          title="En yakın diri fay hattı mesafesi"
        ></div>

        <!-- Search Bar & GPS -->
        <div class="flex items-center gap-2 mb-2">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
              ${Icons.search('w-3.5 h-3.5')}
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="Toplanma alanı, hastane veya ilçe ara..."
              class="w-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 bg-white/5 rounded-xl outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          <button
            id="btn-locate-me"
            title="Konumuma Git ve En Yakın Noktaları Hesapla"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 rounded-xl transition-all flex-shrink-0"
          >
            ${Icons.crosshair('w-4 h-4 text-emerald-400')}
            <span class="hidden sm:inline text-[11px] font-medium text-emerald-300">Konumum</span>
          </button>
        </div>

        <!-- Province Filter & Primary Action Buttons -->
        <div class="flex flex-wrap items-center gap-1.5 mb-2">
          <select
            id="province-select"
            class="flex-1 min-w-[110px] px-2 py-1.5 text-xs text-gray-300 bg-white/5 rounded-xl outline-none cursor-pointer hover:bg-white/10 transition-colors appearance-none"
          >
            <option value="">İl Seçiniz...</option>
          </select>

          <button
            id="btn-toggle-layers"
            title="Harita Katmanları"
            class="p-1.5 text-gray-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            ${Icons.layers('w-4 h-4')}
          </button>

          <button
            id="btn-toggle-seismic"
            title="Canlı Deprem Akışı"
            class="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
          >
            ${Icons.seismic('w-3.5 h-3.5')}
            <span id="seismic-badge-count">${this.seismicCount}</span>
          </button>

          <button
            id="btn-open-whistle"
            title="Afet Düdüğü & Kurtarma İşareti"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl transition-colors shadow-glow-red"
          >
            ${Icons.whistle('w-3.5 h-3.5 text-rose-400')}
            <span>Afet Düdüğü</span>
          </button>
        </div>

        <!-- Earthquake Network Quick Tools Row -->
        <div class="grid grid-cols-5 gap-1 pt-1.5 border-t border-white/5 text-[10px]">
          <button
            id="btn-open-early-warning"
            class="py-1 px-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5"
            title="Sismik Erken Uyarı ve P/S Dalgası Simülasyonu"
          >
            <span>🚨</span>
            <span class="truncate">Erken Uyarı</span>
          </button>

          <button
            id="btn-open-seismograph"
            class="py-1 px-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold transition-all text-center flex flex-col items-center justify-center gap-0.5"
            title="Canlı Cihaz İvmeölçer Sismografı"
          >
            <span>📈</span>
            <span class="truncate">Sismograf</span>
          </button>

          <button
            id="btn-open-felt"
            class="py-1 px-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold transition-all text-center flex flex-col items-center justify-center gap-0.5"
            title="Depremi Hissettiniz mi? Mercalli Bildirimi"
          >
            <span>📍</span>
            <span class="truncate">Hissedildi</span>
          </button>

          <button
            id="btn-open-crisis"
            class="py-1 px-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold transition-all text-center flex flex-col items-center justify-center gap-0.5"
            title="Kriz Durum Koordinasyon Odası & Güvendeyim Bildirimi"
          >
            <span>💬</span>
            <span class="truncate">Kriz Odası</span>
          </button>

          <button
            id="btn-toggle-bag"
            class="py-1 px-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-all text-center flex flex-col items-center justify-center gap-0.5"
            title="Afet Çantası & Aile Güvenliği"
          >
            <span>🎒</span>
            <span class="truncate">Afet Kiti</span>
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
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

    const layersBtn = this.container.querySelector('#btn-toggle-layers') as HTMLButtonElement;
    layersBtn?.addEventListener('click', () => {
      this.callbacks.onToggleLayers();
    });

    const seismicBtn = this.container.querySelector('#btn-toggle-seismic') as HTMLButtonElement;
    seismicBtn?.addEventListener('click', () => {
      this.callbacks.onToggleSeismic();
    });

    const whistleBtn = this.container.querySelector('#btn-open-whistle') as HTMLButtonElement;
    whistleBtn?.addEventListener('click', () => {
      this.callbacks.onToggleWhistle();
    });

    const ewBtn = this.container.querySelector('#btn-open-early-warning') as HTMLButtonElement;
    ewBtn?.addEventListener('click', () => {
      this.callbacks.onToggleEarlyWarning();
    });

    const seismoBtn = this.container.querySelector('#btn-open-seismograph') as HTMLButtonElement;
    seismoBtn?.addEventListener('click', () => {
      this.callbacks.onToggleSeismograph();
    });

    const feltBtn = this.container.querySelector('#btn-open-felt') as HTMLButtonElement;
    feltBtn?.addEventListener('click', () => {
      this.callbacks.onToggleFelt();
    });

    const crisisBtn = this.container.querySelector('#btn-open-crisis') as HTMLButtonElement;
    crisisBtn?.addEventListener('click', () => {
      this.callbacks.onToggleCrisis();
    });

    const saasBtn = this.container.querySelector('#btn-open-saas') as HTMLButtonElement;
    saasBtn?.addEventListener('click', () => {
      this.callbacks.onToggleSaaS();
    });
  }
}
