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
  onToggleFieldAid: () => void;
  onTogglePetSafety: () => void;
  onToggleTentHeating: () => void;
  onToggleBatterySaver: () => void;
  onToggleAcousticListener: () => void;
  onToggleOfflineMapPack: () => void;
  onTogglePsychFirstAid: () => void;
  onToggleCampStatus: () => void;
  onToggleInfantFeeding: () => void;
  onTogglePTTWalkie: () => void;
  // iOS 27 New Civil Defense Modules
  onToggleTacticalCompass: () => void;
  onToggleSARBeacon: () => void;
  onToggleCPRCoach: () => void;
  onToggleDamageAssessment: () => void;
  onToggleWaterDisinfection: () => void;
  onToggleCBRN: () => void;
  onToggleCivilVault: () => void;
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
  emoji: string;
  icon?: (c?: string) => string;
}

export interface QuickToolCategory {
  id: string;
  title: string;
  badge: string;
  accentClass: string;
  tools: QuickToolItem[];
}

/** 4 Streamlined Master Categories (iOS 27 Bento Architecture) */
const TOOL_CATEGORIES: QuickToolCategory[] = [
  {
    id: 'emergency',
    title: 'Acil Müdahale & S.O.S',
    badge: 'Kritik Müdahale',
    accentClass: 'text-rose-400',
    tools: [
      { id: 'btn-open-cpr', label: 'CPR Koçu', title: 'Sahra Kalp Masajı Metronomu (AHA 110 BPM)', rgb: '244, 63, 94', emoji: '🫀' },
      { id: 'btn-open-triage', label: 'Triyaj', title: 'Afet Triyaj Asistanı (START Sahra Karar Protokolü)', rgb: '236, 72, 153', emoji: '🩺' },
      { id: 'btn-open-tourniquet', label: 'Turnike', title: 'Turnike Güvenlik Zamanlayıcısı ve Alın Damgası (120 Dk)', rgb: '239, 68, 68', emoji: '⏱️' },
      { id: 'btn-open-sar-beacon', label: 'SAR Flaşör', title: 'Optik LED Flaşör & Ekran Mors S.O.S Beacon', rgb: '239, 68, 68', emoji: '🔦' },
      { id: 'btn-open-acoustic-listener', label: 'Enkaz Sensörü', title: 'Akustik Enkaz Dinleme ve Otomatik S.O.S Tetikleyici', rgb: '168, 85, 247', emoji: '🎙️' },
      { id: 'btn-open-whistle', label: 'SAR Düdüğü', title: '3000 Hz Kurtarma Düdüğü (Web Audio API)', rgb: '245, 158, 11', emoji: '📢' },
      { id: 'btn-open-night-watch', label: 'Gece Nöbeti', title: 'Gece Sismograf Nöbeti & Ekran WakeLock Modu', rgb: '129, 140, 248', emoji: '🌙' },
      { id: 'btn-open-battery-saver', label: 'Pil Tasarrufu', title: 'Ultra Pil Tasarrufu ve 72 Saat Hayatta Kalma Modu (OLED)', rgb: '16, 185, 129', emoji: '🔋' }
    ]
  },
  {
    id: 'radars',
    title: 'Taktik Navigasyon & Radarlar',
    badge: 'Canlı Sensörler',
    accentClass: 'text-sky-400',
    tools: [
      { id: 'btn-open-tactical-compass', label: 'Taktik Pusula', title: 'Manyetometre Kerteriz Pusulası & Enkaz Katı Derinlik HUD', rgb: '16, 185, 129', emoji: '🧭' },
      { id: 'btn-open-flood-radar', label: 'Sel Radarı', title: 'Sel, Taşkın ve Şiddetli Yağış Erken Uyarı Radarı (GloFAS)', rgb: '14, 165, 233', emoji: '🌊' },
      { id: 'btn-open-air-quality', label: 'Hava & Duman', title: 'Hava Kalitesi, Yangın ve Zehirli Gaz Radarı (Open-Meteo)', rgb: '245, 158, 11', emoji: '💨' },
      { id: 'btn-open-tsunami', label: 'Tsunami', title: 'Tsunami Erken Uyarı & Kıyı Tahliye Radarı (Marmara/Ege)', rgb: '59, 130, 246', emoji: '🌊' },
      { id: 'btn-open-early-warning', label: 'Erken Uyarı', title: 'Sismik Erken Uyarı ve P/S Dalgası Simülasyonu', rgb: '251, 113, 133', emoji: '🚨' },
      { id: 'btn-open-seismograph', label: 'Sismograf', title: 'Canlı Cihaz İvmeölçer Sismografı (100 Hz)', rgb: '52, 211, 153', emoji: '📈' },
      { id: 'btn-open-felt', label: 'Hissettim', title: 'Depremi Hissettiniz mi? Mercalli Bildirimi', rgb: '249, 115, 22', emoji: '✋' }
    ]
  },
  {
    id: 'comms',
    title: 'İnternetsiz İletişim & Lojistik',
    badge: 'Şebekesiz P2P',
    accentClass: 'text-cyan-400',
    tools: [
      { id: 'btn-open-crisis', label: 'BitChat', title: 'BitChat Afet Ağı (P2P Mesh, Nostr ve Çevrimdışı Kriz Odası)', rgb: '34, 211, 238', emoji: '💬' },
      { id: 'btn-open-ptt-walkie', label: 'Telsiz PTT', title: 'İnternetsiz Bas-Konuş Telsiz & Sesli S.O.S Anons Döngüsü', rgb: '16, 185, 129', emoji: '📻' },
      { id: 'btn-open-sms', label: 'Acil SMS', title: 'Tek Tuşla GPS Konumlu Acil Durum SMS ve Acil Hatlar', rgb: '245, 158, 11', emoji: '📱' },
      { id: 'btn-open-emergency-radio', label: 'Afet Telsizi', title: 'TRAC & PMR 446 Çevrimdışı Telsiz ve Acil Frekans Rehberi', rgb: '234, 179, 8', emoji: '📡' },
      { id: 'btn-open-camp-status', label: 'Sahra Durumu', title: 'Toplanma Alanı Sıcak Yemek, Su, WC ve Çadır Doluluk Karnesi', rgb: '245, 158, 11', emoji: '⛺' },
      { id: 'btn-open-field-aid', label: 'Sahra İhtiyaç', title: 'Afet Çadırkent İhtiyaç ve Malzeme Dağıtım Masası (P2P)', rgb: '245, 158, 11', emoji: '📦' },
      { id: 'btn-open-qr-pack', label: 'QR Durum', title: 'İnternetsiz Cihazlar Arası Güvendeyim QR Paketi', rgb: '45, 212, 191', emoji: '📲' }
    ]
  },
  {
    id: 'civil_defense',
    title: 'Sivil Savunma & Dayanıklılık',
    badge: 'Koruma & Hukuk',
    accentClass: 'text-emerald-400',
    tools: [
      { id: 'btn-open-damage-assessment', label: 'Bina Hasarı', title: 'Bina Hasar Tespit & DASK Kanıt Tutanağı (FEMA)', rgb: '251, 191, 36', emoji: '🏛️' },
      { id: 'btn-open-cbrn', label: 'KBRN & Nükleer', title: 'KBRN, Radyasyon & Nükleer Serpinti Sığınağı Kılavuzu', rgb: '234, 179, 8', emoji: '☢️' },
      { id: 'btn-open-water-disinfection', label: 'Su Arıtma', title: 'Sahra Su Arıtma & Klorlama Dozajlayıcısı (WHO WASH)', rgb: '14, 165, 233', emoji: '💧' },
      { id: 'btn-open-civil-vault', label: 'Evrak Kasası', title: 'Mülkiyet Kasası, P2P Takas Defteri & DASK 15 Gün Süre', rgb: '99, 102, 241', emoji: '⚖️' },
      { id: 'btn-open-blood', label: 'Kan Bağışı', title: 'Türk Kızılay Kan Merkezleri & Donör Eşleşme Ağı', rgb: '239, 68, 68', emoji: '🩸' },
      { id: 'btn-open-med-passport', label: 'İlaç Kartı', title: 'Afet İlaç & Tedavi Pasaportu, Eşdeğer Etken Madde Rehberi', rgb: '16, 185, 129', emoji: '💊' },
      { id: 'btn-open-offline-map', label: 'Harita İndir', title: 'İlçe Bazlı Çevrimdışı Vektör Harita Paketi İndir', rgb: '6, 182, 212', emoji: '🗺️' },
      { id: 'btn-toggle-bag', label: 'Afet Kiti', title: 'Afet Çantası & Aile Güvenliği', rgb: '167, 139, 250', emoji: '🎒' },
      { id: 'btn-open-psych-firstaid', label: 'Kutu Nefesi', title: 'Afet Psikolojik İlk Yardım ve 4-4-4-4 Kutu Nefesi Egzersizi', rgb: '59, 130, 246', emoji: '🧠' },
      { id: 'btn-open-pet-safety', label: 'Pati Güvenlik', title: 'Pati ve Evcil Hayvan Afet Güvenliği, Çanta ve Tahliye Rehberi', rgb: '251, 146, 60', emoji: '🐾' }
    ]
  }
];

export class HeaderHUD {
  private container: HTMLElement;
  private isOnline = navigator.onLine;
  private callbacks: HeaderHUDCallbacks;
  private seismicCount = 0;
  private nearestFault: NearestFaultResult | null = null;
  private isMenuOpen = false;
  private isSearchOpen = false;
  private provinces: string[] = [];
  private selectedProvince = '';
  private toolSearchQuery = '';

  constructor(parent: HTMLElement, callbacks: HeaderHUDCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.id = 'ios27-header-root';
    this.container.className = 'contents pointer-events-none';
    parent.appendChild(this.container);

    window.addEventListener('online', () => this.setOnlineState(true));
    window.addEventListener('offline', () => this.setOnlineState(false));

    // Global shortcut Command+K or Ctrl+K opens Spotlight Search
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggleSearch();
      }
    });

    this.render();
  }

  public setOnlineState(online: boolean): void {
    this.isOnline = online;
    this.render();
  }

  public setSeismicCount(count: number): void {
    this.seismicCount = count;
    const badge = this.container.querySelector('#island-seismic-badge');
    if (badge) {
      badge.textContent = `${count} Deprem`;
    }
  }

  public updateSeismicCount(count: number): void {
    this.setSeismicCount(count);
  }

  public setNearestFault(fault: NearestFaultResult | null): void {
    this.nearestFault = fault;
  }

  public updateNearestFault(fault: NearestFaultResult | null): void {
    this.setNearestFault(fault);
  }

  public setProvinces(provinces: string[]): void {
    this.provinces = provinces;
    this.render();
  }

  public populateProvinces(provinces: string[]): void {
    this.setProvinces(provinces);
  }

  public setSelectedProvince(province: string): void {
    this.selectedProvince = province;
    const pill = this.container.querySelector('#island-province-label');
    if (pill) {
      pill.textContent = province || '81 İl Seç';
    }
  }

  public clearSearchResults(): void {
    this.setSearchResults([]);
  }

  public renderSearchResults(results: SearchResultItem[], onSelect: (item: any) => void): void {
    this.setSearchResults(results);
    const list = this.container.querySelector('#spotlight-results-list');
    if (!list) return;
    list.querySelectorAll<HTMLElement>('.spotlight-result-item').forEach((itemEl) => {
      itemEl.addEventListener('click', () => {
        const id = itemEl.getAttribute('data-point-id');
        const found = results.find((r) => r.id === id);
        if (found) {
          onSelect(found.raw || found);
          this.toggleSearch(false);
        }
      });
    });
  }

  public setSearchResults(results: SearchResultItem[]): void {
    const list = this.container.querySelector('#spotlight-results-list');
    if (!list) return;

    if (results.length === 0) {
      list.innerHTML = `<div class="p-4 text-center text-xs text-gray-500">Kayıt bulunamadı.</div>`;
      return;
    }

    list.innerHTML = results
      .slice(0, 8)
      .map(
        (r) => `
        <div data-point-id="${r.id}" class="spotlight-result-item p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 flex items-center justify-between cursor-pointer transition-all ios27-tap-bounce">
          <div class="min-w-0">
            <div class="font-bold text-white text-xs truncate">${r.name}</div>
            <div class="text-[10.5px] text-gray-400 truncate">${r.district}, ${r.city}</div>
          </div>
          ${
            r.distanceKm !== undefined
              ? `<span class="text-[10px] font-mono text-emerald-400 font-bold ml-2 shrink-0">${r.distanceKm.toFixed(1)} km</span>`
              : ''
          }
        </div>
      `
      )
      .join('');
  }

  private toggleSearch(open?: boolean): void {
    this.isSearchOpen = open !== undefined ? open : !this.isSearchOpen;
    const searchPanel = this.container.querySelector('#ios27-spotlight-panel');
    if (searchPanel) {
      if (this.isSearchOpen) {
        searchPanel.classList.remove('hidden');
        (this.container.querySelector('#spotlight-search-input') as HTMLInputElement | null)?.focus();
      } else {
        searchPanel.classList.add('hidden');
      }
    }
  }

  private toggleControlCenter(open?: boolean): void {
    this.isMenuOpen = open !== undefined ? open : !this.isMenuOpen;
    const sheet = this.container.querySelector('#ios27-bento-sheet');
    if (sheet) {
      if (this.isMenuOpen) {
        sheet.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
        sheet.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
      } else {
        sheet.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
        sheet.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      }
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- =========================================================
           1. TOP CENTER: iOS 27 DYNAMIC ISLAND CAPSULE
           ========================================================= -->
      <div class="fixed top-2.5 sm:top-3.5 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] pointer-events-auto select-none">
        <div id="ios27-dynamic-island" class="ios27-capsule px-3 py-1.5 flex items-center gap-2 text-xs text-white shadow-2xl ios27-spring cursor-pointer">
          <!-- Live Telemetry Pulse -->
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${this.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
            <span class="font-black tracking-tight text-[11.5px] text-white">afet<span class="text-cyan-400">.live</span></span>
          </div>

          <!-- Divider -->
          <span class="h-3.5 w-px bg-white/20"></span>

          <!-- Province Selector Pill -->
          <button id="btn-island-province" type="button" class="flex items-center gap-1 text-[11px] font-bold text-gray-200 hover:text-white px-1.5 py-0.5 rounded-lg hover:bg-white/10 transition-colors">
            <span id="island-province-label">${this.selectedProvince || '81 İl'}</span>
            <span class="text-[9px] opacity-70">▾</span>
          </button>

          <!-- Divider -->
          <span class="h-3.5 w-px bg-white/20"></span>

          <!-- Spotlight Search Trigger -->
          <button id="btn-trigger-spotlight" type="button" class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-[10.5px] font-semibold transition-all">
            ${Icons.search('w-3.5 h-3.5')}
            <span class="hidden sm:inline">Ara</span>
            <kbd class="hidden sm:inline text-[9px] px-1 rounded bg-black/40 text-gray-400 font-mono">⌘K</kbd>
          </button>

          <!-- Seismic Counter Badge -->
          <button id="btn-island-seismic" type="button" class="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold">
            <span id="island-seismic-badge">${this.seismicCount} Deprem</span>
          </button>
        </div>

        <!-- Province Dropdown Menu (Hidden by default) -->
        <div id="island-province-dropdown" class="hidden absolute top-12 left-1/2 -translate-x-1/2 w-64 max-h-60 overflow-y-auto ios27-glass rounded-2xl p-2 border border-white/15 shadow-2xl z-50">
          <input
            id="input-filter-province"
            type="text"
            placeholder="İl ara (Örn: İstanbul)..."
            class="w-full px-2.5 py-1.5 mb-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs outline-none"
          />
          <div id="province-items-list" class="space-y-0.5">
            ${this.provinces
              .map(
                (p) => `
              <button data-prov="${p}" class="btn-select-prov w-full px-2.5 py-1.5 rounded-xl text-left text-xs text-gray-200 hover:bg-white/10 hover:text-white transition-colors">
                ${p}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Spotlight Search Panel (Hidden by default) -->
        <div id="ios27-spotlight-panel" class="hidden absolute top-12 left-1/2 -translate-x-1/2 w-[92vw] sm:w-[440px] ios27-glass rounded-3xl p-3 border border-white/15 shadow-2xl z-50 space-y-2">
          <div class="relative flex items-center">
            <span class="absolute left-3 text-gray-400">${Icons.search('w-4 h-4')}</span>
            <input
              id="spotlight-search-input"
              type="text"
              placeholder="Toplanma alanı, hastane veya eczane ara..."
              class="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-gray-400 text-xs outline-none focus:border-cyan-400"
            />
            <button id="btn-close-spotlight" class="absolute right-2.5 text-gray-400 hover:text-white">
              ${Icons.close('w-4 h-4')}
            </button>
          </div>
          <div id="spotlight-results-list" class="max-h-64 overflow-y-auto space-y-1 pr-1"></div>
        </div>
      </div>

      <!-- =========================================================
           2. BOTTOM CENTER: iOS 27 FLOATING SPATIAL GLASS DOCK
           ========================================================= -->
      <div class="fixed bottom-3.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none">
        <div id="ios27-dock" class="ios27-dock px-3.5 py-2 flex items-center gap-3 text-white shadow-2xl">
          <!-- 1. Locate Me / Map -->
          <button id="btn-dock-locate" type="button" class="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 text-gray-200 hover:text-white transition-all" title="Konumuma Odaklan">
            ${Icons.crosshair('w-5 h-5')}
          </button>

          <!-- 2. Big SOS Trigger (Hold-to-confirm) -->
          <button id="btn-dock-sos" type="button" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-rose-600/40 active:scale-95 transition-all flex items-center gap-1.5 border border-rose-400/40">
            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>S.O.S</span>
          </button>

          <!-- 3. BitChat Messenger -->
          <button id="btn-dock-bitchat" type="button" class="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 text-cyan-300 hover:text-white transition-all relative" title="BitChat Kriz Odası">
            ${Icons.messages('w-5 h-5')}
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-obsidian-950"></span>
          </button>

          <!-- 4. Control Center Menu Button -->
          <button id="btn-dock-menu" type="button" class="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white flex items-center gap-1.5 border border-white/10 transition-all">
            <span class="text-sm">🎛️</span>
            <span class="hidden sm:inline">Kontrol Merkezi</span>
          </button>
        </div>
      </div>

      <!-- =========================================================
           3. FULL BENTO CONTROL CENTER SHEET (MINIMALIST DRAWER)
           ========================================================= -->
      <div
        id="ios27-bento-sheet"
        class="fixed inset-x-2 sm:inset-x-auto sm:right-6 sm:bottom-20 bottom-20 sm:w-[480px] max-h-[82vh] ios27-glass rounded-3xl p-4 sm:p-5 border border-white/15 shadow-2xl z-50 flex flex-col gap-3.5 transition-all duration-300 translate-y-full opacity-0 pointer-events-none"
      >
        <!-- Sheet Header -->
        <div class="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-lg">🎛️</span>
            <div>
              <h3 class="text-sm sm:text-base font-black text-white tracking-tight">Afet Kontrol Merkezi</h3>
              <p class="text-[10.5px] text-gray-400">Tüm sivil savunma, radar ve hayatta kalma araçları</p>
            </div>
          </div>
          <button id="btn-close-bento" class="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Quick Filter Input -->
        <div class="relative shrink-0">
          <span class="absolute left-3 top-2.5 text-gray-400 text-xs">🔎</span>
          <input
            id="input-filter-bento-tools"
            type="text"
            placeholder="Araçlarda ara (CPR, turnike, pusula, sel, KBRN)..."
            class="w-full pl-8 pr-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 text-xs outline-none focus:border-cyan-400"
          />
        </div>

        <!-- Bento Grid Categories (Scrollable) -->
        <div id="bento-categories-container" class="overflow-y-auto space-y-3.5 pr-1 text-xs">
          ${TOOL_CATEGORIES.map(
            (cat) => `
            <div class="bento-category-block space-y-2">
              <div class="flex items-center justify-between px-1">
                <span class="font-bold text-[11px] ${cat.accentClass} uppercase tracking-wider">${cat.title}</span>
                <span class="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono">${cat.badge}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${cat.tools
                  .map(
                    (t) => `
                  <button
                    id="${t.id}"
                    type="button"
                    title="${t.title}"
                    class="tool-bento-btn p-2.5 rounded-2xl ios27-glass-card flex flex-col items-center text-center gap-1.5 transition-all ios27-tap-bounce group"
                  >
                    <span class="text-xl group-hover:scale-110 transition-transform">${t.emoji}</span>
                    <span class="text-[11px] font-bold text-gray-200 group-hover:text-white truncate max-w-full">${t.label}</span>
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
          ).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    // Island Province selector
    q('#btn-island-province')?.addEventListener('click', () => {
      const dropdown = q('#island-province-dropdown');
      dropdown?.classList.toggle('hidden');
    });

    q<HTMLInputElement>('#input-filter-province')?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.container.querySelectorAll<HTMLButtonElement>('.btn-select-prov').forEach((btn) => {
        const prov = (btn.getAttribute('data-prov') || '').toLowerCase();
        btn.classList.toggle('hidden', !prov.includes(query));
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-select-prov').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prov = btn.getAttribute('data-prov') || '';
        this.selectedProvince = prov;
        this.callbacks.onSelectProvince(prov);
        q('#island-province-dropdown')?.classList.add('hidden');
        this.setSelectedProvince(prov);
      });
    });

    // Spotlight search
    q('#btn-trigger-spotlight')?.addEventListener('click', () => this.toggleSearch());
    q('#btn-close-spotlight')?.addEventListener('click', () => this.toggleSearch(false));

    q<HTMLInputElement>('#spotlight-search-input')?.addEventListener('input', (e) => {
      const qVal = (e.target as HTMLInputElement).value;
      this.callbacks.onSearchChange(qVal);
    });

    // Dock Buttons
    q('#btn-dock-locate')?.addEventListener('click', () => this.callbacks.onLocateMe());
    q('#btn-dock-sos')?.addEventListener('click', () => this.callbacks.onToggleSOS());
    q('#btn-dock-bitchat')?.addEventListener('click', () => this.callbacks.onToggleCrisis());
    q('#btn-dock-menu')?.addEventListener('click', () => this.toggleControlCenter());
    q('#btn-close-bento')?.addEventListener('click', () => this.toggleControlCenter(false));

    // Seismic island badge
    q('#btn-island-seismic')?.addEventListener('click', () => this.callbacks.onToggleSeismic());

    // Bento Tools filter input
    q<HTMLInputElement>('#input-filter-bento-tools')?.addEventListener('input', (e) => {
      const filter = (e.target as HTMLInputElement).value.toLowerCase();
      this.container.querySelectorAll<HTMLButtonElement>('.tool-bento-btn').forEach((btn) => {
        const title = (btn.getAttribute('title') || '').toLowerCase();
        const text = btn.textContent?.toLowerCase() || '';
        const match = title.includes(filter) || text.includes(filter);
        btn.classList.toggle('hidden', !match);
      });
    });

    // Wire all bento buttons to callbacks and auto-close bento
    const wire = (id: string, fn: () => void) => {
      q(`#${id}`)?.addEventListener('click', () => {
        fn();
        this.toggleControlCenter(false);
      });
    };

    wire('btn-open-cpr', () => this.callbacks.onToggleCPRCoach());
    wire('btn-open-triage', () => this.callbacks.onToggleTriage());
    wire('btn-open-tourniquet', () => this.callbacks.onToggleTourniquet());
    wire('btn-open-sar-beacon', () => this.callbacks.onToggleSARBeacon());
    wire('btn-open-acoustic-listener', () => this.callbacks.onToggleAcousticListener());
    wire('btn-open-whistle', () => this.callbacks.onToggleWhistle());
    wire('btn-open-night-watch', () => this.callbacks.onToggleNightWatch());
    wire('btn-open-battery-saver', () => this.callbacks.onToggleBatterySaver());

    wire('btn-open-tactical-compass', () => this.callbacks.onToggleTacticalCompass());
    wire('btn-open-flood-radar', () => this.callbacks.onToggleFloodRadar());
    wire('btn-open-air-quality', () => this.callbacks.onToggleAirQuality());
    wire('btn-open-tsunami', () => this.callbacks.onToggleTsunami());
    wire('btn-open-early-warning', () => this.callbacks.onToggleEarlyWarning());
    wire('btn-open-seismograph', () => this.callbacks.onToggleSeismograph());
    wire('btn-open-felt', () => this.callbacks.onToggleFelt());

    wire('btn-open-crisis', () => this.callbacks.onToggleCrisis());
    wire('btn-open-ptt-walkie', () => this.callbacks.onTogglePTTWalkie());
    wire('btn-open-sms', () => this.callbacks.onToggleSMS());
    wire('btn-open-emergency-radio', () => this.callbacks.onToggleRadio());
    wire('btn-open-camp-status', () => this.callbacks.onToggleCampStatus());
    wire('btn-open-field-aid', () => this.callbacks.onToggleFieldAid());
    wire('btn-open-qr-pack', () => this.callbacks.onToggleQRPack());

    wire('btn-open-damage-assessment', () => this.callbacks.onToggleDamageAssessment());
    wire('btn-open-cbrn', () => this.callbacks.onToggleCBRN());
    wire('btn-open-water-disinfection', () => this.callbacks.onToggleWaterDisinfection());
    wire('btn-open-civil-vault', () => this.callbacks.onToggleCivilVault());
    wire('btn-open-blood', () => this.callbacks.onToggleBlood());
    wire('btn-open-med-passport', () => this.callbacks.onToggleMedPassport());
    wire('btn-open-offline-map', () => this.callbacks.onToggleOfflineMapPack());
    wire('btn-toggle-bag', () => this.callbacks.onToggleBag());
    wire('btn-open-psych-firstaid', () => this.callbacks.onTogglePsychFirstAid());
    wire('btn-open-pet-safety', () => this.callbacks.onTogglePetSafety());
  }
}
