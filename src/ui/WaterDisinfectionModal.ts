import { Icons } from './icons';
import { civilDefenseProtocols } from '../services/civilDefenseProtocols';

export class WaterDisinfectionModal {
  private container: HTMLElement;
  private volumeLiters = 5;
  private isCloudy = false;
  private countdownTimer: any = null;
  private remainingSeconds = 30 * 60; // 30 minutes
  private isTimerRunning = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'water-disinfection-modal';
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
    this.container.classList.add('hidden');
  }

  private toggleTimer(): void {
    if (this.isTimerRunning) {
      clearInterval(this.countdownTimer);
      this.isTimerRunning = false;
    } else {
      this.isTimerRunning = true;
      this.countdownTimer = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--;
          this.updateTimerText();
        } else {
          clearInterval(this.countdownTimer);
          this.isTimerRunning = false;
          alert('💧 30 Dakikalık klor temas süresi tamamlandı! Su güvenle içilebilir.');
        }
      }, 1000);
    }
    this.render();
  }

  private updateTimerText(): void {
    const el = this.container.querySelector('#water-timer-display');
    if (el) {
      const m = Math.floor(this.remainingSeconds / 60);
      const s = this.remainingSeconds % 60;
      el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }

  private render(): void {
    const calc = civilDefenseProtocols.calculateWaterDisinfection(this.volumeLiters, this.isCloudy);
    const m = Math.floor(this.remainingSeconds / 60);
    const s = this.remainingSeconds % 60;
    const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
              💧
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Sahra Su Arıtma & Klorlama</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  WHO WASH
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Kolera ve dizanteri önleyici damla hesabı su dezenfeksiyonu</p>
            </div>
          </div>
          <button id="btn-close-water" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body Content -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Volume Presets -->
          <div>
            <label class="block text-[11px] font-bold text-gray-300 mb-2">Su Miktarını Seçin:</label>
            <div class="grid grid-cols-4 gap-2">
              ${[1, 5, 10, 19]
                .map(
                  (v) => `
                <button
                  data-vol="${v}"
                  type="button"
                  class="btn-vol-preset py-2 rounded-xl text-xs font-bold transition-all border ${
                    this.volumeLiters === v
                      ? 'bg-sky-600 text-white border-sky-400 shadow-glow-sky'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }"
                >
                  ${v === 19 ? '19L Damacana' : `${v} Litre`}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Cloudy vs Clear Toggle -->
          <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <div class="font-bold text-white">Bulanık / Tortulu Su Modu</div>
              <div class="text-[10.5px] text-gray-400">Kuyu veya birikinti suyu ise klor dozu artırılır</div>
            </div>
            <button
              id="btn-toggle-cloudy"
              type="button"
              class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                this.isCloudy ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-300'
              }"
            >
              ${this.isCloudy ? 'Bulanık Su (%60 Fazla)' : 'Berrak Su'}
            </button>
          </div>

          <!-- Calculation Result Cards -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <span class="block text-[10px] uppercase font-bold text-sky-300">Ev Tipi Çamaşır Suyu</span>
              <span class="text-2xl font-black text-sky-400 font-mono my-1 block">${calc.householdBleachDrops} Damla</span>
              <span class="text-[9.5px] text-gray-400 font-mono">(%4-5 Parfümsüz NaOCl)</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span class="block text-[10px] uppercase font-bold text-emerald-300">Klor Tableti</span>
              <span class="text-2xl font-black text-emerald-400 font-mono my-1 block">${calc.tabletCount} Tablet</span>
              <span class="text-[9.5px] text-gray-400 font-mono">(Sahra İkmal Tableti)</span>
            </div>
          </div>

          <!-- 30-min Contact Timer -->
          <div class="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between gap-3">
            <div>
              <span class="block text-[10.5px] text-gray-400 font-semibold">Klor Temas Süresi (Zorunlu):</span>
              <span id="water-timer-display" class="text-2xl font-black font-mono text-amber-400">${timeFormatted}</span>
            </div>
            <button
              id="btn-toggle-water-timer"
              type="button"
              class="px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                this.isTimerRunning ? 'bg-rose-600 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'
              }"
            >
              ${this.isTimerRunning ? 'Durdur' : 'Sayacı Başlat (30 Dk)'}
            </button>
          </div>

          <!-- 3-Step Instructions -->
          <div class="space-y-1.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-gray-200 block">📋 Sahra Arıtma Kuralları:</span>
            ${calc.instructions
              .map((inst) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${inst}</p>`)
              .join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q('#btn-close-water')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll<HTMLButtonElement>('.btn-vol-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = parseInt(btn.getAttribute('data-vol') || '5', 10);
        this.volumeLiters = v;
        this.render();
      });
    });

    q('#btn-toggle-cloudy')?.addEventListener('click', () => {
      this.isCloudy = !this.isCloudy;
      this.render();
    });

    q('#btn-toggle-water-timer')?.addEventListener('click', () => this.toggleTimer());
  }
}
