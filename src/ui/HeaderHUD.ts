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
  icon: (c?: string) => string;
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
      { id: 'btn-open-cpr', label: 'CPR Koçu', title: 'Kalp Masajı Metronomu (AHA 110 BPM)', rgb: '244, 63, 94', icon: Icons.heartPulse },
      { id: 'btn-open-triage', label: 'Triyaj', title: 'Sahra Triyaj Asistanı (START Protokolü)', rgb: '236, 72, 153', icon: Icons.stethoscope },
      { id: 'btn-open-tourniquet', label: 'Turnike', title: 'Turnike Zamanlayıcısı (120 Dk Güvenlik)', rgb: '239, 68, 68', icon: Icons.timer },
      { id: 'btn-open-sar-beacon', label: 'SAR Flaşör', title: 'Optik Flaşör & Ekran Mors S.O.S', rgb: '239, 68, 68', icon: Icons.flashlight },
      { id: 'btn-open-acoustic-listener', label: 'Enkaz Sensörü', title: 'Akustik Enkaz Dinleme ve S.O.S Tetikleyici', rgb: '168, 85, 247', icon: Icons.mic },
      { id: 'btn-open-whistle', label: 'SAR Düdüğü', title: '3000 Hz Kurtarma Düdüğü (Web Audio)', rgb: '245, 158, 11', icon: Icons.whistle },
      { id: 'btn-open-night-watch', label: 'Gece Nöbeti', title: 'Sismograf Başucu Nöbeti & WakeLock', rgb: '129, 140, 248', icon: Icons.moon },
      { id: 'btn-open-battery-saver', label: 'Pil Tasarrufu', title: 'Ultra Pil Tasarrufu (72 Saat OLED Modu)', rgb: '16, 185, 129', icon: Icons.battery }
    ]
  },
  {
    id: 'radars',
    title: 'Taktik Navigasyon & Radarlar',
    badge: 'Canlı Sensörler',
    accentClass: 'text-sky-400',
    tools: [
      { id: 'btn-open-tactical-compass', label: 'Taktik Pusula', title: 'Manyetometre Kerteriz Pusulası & HUD', rgb: '16, 185, 129', icon: Icons.compass },
      { id: 'btn-open-flood-radar', label: 'Sel Radarı', title: 'Sel ve Kentsel Su Baskını Radarı (GloFAS)', rgb: '14, 165, 233', icon: Icons.cloudRain },
      { id: 'btn-open-air-quality', label: 'Hava & Duman', title: 'Hava Kalitesi ve Yangın Dumanı Radarı', rgb: '245, 158, 11', icon: Icons.wind },
      { id: 'btn-open-tsunami', label: 'Tsunami', title: 'Tsunami ve Kıyı Tahliye Radarı', rgb: '59, 130, 246', icon: Icons.waves },
      { id: 'btn-open-early-warning', label: 'Erken Uyarı', title: 'Sismik P/S Dalgası Yayılım Simülasyonu', rgb: '251, 113, 133', icon: Icons.siren },
      { id: 'btn-open-seismograph', label: 'Sismograf', title: 'Canlı İvmeölçer Sismografı (100 Hz)', rgb: '52, 211, 153', icon: Icons.activity },
      { id: 'btn-open-felt', label: 'Hissettim', title: 'Depremi Hissettim Mercalli Bildirimi', rgb: '249, 115, 22', icon: Icons.seismic }
    ]
  },
  {
    id: 'comms',
    title: 'İnternetsiz İletişim & Lojistik',
    badge: 'Şebekesiz P2P',
    accentClass: 'text-cyan-400',
    tools: [
      { id: 'btn-open-crisis', label: 'BitChat', title: 'BitChat Şebekesiz P2P ve Nostr Kriz Ağı', rgb: '34, 211, 238', icon: Icons.messages },
      { id: 'btn-open-ptt-walkie', label: 'Telsiz PTT', title: 'İnternetsiz Bas-Konuş Telsiz', rgb: '16, 185, 129', icon: Icons.radio },
      { id: 'btn-open-sms', label: 'Acil SMS', title: 'GPS Konumlu Acil Durum SMS ve Hatlar', rgb: '245, 158, 11', icon: Icons.phone },
      { id: 'btn-open-emergency-radio', label: 'Afet Telsizi', title: 'TRAC & PMR 446 Acil Frekans Rehberi', rgb: '234, 179, 8', icon: Icons.radio },
      { id: 'btn-open-camp-status', label: 'Sahra Durumu', title: 'Toplanma Alanı Su, WC ve Çadır Doluluk Karnesi', rgb: '245, 158, 11', icon: Icons.tent },
      { id: 'btn-open-field-aid', label: 'Sahra İhtiyaç', title: 'Çadırkent Malzeme ve Yardım Masası (P2P)', rgb: '245, 158, 11', icon: Icons.truck },
      { id: 'btn-open-qr-pack', label: 'QR Durum', title: 'İnternetsiz Cihazlar Arası Güvendeyim QR Paketi', rgb: '45, 212, 191', icon: Icons.qrCode }
    ]
  },
  {
    id: 'civil_defense',
    title: 'Sivil Savunma & Dayanıklılık',
    badge: 'Koruma & Hukuk',
    accentClass: 'text-emerald-400',
    tools: [
      { id: 'btn-open-damage-assessment', label: 'Bina Hasarı', title: 'Bina Hasar Tespit ve Kanıt Tutanağı', rgb: '251, 191, 36', icon: Icons.building },
      { id: 'btn-open-cbrn', label: 'KBRN & Nükleer', title: 'KBRN, Radyasyon ve Sığınak Güvenliği', rgb: '234, 179, 8', icon: Icons.radiation },
      { id: 'btn-open-water-disinfection', label: 'Su Arıtma', title: 'Sahra Su Arıtma ve Klorlama Dozajlayıcısı', rgb: '14, 165, 233', icon: Icons.droplet },
      { id: 'btn-open-civil-vault', label: 'Evrak Kasası', title: 'Mülkiyet Kasası ve P2P Takas Defteri', rgb: '99, 102, 241', icon: Icons.fileText },
      { id: 'btn-open-blood', label: 'Kan Bağışı', title: 'Kan Merkezleri ve Donör Eşleşme Ağı', rgb: '239, 68, 68', icon: Icons.health },
      { id: 'btn-open-med-passport', label: 'İlaç Kartı', title: 'Afet İlaç Pasaportu ve Eşdeğer Rehberi', rgb: '16, 185, 129', icon: Icons.pill },
      { id: 'btn-open-offline-map', label: 'Harita İndir', title: 'Çevrimdışı Vektör Harita Paketi', rgb: '6, 182, 212', icon: Icons.download },
      { id: 'btn-toggle-bag', label: 'Afet Kiti', title: 'Afet Çantası Malzeme Kontrol Listesi', rgb: '167, 139, 250', icon: Icons.backpack },
      { id: 'btn-open-psych-firstaid', label: 'Kutu Nefesi', title: 'Psikolojik İlk Yardım ve Kutu Nefesi', rgb: '59, 130, 246', icon: Icons.brain },
      { id: 'btn-open-pet-safety', label: 'Pati Güvenlik', title: 'Evcil Hayvan Afet Güvenliği ve Tahliye', rgb: '251, 146, 60', icon: Icons.paw }
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
      badge.textContent = 'Son Depremler';
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
        <div id="ios27-dynamic-island" class="ios27-capsule px-3 py-1.5 flex items-center gap-2.5 text-xs text-white shadow-2xl ios27-spring">
          <!-- Logo (Verilen orijinal vektör logo, yanıp sönen nokta kaldırıldı) -->
          <a href="/" class="flex items-center gap-1 shrink-0 active:scale-95 transition-transform" title="afet.live">
            <img src="/logo-horizontal.svg" alt="afet.live" class="h-5 sm:h-5.5 w-auto select-none pointer-events-none" />
          </a>

          <!-- Divider -->
          <span class="h-3.5 w-px bg-white/20"></span>

          <!-- Spotlight Search Trigger -->
          <button id="btn-trigger-spotlight" type="button" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-[10.5px] font-semibold transition-all cursor-pointer">
            ${Icons.search('w-3.5 h-3.5')}
            <span class="hidden sm:inline">Ara</span>
            <kbd class="hidden sm:inline text-[9px] px-1 rounded bg-black/40 text-gray-400 font-mono">⌘K</kbd>
          </button>

          <!-- Divider -->
          <span class="h-3.5 w-px bg-white/20"></span>

          <!-- Son Depremler Trigger (60 deprem -> Son Depremler) -->
          <button id="btn-island-seismic" type="button" class="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-white text-[10.5px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5">
            ${Icons.seismic('w-3.5 h-3.5 text-rose-400')}
            <span id="island-seismic-badge">Son Depremler</span>
          </button>
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
            <button id="btn-close-spotlight" class="absolute right-2.5 text-gray-400 hover:text-white cursor-pointer">
              ${Icons.close('w-4 h-4')}
            </button>
          </div>
          <div id="spotlight-results-list" class="max-h-64 overflow-y-auto space-y-1 pr-1"></div>
        </div>
      </div>

      <!-- =========================================================
           2. BOTTOM CENTER: iOS 27 FLOATING SPATIAL GLASS DOCK
           ========================================================= -->
      <div class="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none w-[94vw] sm:w-[460px] max-w-[480px]">
        <div id="ios27-dock" class="ios27-bar w-full p-1 sm:p-1.5 flex items-center justify-between gap-1 sm:gap-1.5 text-white shadow-2xl">
          <!-- Left Wing 1: Locate Me / Map -->
          <button id="btn-dock-locate" type="button" class="w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] flex items-center justify-center rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 text-gray-200 hover:text-white transition-all cursor-pointer border border-white/5 shrink-0" title="Konumuma Odaklan">
            ${Icons.crosshair('w-4.5 h-4.5 sm:w-5 sm:h-5')}
          </button>

          <!-- Left Wing 2: Hissettim Butonu -->
          <button id="btn-dock-felt" type="button" class="flex-1 min-w-0 h-[38px] sm:h-[42px] flex items-center justify-center gap-1.5 rounded-[18px] bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 hover:text-white font-bold text-xs tracking-wide shadow-md border border-amber-500/30 transition-all cursor-pointer" title="Depremi Hissettim Bildirimi">
            ${Icons.activity('w-4 h-4 text-amber-400')}
            <span class="text-[11px] sm:text-xs truncate">Hissettim</span>
          </button>

          <!-- DEAD CENTER HERO: Big SOS Trigger -->
          <button id="btn-dock-sos" type="button" class="px-4 sm:px-5 h-[38px] sm:h-[42px] flex items-center justify-center gap-1.5 rounded-[18px] bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-rose-600/40 active:scale-95 transition-all border border-rose-400/40 cursor-pointer shrink-0">
            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>S.O.S</span>
          </button>

          <!-- Right Wing 1: BitChat Messenger Pill (Matches Hissettim Pill symmetrically) -->
          <button id="btn-dock-bitchat" type="button" class="flex-1 min-w-0 h-[38px] sm:h-[42px] flex items-center justify-center gap-1.5 rounded-[18px] bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-cyan-300 hover:text-white font-bold text-xs tracking-wide shadow-md border border-cyan-500/30 transition-all cursor-pointer" title="BitChat Kriz Odası">
            ${Icons.messages('w-4 h-4 text-cyan-400')}
            <span class="text-[11px] sm:text-xs truncate">BitChat</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          </button>

          <!-- Right Wing 2: Control Center Menu Square (Matches Locate Square symmetrically) -->
          <button id="btn-dock-menu" type="button" class="w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] flex items-center justify-center rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 text-gray-200 hover:text-white transition-all cursor-pointer border border-white/5 shrink-0" title="Afet Kontrol Merkezi">
            ${Icons.grid('w-4.5 h-4.5 sm:w-5 sm:h-5 text-cyan-400')}
          </button>
        </div>
      </div>

      <!-- =========================================================
           3. FULL BENTO CONTROL CENTER SHEET (MINIMALIST DRAWER)
           ========================================================= -->
      <div
        id="ios27-bento-sheet"
        class="fixed bottom-[64px] sm:bottom-[78px] left-1/2 -translate-x-1/2 w-[94vw] sm:w-[460px] max-w-[480px] max-h-[80vh] ios27-bar p-4 sm:p-5 shadow-2xl z-50 flex flex-col gap-3.5 transition-all duration-300 translate-y-full opacity-0 pointer-events-none"
      >
        <!-- Sheet Header -->
        <div class="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400">
              ${Icons.grid('w-4 h-4')}
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-black text-white tracking-tight">Afet Kontrol Merkezi</h3>
              <p class="text-[10.5px] text-gray-400">Tüm sivil savunma, radar ve hayatta kalma araçları</p>
            </div>
          </div>
          <button id="btn-close-bento" class="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white cursor-pointer">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Quick Filter Input -->
        <div class="relative shrink-0">
          <span class="absolute left-3 top-2.5 text-gray-400">${Icons.search('w-3.5 h-3.5')}</span>
          <input
            id="input-filter-bento-tools"
            type="text"
            placeholder="Araçlarda ara (CPR, turnike, pusula, sel, KBRN)..."
            class="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 text-xs outline-none focus:border-cyan-400"
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
                    class="tool-bento-btn p-2.5 rounded-2xl ios27-glass-card flex flex-col items-center text-center gap-1.5 transition-all ios27-tap-bounce group cursor-pointer"
                  >
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform text-white">
                      ${t.icon('w-4 h-4')}
                    </div>
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
    q('#btn-dock-felt')?.addEventListener('click', () => this.callbacks.onToggleFelt());
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
