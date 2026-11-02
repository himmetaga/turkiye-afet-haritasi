import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import {
  avalancheHypothermiaService,
  SnowPackType,
  SNOWPACK_PROFILES,
  HypothermiaAssessment,
  AvalancheAssessment
} from '../services/avalancheHypothermiaService';

export class AvalancheHypothermiaModal {
  private container: HTMLElement;
  private activeTab: 'hypothermia' | 'avalanche' | 'snow_cave' = 'hypothermia';

  // Hypothermia inputs
  private ambientTempC = -8;
  private windSpeedKmh = 40;

  // Avalanche inputs
  private slopeAngleDeg = 36; // Default to critical danger slope
  private snowType: SnowPackType = 'wind_slab';
  private isClinometerActive = false;
  private orientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'avalanche-hypothermia-modal';
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
    registerModalOpen('avalanche-hypothermia-modal', () => this.hide());
  }

  public hide(): void {
    this.stopClinometer();
    registerModalClose('avalanche-hypothermia-modal');
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private stopClinometer(): void {
    if (this.orientationHandler) {
      window.removeEventListener('deviceorientation', this.orientationHandler);
      this.orientationHandler = null;
    }
    this.isClinometerActive = false;
  }

  private toggleClinometer(): void {
    if (this.isClinometerActive) {
      this.stopClinometer();
      this.render();
      return;
    }

    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((state: string) => {
          if (state === 'granted') {
            this.startListeningOrientation();
          }
        })
        .catch(() => {});
    } else {
      this.startListeningOrientation();
    }
  }

  private startListeningOrientation(): void {
    this.isClinometerActive = true;
    this.orientationHandler = (e: DeviceOrientationEvent) => {
      // Beta: front-to-back tilt (-180 to 180)
      if (e.beta !== null) {
        const tilt = Math.abs(Math.round(e.beta));
        this.slopeAngleDeg = Math.min(65, Math.max(0, tilt));
        this.render();
      }
    };
    window.addEventListener('deviceorientation', this.orientationHandler);
    this.render();
  }

  private render(): void {
    const hypo = avalancheHypothermiaService.calculateWindChill(this.ambientTempC, this.windSpeedKmh);
    const aval = avalancheHypothermiaService.evaluateAvalanche(this.slopeAngleDeg, this.snowType);

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              ${Icons.waves('w-5 h-5')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-wide">Çığ & Kış Hipotermi Radarı</h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider" style="color: ${
                  this.activeTab === 'hypothermia' ? hypo.hypothermiaRiskColor : aval.avalancheRiskColor
                }; background: ${
                  this.activeTab === 'hypothermia' ? hypo.hypothermiaRiskColor + '20' : aval.avalancheRiskColor + '20'
                }; border: 1px solid ${
                  this.activeTab === 'hypothermia' ? hypo.hypothermiaRiskColor + '40' : aval.avalancheRiskColor + '40'
                };">
                  ${this.activeTab === 'hypothermia' ? hypo.hypothermiaRiskLevel.replace('_', ' ') : aval.avalancheRiskLevel.replace('_', ' ')}
                </span>
              </div>
              <p class="text-xs text-gray-400">NOAA Wind Chill & EAWS 30°-45° Kritik Çığ Tuzağı Analizi</p>
            </div>
          </div>
          <button id="btn-close-avalanche" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 px-5 pt-3 pb-1 border-b border-white/5 bg-black/20 text-xs font-semibold">
          <button data-tab="hypothermia" class="btn-tab px-3.5 py-1.5 rounded-xl transition-all ${
            this.activeTab === 'hypothermia'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-gray-400 hover:text-white'
          }">
            ❄️ Rüzgar Soğuğu (Hipotermi)
          </button>
          <button data-tab="avalanche" class="btn-tab px-3.5 py-1.5 rounded-xl transition-all ${
            this.activeTab === 'avalanche'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-gray-400 hover:text-white'
          }">
            🏔️ Çığ Eğimi & Klinometre
          </button>
          <button data-tab="snow_cave" class="btn-tab px-3.5 py-1.5 rounded-xl transition-all ${
            this.activeTab === 'snow_cave'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-gray-400 hover:text-white'
          }">
            ⛺ Kar Mağarası Sığınağı
          </button>
        </div>

        <!-- Body Content -->
        <div class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          
          ${this.activeTab === 'hypothermia' ? this.renderHypothermiaTab(hypo) : ''}
          ${this.activeTab === 'avalanche' ? this.renderAvalancheTab(aval) : ''}
          ${this.activeTab === 'snow_cave' ? this.renderSnowCaveTab() : ''}

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderHypothermiaTab(h: HypothermiaAssessment): string {
    return `
      <!-- Wind Chill Big Display Card -->
      <div class="p-4 rounded-2xl bg-black/40 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center">
        <div class="p-3 rounded-xl bg-white/[0.03]">
          <div class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Termometre Sıcaklığı</div>
          <div class="text-2xl font-black text-gray-200 mt-1">${h.ambientTempC}°C</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Durgun hava</div>
        </div>

        <div class="p-3 rounded-xl border" style="background: ${h.hypothermiaRiskColor}15; border-color: ${h.hypothermiaRiskColor}40;">
          <div class="text-[10px] uppercase tracking-wider font-bold" style="color: ${h.hypothermiaRiskColor}">Hissedilen Rüzgar Soğuğu</div>
          <div class="text-3xl font-black mt-1" style="color: ${h.hypothermiaRiskColor}">${h.windChillC}°C</div>
          <div class="text-[10px] font-medium mt-0.5" style="color: ${h.hypothermiaRiskColor}cc">
            ${h.frostbiteTimeMinutes ? `⚠️ ${h.frostbiteTimeMinutes} Dk İçinde Donma Riski!` : 'Donma süresi güvenli'}
          </div>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.03]">
          <div class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rüzgar Hızı</div>
          <div class="text-2xl font-black text-sky-400 mt-1">${h.windSpeedKmh} <span class="text-xs font-normal text-gray-400">km/s</span></div>
          <div class="text-[10px] text-gray-500 mt-0.5">${h.windSpeedKmh >= 50 ? 'Fırtına' : h.windSpeedKmh >= 25 ? 'Kuvvetli Rüzgar' : 'Esinti'}</div>
        </div>
      </div>

      <!-- Sliders for Temp & Wind -->
      <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <span>🎚️</span> Hava Koşullarını Ayarla
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">Dış Ortam Sıcaklığı (°C)</span>
            <span class="font-bold text-cyan-400">${this.ambientTempC}°C</span>
          </div>
          <input id="input-temp" type="range" min="-35" max="10" step="1" value="${this.ambientTempC}" class="w-full accent-cyan-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
          <div class="flex justify-between text-[9px] text-gray-500 font-mono">
            <span>-35°C (Kutup)</span>
            <span>-20°C (Doğu Kışı)</span>
            <span>-5°C (Don)</span>
            <span>+10°C (Serin)</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">Rüzgar Hızı (km/saat)</span>
            <span class="font-bold text-sky-400">${this.windSpeedKmh} km/saat</span>
          </div>
          <input id="input-wind" type="range" min="0" max="90" step="5" value="${this.windSpeedKmh}" class="w-full accent-sky-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
          <div class="flex justify-between text-[9px] text-gray-500 font-mono">
            <span>0 km/s (Durgun)</span>
            <span>30 km/s (Orta)</span>
            <span>60 km/s (Fırtına)</span>
            <span>90 km/s (Boran)</span>
          </div>
        </div>
      </div>

      <!-- Advice Cards -->
      <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
        <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span> Hipotermiden Korunma & İlk Yardım Direktifleri
        </div>
        <div class="space-y-2 text-[11px] text-gray-300">
          ${h.hypothermiaAdvice.map((a) => `
            <div class="flex items-start gap-2">
              <span class="text-cyan-400 mt-0.5">•</span>
              <span>${a}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <button id="btn-copy-hypo-report" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
        ${Icons.share('w-4 h-4')}
        Hipotermi Raporunu Kopyala / Paylaş
      </button>
    `;
  }

  private renderAvalancheTab(a: AvalancheAssessment): string {
    return `
      <!-- Avalanche Banner -->
      <div class="p-4 rounded-2xl border flex items-center justify-between gap-4" style="background: ${a.avalancheRiskColor}15; border-color: ${a.avalancheRiskColor}40;">
        <div class="space-y-1">
          <div class="text-[11px] font-bold uppercase tracking-wider" style="color: ${a.avalancheRiskColor}">
            ${a.isCriticalSlopeTrap ? '⚠️ KRİTİK ÇIĞ TUZAĞI (30° - 45° EĞİM)' : 'ÇIĞ RİSK SEVİYESİ'}
          </div>
          <div class="text-xl font-black text-white">
            ${a.slopeAngleDeg}° Eğim • ${a.snowProfile.name.split(' (')[0]}
          </div>
          <div class="text-[11px] text-gray-300">
            ${a.snowProfile.triggerEase}
          </div>
        </div>

        <button id="btn-toggle-clinometer" class="px-4 py-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
          this.isClinometerActive
            ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
            : 'bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-400/30'
        }">
          <span>📐</span>
          <span>${this.isClinometerActive ? 'Ölçümü Durdur' : 'Telefonla Eğim Ölç'}</span>
        </button>
      </div>

      <!-- Slope Angle Slider -->
      <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-400">Yamaç Eğim Açısı</span>
          <span class="font-extrabold text-base" style="color: ${a.avalancheRiskColor}">${this.slopeAngleDeg}°</span>
        </div>
        <input id="input-slope-angle" type="range" min="0" max="65" step="1" value="${this.slopeAngleDeg}" class="w-full accent-cyan-400 bg-white/10 rounded-lg h-2 cursor-pointer" />
        <div class="flex justify-between text-[9px] font-mono text-gray-500">
          <span>0° (Düz)</span>
          <span class="text-rose-400 font-bold">30° ÇIĞ BAŞLANGICI</span>
          <span class="text-rose-400 font-bold">45° ÇIĞ ZİRVESİ</span>
          <span>60° (Uçurum)</span>
        </div>
      </div>

      <!-- Snow Pack Selection -->
      <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
        <span class="text-gray-400 block text-xs font-semibold">Kar Tabakası Durumu</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${(Object.keys(SNOWPACK_PROFILES) as SnowPackType[]).map((sp) => `
            <button data-snow="${sp}" class="btn-snow p-3 rounded-xl text-left border transition-all text-xs ${
              this.snowType === sp
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white'
            }">
              <div class="font-bold">${SNOWPACK_PROFILES[sp].name}</div>
              <div class="text-[10px] text-gray-400 mt-0.5">${SNOWPACK_PROFILES[sp].description}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Tactical Rules -->
      <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
        <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <span>🏔️</span> Dağda Çığ Güvenlik Kuralları
        </div>
        <div class="space-y-2 text-[11px] text-gray-300">
          ${a.tacticalRules.map((r) => `
            <div class="flex items-start gap-2">
              <span class="text-rose-400 mt-0.5">•</span>
              <span>${r}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderSnowCaveTab(): string {
    return `
      <!-- Snow Cave Diagram & Guide -->
      <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-cyan-300">Acil Durum Kar Mağarası Kesiti</span>
          <span class="text-[11px] text-emerald-400 font-bold">Dışarı -25°C iken İçerisi 0°C</span>
        </div>

        <!-- SVG Snow Cave Diagram -->
        <div class="w-full h-44">
          <svg viewBox="0 0 500 160" class="w-full h-full drop-shadow">
            <!-- Mountain Snow Slope -->
            <path d="M 20 20 Q 150 25 250 80 T 480 150 L 480 160 L 20 160 Z" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5" />
            
            <!-- Cave Chamber (Sleeping Shelf) -->
            <path d="M 160 70 Q 220 50 270 70 L 270 95 L 200 95 L 200 125 L 140 125 L 140 90 Z" fill="#0A0F1D" stroke="#06B6D4" stroke-width="2" />
            
            <!-- Cold Well (Lower than shelf) -->
            <rect x="140" y="115" width="60" height="30" fill="#0284C7" opacity="0.3" rx="2" />
            <text x="170" y="132" fill="#38BDF8" font-size="7.5" font-weight="bold" text-anchor="middle">Soğuk Çukuru</text>

            <!-- Sleeping Platform (High ground) -->
            <rect x="200" y="90" width="70" height="8" fill="#10B981" rx="2" />
            <text x="235" y="85" fill="#34D399" font-size="8" font-weight="bold" text-anchor="middle">Uyku Sekisi (0°C)</text>

            <!-- Ventilation Hole -->
            <line x1="210" y1="58" x2="210" y2="28" stroke="#F59E0B" stroke-width="2" stroke-dasharray="3 2" />
            <text x="210" y="24" fill="#FBBF24" font-size="7.5" font-weight="bold" text-anchor="middle">Hava Bacası</text>

            <!-- Entrance Tunnel -->
            <path d="M 120 145 L 150 125" stroke="#38BDF8" stroke-width="2" />
            <text x="110" y="152" fill="#94A3B8" font-size="7.5" text-anchor="middle">Giriş (Alçak)</text>
          </svg>
        </div>
      </div>

      <!-- Construction Steps -->
      <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
        <div class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <span>🛠️</span> 4 Adımda Kar Mağarası İnşası (Hipotermi Barınağı)
        </div>

        <div class="space-y-2 text-[11px] text-gray-300">
          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong class="text-cyan-400">1. Yamaç Seçimi:</strong> En az 1.5 - 2 metre derinlikte rüzgar süprüntüsü kar birikintisi bulun (Çığ tehlikesi olan yamacın tabanında olmamasına dikkat edin).
          </div>
          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong class="text-cyan-400">2. Alçak Giriş Tüneli:</strong> Girişi tünel şeklinde açın. Giriş tavanı, içeride yatacağınız sekiden daha ALÇAKTA olmalıdır (Böylece ağır soğuk hava dışarı ve çukura akar, sıcak hava kubbede kalır).
          </div>
          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong class="text-cyan-400">3. Uyku Sekisi (Yüksek Platform):</strong> Kar mağarasının içinde zeminden 30-40 cm yüksekte düz bir kar sekisi kazın. Altınıza sırt çantası, folyo battaniye veya çam dalları sererek doğrudan karla teması kesin.
          </div>
          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <strong class="text-rose-400">4. Havalandırma Bacası (HAYATİ):</strong> Tavanın en yüksek noktasına kayak batonu veya sopayla bilek kalınlığında bir hava deliği açın! Tipi deliği kapatırsa karbonmonoksit boğulması riski doğar; bacayı sürekli açık tutun.
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const btnClose = this.container.querySelector('#btn-close-avalanche');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.hide());
    }

    const tabButtons = this.container.querySelectorAll('.btn-tab');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-tab') as any;
        if (t) {
          this.activeTab = t;
          this.render();
        }
      });
    });

    const inputTemp = this.container.querySelector('#input-temp') as HTMLInputElement;
    if (inputTemp) {
      inputTemp.addEventListener('input', (e) => {
        this.ambientTempC = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const inputWind = this.container.querySelector('#input-wind') as HTMLInputElement;
    if (inputWind) {
      inputWind.addEventListener('input', (e) => {
        this.windSpeedKmh = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const inputSlope = this.container.querySelector('#input-slope-angle') as HTMLInputElement;
    if (inputSlope) {
      inputSlope.addEventListener('input', (e) => {
        this.slopeAngleDeg = parseInt((e.target as HTMLInputElement).value, 10);
        this.render();
      });
    }

    const btnClinometer = this.container.querySelector('#btn-toggle-clinometer');
    if (btnClinometer) {
      btnClinometer.addEventListener('click', () => {
        this.toggleClinometer();
      });
    }

    const snowButtons = this.container.querySelectorAll('.btn-snow');
    snowButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sp = btn.getAttribute('data-snow') as SnowPackType;
        if (sp) {
          this.snowType = sp;
          this.render();
        }
      });
    });

    const btnCopyHypo = this.container.querySelector('#btn-copy-hypo-report');
    if (btnCopyHypo) {
      btnCopyHypo.addEventListener('click', () => {
        const h = avalancheHypothermiaService.calculateWindChill(this.ambientTempC, this.windSpeedKmh);
        const text = `[HİPOTERMİ & RÜZGAR SOĞUĞU SAHRA RAPORU]\n` +
          `• Sıcaklık: ${h.ambientTempC}°C | Rüzgar: ${h.windSpeedKmh} km/saat\n` +
          `• HİSSEDİLEN RÜZGAR SOĞUĞU: ${h.windChillC}°C\n` +
          `• Donma Riski (Frostbite): ${h.frostbiteTimeMinutes ? `${h.frostbiteTimeMinutes} dakika içinde açıkta kalan deri donar!` : 'Normal'}\n` +
          `• Tehlike Düzeyi: ${h.hypothermiaRiskLevel}\n` +
          `⚠️ TALİMAT: 3 katmanlı giyinin, ıslak giysileri değiştirin, rüzgar siperi oluşturun ve asla donmuş deriyi karla ovmayın.\n` +
          `afet.live ile oluşturuldu.`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          btnCopyHypo.innerHTML = `${Icons.checkCircle('w-4 h-4')} Hipotermi Raporu Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}

