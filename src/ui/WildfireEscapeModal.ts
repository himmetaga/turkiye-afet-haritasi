import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import { wildfireEscapeService, FuelType, FUEL_PROFILES, WildfireAssessment } from '../services/wildfireEscapeService';

export class WildfireEscapeModal {
  private container: HTMLElement;
  private windBearing = 45; // Default Poyraz (KD)
  private windSpeedKmh = 35; // Default strong breeze
  private slopePct = 15; // Moderate slope
  private fuelType: FuelType = 'brush'; // Typical Aegean/Mediterranean maquis

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'wildfire-escape-modal';
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
    registerModalOpen('wildfire-escape-modal', () => this.hide());
  }

  public hide(): void {
    registerModalClose('wildfire-escape-modal');
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private render(): void {
    const assessment = wildfireEscapeService.evaluateWildfire(
      this.windBearing,
      this.windSpeedKmh,
      this.slopePct,
      this.fuelType
    );

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              ${Icons.wildfire('w-5 h-5')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-wide">Orman & Yangın Kaçış Koridoru</h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider" style="color: ${assessment.dangerColor}; background: ${assessment.dangerColor}20; border: 1px solid ${assessment.dangerColor}40;">
                  ${assessment.dangerLevel === 'EXTREME' ? 'AŞIRI YANGIN TEHLİKESİ' : assessment.dangerLevel === 'HIGH' ? 'YÜKSEK TEHLİKE' : 'GÜVENLİ KAÇIŞ'}
                </span>
              </div>
              <p class="text-xs text-gray-400">Rothermel yayılma modeli & 90° yan kanat (flank) kaçış vektörü</p>
            </div>
          </div>
          <button id="btn-close-wildfire" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          
          <!-- Tactical Compass & Escape Vectors Visualizer -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-black/40 rounded-2xl p-4 border border-white/5">
            
            <!-- SVG Compass Visualizer -->
            <div class="relative flex flex-col items-center justify-center">
              <div class="relative w-48 h-48 sm:w-52 sm:h-52">
                ${this.renderTacticalCompassSvg(assessment)}
              </div>
              <div class="mt-2 text-center">
                <span class="text-[11px] text-gray-400">Rüzgar: <strong class="text-sky-400">${this.windBearing}° (${wildfireEscapeService.bearingToText(this.windBearing)})</strong></span>
              </div>
            </div>

            <!-- Key Escape Headings -->
            <div class="space-y-3">
              <!-- Threat Direction (Red) -->
              <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
                <div class="text-rose-400 font-bold text-base mt-0.5">⛔</div>
                <div>
                  <div class="text-[11px] font-bold text-rose-400 uppercase tracking-wide">ASLA KAÇILMAYACAK YÖN (Ölüm Konisi)</div>
                  <div class="text-sm font-black text-rose-300">${wildfireEscapeService.bearingToText(assessment.threatDirectionDeg)} (${assessment.threatDirectionDeg}°)</div>
                  <div class="text-[10px] text-rose-200/80">Yangın rüzgarın önünde bu istikamete doğru hızla koşuyor.</div>
                </div>
              </div>

              <!-- Safe Escape Flank 1 (Green) -->
              <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <div class="text-emerald-400 font-bold text-base mt-0.5">🧭</div>
                <div>
                  <div class="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">GÜVENLİ SAĞ KANAT KAÇIŞI (+90°)</div>
                  <div class="text-sm font-black text-emerald-300">${wildfireEscapeService.bearingToText(assessment.rightFlankEscapeDeg)} (${assessment.rightFlankEscapeDeg}°)</div>
                  <div class="text-[10px] text-emerald-200/80">Rüzgar ve alev cephesine dik açıyla alevin yanından uzaklaşın.</div>
                </div>
              </div>

              <!-- Safe Escape Flank 2 (Green) -->
              <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <div class="text-emerald-400 font-bold text-base mt-0.5">🧭</div>
                <div>
                  <div class="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">GÜVENLİ SOL KANAT KAÇIŞI (-90°)</div>
                  <div class="text-sm font-black text-emerald-300">${wildfireEscapeService.bearingToText(assessment.leftFlankEscapeDeg)} (${assessment.leftFlankEscapeDeg}°)</div>
                  <div class="text-[10px] text-emerald-200/80">Sol kanada dik açıyla veya yanmış siyah kül hattına çıkın.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Calculated Metrics -->
          <div class="grid grid-cols-3 gap-2.5">
            <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div class="text-[10px] text-gray-400 font-medium">Yayılma Hızı (ROS)</div>
              <div class="text-base font-extrabold text-orange-400 mt-1">${assessment.rateOfSpreadMPerMin} <span class="text-[10px] font-normal text-gray-400">m/dk</span></div>
              <div class="text-[9px] text-gray-500 mt-0.5">Saatte ${assessment.rateOfSpreadKmH} km</div>
            </div>
            <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div class="text-[10px] text-gray-400 font-medium">Tahmini Alev Boyu</div>
              <div class="text-base font-extrabold text-amber-400 mt-1">${assessment.estimatedFlameLengthM} <span class="text-[10px] font-normal text-gray-400">metre</span></div>
              <div class="text-[9px] text-gray-500 mt-0.5">Yoğun radyant ısı</div>
            </div>
            <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div class="text-[10px] text-gray-400 font-medium">Güvenlik Açıklığı</div>
              <div class="text-base font-extrabold text-cyan-400 mt-1">${assessment.safetyZoneRadiusM} <span class="text-[10px] font-normal text-gray-400">metre</span></div>
              <div class="text-[9px] text-gray-500 mt-0.5">4x Alev Boyu Standardı</div>
            </div>
          </div>

          <!-- Interactive Sliders & Configuration -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span>🎛️</span> Çevre ve Meteoroloji Parametreleri
            </div>

            <!-- Wind Bearing Slider -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Rüzgarın Geldiği Yön (Estiği İstikamet)</span>
                <span class="font-bold text-sky-400">${this.windBearing}° (${wildfireEscapeService.bearingToText(this.windBearing)})</span>
              </div>
              <input id="input-wind-bearing" type="range" min="0" max="359" step="5" value="${this.windBearing}" class="w-full accent-sky-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
              <div class="flex justify-between text-[9px] text-gray-500 font-mono">
                <span>0° K</span>
                <span>45° KD</span>
                <span>90° D</span>
                <span>135° GD</span>
                <span>180° G</span>
                <span>225° GB</span>
                <span>270° B</span>
                <span>315° KB</span>
              </div>
            </div>

            <!-- Wind Speed & Slope -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-400">Rüzgar Hızı</span>
                  <span class="font-bold text-amber-400">${this.windSpeedKmh} km/saat</span>
                </div>
                <input id="input-wind-speed" type="range" min="5" max="80" step="5" value="${this.windSpeedKmh}" class="w-full accent-amber-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
                <div class="flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>Hafif (10)</span>
                  <span>Orta (30)</span>
                  <span>Şiddetli (60+)</span>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-400">Arazi Eğimi (Yamaç)</span>
                  <span class="font-bold text-rose-400">%${this.slopePct} Eğim</span>
                </div>
                <input id="input-slope" type="range" min="0" max="60" step="5" value="${this.slopePct}" class="w-full accent-rose-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
                <div class="flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>Düzlük (%0)</span>
                  <span>Tepe (%25)</span>
                  <span>Sarp (%50+)</span>
                </div>
              </div>
            </div>

            <!-- Fuel Type Buttons -->
            <div class="space-y-1.5">
              <span class="text-gray-400 block text-xs">Bitki Örtüsü / Yakıt Tipi</span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${(Object.keys(FUEL_PROFILES) as FuelType[]).map((f) => `
                  <button data-fuel="${f}" class="btn-fuel p-2 rounded-xl text-center border transition-all text-xs ${
                    this.fuelType === f
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold'
                      : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white'
                  }">
                    ${FUEL_PROFILES[f].name}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Tactical Rules & Burnover Protocols -->
          <div class="space-y-2.5">
            <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span>🛡️</span> Hayatta Kalma ve Burnover (Alev İçinde Kalma) Protokolü
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div class="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div class="font-bold text-sky-400 flex items-center gap-1.5">
                  <span>🚗</span> Araç İçinde Alev Ortasında Kaldıysanız
                </div>
                <ul class="text-[11px] text-gray-300 space-y-1 list-disc list-inside">
                  <li>Asla aracı terk edip alevlere karşı koşmayın (Radyant ısı dakikalar içinde ciğerleri yakar).</li>
                  <li>Camları ve hava menfezlerini kapatıp iç sirkülasyona alın.</li>
                  <li>Farları ve dörtlüleri yakın, tabana doğru eğilip battaniye/ceketle örtünün.</li>
                </ul>
              </div>

              <div class="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div class="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>🚶</span> Açık Arazide Yaya İken Sıkıştıysanız
                </div>
                <ul class="text-[11px] text-gray-300 space-y-1 list-disc list-inside">
                  <li>Yamaç yukarı değil, daima yan kanatlara doğru koşun (Yangın yukarı 3x hızlı tırmanır).</li>
                  <li>Kaçış yolu kapandıysa yanmış siyah araziye (Black zone) geçin (Yakıtı tükenmiş zemin en güvenlisidir).</li>
                  <li>Çukur veya kayalık arkasında yüzüstü yatıp ağzınızı ıslak bezle kapatın.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Action Button: Copy Tactical Evacuation Report -->
          <button id="btn-copy-wildfire-report" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            ${Icons.share('w-4 h-4')}
            Taktik Kaçış ve Rüzgar Bilgisini Kopyala / Paylaş
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Generates interactive SVG tactical compass for wildfire escape
   */
  private renderTacticalCompassSvg(a: WildfireAssessment): string {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const r = 78;

    // Convert angles to radian
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

    // Threat coordinates
    const threatRad = toRad(a.threatDirectionDeg);
    const tx = cx + Math.cos(threatRad) * (r - 10);
    const ty = cy + Math.sin(threatRad) * (r - 10);

    // Right Flank
    const rFlankRad = toRad(a.rightFlankEscapeDeg);
    const rx = cx + Math.cos(rFlankRad) * (r - 8);
    const ry = cy + Math.sin(rFlankRad) * (r - 8);

    // Left Flank
    const lFlankRad = toRad(a.leftFlankEscapeDeg);
    const lx = cx + Math.cos(lFlankRad) * (r - 8);
    const ly = cy + Math.sin(lFlankRad) * (r - 8);

    // Wind origin
    const windRad = toRad(a.windBearingDeg);
    const wx = cx + Math.cos(windRad) * (r + 14);
    const wy = cy + Math.sin(windRad) * (r + 14);

    return `
      <svg viewBox="0 0 ${size} ${size}" class="w-full h-full drop-shadow-md">
        <!-- Outer Compass Circle -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0A0F1D" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <circle cx="${cx}" cy="${cy}" r="${r - 20}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 3" />
        
        <!-- Cardinal Markers -->
        <text x="${cx}" y="${cy - r + 12}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">K</text>
        <text x="${cx + r - 12}" y="${cy + 3}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">D</text>
        <text x="${cx}" y="${cy + r - 6}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">G</text>
        <text x="${cx - r + 12}" y="${cy + 3}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">B</text>

        <!-- Threat / Flame Run Zone (Death Cone) -->
        <line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="${tx}" cy="${ty}" r="6" fill="#EF4444" />
        <text x="${tx}" y="${ty - 8}" fill="#F87171" font-size="8" font-weight="bold" text-anchor="middle">ALEV CEPHESİ</text>

        <!-- Right Escape Flank (Green) -->
        <line x1="${cx}" y1="${cy}" x2="${rx}" y2="${ry}" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 2" />
        <polygon points="${rx},${ry} ${rx - 4},${ry - 4} ${rx + 4},${ry - 4}" fill="#10B981" transform="rotate(${a.rightFlankEscapeDeg}, ${rx}, ${ry})" />
        <circle cx="${rx}" cy="${ry}" r="4" fill="#10B981" />

        <!-- Left Escape Flank (Green) -->
        <line x1="${cx}" y1="${cy}" x2="${lx}" y2="${ly}" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 2" />
        <polygon points="${lx},${ly} ${lx - 4},${ly - 4} ${lx + 4},${ly - 4}" fill="#10B981" transform="rotate(${a.leftFlankEscapeDeg}, ${lx}, ${ly})" />
        <circle cx="${lx}" cy="${ly}" r="4" fill="#10B981" />

        <!-- Wind Vector Indicator (Cyan Arrow blowing in) -->
        <line x1="${wx}" y1="${wy}" x2="${cx}" y2="${cy}" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
        <circle cx="${wx}" cy="${wy}" r="3" fill="#38BDF8" />
        <text x="${wx}" y="${wy - 4}" fill="#38BDF8" font-size="7.5" font-weight="bold" text-anchor="middle">Rüzgar (${a.windBearingDeg}°)</text>

        <!-- Center User Node -->
        <circle cx="${cx}" cy="${cy}" r="5" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2" />
      </svg>
    `;
  }

  private bindEvents(): void {
    const btnClose = this.container.querySelector('#btn-close-wildfire');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.hide());
    }

    const inputWindBearing = this.container.querySelector('#input-wind-bearing') as HTMLInputElement;
    if (inputWindBearing) {
      inputWindBearing.addEventListener('input', (e) => {
        this.windBearing = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const inputWindSpeed = this.container.querySelector('#input-wind-speed') as HTMLInputElement;
    if (inputWindSpeed) {
      inputWindSpeed.addEventListener('input', (e) => {
        this.windSpeedKmh = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const inputSlope = this.container.querySelector('#input-slope') as HTMLInputElement;
    if (inputSlope) {
      inputSlope.addEventListener('input', (e) => {
        this.slopePct = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const fuelButtons = this.container.querySelectorAll('.btn-fuel');
    fuelButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const fuel = btn.getAttribute('data-fuel') as FuelType;
        if (fuel) {
          this.fuelType = fuel;
          this.render();
        }
      });
    });

    const btnCopy = this.container.querySelector('#btn-copy-wildfire-report');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const a = wildfireEscapeService.evaluateWildfire(
          this.windBearing,
          this.windSpeedKmh,
          this.slopePct,
          this.fuelType
        );

        const text = `[ORMAN/ARAZİ YANGINI ACİL KAÇIŞ TALİMATI]\n` +
          `• Rüzgar Yönü: ${this.windBearing}° (${wildfireEscapeService.bearingToText(this.windBearing)}) - ${this.windSpeedKmh} km/saat\n` +
          `• Yangının Koştuğu Tehlike Yönü: ${a.threatDirectionDeg}° (${wildfireEscapeService.bearingToText(a.threatDirectionDeg)})\n` +
          `• GÜVENLİ SAĞ KAÇIŞ KANADI: ${a.rightFlankEscapeDeg}° (${wildfireEscapeService.bearingToText(a.rightFlankEscapeDeg)})\n` +
          `• GÜVENLİ SOL KAÇIŞ KANADI: ${a.leftFlankEscapeDeg}° (${wildfireEscapeService.bearingToText(a.leftFlankEscapeDeg)})\n` +
          `• Tahmini Yayılma: ${a.rateOfSpreadMPerMin} m/dk | Asgari Güvenli Açıklık: ${a.safetyZoneRadiusM} metre\n` +
          `⚠️ KURAL: Asla rüzgar altına ve yangının önündeki tepeye kaçmayın. Dik kanatlara veya yanmış siyah kül arazisine çıkın!\n` +
          `afet.live ile oluşturuldu.`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          btnCopy.innerHTML = `${Icons.checkCircle('w-4 h-4')} Kaçış Talimatı Panoya Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}
