import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import { collapseZoneService, StructuralType, STRUCTURE_PROFILES, CollapseAssessment } from '../services/collapseZoneService';

export class BuildingCollapseZoneModal {
  private container: HTMLElement;
  private floors = 7; // Typical Turkish apartment building
  private streetWidthM = 8.0; // Typical narrow Turkish side street
  private structuralType: StructuralType = 'concrete_frame';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'building-collapse-zone-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide()
    });

    this.render();
  }

  public show(): void {
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
    registerModalOpen('building-collapse-zone-modal', () => this.hide());
  }

  public hide(): void {
    registerModalClose('building-collapse-zone-modal');
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private render(): void {
    const assessment = collapseZoneService.evaluateCollapseZone(
      this.floors,
      this.streetWidthM,
      this.structuralType
    );

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              ${Icons.collapseZone('w-5 h-5')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-wide">Yıkılma & Moloz Güvenlik Çemberi</h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider" style="color: ${assessment.dangerColor}; background: ${assessment.dangerColor}20; border: 1px solid ${assessment.dangerColor}40;">
                  ${assessment.isStreetDeathTrap ? 'ÖLÜM KANYONU TEHLİKESİ' : 'GÜVENLİ MESAFE'}
                </span>
              </div>
              <p class="text-xs text-gray-400">USAR / FEMA 1.5 x H Kuralı & Sokak Genişliği Enkaz Analizi</p>
            </div>
          </div>
          <button id="btn-close-collapse" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          
          <!-- Cross-Section Visualizer Diagram -->
          <div class="bg-black/50 rounded-2xl p-4 border border-white/5 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-gray-300">Sokak & Bina Enkaz Kesiti (Debris Arc)</span>
              <span class="text-[11px] ${assessment.isStreetDeathTrap ? 'text-rose-400 font-bold' : 'text-emerald-400'}">
                ${assessment.isStreetDeathTrap ? '⚠️ Karşı Kaldırım Enkaz Altında Kalır!' : '✅ Karşı Taraf Güvenli Bölge'}
              </span>
            </div>
            
            <div class="w-full h-40 sm:h-44">
              ${this.renderCrossSectionSvg(assessment)}
            </div>
          </div>

          <!-- Calculated Metrics -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div class="text-[10px] text-gray-400 font-medium">Bina Yüksekliği (H)</div>
              <div class="text-base font-extrabold text-white mt-1">${assessment.buildingHeightM} <span class="text-[10px] font-normal text-gray-400">m</span></div>
              <div class="text-[9px] text-gray-500 mt-0.5">${assessment.floors} Kat x 3.0m</div>
            </div>

            <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
              <div class="text-[10px] text-rose-300 font-medium">1.5x Güvenli Standoff</div>
              <div class="text-base font-extrabold text-rose-400 mt-1">${assessment.safeStandoffRadiusM} <span class="text-[10px] font-normal text-gray-400">m</span></div>
              <div class="text-[9px] text-rose-300/70 mt-0.5">Asgari Güvenli Çap</div>
            </div>

            <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div class="text-[10px] text-amber-300 font-medium">2.0x Cam/Parapet</div>
              <div class="text-base font-extrabold text-amber-400 mt-1">${assessment.shrapnelRadiusM} <span class="text-[10px] font-normal text-gray-400">m</span></div>
              <div class="text-[9px] text-amber-300/70 mt-0.5">Ağır Şarapnel Bölgesi</div>
            </div>

            <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div class="text-[10px] text-gray-400 font-medium">Sokak Genişliği (W)</div>
              <div class="text-base font-extrabold text-sky-400 mt-1">${assessment.streetWidthM} <span class="text-[10px] font-normal text-gray-400">m</span></div>
              <div class="text-[9px] text-gray-500 mt-0.5">%${assessment.streetCoveragePct} Enkaz Kapsama</div>
            </div>
          </div>

          <!-- Configuration Inputs -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span>🏗️</span> Bina ve Sokak Ölçüleri
            </div>

            <!-- Floor Count Slider -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Hasarlı Binanın Kat Sayısı</span>
                <span class="font-bold text-rose-400">${this.floors} Kat (${(this.floors * 3.0).toFixed(1)} Metre)</span>
              </div>
              <input id="input-collapse-floors" type="range" min="1" max="25" step="1" value="${this.floors}" class="w-full accent-rose-500 bg-white/10 rounded-lg h-2 cursor-pointer" />
              <div class="flex justify-between text-[9px] text-gray-500 font-mono">
                <span>1 Kat (Müstakil)</span>
                <span>5 Kat (Standart)</span>
                <span>10 Kat</span>
                <span>25 Kat (Kule)</span>
              </div>
            </div>

            <!-- Street Width Slider -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Sokak / Cadde Genişliği</span>
                <span class="font-bold text-sky-400">${this.streetWidthM} Metre</span>
              </div>
              <input id="input-street-width" type="range" min="3" max="40" step="1" value="${this.streetWidthM}" class="w-full accent-sky-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
              <div class="flex justify-between text-[9px] text-gray-500 font-mono">
                <span>3m (Dar Ara Sokak)</span>
                <span>8m (Tipik Mahalle)</span>
                <span>20m (Geniş Cadde)</span>
                <span>40m (Bulvar)</span>
              </div>
            </div>

            <!-- Structural Type Buttons -->
            <div class="space-y-1.5">
              <span class="text-gray-400 block text-xs">Taşıyıcı Sistem Türü</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                ${(Object.keys(STRUCTURE_PROFILES) as StructuralType[]).map((st) => `
                  <button data-type="${st}" class="btn-structure p-2.5 rounded-xl text-left border transition-all text-xs ${
                    this.structuralType === st
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                      : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white'
                  }">
                    <div class="font-bold">${STRUCTURE_PROFILES[st].name.split(' (')[0]}</div>
                    <div class="text-[10px] text-gray-400 mt-0.5">${STRUCTURE_PROFILES[st].failureMode.split(' / ')[0]}</div>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- USAR Standoff Rules -->
          <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
            <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span>⚠️</span> Hayati Tahliye ve Artçı Şok Kuralları
            </div>
            <div class="space-y-2 text-[11px] text-gray-300">
              ${assessment.tacticalRules.map((rule) => `
                <div class="flex items-start gap-2">
                  <span class="text-amber-400 mt-0.5">•</span>
                  <span>${rule}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Button: Copy Collapse Zone Safety Report -->
          <button id="btn-copy-collapse-report" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            ${Icons.share('w-4 h-4')}
            Yıkılma Güvenlik Raporunu Kopyala / Ekiplere İlet
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Generates cross-section SVG diagram of damaged building and street canyon
   */
  private renderCrossSectionSvg(a: CollapseAssessment): string {
    const width = 600;
    const height = 160;
    const groundY = 135;

    // Scale factors
    const maxM = Math.max(a.safeStandoffRadiusM * 1.2, a.streetWidthM + 10, 40);
    const scaleX = (width - 160) / maxM;
    const scaleY = (groundY - 20) / Math.max(a.buildingHeightM, 15);

    const bX = 60;
    const bW = 50;
    const bH = a.buildingHeightM * scaleY;
    const bTop = groundY - bH;

    // Street opposite side
    const streetEndX = bX + bW + (a.streetWidthM * scaleX);

    // Standoff point
    const standoffX = bX + bW + (a.safeStandoffRadiusM * scaleX);

    // Debris Danger Arc
    const isDeathTrap = a.isStreetDeathTrap;

    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full drop-shadow-md">
        <!-- Ground Line -->
        <line x1="20" y1="${groundY}" x2="${width - 20}" y2="${groundY}" stroke="#4B5563" stroke-width="2" />
        <rect x="20" y="${groundY}" width="${width - 40}" height="20" fill="#111827" />

        <!-- Damaged Building (Left) -->
        <rect x="${bX}" y="${bTop}" width="${bW}" height="${bH}" fill="#7F1D1D" stroke="#EF4444" stroke-width="2" rx="2" />
        <!-- Window Grids -->
        <line x1="${bX + 15}" y1="${bTop + 8}" x2="${bX + 15}" y2="${groundY - 5}" stroke="#B91C1C" stroke-width="1.5" stroke-dasharray="4 6" />
        <line x1="${bX + 35}" y1="${bTop + 8}" x2="${bX + 35}" y2="${groundY - 5}" stroke="#B91C1C" stroke-width="1.5" stroke-dasharray="4 6" />
        <text x="${bX + bW / 2}" y="${bTop - 6}" fill="#F87171" font-size="9" font-weight="bold" text-anchor="middle">Hasarlı Yapı (${a.buildingHeightM}m)</text>

        <!-- Street Zone (Width W) -->
        <rect x="${bX + bW}" y="${groundY - 6}" width="${a.streetWidthM * scaleX}" height="6" fill="#374151" />
        <line x1="${bX + bW}" y1="${groundY + 12}" x2="${streetEndX}" y2="${groundY + 12}" stroke="#60A5FA" stroke-width="1.5" />
        <text x="${bX + bW + (a.streetWidthM * scaleX) / 2}" y="${groundY + 22}" fill="#60A5FA" font-size="8.5" font-weight="bold" text-anchor="middle">Sokak: ${a.streetWidthM}m</text>

        <!-- Debris Shadow Zone Arc (Red Fill) -->
        <path d="M ${bX + bW} ${groundY} Q ${bX + bW + (a.safeStandoffRadiusM * scaleX) / 2} ${groundY - bH * 0.4} ${standoffX} ${groundY} Z" 
              fill="${isDeathTrap ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)'}" 
              stroke="${isDeathTrap ? '#EF4444' : '#F59E0B'}" stroke-width="1.5" stroke-dasharray="4 3" />

        <!-- 1.5x Standoff Marker -->
        <line x1="${standoffX}" y1="${groundY - 40}" x2="${standoffX}" y2="${groundY}" stroke="#EF4444" stroke-width="2" stroke-linecap="round" />
        <circle cx="${standoffX}" cy="${groundY}" r="4" fill="#EF4444" />
        <text x="${standoffX}" y="${groundY - 45}" fill="#F87171" font-size="8" font-weight="bold" text-anchor="middle">1.5x Güvenli Sınır (${a.safeStandoffRadiusM}m)</text>

        <!-- Opposite Building / Wall -->
        <rect x="${streetEndX}" y="${groundY - 45}" width="30" height="45" fill="#1F2937" stroke="#4B5563" stroke-width="1.5" rx="1" />
        <text x="${streetEndX + 15}" y="${groundY - 50}" fill="#9CA3AF" font-size="7.5" text-anchor="middle">Karşı Yapı</text>

        <!-- Warning Label on Opposite Sidewalk if Trap -->
        ${isDeathTrap ? `
          <rect x="${streetEndX - 4}" y="${groundY - 25}" width="40" height="15" fill="#EF4444" rx="3" />
          <text x="${streetEndX + 16}" y="${groundY - 15}" fill="#FFFFFF" font-size="7" font-weight="black" text-anchor="middle">ÖLÜM TUZAĞI</text>
        ` : `
          <text x="${streetEndX + 16}" y="${groundY - 15}" fill="#10B981" font-size="7" font-weight="bold" text-anchor="middle">GÜVENLİ</text>
        `}
      </svg>
    `;
  }

  private bindEvents(): void {
    const btnClose = this.container.querySelector('#btn-close-collapse');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.hide());
    }

    const inputFloors = this.container.querySelector('#input-collapse-floors') as HTMLInputElement;
    if (inputFloors) {
      inputFloors.addEventListener('input', (e) => {
        this.floors = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const inputStreet = this.container.querySelector('#input-street-width') as HTMLInputElement;
    if (inputStreet) {
      inputStreet.addEventListener('input', (e) => {
        this.streetWidthM = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const structButtons = this.container.querySelectorAll('.btn-structure');
    structButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const st = btn.getAttribute('data-type') as StructuralType;
        if (st) {
          this.structuralType = st;
          this.render();
        }
      });
    });

    const btnCopy = this.container.querySelector('#btn-copy-collapse-report');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const a = collapseZoneService.evaluateCollapseZone(
          this.floors,
          this.streetWidthM,
          this.structuralType
        );

        const text = `[HASARLI BİNA YIKILMA GÜVENLİK ALANI RAPORU]\n` +
          `• Kat Sayısı: ${a.floors} Kat | Yükseklik (H): ${a.buildingHeightM} Metre\n` +
          `• Yapı Türü: ${a.structureProfile.name}\n` +
          `• 1.5x USAR ASGARİ GÜVENLİ MESAFE: ${a.safeStandoffRadiusM} Metre\n` +
          `• 2.0x Ağır Parapet / Cam Fırlama Menzili: ${a.shrapnelRadiusM} Metre\n` +
          `• Sokak Durumu: ${a.streetWidthM}m Sokak Genişliği -> ${a.isStreetDeathTrap ? 'ÖLÜM TUZAĞI (Sokağın tamamı ve karşı kaldırım enkaz altında kalır!)' : 'Açık alan yeterli'}\n` +
          `⚠️ TALİMAT: Binanın altından veya karşı kaldırımdan yürümeyiniz. Acilen sokağa dik ana caddelere veya açık parklara çıkınız!\n` +
          `afet.live ile oluşturuldu.`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          btnCopy.innerHTML = `${Icons.checkCircle('w-4 h-4')} Güvenlik Raporu Panoya Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}
