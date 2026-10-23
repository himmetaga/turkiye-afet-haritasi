import { Icons } from './icons';

export interface HeaderHUDCallbacks {
  onSearchChange: (query: string) => void;
  onLocateMe: () => void;
  onToggleSeismic: () => void;
  onToggleSOS: () => void;
  onSelectProvince: (province: string) => void;
}

export class HeaderHUD {
  private container: HTMLElement;
  private isOnline = navigator.onLine;
  private callbacks: HeaderHUDCallbacks;
  private seismicCount = 0;

  constructor(parent: HTMLElement, callbacks: HeaderHUDCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('header');
    this.container.className =
      'absolute top-4 left-4 z-20 flex flex-col gap-3 pointer-events-auto max-w-[calc(100vw-32px)] sm:max-w-md';
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
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400';
        badge.innerHTML = `${Icons.wifi('w-3 h-3')} <span>Çevrimiçi Canlı</span>`;
      } else {
        badge.className =
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300';
        badge.innerHTML = `${Icons.wifiOff('w-3 h-3')} <span>Çevrimdışı Koruma</span>`;
      }
    }
  }

  public updateSeismicCount(count: number): void {
    this.seismicCount = count;
    const el = this.container.querySelector('#seismic-badge-count');
    if (el) el.textContent = String(count);
  }

  public populateProvinces(provinces: string[]): void {
    const select = this.container.querySelector('#province-select') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML = '<option value="">Türkiye Geneli (Tüm İller)</option>' +
      provinces.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all">
        <div class="flex items-center justify-between gap-3 mb-2.5">
          <div>
            <h1 class="text-sm font-semibold tracking-wider text-white uppercase flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Türkiye Afet Atlası
            </h1>
            <p class="text-[11px] text-gray-400 tracking-wide font-normal">3B Toplanma & Sismik Savunma</p>
          </div>
          <div id="connection-badge" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            this.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
          }">
            ${this.isOnline ? Icons.wifi('w-3 h-3') : Icons.wifiOff('w-3 h-3')}
            <span>${this.isOnline ? 'Çevrimiçi Canlı' : 'Çevrimdışı Koruma'}</span>
          </div>
        </div>

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
            title="Konumumu Bul"
            class="p-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl transition-all"
          >
            ${Icons.crosshair('w-4 h-4 text-emerald-400')}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <select
            id="province-select"
            class="flex-1 px-2.5 py-1.5 text-xs text-gray-300 bg-white/5 rounded-xl outline-none cursor-pointer hover:bg-white/10 transition-colors appearance-none"
          >
            <option value="">İl Seçiniz...</option>
          </select>

          <button
            id="btn-toggle-seismic"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
          >
            ${Icons.seismic('w-3.5 h-3.5')}
            <span>Sismik (<span id="seismic-badge-count">${this.seismicCount}</span>)</span>
          </button>

          <button
            id="btn-open-sos"
            class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 rounded-xl transition-colors shadow-glow-red"
          >
            ${Icons.whistle('w-3.5 h-3.5')}
            <span>SOS Düdük</span>
          </button>
        </div>
      </div>
    `;

    const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
    searchInput.addEventListener('input', (e) => {
      this.callbacks.onSearchChange((e.target as HTMLInputElement).value);
    });

    const locateBtn = this.container.querySelector('#btn-locate-me') as HTMLButtonElement;
    locateBtn.addEventListener('click', () => {
      this.callbacks.onLocateMe();
    });

    const provinceSelect = this.container.querySelector('#province-select') as HTMLSelectElement;
    provinceSelect.addEventListener('change', (e) => {
      this.callbacks.onSelectProvince((e.target as HTMLSelectElement).value);
    });

    const seismicBtn = this.container.querySelector('#btn-toggle-seismic') as HTMLButtonElement;
    seismicBtn.addEventListener('click', () => {
      this.callbacks.onToggleSeismic();
    });

    const sosBtn = this.container.querySelector('#btn-open-sos') as HTMLButtonElement;
    sosBtn.addEventListener('click', () => {
      this.callbacks.onToggleSOS();
    });
  }
}
