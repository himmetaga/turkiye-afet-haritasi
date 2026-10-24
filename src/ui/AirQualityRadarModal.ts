import { Icons } from './icons';
import { airQualityService, AirQualityData } from '../services/airQualityService';

export class AirQualityRadarModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private currentCity = 'İstanbul';
  private data: AirQualityData | null = null;
  private isLoading = false;

  constructor(parent: HTMLElement, userCoords: [number, number]) {
    this.userCoords = userCoords;
    this.container = document.createElement('div');
    this.container.id = 'air-quality-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setUserCoords(coords: [number, number], city?: string): void {
    this.userCoords = coords;
    if (city) this.currentCity = city;
  }

  public async show(): Promise<void> {
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
    await this.loadData();
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.render();
    try {
      this.data = await airQualityService.fetchAirQuality(this.userCoords[1], this.userCoords[0]);
    } catch {}
    this.isLoading = false;
    this.render();
  }

  private render(): void {
    const d = this.data;

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              ${Icons.wind('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Hava Kalitesi & Enkaz Duman Radarı
              </h3>
              <p class="text-[11px] text-gray-400">
                ${this.currentCity} [${this.userCoords[1].toFixed(3)}, ${this.userCoords[0].toFixed(3)}] • Open-Meteo Atmosfer Telemetrisi
              </p>
            </div>
          </div>

          <button id="btn-close-air" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        ${
          this.isLoading
            ? `
          <div class="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div class="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs">Atmosfer partikül ve zehirli gaz sensörleri okunuyor...</p>
          </div>
        `
            : d
            ? `
          <!-- Primary AQI Banner -->
          <div class="p-4 rounded-xl border ${d.aqiColorClass} flex items-center justify-between mb-4">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-wider opacity-80">Avrupa Hava Kalitesi (AQI)</div>
              <div class="text-xl font-black mt-0.5">${d.aqiLabel}</div>
              <div class="text-[11px] opacity-75 mt-0.5">İndeks Değeri: ${d.aqi} / 100</div>
            </div>
            <div class="text-right">
              <span class="px-3 py-1 rounded-lg text-xs font-black uppercase bg-white/10">
                ${d.debrisRisk === 'critical' || d.debrisRisk === 'high' ? '⚠️ TOZ ALARMI' : 'STABİL'}
              </span>
            </div>
          </div>

          <!-- Particulate & Gas Metric Grid -->
          <div class="grid grid-cols-3 gap-2.5 mb-4">
            <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div class="text-[10px] text-gray-400 font-medium">PM2.5 (İnce Toz)</div>
              <div class="text-base font-black text-white mt-0.5">${d.pm25.toFixed(1)} <span class="text-[10px] text-gray-400 font-normal">µg/m³</span></div>
              <div class="text-[9.5px] ${d.pm25 > 25 ? 'text-rose-400' : 'text-emerald-400'} mt-0.5">
                ${d.pm25 > 25 ? 'Yüksek' : 'Normal'}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div class="text-[10px] text-gray-400 font-medium">PM10 (Kaba Toz)</div>
              <div class="text-base font-black text-white mt-0.5">${d.pm10.toFixed(1)} <span class="text-[10px] text-gray-400 font-normal">µg/m³</span></div>
              <div class="text-[9.5px] ${d.pm10 > 50 ? 'text-rose-400' : 'text-emerald-400'} mt-0.5">
                ${d.pm10 > 50 ? 'Enkaz Tozu' : 'Normal'}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div class="text-[10px] text-gray-400 font-medium">Karbonmonoksit</div>
              <div class="text-base font-black text-white mt-0.5">${Math.round(d.co)} <span class="text-[10px] text-gray-400 font-normal">µg/m³</span></div>
              <div class="text-[9.5px] ${d.generatorRisk !== 'safe' ? 'text-rose-400 font-bold' : 'text-emerald-400'} mt-0.5">
                ${d.generatorRisk === 'safe' ? 'Zehirsiz' : '⚠️ Tehlike'}
              </div>
            </div>
          </div>

          <!-- Mask Advice Box -->
          <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs font-semibold mb-4 flex items-center gap-2.5">
            <span class="text-lg">😷</span>
            <div>${d.maskAdvice}</div>
          </div>

          <!-- Disaster Directives -->
          <div class="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-2 mb-4 text-xs text-gray-300">
            <div class="text-amber-300 font-bold flex items-center gap-1.5">
              <span>⚠️ Hayati Afet & Zehirlenme Uyarıları:</span>
            </div>
            ${d.guidelines.map((g) => `<div class="flex items-start gap-2 leading-relaxed"><span>•</span><span>${g}</span></div>`).join('')}
          </div>
        `
            : `
          <div class="py-8 text-center text-gray-400 text-xs">
            Hava kalitesi verisi alınamadı. İnternet bağlantınızı kontrol edin.
          </div>
        `
        }

        <!-- Bottom Controls -->
        <div class="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            id="btn-refresh-air"
            type="button"
            class="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            🔄 Verileri Yenile
          </button>
          <button
            id="btn-close-air-bottom"
            type="button"
            class="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-air')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-close-air-bottom')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-refresh-air')?.addEventListener('click', () => this.loadData());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
