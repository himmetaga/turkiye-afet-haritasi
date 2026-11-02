/**
 * AfetBilgiCatalogModal.ts
 * =============================================================================
 * AfetBilgi & Açık Yazılım Ağı Doğrulanmış Barınma, Aşevi ve İaşe Kataloğu
 * Açık Kaynak:
 * - https://github.com/alpaylan/afetbilgi.com
 * - https://github.com/acikyazilimagi/afet-org
 * =============================================================================
 * Afet sonrasında depremzedelerin hayati ihtiyaç noktalarını (Aşevleri,
 * Kızılay çadırları, bebek maması/bezi çadırları, sahra tuvaletleri,
 * giysi/battaniye dağıtım üsleri) %100 çevrimdışı listeleyen ve haritaya bağlayan arayüz.
 */

import { Icons } from './icons';
import {
  afetBilgiService,
  AfetBilgiCategory,
  AfetBilgiPoint,
  EmergencyHotline
} from '../services/afetBilgiService';
import { registerModalOpen, registerModalClose, setupModalMobileDismiss } from '../utils/mobileModalHelper';

const CATEGORY_TABS: { id: AfetBilgiCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Tümü', icon: '🌐' },
  { id: 'soup_kitchen', label: 'Aşevleri & Yemek', icon: '🍲' },
  { id: 'shelter', label: 'Çadırkent & Barınma', icon: '⛺' },
  { id: 'baby_care', label: 'Bebek & Anne', icon: '👶' },
  { id: 'clothing', label: 'Giysi & Isınma', icon: '🧣' },
  { id: 'hygiene', label: 'Sahra WC & Hijyen', icon: '🚻' },
  { id: 'psychosocial', label: 'Psikososyal', icon: '🧠' },
  { id: 'veterinary', label: 'Sahra Hayvan', icon: '🐾' }
];

export class AfetBilgiCatalogModal {
  private container: HTMLElement;
  private currentCategory: AfetBilgiCategory = 'all';
  private selectedProvince = '';
  private searchQuery = '';
  private userCoords: [number, number] = [29.03367, 40.98527];
  private onNavigateToPoint?: (coords: [number, number], title: string) => void;

  constructor(parent: HTMLElement, onNavigateToPoint?: (coords: [number, number], title: string) => void) {
    this.onNavigateToPoint = onNavigateToPoint;

    this.container = document.createElement('div');
    this.container.id = 'afetbilgi-catalog-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide(),
      closeBtnSelector: '#btn-close-afetbilgi'
    });
  }

  public show(coords?: [number, number]): void {
    if (coords) {
      this.userCoords = coords;
    }
    this.container.classList.remove('hidden');
    registerModalOpen('afetbilgi-catalog-modal', () => this.hide());
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    registerModalClose('afetbilgi-catalog-modal');
  }

  private render(): void {
    const points = afetBilgiService.getVerifiedPoints(
      this.currentCategory,
      this.selectedProvince,
      this.searchQuery,
      this.userCoords
    );

    const provinces = afetBilgiService.getProvinceList();
    const hotlines = afetBilgiService.getEmergencyHotlines();

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              ${Icons.soupKitchen('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">AfetBilgi Sahra Kataloğu</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Doğrulanmış Kaynak
                </span>
              </div>
              <p class="text-[11px] text-white/60">Aşevi, Çadırkent, Bebek Maması, Sahra WC & İhtiyaç Masası</p>
            </div>
          </div>
          <button id="btn-close-afetbilgi" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Filter Controls -->
        <div class="p-3 border-b border-white/10 bg-white/[0.02] space-y-2.5 shrink-0">
          <!-- Search & Province Select -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="absolute left-3 top-2.5 text-white/40 pointer-events-none">
                ${Icons.search('w-4 h-4')}
              </span>
              <input
                id="afetbilgi-search-input"
                type="text"
                placeholder="Aşevi, çadır, bebek bezi, sıcak yemek ara..."
                value="${this.searchQuery}"
                class="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
              />
            </div>
            <select
              id="afetbilgi-prov-select"
              class="px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
            >
              <option value="">Tüm İller</option>
              ${provinces
                .map(
                  (prov) => `
                <option value="${prov}" ${this.selectedProvince === prov ? 'selected' : ''}>${prov}</option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Category Badges / Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            ${CATEGORY_TABS.map(
              (tab) => `
              <button
                data-category="${tab.id}"
                class="tab-cat-btn whitespace-nowrap px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-[11px] ${
                  this.currentCategory === tab.id
                    ? 'bg-amber-500 text-obsidian-950 font-black shadow-md'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }"
              >
                <span>${tab.icon}</span>
                <span>${tab.label}</span>
              </button>
            `
            ).join('')}
          </div>
        </div>

        <!-- Hotlines Banner (Scrollable horizontal chips) -->
        <div class="px-3 py-2 bg-black/30 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
          <span class="text-white/40 font-bold uppercase tracking-wider text-[9px] shrink-0">Hızlı Hatlar:</span>
          ${hotlines
            .map(
              (h) => `
            <a
              href="tel:${h.number.replace(/\s+/g, '')}"
              class="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-mono font-bold flex items-center gap-1 transition-all"
              title="${h.name} - ${h.purpose}"
            >
              <span>📞</span>
              <span>${h.name.split(' ')[0]}</span>
              <span class="text-white/80">${h.number}</span>
            </a>
          `
            )
            .join('')}
        </div>

        <!-- Point List Body -->
        <div class="p-3 sm:p-4 overflow-y-auto space-y-3">
          ${
            points.length === 0
              ? `
            <div class="p-8 text-center text-white/50 space-y-2">
              <span class="text-3xl">🔍</span>
              <p class="font-bold text-sm text-white">Aranan kriterlere uygun sahra noktası bulunamadı.</p>
              <p class="text-xs">Filtreyi temizleyerek veya il seçimini değiştirerek tekrar deneyebilirsiniz.</p>
            </div>
          `
              : points
                  .map(
                    (p) => `
            <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      ${p.categoryLabel}
                    </span>
                    <span class="text-[10.5px] font-bold text-white/80">
                      ${p.province} / ${p.district}
                    </span>
                    ${
                      p.distanceMeters !== undefined
                        ? `
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        📍 ${(p.distanceMeters / 1000).toFixed(1)} km
                      </span>
                    `
                        : ''
                    }
                  </div>
                  <h3 class="text-sm font-black text-white mt-1">${p.name}</h3>
                  <p class="text-[11px] text-white/60 leading-snug">${p.address}</p>
                </div>

                <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-bold ${
                  p.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }">
                  ${p.status === 'active' ? '● Aktif' : 'Kısıtlı'}
                </span>
              </div>

              <!-- Services Chips -->
              <div class="flex flex-wrap gap-1">
                ${p.services
                  .map(
                    (s) => `
                  <span class="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80">
                    ✓ ${s}
                  </span>
                `
                  )
                  .join('')}
              </div>

              <!-- Meta & Actions -->
              <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 flex-wrap gap-2">
                <div class="flex items-center gap-3">
                  <span>🏢 ${p.operatingOrg}</span>
                  <span>⏰ ${p.hours}</span>
                </div>

                <div class="flex items-center gap-1.5">
                  ${
                    p.contactPhone
                      ? `
                    <a
                      href="tel:${p.contactPhone.replace(/\s+/g, '')}"
                      class="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 transition-all"
                    >
                      📞 Ara (${p.contactPhone})
                    </a>
                  `
                      : ''
                  }
                  <button
                    data-nav-coords="${p.coordinates[0]},${p.coordinates[1]}"
                    data-point-name="${p.name}"
                    class="btn-point-nav px-3 py-1 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/40 text-amber-200 font-bold flex items-center gap-1.5 transition-all"
                  >
                    📍 Haritada Göster
                  </button>
                </div>
              </div>
            </div>
          `
                  )
                  .join('')
          }
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span>%100 Çevrimdışı Kütüphane</span>
          <span>Açık Yazılım Ağı & afetbilgi.com Açık Verisi</span>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Search input
    const searchInput = this.container.querySelector<HTMLInputElement>('#afetbilgi-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
      const inputAgain = this.container.querySelector<HTMLInputElement>('#afetbilgi-search-input');
      if (inputAgain) {
        inputAgain.focus();
        inputAgain.setSelectionRange(inputAgain.value.length, inputAgain.value.length);
      }
    });

    // Province select
    const provSelect = this.container.querySelector<HTMLSelectElement>('#afetbilgi-prov-select');
    provSelect?.addEventListener('change', (e) => {
      this.selectedProvince = (e.target as HTMLSelectElement).value;
      this.render();
    });

    // Category buttons
    this.container.querySelectorAll<HTMLButtonElement>('.tab-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentCategory = (btn.dataset.category as AfetBilgiCategory) || 'all';
        this.render();
      });
    });

    // Navigate to point buttons
    this.container.querySelectorAll<HTMLButtonElement>('.btn-point-nav').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rawCoords = btn.dataset.navCoords;
        const name = btn.dataset.pointName || 'Sahra Noktası';
        if (rawCoords && this.onNavigateToPoint) {
          const [lng, lat] = rawCoords.split(',').map(Number);
          this.onNavigateToPoint([lng, lat], name);
          this.hide();
        }
      });
    });
  }
}

