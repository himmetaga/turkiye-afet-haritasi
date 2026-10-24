import { soundSynthesizer } from '../services/soundSynthesizer';
import { Icons } from './icons';

export class EmergencyWhistleModal {
  private container: HTMLElement;
  private isStrobeActive = false;
  private strobeInterval: number | null = null;
  private strobeOverlay: HTMLElement | null = null;
  private torchTrack: MediaStreamTrack | null = null;
  private isTorchActive = false;

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
    this.stopTorch();
    soundSynthesizer.stopWhistle();
    soundSynthesizer.stopGeophoneBeacon();
    soundSynthesizer.stopDogWhistle();
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
    this.updateButtons();
  }

  private toggleContinuousWhistle(): void {
    soundSynthesizer.stopGeophoneBeacon();
    soundSynthesizer.stopDogWhistle();
    soundSynthesizer.toggleWhistle();
    this.updateButtons();
  }

  private toggleGeophoneBeacon(): void {
    soundSynthesizer.stopWhistle();
    soundSynthesizer.stopDogWhistle();
    if (soundSynthesizer.isGeophoneRunning()) {
      soundSynthesizer.stopGeophoneBeacon();
    } else {
      soundSynthesizer.startGeophoneBeacon(15);
    }
    this.updateButtons();
  }

  private toggleDogWhistle(): void {
    soundSynthesizer.stopWhistle();
    soundSynthesizer.stopGeophoneBeacon();
    if (soundSynthesizer.isDogWhistleRunning()) {
      soundSynthesizer.stopDogWhistle();
    } else {
      soundSynthesizer.startDogWhistle();
    }
    this.updateButtons();
  }

  private playMorseSOS(): void {
    soundSynthesizer.stopWhistle();
    soundSynthesizer.stopGeophoneBeacon();
    soundSynthesizer.stopDogWhistle();
    soundSynthesizer.playMorseSOS(() => {
      this.updateButtons();
    });
    this.updateButtons();
  }

  private async toggleLight(): Promise<void> {
    if (this.isTorchActive || this.isStrobeActive) {
      this.stopTorch();
      this.stopStrobe();
    } else {
      await this.startTorchOrStrobe();
    }
    this.updateButtons();
  }

  private async startTorchOrStrobe(): Promise<void> {
    // Attempt camera torch first (on supported Android/Chrome mobile devices)
    let torchStarted = false;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          await (track as any).applyConstraints({
            advanced: [{ torch: true }]
          });
          this.torchTrack = track;
          this.isTorchActive = true;
          torchStarted = true;
        }
      } catch (err) {
        console.warn('Flaş LED donanımı açılamadı, ekran flaşörüne geçiliyor:', err);
      }
    }

    // Always start screen strobe as visual reinforcement or fallback
    this.startStrobe();
    if (torchStarted) {
      this.isTorchActive = true;
    }
  }

  private stopTorch(): void {
    if (this.torchTrack) {
      try {
        (this.torchTrack as any).applyConstraints({ advanced: [{ torch: false }] });
        this.torchTrack.stop();
      } catch {}
      this.torchTrack = null;
    }
    this.isTorchActive = false;
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

    const geophoneBtn = this.container.querySelector('#btn-geophone-toggle');
    if (geophoneBtn) {
      const isGeo = soundSynthesizer.isGeophoneRunning();
      if (isGeo) {
        geophoneBtn.className =
          'py-2.5 px-3 rounded-xl bg-cyan-500 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex-1 shadow-glow-cyan animate-pulse';
        geophoneBtn.textContent = '⏹ Geofon Darbesini Durdur';
      } else {
        geophoneBtn.className =
          'py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1';
        geophoneBtn.textContent = '🎯 Geofon Sonar (3.5 kHz)';
      }
    }

    const dogBtn = this.container.querySelector('#btn-dog-toggle');
    if (dogBtn) {
      const isDog = soundSynthesizer.isDogWhistleRunning();
      if (isDog) {
        dogBtn.className =
          'py-2.5 px-3 rounded-xl bg-amber-500 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex-1 shadow-glow-amber animate-pulse';
        dogBtn.textContent = '⏹ Köpek Düdüğünü Durdur';
      } else {
        dogBtn.className =
          'py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1';
        dogBtn.textContent = '🐕 Arama Köpeği (18.5 kHz)';
      }
    }

    const strobeBtn = this.container.querySelector('#btn-strobe-toggle');
    if (strobeBtn) {
      const isLighting = this.isTorchActive || this.isStrobeActive;
      if (isLighting) {
        strobeBtn.className =
          'py-2.5 px-3 rounded-xl bg-amber-500 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex-1';
        strobeBtn.textContent = '⚡ Flaşörü Kapat';
      } else {
        strobeBtn.className =
          'py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1';
        strobeBtn.textContent = '💡 LED Flaş & Ekran';
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
              ${Icons.whistle('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Afet Düdüğü & Akustik Enkaz Sinyali
              </h3>
              <p class="text-[11px] text-gray-400">
                2.9 - 3.5 kHz beton delici akustik frekans ve K9 ultrasonik çağrısı
              </p>
            </div>
          </div>

          <button id="btn-close-whistle" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Main Whistle Giant Button -->
        <div class="my-4">
          <button
            id="btn-whistle-toggle"
            type="button"
            class="w-full py-4 rounded-2xl bg-emerald-500 text-obsidian-950 font-black text-lg shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            📢 KESİNTİSİZ AFET DÜDÜĞÜ ÇAL
          </button>
        </div>

        <!-- Specialized Rescue Beacons -->
        <div class="flex items-center gap-2 mb-3">
          <button
            id="btn-geophone-toggle"
            type="button"
            title="AFAD ve kurtarma ekiplerinin sismik dinleme mikrofonları (geofon) için 15 saniyede bir 3 darbe ve titreşim gönderir (Pil tasarruflu)"
            class="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1"
          >
            🎯 Geofon Sonar (3.5 kHz)
          </button>
          <button
            id="btn-dog-toggle"
            type="button"
            title="Arama kurtarma köpeklerinin duyduğu yüksek frekanslı (18.5 kHz) ultrasonik çağrı"
            class="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1"
          >
            🐕 Arama Köpeği (18.5 kHz)
          </button>
        </div>

        <!-- Mode Buttons -->
        <div class="flex items-center gap-2 mb-4">
          <button
            id="btn-morse-sos"
            type="button"
            class="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1"
          >
            🆘 Mors Kodu S.O.S
          </button>
          <button
            id="btn-strobe-toggle"
            type="button"
            class="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all flex-1"
          >
            💡 LED Flaş & Ekran
          </button>
        </div>

        <!-- Rescue Guidance -->
        <div class="rounded-xl bg-white/5 border border-white/10 p-3 text-[11px] text-gray-300 space-y-1.5">
          <div class="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <span>🔋 Pil Tasarrufu & Hayatta Kalma Modu:</span>
          </div>
          <p>• <strong>Geofon Sonar Modu:</strong> Enkaz altındayken pili tüketmemek için her 15 saniyede bir 3 güçlü akustik darbe ve titreşim yayarak sismik cihazların yerinizi saptamasını sağlar.</p>
          <p>• <strong>Arama Köpeği Modu:</strong> İnsan kulağının yorulmadığı 18.5 kHz frekansıyla K9 canlı arama köpeklerini doğrudan enkaz boşluğunuza çeker.</p>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-whistle')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-whistle-toggle')?.addEventListener('click', () => this.toggleContinuousWhistle());
    this.container.querySelector('#btn-geophone-toggle')?.addEventListener('click', () => this.toggleGeophoneBeacon());
    this.container.querySelector('#btn-dog-toggle')?.addEventListener('click', () => this.toggleDogWhistle());
    this.container.querySelector('#btn-morse-sos')?.addEventListener('click', () => this.playMorseSOS());
    this.container.querySelector('#btn-strobe-toggle')?.addEventListener('click', () => this.toggleLight());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
