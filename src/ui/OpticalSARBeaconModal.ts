import { Icons } from './icons';
import { advancedHardwareService } from '../services/advancedHardwareService';

/** Mors S.O.S zamanlaması: nokta 200 ms, çizgi 600 ms. [ışık açık mı, süre ms] */
const DOT = 200;
const SOS_PATTERN: Array<[boolean, number]> = [
  // S
  [true, DOT], [false, DOT], [true, DOT], [false, DOT], [true, DOT], [false, DOT * 3],
  // O
  [true, DOT * 3], [false, DOT], [true, DOT * 3], [false, DOT], [true, DOT * 3], [false, DOT * 3],
  // S
  [true, DOT], [false, DOT], [true, DOT], [false, DOT], [true, DOT], [false, DOT * 7]
];

export class OpticalSARBeaconModal {
  private container: HTMLElement;
  private isBeaconActive = false;
  private strobeTimer: number | null = null;
  private strobeStep = 0;
  /** null: henüz denenmedi · true: fener yanıp sönüyor · false: fener kontrol edilemiyor */
  private torchOk: boolean | null = null;

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
    this.torchOk = null;

    // 1. Cihaz fenerini dene; sonuç ekranda olduğu gibi gösterilir.
    this.torchOk = await advancedHardwareService.startPulsedTorchSOS();
    if (!this.isBeaconActive) return;

    // 2. Ekran S.O.S ritmiyle yanıp söner (fener yoksa tam ekran).
    this.strobeStep = 0;
    this.runStrobe();
  }

  private runStrobe(): void {
    if (!this.isBeaconActive) return;
    const [on, ms] = SOS_PATTERN[this.strobeStep % SOS_PATTERN.length];
    this.applyStrobe(on);
    this.strobeStep += 1;
    this.strobeTimer = window.setTimeout(() => this.runStrobe(), ms);
  }

  private applyStrobe(on: boolean): void {
    // render() DOM'u yenilediği için öğeler her adımda yeniden bulunur.
    const box = this.container.querySelector('#screen-strobe-box') as HTMLElement | null;
    if (box) box.style.background = on ? '#e11d48' : '#000000';
    const full = this.container.querySelector('#sar-fullscreen-strobe') as HTMLElement | null;
    if (full) full.style.background = on ? '#ffffff' : '#000000';
  }

  private stopBeacon(): void {
    this.isBeaconActive = false;
    this.torchOk = null;
    advancedHardwareService.stopPulsedTorchSOS();
    if (this.strobeTimer) {
      clearTimeout(this.strobeTimer);
      this.strobeTimer = null;
    }
    this.applyStrobe(false);
  }

  private getStatusText(): string {
    if (!this.isBeaconActive) return 'IŞIK KAPALI';
    if (this.torchOk === true) return 'FENER S.O.S RİTMİYLE YANIP SÖNÜYOR';
    if (this.torchOk === false) return 'FENER KONTROL EDİLEMİYOR — YALNIZCA EKRAN YANIP SÖNÜYOR';
    return 'FENER DENENİYOR…';
  }

  private render(): void {
    const screenOnly = this.isBeaconActive && this.torchOk === false;

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
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">S.O.S Işık Sinyali</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  MORS S.O.S
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Yakınınızdaki kişilerin dikkatini çekmek için fener ve ekranı yakıp söndürür</p>
            </div>
          </div>
          <button id="btn-close-beacon" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body & Trigger Area -->
        <div class="p-5 flex flex-col items-center justify-center gap-4 text-center">
          <div
            id="screen-strobe-box"
            class="w-full h-32 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 px-3"
            style="background:#000000"
          >
            <span class="text-2xl">${this.isBeaconActive ? '⚡' : '💤'}</span>
            <span class="text-xs font-mono font-bold ${this.isBeaconActive ? 'text-white' : 'text-gray-500'}">
              ${this.getStatusText()}
            </span>
            <span class="text-[10px] text-gray-400 font-mono">··· --- ··· (S.O.S)</span>
          </div>

          ${
            screenOnly
              ? `<p class="w-full text-[11.5px] text-amber-200 text-left">Bu cihazda fener bu sayfadan kontrol edilemiyor. Telefonun kendi fenerini ayrıca açın; ekran en yüksek parlaklıkta olsun.</p>`
              : ''
          }

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
            <span>${this.isBeaconActive ? 'IŞIK SİNYALİNİ DURDUR' : 'S.O.S IŞIK SİNYALİNİ BAŞLAT'}</span>
          </button>

          <button
            id="btn-geophone-pulse"
            type="button"
            class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>🔊 Kısa bip sesi çal</span>
          </button>

          <div class="w-full p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[10.5px] text-gray-400 text-left space-y-1">
            <p>Işık ve ses yalnızca yakındaki kişilerin dikkatini çekmeye yarar; kimseye konum ya da mesaj göndermez. Fener ve ekran pili hızlı tüketir.</p>
            <p><strong>Ekiplere duyurmanın en güvenilir yolu:</strong> boruya ya da duvara 3'er kez vurmak ve düdük çalmak. Telefon çekiyorsa 112'yi arayın.</p>
            <p>Yanıp sönen ışık, ışığa duyarlı kişilerde nöbeti tetikleyebilir.</p>
          </div>
        </div>
      </div>

      ${
        screenOnly
          ? `
        <div id="sar-fullscreen-strobe" class="fixed inset-0 z-[60] flex items-end justify-center pb-10" style="background:#000000">
          <button id="btn-stop-fullscreen-strobe" type="button" class="px-8 py-4 rounded-3xl bg-black text-white text-base font-black border-4 border-white">
            DURDUR
          </button>
        </div>
      `
          : ''
      }
    `;

    this.container.querySelector('#btn-close-beacon')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-toggle-beacon-active')?.addEventListener('click', () => this.toggleBeacon());
    this.container.querySelector('#btn-stop-fullscreen-strobe')?.addEventListener('click', () => {
      this.stopBeacon();
      this.render();
    });
    this.container.querySelector('#btn-geophone-pulse')?.addEventListener('click', () => {
      advancedHardwareService.playGeophoneSeismicPulse();
    });
  }
}
