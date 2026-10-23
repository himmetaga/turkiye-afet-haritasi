import { soundSynthesizer } from '../services/soundSynthesizer';
import { Icons } from './icons';

export class EmergencyWhistleModal {
  private container: HTMLElement;
  private isStrobeActive = false;
  private strobeInterval: number | null = null;
  private strobeOverlay: HTMLElement | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'emergency-whistle-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.stopStrobe();
    soundSynthesizer.stopWhistle();
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
    this.updateButtons();
  }

  private toggleContinuousWhistle(): void {
    const active = soundSynthesizer.toggleWhistle();
    this.updateButtons();
  }

  private playMorseSOS(): void {
    soundSynthesizer.playMorseSOS(() => {
      this.updateButtons();
    });
    this.updateButtons();
  }

  private toggleStrobe(): void {
    if (this.isStrobeActive) {
      this.stopStrobe();
    } else {
      this.startStrobe();
    }
    this.updateButtons();
  }

  private startStrobe(): void {
    this.isStrobeActive = true;
    if (!this.strobeOverlay) {
      this.strobeOverlay = document.createElement('div');
      this.strobeOverlay.className = 'fixed inset-0 z-[100] pointer-events-none transition-opacity duration-75';
      document.body.appendChild(this.strobeOverlay);
    }

    let toggle = false;
    this.strobeInterval = window.setInterval(() => {
      if (this.strobeOverlay) {
        this.strobeOverlay.style.backgroundColor = toggle ? '#FFFFFF' : '#DC2626';
        this.strobeOverlay.style.opacity = toggle ? '0.95' : '0.85';
        toggle = !toggle;
      }
    }, 120);
  }

  private stopStrobe(): void {
    this.isStrobeActive = false;
    if (this.strobeInterval) {
      clearInterval(this.strobeInterval);
      this.strobeInterval = null;
    }
    if (this.strobeOverlay) {
      this.strobeOverlay.remove();
      this.strobeOverlay = null;
    }
  }

  private updateButtons(): void {
    const whistleBtn = this.container.querySelector('#btn-whistle-toggle');
    if (whistleBtn) {
      const isRunning = soundSynthesizer.isWhistleRunning();
      if (isRunning) {
        whistleBtn.className =
          'w-full py-4 rounded-2xl bg-rose-500 text-white font-black text-lg shadow-glow-rose active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse';
        whistleBtn.innerHTML = '🔊 DÜDÜĞÜ DURDUR';
      } else {
        whistleBtn.className =
          'w-full py-4 rounded-2xl bg-emerald-500 text-obsidian-950 font-black text-lg shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center gap-2';
        whistleBtn.innerHTML = '📢 KESİNTİSİZ AFET DÜDÜĞÜ ÇAL';
      }
    }

    const strobeBtn = this.container.querySelector('#btn-strobe-toggle');
    if (strobeBtn) {
      if (this.isStrobeActive) {
        strobeBtn.className =
          'py-3 px-4 rounded-xl bg-amber-500 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex-1';
        strobeBtn.textContent = '⚡ Flaşörü Kapat';
      } else {
        strobeBtn.className =
          'py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1';
        strobeBtn.textContent = '💡 Ekran Flaşörü (Strobe)';
      }
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="relative w-full max-w-md rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              ${Icons.bell('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Afet Düdüğü & Kurtarma İşareti
              </h3>
              <p class="text-[11px] text-gray-400">
                2.9 kHz akustik rezonans: Enkaz altında beton blokları delip geçen ses dalgası
              </p>
            </div>
          </div>

          <button id="btn-close-whistle" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Main Whistle Giant Button -->
        <div class="my-4">
          <button
            id="btn-whistle-toggle"
            class="w-full py-4 rounded-2xl bg-emerald-500 text-obsidian-950 font-black text-lg shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            📢 KESİNTİSİZ AFET DÜDÜĞÜ ÇAL
          </button>
        </div>

        <!-- Mode Buttons -->
        <div class="flex items-center gap-2.5 mb-4">
          <button
            id="btn-morse-sos"
            class="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1"
          >
            🆘 Mors Kodu S.O.S (... --- ...)
          </button>
          <button
            id="btn-strobe-toggle"
            class="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1"
          >
            💡 Ekran Flaşörü (Strobe)
          </button>
        </div>

        <!-- Rescue Guidance -->
        <div class="rounded-xl bg-white/5 border border-white/10 p-3 text-[11px] text-gray-300 space-y-1">
          <p class="font-semibold text-rose-300">⚠️ Enkaz Altında Enerji Tasarrufu:</p>
          <p>• Düdüğü aralıklarla çalarak cihaz şarjınızı koruyun.</p>
          <p>• Kurtarma ekiplerinin sesini duyduğunuzda butona aralıksız basın.</p>
          <p>• Ekran flaşörü tozlu ortamlarda arama ekipleri için optik hedef sağlar.</p>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-whistle')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-whistle-toggle')?.addEventListener('click', () => this.toggleContinuousWhistle());
    this.container.querySelector('#btn-morse-sos')?.addEventListener('click', () => this.playMorseSOS());
    this.container.querySelector('#btn-strobe-toggle')?.addEventListener('click', () => this.toggleStrobe());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
