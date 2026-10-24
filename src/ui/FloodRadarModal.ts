import { Icons } from './icons';
import { floodRadarService, FloodRadarData, FloodRiskTier } from '../services/floodRadarService';

export class FloodRadarModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private currentData: FloodRadarData | null = null;
  private isVisible = false;

  constructor(parent: HTMLElement, userCoords: [number, number]) {
    this.userCoords = userCoords;
    this.container = document.createElement('div');
    this.container.id = 'flood-radar-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/80 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public async show(): Promise<void> {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.renderLoading();

    try {
      this.currentData = await floodRadarService.fetchFloodRadar(this.userCoords);
      this.render();
    } catch {
      this.currentData = floodRadarService.getSimulationData('low', this.userCoords);
      this.render();
    }
  }

  public hide(): void {
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="relative w-full max-w-xl rounded-2xl bg-obsidian-900/95 border border-white/10 p-6 shadow-2xl backdrop-blur-xl text-white text-center">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 animate-spin">
          ${Icons.cloudRain('w-6 h-6')}
        </div>
        <h3 class="text-base font-bold text-white tracking-wide">
          Sel & Taşkın Radarı Sorgulanıyor
        </h3>
        <p class="text-xs text-gray-400 mt-1">
          Open-Meteo & GloFAS küresel nehir debisi ve anlık meteorolojik yağış verileri analiz ediliyor...
        </p>
      </div>
    `;
  }

  private render(): void {
    if (!this.currentData) return;
    const d = this.currentData;

    const tierConfig: Record<
      FloodRiskTier,
      { label: string; badgeCls: string; borderCls: string; textCls: string; bgCls: string; icon: string }
    > = {
      low: {
        label: 'DÜŞÜK RİSK • NORMAL',
        badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        borderCls: 'border-emerald-500/30',
        textCls: 'text-emerald-400',
        bgCls: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        icon: '🟢'
      },
      moderate: {
        label: 'ORTA RİSK • ŞİDDETLİ YAĞIŞ',
        badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        borderCls: 'border-amber-500/30',
        textCls: 'text-amber-400',
        bgCls: 'from-amber-500/10 via-amber-500/5 to-transparent',
        icon: '🟡'
      },
      high: {
        label: 'YÜKSEK RİSK • TAŞKIN TEHLİKESİ',
        badgeCls: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        borderCls: 'border-orange-500/40',
        textCls: 'text-orange-400',
        bgCls: 'from-orange-500/15 via-orange-500/5 to-transparent',
        icon: '🟠'
      },
      critical: {
        label: 'KIRMIZI KOD • ACİL TAŞKIN & ANİ SEL',
        badgeCls: 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse',
        borderCls: 'border-rose-500/50',
        textCls: 'text-rose-400',
        bgCls: 'from-rose-500/20 via-rose-500/10 to-transparent',
        icon: '🚨'
      }
    };

    const cfg = tierConfig[d.riskTier];

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-obsidian-900/95 border border-white/10 shadow-2xl backdrop-blur-xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
              ${Icons.cloudRain('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
                  Sel & Taşkın Erken Uyarı Radarı
                </h3>
                ${d.isSimulated ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">TEST MODU</span>' : ''}
              </div>
              <p class="text-[11px] text-gray-400">
                GloFAS nehir debisi ve anlık meteorolojik radar verileri
              </p>
            </div>
          </div>

          <button id="btn-close-flood" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Risk Banner -->
          <div class="p-4 rounded-xl bg-gradient-to-b ${cfg.bgCls} border ${cfg.borderCls}">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.badgeCls} flex items-center gap-1.5">
                <span>${cfg.icon}</span>
                <span>${cfg.label}</span>
              </span>
              <span class="text-[11px] font-mono text-gray-400">Risk Puanı: <strong class="${cfg.textCls}">%${d.riskScore}</strong></span>
            </div>
            <p class="text-[13px] font-medium text-gray-200 mt-1">
              Hava Durumu: <strong class="text-white">${d.weatherDescription}</strong>
            </p>
          </div>

          <!-- Telemetry Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
              <span class="text-[10px] text-gray-400 block uppercase font-mono">Anlık Yağış</span>
              <span class="text-base font-bold text-sky-400 font-mono mt-0.5 block">${d.precipitationMmPerHour} <span class="text-[10px] text-gray-400 font-normal">mm/h</span></span>
            </div>

            <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
              <span class="text-[10px] text-gray-400 block uppercase font-mono">Nehir Debisi</span>
              <span class="text-base font-bold text-emerald-400 font-mono mt-0.5 block">${d.riverDischargeM3s !== null ? d.riverDischargeM3s : '—'} <span class="text-[10px] text-gray-400 font-normal">m³/s</span></span>
            </div>

            <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
              <span class="text-[10px] text-gray-400 block uppercase font-mono">Rüzgar Hızı</span>
              <span class="text-base font-bold text-amber-400 font-mono mt-0.5 block">${d.windSpeedKmH} <span class="text-[10px] text-gray-400 font-normal">km/s</span></span>
            </div>

            <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
              <span class="text-[10px] text-gray-400 block uppercase font-mono">Havadaki Nem</span>
              <span class="text-base font-bold text-indigo-400 font-mono mt-0.5 block">%${d.humidityPct}</span>
            </div>
          </div>

          <!-- Directives List -->
          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <h4 class="text-xs font-bold text-white mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <span>📋</span><span>Hayati Sel & Taşkın Direktifleri</span>
            </h4>
            <div class="space-y-2">
              ${d.directives
                .map(
                  (dir) => `
                <div class="flex items-start gap-2 p-2 rounded-lg bg-white/5 text-[11.5px] leading-relaxed text-gray-200">
                  <span class="flex-shrink-0 mt-0.5">🔹</span>
                  <span>${dir}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Survival Rules Card: 15cm & 30cm -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div class="font-bold text-rose-300 flex items-center gap-1 mb-1">
                <span>🚗</span><span>30 cm Su = Aracı Sürükler</span>
              </div>
              <p class="text-gray-300 leading-snug">
                Asla su basmış alt geçide veya dereye araçla girmeyin. Su motoru boğup kapıları kilitler; derhal aracı terk edip çatıya çıkın.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div class="font-bold text-amber-300 flex items-center gap-1 mb-1">
                <span>⚡</span><span>Gizli Rögar & Kaçak Elektrik</span>
              </div>
              <p class="text-gray-300 leading-snug">
                Bulanık sel suyu basınçla rögar kapaklarını yerinden söker. Su basan sokak lambası veya trafoların yanında yürümeyin.
              </p>
            </div>
          </div>

          <!-- Simulation / Test Switcher -->
          <div class="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] text-gray-400 font-medium">Test Senaryosu:</span>
              <button type="button" data-sim="low" class="btn-sim px-2 py-1 rounded-lg border text-[10.5px] font-semibold bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">Normal</button>
              <button type="button" data-sim="moderate" class="btn-sim px-2 py-1 rounded-lg border text-[10.5px] font-semibold bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25">Orta Risk</button>
              <button type="button" data-sim="critical" class="btn-sim px-2 py-1 rounded-lg border text-[10.5px] font-semibold bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25">Taşkın Kırmızı Kod</button>
            </div>

            <button
              id="btn-share-flood"
              type="button"
              class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>📲</span><span>Durumu Paylaş</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-flood')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll('.btn-sim').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = btn.getAttribute('data-sim') as FloodRiskTier;
        if (tier) {
          this.currentData = floodRadarService.getSimulationData(tier, this.userCoords);
          this.render();
        }
      });
    });

    this.container.querySelector('#btn-share-flood')?.addEventListener('click', () => {
      if (!this.currentData) return;
      const d = this.currentData;
      const text = `🌊 afet.live Sel & Taşkın Durum Raporu:\nRisk Seviyesi: ${cfg.label}\nAnlık Yağış: ${d.precipitationMmPerHour} mm/saat\nHava: ${d.weatherDescription}\nKonum: https://afet.live?mod=sel`;
      if (navigator.share) {
        navigator.share({ title: 'Sel Radarı', text }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text);
        alert('Sel durumu panoya kopyalandı.');
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
