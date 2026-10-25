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
  onToggleNightWatch: () => void;
  onToggleBuildingRisk: () => void;
  onToggleQRPack: () => void;
  onToggleDrill: () => void;
  onToggleApartmentPoster: () => void;
  onToggleFamilyCard: () => void;
  onToggleICE: () => void;
  onToggleGuide: () => void;
  onToggleSMS: () => void;
  onToggleFloodRadar: () => void;
  onToggleRadio: () => void;
  onToggleTriage: () => void;
  onToggleAirQuality: () => void;
  onToggleTsunami: () => void;
  onToggleBlood: () => void;
  onToggleTourniquet: () => void;
  onToggleMedPassport: () => void;
  onToggleHazardHunt: () => void;
}

export interface SearchResultItem {
  id: string;
  name: string;
  category: 'assembly' | 'hospital' | 'pharmacy';
  district: string;
  city: string;
  distanceKm?: number;
  raw: any;
}

export interface QuickToolItem {
  id: string;
  label: string;
  title: string;
  rgb: string;
  icon: (c?: string) => string;
}

export interface QuickToolCategory {
  id: string;
  title: string;
  badge: string;
  accentClass: string;
  tools: QuickToolItem[];
}

/** Categorized tool definitions grouped by disaster utility */
const TOOL_CATEGORIES: QuickToolCategory[] = [
  {
    id: 'emergency',
    title: 'Acil Müdahale & S.O.S',
    badge: 'Kritik Müdahale',
    accentClass: 'text-rose-400',
    tools: [
      { id: 'btn-open-triage', label: 'Triyaj', title: 'Afet Triyaj Asistanı (START Sahra Karar Protokolü)', rgb: '236, 72, 153', icon: Icons.health },
      { id: 'btn-open-tourniquet', label: 'Turnike', title: 'Turnike Güvenlik Zamanlayıcısı ve Alın Damgası (120 Dk)', rgb: '239, 68, 68', icon: Icons.timer },
      { id: 'btn-open-sms', label: 'Acil SMS', title: 'Tek Tuşla GPS Konumlu Acil Durum SMS ve Acil Hatlar', rgb: '245, 158, 11', icon: Icons.phone },
      { id: 'btn-open-crisis', label: 'BitChat', title: 'BitChat Afet Ağı (P2P Mesh, Nostr ve Çevrimdışı Kriz Odası)', rgb: '34, 211, 238', icon: Icons.messages },
      { id: 'btn-open-emergency-radio', label: 'Afet Telsizi', title: 'TRAC & PMR 446 Çevrimdışı Telsiz ve Acil Frekans Rehberi', rgb: '234, 179, 8', icon: Icons.radio },
      { id: 'btn-open-night-watch', label: 'Gece Nöbeti', title: 'Gece Sismograf Nöbeti & Ekran WakeLock Modu', rgb: '129, 140, 248', icon: Icons.moon }
    ]
  },
  {
    id: 'radars',
    title: 'Erken Uyarı & Çevre Radarları',
    badge: 'Canlı Sensörler',
    accentClass: 'text-sky-400',
    tools: [
      { id: 'btn-open-flood-radar', label: 'Sel Radarı', title: 'Sel, Taşkın ve Şiddetli Yağış Erken Uyarı Radarı (GloFAS)', rgb: '14, 165, 233', icon: Icons.cloudRain },
      { id: 'btn-open-air-quality', label: 'Hava & Duman', title: 'Hava Kalitesi, Yangın ve Zehirli Gaz Radarı (Open-Meteo)', rgb: '245, 158, 11', icon: Icons.wind },
      { id: 'btn-open-tsunami', label: 'Tsunami', title: 'Tsunami Erken Uyarı & Kıyı Tahliye Radarı (Marmara/Ege)', rgb: '59, 130, 246', icon: Icons.waves },
      { id: 'btn-open-early-warning', label: 'Erken Uyarı', title: 'Sismik Erken Uyarı ve P/S Dalgası Simülasyonu', rgb: '251, 113, 133', icon: Icons.siren },
      { id: 'btn-open-seismograph', label: 'Sismograf', title: 'Canlı Cihaz İvmeölçer Sismografı', rgb: '52, 211, 153', icon: Icons.activity },
      { id: 'btn-open-felt', label: 'Hissettim', title: 'Depremi Hissettiniz mi? Mercalli Bildirimi', rgb: '249, 115, 22', icon: Icons.handRaised }
    ]
  },
  {
    id: 'preparedness',
    title: 'Hazırlık & Aile Güvenliği',
    badge: 'Önlem & Planlama',
    accentClass: 'text-amber-400',
    tools: [
      { id: 'btn-open-blood', label: 'Kan Bağışı', title: 'Türk Kızılay Kan Merkezleri & Donör Eşleşme Ağı', rgb: '239, 68, 68', icon: Icons.droplet },
      { id: 'btn-open-med-passport', label: 'İlaç Kartı', title: 'Afet İlaç & Tedavi Pasaportu, Eşdeğer Etken Madde Rehberi', rgb: '16, 185, 129', icon: Icons.pill },
      { id: 'btn-open-hazard-hunt', label: 'Tehlike Avı', title: 'Ev İçi Deprem Güvenlik Denetimi & Sabitleme Skoru', rgb: '245, 158, 11', icon: Icons.home },
      { id: 'btn-toggle-bag', label: 'Afet Kiti', title: 'Afet Çantası & Aile Güvenliği', rgb: '167, 139, 250', icon: Icons.backpack },
      { id: 'btn-open-building-risk', label: 'Bina Riski', title: 'Bina ve Zemin Sismik Ön Değerlendirme Kartı', rgb: '251, 191, 36', icon: Icons.building },
      { id: 'btn-open-ice', label: 'Kilit Ekranı', title: 'Kilit Ekranı Acil Durum & Kan Grubu Duvar Kağıdı (ICE)', rgb: '239, 68, 68', icon: Icons.shield },
      { id: 'btn-open-drill', label: 'Tatbikat', title: 'Deprem Tatbikatı & Sismik Dalga Simülasyonu', rgb: '239, 68, 68', icon: Icons.waves },
      { id: 'btn-open-qr-pack', label: 'QR Durum', title: 'İnternetsiz Cihazlar Arası Güvendeyim QR Paketi', rgb: '45, 212, 191', icon: Icons.qrCode }
    ]
  },
  {
    id: 'guides',
    title: 'Bilgilendirme, Rehberler & Afişler',
    badge: 'Eğitim & Rehber',
    accentClass: 'text-emerald-400',
    tools: [
      { id: 'btn-open-guide', label: 'Hayatta Kalma', title: 'Afet, Enkaz ve İlk Yardım Hayatta Kalma Rehberi', rgb: '16, 185, 129', icon: Icons.checkCircle },
      { id: 'btn-open-apartment-poster', label: 'Bina Afişi', title: 'Apartman Girişi ve Asansör Acil Durum Afişi (A4)', rgb: '245, 158, 11', icon: Icons.printer },
      { id: 'btn-open-family-card', label: 'Aile Kartı', title: 'Ailem İçin Afet Buluşma Kartı (Story 9:16)', rgb: '56, 189, 248', icon: Icons.users }
    ]
  }
];

const SEARCH_CATEGORY_STYLE: Record<SearchResultItem['category'], { label: string; cls: string; icon: (c?: string) => string }> = {
  assembly: { label: 'Toplanma', cls: 'text-emerald-300 bg-emerald-500/15', icon: Icons.shield },
  hospital: { label: 'Hastane', cls: 'text-cyan-300 bg-cyan-500/15', icon: Icons.hospital },
  pharmacy: { label: 'Eczane', cls: 'text-amber-300 bg-amber-500/15', icon: Icons.pill }
};

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class HeaderHUD {
  private container: HTMLElement;
  private isOnline = navigator.onLine;
  private callbacks: HeaderHUDCallbacks;
  private seismicCount = 0;
  private nearestFault: NearestFaultResult | null = null;
  private isMenuOpen = false;
  private provinces: string[] = [];
  private selectedProvince = '';

  constructor(parent: HTMLElement, callbacks: HeaderHUDCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('header');
    this.container.className =
      'absolute top-3 sm:top-4 left-3 right-3 sm:right-auto sm:left-4 sm:w-[420px] max-w-[calc(100vw-24px)] sm:max-w-[420px] z-20 flex flex-col gap-2 pointer-events-auto transition-all box-border';
    parent.appendChild(this.container);

    window.addEventListener('online', () => this.setOnlineState(true));
    window.addEventListener('offline', () => this.setOnlineState(false));

    this.render();
  }

  public setOnlineState(online: boolean): void {
    this.isOnline = online;
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
      const shortName = escapeHtml(faultResult.fault.name.split('(')[0].trim());
      faultBadge.classList.remove('hidden');
      faultBadge.classList.add('flex');
      faultBadge.innerHTML = `
        <span class="grid place-items-center w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex-shrink-0">
          ${Icons.alertTriangle('w-3.5 h-3.5')}
        </span>
        <div class="min-w-0 flex-1 leading-tight">
          <div class="hud-section-label !text-rose-300/70">En yakın diri fay</div>
          <div class="text-[11.5px] font-medium text-rose-100 truncate" title="${escapeHtml(faultResult.fault.name)}">${shortName}</div>
        </div>
        <span class="font-mono text-[13px] font-bold text-rose-300 tabular-nums flex-shrink-0">
          ${faultResult.distanceKm}<span class="text-[10px] font-medium text-rose-300/70 ml-0.5">km</span>
        </span>
      `;
    }
  }

  public populateProvinces(provinces: string[]): void {
    this.provinces = provinces;
    this.syncProvinceSelect();
  }

  private syncProvinceSelect(): void {
    const select = this.container.querySelector('#province-select') as HTMLSelectElement | null;
    if (!select) return;
    select.innerHTML =
      '<option value="">Türkiye Geneli (Tüm İller)</option>' +
      this.provinces
        .map(
          (p) =>
            `<option value="${escapeHtml(p)}" ${p === this.selectedProvince ? 'selected' : ''}>${escapeHtml(p)}</option>`
        )
        .join('');
  }

  public renderSearchResults(
    results: SearchResultItem[],
    onSelect: (item: any) => void
  ): void {
    const dropdown = this.container.querySelector('#search-results-dropdown') as HTMLElement;
    if (!dropdown) return;

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="flex flex-col items-center gap-1.5 px-3 py-4 text-center">
          <span class="text-gray-500">${Icons.search('w-5 h-5')}</span>
          <div class="text-[11.5px] text-gray-300 font-medium">Sonuç bulunamadı</div>
          <div class="text-[10.5px] text-gray-500">Farklı bir ilçe, park veya hastane adı deneyin.</div>
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML =
      `<div class="px-2.5 pt-1.5 pb-1 hud-section-label">${results.length} sonuç · yakına göre</div>` +
      results
        .map((item) => {
          const style = SEARCH_CATEGORY_STYLE[item.category];
          const distBadge =
            item.distanceKm !== undefined
              ? `<span class="text-[10.5px] font-mono font-semibold text-gray-300 tabular-nums shrink-0">${item.distanceKm.toFixed(1)} km</span>`
              : '';

          return `
            <button
              type="button"
              data-id="${escapeHtml(item.id)}"
              class="search-result-item w-full text-left flex items-center justify-between gap-2.5 px-2 py-1.5 hover:bg-white/[0.07] focus-visible:bg-white/[0.07] outline-none rounded-lg cursor-pointer transition-colors"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="grid place-items-center w-7 h-7 rounded-lg shrink-0 ${style.cls}" title="${style.label}">
                  ${style.icon('w-3.5 h-3.5')}
                </span>
                <div class="min-w-0">
                  <div class="text-[12px] font-medium text-white truncate">${escapeHtml(item.name)}</div>
                  <div class="text-[10.5px] text-gray-400 truncate">${style.label} · ${escapeHtml(item.district)}, ${escapeHtml(item.city)}</div>
                </div>
              </div>
              ${distBadge}
            </button>
          `;
        })
        .join('');

    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.search-result-item').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const match = results.find((r) => r.id === id);
        if (match) {
          const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
          if (searchInput) searchInput.value = match.name;
          this.syncClearButton();
          dropdown.classList.add('hidden');
          onSelect(match.raw);
        }
      });
    });
  }

  public clearSearchResults(): void {
    const dropdown = this.container.querySelector('#search-results-dropdown') as HTMLElement;
    if (dropdown) dropdown.classList.add('hidden');
  }

  private syncClearButton(): void {
    const input = this.container.querySelector('#search-input') as HTMLInputElement | null;
    const clearBtn = this.container.querySelector('#btn-search-clear') as HTMLElement | null;
    const kbd = this.container.querySelector('#search-kbd-hint') as HTMLElement | null;
    const hasValue = !!input && input.value.length > 0;
    clearBtn?.classList.toggle('hidden', !hasValue);
    kbd?.classList.toggle('sm:inline-block', !hasValue);
  }

  private render(): void {
    const categoriesHtml = TOOL_CATEGORIES.map((cat) => {
      const tiles = cat.tools
        .map(
          (t) => `
          <button id="${t.id}" type="button" class="hud-tool" style="--tool: ${t.rgb}" title="${t.title}" aria-label="${t.title}">
            <span class="hud-tool-icon">${t.icon('w-4 h-4')}</span>
            <span>${t.label}</span>
          </button>
        `
        )
        .join('');

      return `
        <div class="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06] first:border-0 first:pt-0">
          <div class="flex items-center justify-between px-1">
            <span class="hud-section-label !font-bold ${cat.accentClass}">${cat.title}</span>
            <span class="text-[9.5px] font-mono text-gray-400 font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">${cat.tools.length}</span>
          </div>
          <div class="grid grid-cols-3 gap-1">
            ${tiles}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="hud-header-panel rounded-[20px] p-2.5 sm:p-3 flex flex-col gap-2 shadow-2xl w-full max-w-full overflow-hidden box-border">
        <!-- 1. Brand bar & Symmetrical Menu Toggle -->
        <div class="flex items-center justify-between gap-2 min-w-0 w-full">
          <a href="/" class="flex items-center group rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400/60 flex-shrink-0" aria-label="afet.live ana sayfa">
            <img src="/logo-horizontal.svg" alt="afet.live" class="h-6 sm:h-[28px] w-auto max-w-[120px] sm:max-w-none object-contain group-hover:opacity-90 transition-opacity" />
          </a>
          <button
            id="btn-toggle-tools-menu"
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              this.isMenuOpen
                ? 'bg-white/20 border-white/30 text-white shadow-sm'
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-gray-200'
            }"
            title="Menüyü Aç / Kapat"
            aria-expanded="${this.isMenuOpen}"
          >
            <span>${this.isMenuOpen ? 'Kapat' : 'Menü'}</span>
            <span class="text-[9px] opacity-75">${this.isMenuOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        <!-- 2. PRIMARY EMERGENCY ACTION: AFET DÜDÜĞÜ & S.O.S -->
        <button
          id="btn-open-whistle"
          type="button"
          title="Afet Düdüğü & S.O.S"
          aria-label="Afet Düdüğünü Başlat"
          class="hud-emergency-btn flex items-center justify-center gap-2.5 w-full max-w-full px-4 py-2.5 rounded-xl text-white cursor-pointer select-none min-w-0 active:scale-95 transition-transform"
        >
          <span class="grid place-items-center w-6 h-6 rounded-md bg-white/20 text-white flex-shrink-0">
            ${Icons.whistle('w-4 h-4')}
          </span>
          <span class="text-[13px] sm:text-[14px] font-black tracking-wide text-white">AFET DÜDÜĞÜ & S.O.S</span>
        </button>

        <!-- 3. Collapsible Menus & Tools (Sonradan Açılan Menüler) -->
        <div id="hud-tools-collapsible" class="${this.isMenuOpen ? 'flex' : 'hidden'} flex-col gap-2 sm:gap-2.5 pt-1.5 border-t border-white/[0.08] transition-all">
          <!-- Search & GPS -->
          <div class="flex items-center gap-2 min-w-0 w-full">
            <div class="relative flex-1 min-w-0">
              <label class="hud-control flex items-center gap-2 pl-2.5 pr-1.5 cursor-text min-w-0 w-full">
                <span class="text-gray-400 flex-shrink-0">${Icons.search('w-4 h-4')}</span>
                <input
                  id="search-input"
                  type="search"
                  autocomplete="off"
                  spellcheck="false"
                  aria-label="Toplanma alanı, hastane veya ilçe ara"
                  placeholder="Toplanma alanı, ilçe ara…"
                  class="flex-1 min-w-0 w-full bg-transparent text-[12px] sm:text-[12.5px] text-white placeholder-gray-500 outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                <kbd id="search-kbd-hint" class="hud-kbd hidden sm:inline-block flex-shrink-0">/</kbd>
                <button
                  id="btn-search-clear"
                  type="button"
                  aria-label="Aramayı temizle"
                  class="hidden grid place-items-center w-6 h-6 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  ${Icons.close('w-3.5 h-3.5')}
                </button>
              </label>
              <!-- Search Results Floating Dropdown -->
              <div
                id="search-results-dropdown"
                class="hud-search-dropdown absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-obsidian-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 hidden p-1"
              ></div>
            </div>

            <button
              id="btn-locate-me"
              type="button"
              title="Konumuma Git ve En Yakın Noktaları Hesapla"
              aria-label="Konumuma git"
              class="hud-control flex items-center justify-center gap-1.5 px-2.5 sm:px-3 !bg-emerald-500/15 !border-emerald-500/25 hover:!bg-emerald-500/25 text-emerald-300 flex-shrink-0"
            >
              ${Icons.crosshair('w-4 h-4')}
              <span class="hidden sm:inline text-[11.5px] font-semibold">Konumum</span>
            </button>
          </div>

          <!-- Fault proximity -->
          <button
            type="button"
            id="fault-proximity-badge"
            class="${this.nearestFault ? 'flex' : 'hidden'} items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-rose-500/[0.08] hover:bg-rose-500/15 border border-rose-500/20 cursor-pointer active:scale-95 transition-all text-left"
            title="En yakın diri faya mesafe ve bina risk analizini aç"
          ></button>

          <!-- Province filter, layers, live quake feed -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1 min-w-0">
              <select
                id="province-select"
                aria-label="İl filtresi"
                class="hud-control w-full pl-2.5 pr-8 text-[12px] text-gray-200 cursor-pointer appearance-none outline-none"
              >
                <option value="">Türkiye Geneli (Tüm İller)</option>
              </select>
              <span class="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-500">
                ${Icons.chevronDown('w-3.5 h-3.5')}
              </span>
            </div>

            <button
              id="btn-toggle-layers"
              type="button"
              title="Harita Katmanları"
              aria-label="Harita katmanları"
              class="hud-control grid place-items-center w-[34px] text-gray-300 hover:text-white flex-shrink-0"
            >
              ${Icons.layers('w-4 h-4')}
            </button>

            <button
              id="btn-toggle-seismic"
              type="button"
              title="Canlı Deprem Akışı"
              aria-label="Canlı deprem akışı"
              class="hud-control flex items-center gap-1.5 px-2.5 !bg-amber-500/10 !border-amber-500/20 hover:!bg-amber-500/20 text-amber-300 flex-shrink-0"
            >
              ${Icons.seismic('w-4 h-4')}
              <span id="seismic-badge-count" class="font-mono text-[12px] font-bold tabular-nums">${this.seismicCount}</span>
              <span class="hidden sm:inline text-[11px] font-medium text-amber-300/80">deprem</span>
            </button>
          </div>

          <!-- Categorized Quick Tools Matrix (Faydaya Göre Gruplandırılmış Menü) -->
          <div class="pt-1">
            <div class="max-h-[min(480px,calc(100vh-210px))] overflow-y-auto overscroll-contain pr-1 space-y-3.5 scrollbar-thin">
              ${categoriesHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    this.syncProvinceSelect();
    if (this.nearestFault) {
      this.updateNearestFault(this.nearestFault);
    }
    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    const searchInput = q<HTMLInputElement>('#search-input');
    searchInput?.addEventListener('input', (e) => {
      this.syncClearButton();
      this.callbacks.onSearchChange((e.target as HTMLInputElement).value);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (searchInput.value) {
          searchInput.value = '';
          this.syncClearButton();
          this.callbacks.onSearchChange('');
        } else {
          searchInput.blur();
        }
        this.clearSearchResults();
      } else if (e.key === 'ArrowDown') {
        const first = q<HTMLElement>('#search-results-dropdown .search-result-item');
        if (first) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Arrow-key navigation inside the results list
    q<HTMLElement>('#search-results-dropdown')?.addEventListener('keydown', (e) => {
      const items = Array.from(this.container.querySelectorAll<HTMLElement>('.search-result-item'));
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (idx === -1) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[Math.min(idx + 1, items.length - 1)].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx === 0) searchInput?.focus();
        else items[idx - 1].focus();
      } else if (e.key === 'Escape') {
        this.clearSearchResults();
        searchInput?.focus();
      }
    });

    q<HTMLButtonElement>('#btn-search-clear')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!searchInput) return;
      searchInput.value = '';
      this.syncClearButton();
      this.callbacks.onSearchChange('');
      searchInput.focus();
    });

    // "/" focuses search from anywhere (unless already typing in a field)
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      e.preventDefault();
      searchInput?.focus();
    });

    q<HTMLSelectElement>('#province-select')?.addEventListener('change', (e) => {
      this.selectedProvince = (e.target as HTMLSelectElement).value;
      this.callbacks.onSelectProvince(this.selectedProvince);
    });

    const clickMap: Record<string, () => void> = {
      'btn-locate-me': () => this.callbacks.onLocateMe(),
      'btn-toggle-layers': () => this.callbacks.onToggleLayers(),
      'btn-toggle-seismic': () => this.callbacks.onToggleSeismic(),
      'btn-open-whistle': () => this.callbacks.onToggleWhistle(),
      'btn-open-ice': () => this.callbacks.onToggleICE(),
      'btn-open-guide': () => this.callbacks.onToggleGuide(),
      'btn-open-triage': () => this.callbacks.onToggleTriage(),
      'btn-open-tourniquet': () => this.callbacks.onToggleTourniquet(),
      'btn-open-med-passport': () => this.callbacks.onToggleMedPassport(),
      'btn-open-hazard-hunt': () => this.callbacks.onToggleHazardHunt(),
      'btn-open-air-quality': () => this.callbacks.onToggleAirQuality(),
      'btn-open-tsunami': () => this.callbacks.onToggleTsunami(),
      'btn-open-blood': () => this.callbacks.onToggleBlood(),
      'btn-open-sms': () => this.callbacks.onToggleSMS(),
      'btn-open-flood-radar': () => this.callbacks.onToggleFloodRadar(),
      'btn-open-emergency-radio': () => this.callbacks.onToggleRadio(),
      'btn-open-early-warning': () => this.callbacks.onToggleEarlyWarning(),
      'btn-open-night-watch': () => this.callbacks.onToggleNightWatch(),
      'btn-open-seismograph': () => this.callbacks.onToggleSeismograph(),
      'btn-open-building-risk': () => this.callbacks.onToggleBuildingRisk(),
      'btn-open-drill': () => this.callbacks.onToggleDrill(),
      'btn-open-apartment-poster': () => this.callbacks.onToggleApartmentPoster(),
      'btn-open-family-card': () => this.callbacks.onToggleFamilyCard(),
      'btn-open-felt': () => this.callbacks.onToggleFelt(),
      'btn-open-crisis': () => this.callbacks.onToggleCrisis(),
      'btn-open-qr-pack': () => this.callbacks.onToggleQRPack(),
      'btn-toggle-bag': () => this.callbacks.onToggleBag(),
      'fault-proximity-badge': () => this.callbacks.onToggleBuildingRisk()
    };
    for (const [id, handler] of Object.entries(clickMap)) {
      q<HTMLButtonElement>(`#${id}`)?.addEventListener('click', handler);
    }

    q<HTMLButtonElement>('#btn-toggle-tools-menu')?.addEventListener('click', () => {
      this.toggleMenu();
    });

    document.addEventListener('click', (e) => {
      const dropdown = q<HTMLElement>('#search-results-dropdown');
      if (dropdown && !this.container.contains(e.target as Node)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  public toggleMenu(force?: boolean): void {
    this.isMenuOpen = force !== undefined ? force : !this.isMenuOpen;
    const collapsible = this.container.querySelector('#hud-tools-collapsible') as HTMLElement | null;
    const toggleBtn = this.container.querySelector('#btn-toggle-tools-menu') as HTMLButtonElement | null;
    if (collapsible) {
      collapsible.classList.toggle('hidden', !this.isMenuOpen);
      collapsible.classList.toggle('flex', this.isMenuOpen);
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(this.isMenuOpen));
      toggleBtn.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        this.isMenuOpen
          ? 'bg-white/20 border-white/30 text-white shadow-sm'
          : 'bg-white/10 hover:bg-white/15 border-white/10 text-gray-200'
      }`;
      const spanText = toggleBtn.querySelector('span:first-child');
      const spanArrow = toggleBtn.querySelector('span:last-child');
      if (spanText) spanText.textContent = this.isMenuOpen ? 'Kapat' : 'Menü';
      if (spanArrow) spanArrow.textContent = this.isMenuOpen ? '▲' : '▼';
    }
  }
}
