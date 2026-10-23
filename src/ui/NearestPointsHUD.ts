import { NearestResult, AssemblyPoint, EmergencyFacility } from '../types';
import { Icons } from './icons';
import { getBearingDirectionText } from '../utils/geoMath';
import { voiceGuide } from '../services/voiceGuideService';
import { isAfterClosingHours } from '../utils/pharmacySchedule';

export type HUDCategory = 'assembly' | 'hospitals' | 'pharmacies';

export interface NearestHUDData {
  assembly: NearestResult[];
  hospitals: NearestResult[];
  pharmacies: NearestResult[];
}

export class NearestPointsHUD {
  private container: HTMLElement;
  private onSelectPoint: (point: AssemblyPoint | EmergencyFacility) => void;
  private currentData: NearestHUDData = { assembly: [], hospitals: [], pharmacies: [] };
  private activeCategory: HUDCategory = 'assembly';
  private isCollapsed = false;
  private contextTitle = 'Konumunuza En Yakın Güvenlik & Sağlık Noktaları';

  constructor(parent: HTMLElement, onSelectPoint: (point: AssemblyPoint | EmergencyFacility) => void) {
    this.onSelectPoint = onSelectPoint;
    this.container = document.createElement('div');
    this.container.className =
      'absolute bottom-6 left-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-md pointer-events-auto transition-all';
    parent.appendChild(this.container);
  }

  public updateAll(data: NearestHUDData, title?: string): void {
    this.currentData = data;
    if (title) this.contextTitle = title;
    this.render();
  }

  public getActiveTopResult(): NearestResult | null {
    const list = this.currentData[this.activeCategory] || [];
    return list.length > 0 ? list[0] : null;
  }

  private render(): void {
    const list = this.currentData[this.activeCategory] || [];
    const isClosedHours = isAfterClosingHours();

    const categoryBadges: { key: HUDCategory; label: string; icon: string; count: number }[] = [
      { key: 'assembly', label: 'Toplanma', icon: '🛡️', count: this.currentData.assembly.length },
      { key: 'hospitals', label: 'Hastaneler', icon: '🏥', count: this.currentData.hospitals.length },
      { key: 'pharmacies', label: 'Eczaneler', icon: '💊', count: this.currentData.pharmacies.length }
    ];

    let categoryHeaderBanner = '';
    if (this.activeCategory === 'pharmacies') {
      if (isClosedHours) {
        categoryHeaderBanner = `
          <div class="mb-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-center justify-between">
            <span class="flex items-center gap-1.5 font-medium">
              <span class="animate-pulse">🌙</span>
              <span>19:00 sonrası: Yalnızca nöbetçi eczaneler listeleniyor</span>
            </span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">7/24 Açık</span>
          </div>
        `;
      } else {
        categoryHeaderBanner = `
          <div class="mb-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-between">
            <span class="flex items-center gap-1.5 font-medium">
              <span>💊</span>
              <span>Mesai saatleri: Gündüz ve nöbetçi eczaneler (Kapanış: 19:00)</span>
            </span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">Açık</span>
          </div>
        `;
      }
    } else if (this.activeCategory === 'hospitals') {
      categoryHeaderBanner = `
        <div class="mb-2 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-cyan-300 flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-medium">
            <span>🏥</span>
            <span>Sağlık Bakanlığı tescilli acil servis ve travma merkezleri</span>
          </span>
          <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">7/24 Açık</span>
        </div>
      `;
    } else if (this.activeCategory === 'assembly') {
      categoryHeaderBanner = `
        <div class="mb-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-medium">
            <span>🛡️</span>
            <span>Valilik & AFAD onaylı afet acil toplanma sahaları</span>
          </span>
          <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">Tescilli</span>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all">
        <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full ${
              this.activeCategory === 'assembly'
                ? 'bg-emerald-400'
                : this.activeCategory === 'hospitals'
                ? 'bg-cyan-400'
                : 'bg-amber-400'
            } animate-pulse flex-shrink-0"></span>
            <span class="text-xs font-bold tracking-wider text-white uppercase truncate">
              ${this.contextTitle}
            </span>
          </div>

          <div class="flex items-center gap-1 flex-shrink-0">
            <button id="btn-voice-guide" title="Sesli Pusula Rehberi" class="p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 px-2 transition-colors">
              <span>🔊</span>
              <span>Sesli Yön</span>
            </button>
            <button id="btn-collapse-nearest" class="p-1 text-gray-400 hover:text-white rounded-lg bg-white/5 text-[10px]">
              ${this.isCollapsed ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <!-- Kategori Sekmeleri -->
        <div class="flex items-center gap-1.5 mb-2.5">
          ${categoryBadges
            .map(
              (cat) => `
            <button
              data-cat="${cat.key}"
              class="cat-tab flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                this.activeCategory === cat.key
                  ? cat.key === 'assembly'
                    ? 'bg-emerald-500 text-obsidian-950 shadow-glow-emerald'
                    : cat.key === 'hospitals'
                    ? 'bg-cyan-500 text-obsidian-950 shadow-lg'
                    : 'bg-amber-500 text-obsidian-950 shadow-lg'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }"
            >
              <span>${cat.icon}</span>
              <span>${cat.label}</span>
              <span class="text-[10px] opacity-75 font-mono">(${cat.count})</span>
            </button>
          `
            )
            .join('')}
        </div>

        ${categoryHeaderBanner}

        <!-- En Yakın Noktalar Listesi -->
        <div id="nearest-items-list" class="flex flex-col gap-2 ${this.isCollapsed ? 'hidden' : ''}">
          ${
            list.length === 0
              ? `<div class="p-4 text-center text-xs text-gray-400 bg-white/5 rounded-xl">
                  Bu bölgede kayıtlı ${
                    this.activeCategory === 'assembly'
                      ? 'toplanma alanı'
                      : this.activeCategory === 'hospitals'
                      ? 'acil hastane'
                      : 'nöbetçi eczane'
                  } bulunamadı. Haritadan başka bir il/ilçe seçebilirsiniz.
                </div>`
              : list
                  .map((res, idx) => {
                    const p = res.point;
                    const dirText = getBearingDirectionText(res.bearingDegrees);
                    const distText =
                      res.distanceMeters > 1000
                        ? `${(res.distanceMeters / 1000).toFixed(1)} km`
                        : `${res.distanceMeters} m`;

                    const tagColor =
                      this.activeCategory === 'assembly'
                        ? 'text-emerald-400 bg-emerald-500/15'
                        : this.activeCategory === 'hospitals'
                        ? 'text-cyan-400 bg-cyan-500/15'
                        : 'text-amber-400 bg-amber-500/15';

                    const phone = (p as any).phone;
                    const address = (p as any).address;
                    const neighborhood = (p as any).neighborhood;

                    return `
                      <div
                        data-point-id="${p.id}"
                        class="point-item group p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] cursor-pointer transition-all border border-white/5"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                              <span class="text-[11px] font-bold font-mono ${tagColor.split(' ')[0]}">#${idx + 1}</span>
                              <h4 class="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                                ${p.name}
                              </h4>
                            </div>
                            <p class="text-[11px] text-gray-400 mt-0.5 truncate">
                              ${p.district}, ${p.city} ${
                                neighborhood ? `• ${neighborhood}` : (p as any).typeText ? `• ${(p as any).typeText}` : p.capacity ? `• Kapasite: ${p.capacity.toLocaleString()}` : ''
                              }
                            </p>
                            ${
                              address
                                ? `<p class="text-[10px] text-gray-400 mt-0.5 truncate font-mono">📍 ${address}</p>`
                                : ''
                            }
                          </div>

                          <!-- Pusula ve Mesafe Rozeti -->
                          <div class="text-right flex flex-col items-end flex-shrink-0">
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg ${tagColor} text-xs font-bold font-mono">
                              <span>${distText}</span>
                              <span class="inline-block transition-transform duration-300" style="transform: rotate(${res.bearingDegrees}deg);" title="${res.bearingDegrees}° ${dirText}">
                                ▲
                              </span>
                            </div>
                            <span class="text-[10px] text-gray-300 font-mono mt-0.5 font-medium">
                              ${dirText} • ~${res.walkingMinutes} dk
                            </span>
                          </div>
                        </div>

                        <div class="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/5 text-[10px] text-gray-400">
                          <div class="flex items-center gap-2">
                            ${
                              this.activeCategory === 'assembly'
                                ? `
                                  <span class="flex items-center gap-0.5 ${(p as any).hasWater ? 'text-cyan-400' : 'opacity-30'}">
                                    ${Icons.water('w-3 h-3')} Su
                                  </span>
                                  <span class="flex items-center gap-0.5 ${(p as any).hasElectricity ? 'text-amber-400' : 'opacity-30'}">
                                    ${Icons.bolt('w-3 h-3')} Elektrik
                                  </span>
                                  <span class="flex items-center gap-0.5 ${(p as any).hasTentArea ? 'text-emerald-400' : 'opacity-30'}">
                                    ${Icons.tent('w-3 h-3')} Çadır
                                  </span>
                                `
                                : this.activeCategory === 'pharmacies'
                                ? (p as any).isDuty
                                  ? '<span class="text-amber-400 font-bold">🌙 24 Saat Nöbetçi</span>'
                                  : '<span class="text-gray-400">💊 Gündüz (19:00 Kapanış)</span>'
                                : (p as any).hasTraumaCenter
                                ? '<span class="text-rose-400 font-semibold">🔴 Travma Merkezi</span>'
                                : (p as any).emergencyBeds
                                ? `<span class="text-cyan-400 font-mono">${(p as any).emergencyBeds} Acil Yatak</span>`
                                : '<span class="text-cyan-400 font-medium">⚡ 7/24 Acil Servis</span>'
                            }
                            ${
                              phone
                                ? `
                              <a
                                href="tel:${phone.replace(/[^0-9+]/g, '')}"
                                class="phone-link text-emerald-400 hover:underline flex items-center gap-1 font-mono ml-1 font-medium"
                                title="Telefonla Ara"
                              >
                                <span>📞</span>
                                <span>${phone}</span>
                              </a>
                            `
                                : ''
                            }
                          </div>

                          <span class="text-[10px] text-emerald-400 group-hover:underline font-mono">
                            Haritada Rota Çiz →
                          </span>
                        </div>
                      </div>
                    `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;

    // Tab click listeners
    const tabs = this.container.querySelectorAll('.cat-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-cat') as HUDCategory;
        if (cat) {
          this.activeCategory = cat;
          this.render();
        }
      });
    });

    // Item click listeners
    const items = this.container.querySelectorAll('.point-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-point-id');
        const found = list.find((r) => r.point.id === id);
        if (found) {
          this.onSelectPoint(found.point as any);
        }
      });
    });

    const phoneLinks = this.container.querySelectorAll('.phone-link');
    phoneLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // Collapse toggle
    const collapseBtn = this.container.querySelector('#btn-collapse-nearest');
    collapseBtn?.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      const listEl = this.container.querySelector('#nearest-items-list');
      if (listEl) {
        listEl.classList.toggle('hidden', this.isCollapsed);
      }
      if (collapseBtn) collapseBtn.textContent = this.isCollapsed ? '▲' : '▼';
    });

    // Voice guide
    const voiceBtn = this.container.querySelector('#btn-voice-guide');
    voiceBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const top = this.getActiveTopResult();
      if (top) {
        const dir = getBearingDirectionText(top.bearingDegrees);
        voiceGuide.requestWakeLock();
        const catText =
          this.activeCategory === 'assembly'
            ? 'toplanma alanı'
            : this.activeCategory === 'hospitals'
            ? 'acil hastane'
            : 'nöbetçi eczane';
        voiceGuide.speak(
          `En yakın ${catText}: ${top.point.name}. Mesafe: ${top.distanceMeters} metre. Pusula yönü: ${dir}, ${top.bearingDegrees} derece. Tahmini yürüyüş süresi: ${top.walkingMinutes} dakika.`
        );
      }
    });
  }

  public hide(): void {
    this.container.innerHTML = '';
  }
}
