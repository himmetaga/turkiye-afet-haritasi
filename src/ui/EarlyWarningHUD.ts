import { EarlyWarningStatus, earlyWarningEngine } from '../services/earlyWarningEngine';
import { Icons } from './icons';

export class EarlyWarningHUD {
  private container: HTMLElement;
  private onNavigateNearestAssembly?: () => void;

  constructor(parent: HTMLElement, onNavigateNearestAssembly?: () => void) {
    this.onNavigateNearestAssembly = onNavigateNearestAssembly;
    this.container = document.createElement('div');
    this.container.id = 'early-warning-hud';
    this.container.className =
      'fixed inset-x-0 top-0 z-50 flex justify-center p-3 sm:p-4 pointer-events-none transition-all duration-500 -translate-y-full opacity-0';
    parent.appendChild(this.container);

    earlyWarningEngine.subscribe((status) => {
      this.update(status);
    });
  }

  public update(status: EarlyWarningStatus): void {
    if (!status.isActive) {
      this.container.classList.add('-translate-y-full', 'opacity-0');
      this.container.classList.remove('translate-y-0', 'opacity-100');
      return;
    }

    this.container.classList.remove('-translate-y-full', 'opacity-0');
    this.container.classList.add('translate-y-0', 'opacity-100');

    const sEta = status.sWaveEtaSeconds;
    const isImminent = sEta <= 15 && sEta > 0;
    const isShaking = sEta === 0;

    const bannerColor = isShaking
      ? 'bg-rose-950/95 border-rose-500 shadow-glow-rose'
      : isImminent
      ? 'bg-amber-950/95 border-amber-500 shadow-glow-amber'
      : 'bg-obsidian-900/95 border-cyan-500/50 shadow-2xl';

    this.container.innerHTML = `
      <div class="pointer-events-auto w-full max-w-2xl rounded-2xl border-2 p-4 sm:p-5 backdrop-blur-2xl text-white transition-all ${bannerColor}">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="flex h-4 w-4 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
            <div class="flex flex-col">
              <span class="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                🚨 SİSMİK ERKEN UYARI SİSTEMİ
              </span>
              <h3 class="text-sm sm:text-base font-extrabold tracking-tight text-white">
                ${status.earthquake ? status.earthquake.title : 'Deprem Dalgası Algılandı'}
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              id="btn-ew-sound-toggle"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-mono"
              title="Siren Sesini Aç / Kapat"
            >
              ${earlyWarningEngine.isSoundEnabled() ? '🔊 Siren Açık' : '🔇 Sessiz'}
            </button>
            <button
              id="btn-ew-dismiss"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
              title="Bildirimi Kapat"
            >
              ${Icons.close('w-4 h-4 text-gray-300')}
            </button>
          </div>
        </div>

        <!-- Wave Arrival Countdowns -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3">
          <!-- Destructive S-Wave Countdown (Main) -->
          <div class="col-span-2 sm:col-span-1 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Yıkıcı S-Dalgası</span>
            <div class="text-3xl sm:text-4xl font-black font-mono my-1 ${isShaking ? 'text-rose-400 animate-pulse' : 'text-amber-400'}">
              ${isShaking ? 'SARSINTI' : `${sEta}s`}
            </div>
            <span class="text-[10px] font-medium text-gray-300">
              ${isShaking ? 'Derhal Çök-Kapan-Tutun!' : 'Varışına Kalan Süre'}
            </span>
          </div>

          <!-- P-Wave Status -->
          <div class="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Öncül P-Dalgası</span>
            <div class="text-xl sm:text-2xl font-bold font-mono my-1 text-cyan-400">
              ${status.hasPWaveArrived ? 'Ulaştı ✓' : `${status.pWaveEtaSeconds}s`}
            </div>
            <span class="text-[10px] text-gray-400">
              Hız: ~6.5 km/s
            </span>
          </div>

          <!-- Intensity & Distance -->
          <div class="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Tahmini Şiddet</span>
            <div class="text-xl sm:text-2xl font-black font-mono my-1 text-rose-400">
              MMI ${status.estimatedMMI}
            </div>
            <span class="text-[10px] text-gray-300 font-mono">
              📍 Mesafe: ${status.distanceKm} km
            </span>
          </div>
        </div>

        <!-- Protocol Action Bar -->
        <div class="rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">🛡️</span>
            <span class="text-xs font-semibold text-rose-200">
              ${status.protocolText}
            </span>
          </div>

          ${
            this.onNavigateNearestAssembly
              ? `
            <button
              id="btn-ew-route"
              class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
            >
              En Yakın Alana Git →
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    // Event listeners
    const dismissBtn = this.container.querySelector('#btn-ew-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => earlyWarningEngine.dismiss());
    }

    const soundBtn = this.container.querySelector('#btn-ew-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const next = !earlyWarningEngine.isSoundEnabled();
        earlyWarningEngine.setSoundEnabled(next);
        this.update(status);
      });
    }

    const routeBtn = this.container.querySelector('#btn-ew-route');
    if (routeBtn && this.onNavigateNearestAssembly) {
      routeBtn.addEventListener('click', () => {
        this.onNavigateNearestAssembly!();
      });
    }
  }
}
