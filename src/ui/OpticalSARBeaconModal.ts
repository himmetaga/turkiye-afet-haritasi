import { Icons } from './icons';
import { advancedHardwareService } from '../services/advancedHardwareService';

export class OpticalSARBeaconModal {
  private container: HTMLElement;
  private isBeaconActive = false;
  private screenStrobeInterval: any = null;
  private isScreenStrobeOn = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'optical-sar-beacon-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.stopBeacon();
    this.container.classList.add('hidden');
  }

  private async toggleBeacon(): Promise<void> {
    if (this.isBeaconActive) {
      this.stopBeacon();
    } else {
      await this.startBeacon();
    }
    this.render();
  }

  private async startBeacon(): Promise<void> {
    this.isBeaconActive = true;
    // 1. Try Hardware Torch API
    const torchStarted = await advancedHardwareService.startPulsedTorchSOS();

    // 2. Start Screen Strobe (flashes full screen high-visibility rescue color)
    const strobeBox = this.container.querySelector('#screen-strobe-box') as HTMLElement | null;
    this.screenStrobeInterval = setInterval(() => {
      this.isScreenStrobeOn = !this.isScreenStrobeOn;
      if (strobeBox) {
        if (this.isScreenStrobeOn) {
          strobeBox.classList.remove('bg-black', 'border-white/10');
          strobeBox.classList.add('bg-rose-600', 'border-rose-400', 'shadow-glow-red');
        } else {
          strobeBox.classList.remove('bg-rose-600', 'border-rose-400', 'shadow-glow-red');
          strobeBox.classList.add('bg-black', 'border-white/10');
        }
      }
    }, 450);

    // 3. Play Geophone pulse every 10 seconds
    advancedHardwareService.playGeophoneSeismicPulse();
  }

  private stopBeacon(): void {
    this.isBeaconActive = false;
    advancedHardwareService.stopPulsedTorchSOS();
    if (this.screenStrobeInterval) {
      clearInterval(this.screenStrobeInterval);
      this.screenStrobeInterval = null;
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-sm sm:max-w-md flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03]">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
              🔦
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">SAR Optik Flaşör & Beacon</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  MORS S.O.S
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Gece dronları ve termal arama ekipleri için optik işaret fişeği</p>
            </div>
          </div>
          <button id="btn-close-beacon" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body & Trigger Area -->
        <div class="p-5 flex flex-col items-center justify-center gap-4 text-center">
          <!-- Visual Strobe Box Preview -->
          <div
            id="screen-strobe-box"
            class="w-full h-32 rounded-2xl bg-black border border-white/10 flex flex-col items-center justify-center gap-2 transition-all duration-200"
          >
            <span class="text-2xl">${this.isBeaconActive ? '⚡' : '💤'}</span>
            <span class="text-xs font-mono font-bold ${this.isBeaconActive ? 'text-white' : 'text-gray-500'}">
              ${this.isBeaconActive ? 'S.O.S OPTİK SİNYAL YAYINLANIYOR' : 'OPTİK SİNYAL BEKLEMEDE'}
            </span>
            <span class="text-[10px] text-gray-400 font-mono">··· --- ··· (Mors Kurtarma Kodu)</span>
          </div>

          <!-- Big Toggle Button -->
          <button
            id="btn-toggle-beacon-active"
            type="button"
            class="w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl transition-all ios27-spring ios27-tap-bounce ${
              this.isBeaconActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-red'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald'
            }"
          >
            <span>${this.isBeaconActive ? '⏹' : '▶'}</span>
            <span>${this.isBeaconActive ? 'OPTİK FLAŞÖRÜ DURDUR' : 'SAR OPTİK S.O.S BAŞLAT'}</span>
          </button>

          <!-- Geophone Pulse Trigger -->
          <button
            id="btn-geophone-pulse"
            type="button"
            class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>🔊 3800 Hz Geofon Sismik Sinyal Gönder</span>
          </button>

          <!-- Specifications Note -->
          <div class="w-full p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[10.5px] text-gray-400 text-left space-y-1">
            <p><strong>🔋 %95 Batarya Koruması:</strong> Sürekli fener açık tutmak bataryayı 1 saatte bitirir. Bu sistem 5 saniyede bir 10ms yüksek lümenli lazer darbesi fırlatarak günlerce çalışır.</p>
            <p><strong>🛰️ Dron Algılama:</strong> Moloz aralıklarından gökyüzüne sızan anlık ışık patlamaları gece uçan kurtarma dronlarının termal sensörleri tarafından kolayca haritalanır.</p>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-beacon')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-toggle-beacon-active')?.addEventListener('click', () => this.toggleBeacon());
    this.container.querySelector('#btn-geophone-pulse')?.addEventListener('click', () => {
      advancedHardwareService.playGeophoneSeismicPulse();
      alert('🔊 3800 Hz Geofon rezonans darbesi hoparlörden yayıldı.');
    });
  }
}
