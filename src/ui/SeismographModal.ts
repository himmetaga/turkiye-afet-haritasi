import { seismicSensorNode, SeismicNodeStatus, AccelerationSample } from '../services/seismicSensorNode';
import { Icons } from './icons';

export class SeismographModal {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private unsubscribe: (() => void) | null = null;
  private currentStatus: SeismicNodeStatus | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'seismograph-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');

    seismicSensorNode.start();
    this.unsubscribe = seismicSensorNode.subscribe((status) => {
      this.currentStatus = status;
      this.updateStatusUI(status);
    });

    this.initCanvas();
    this.startRenderLoop();
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private initCanvas(): void {
    this.canvas = this.container.querySelector('#seismo-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  private startRenderLoop(): void {
    const render = () => {
      this.drawSeismograph();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  private drawSeismograph(): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const midY = h / 2;

    for (let y = 0; y <= h; y += h / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline (Zero acceleration)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const buffer = seismicSensorNode.getBuffer();
    if (buffer.length < 2) return;

    const step = w / Math.max(1, buffer.length - 1);
    const scaleY = h * 0.4; // 1 m/s^2 maps to 40% height

    // Draw Combined Vector Magnitude
    ctx.beginPath();
    ctx.strokeStyle = this.currentStatus?.isTriggered ? '#EF4444' : '#10B981';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    for (let i = 0; i < buffer.length; i++) {
      const sample = buffer[i];
      const x = i * step;
      const y = midY - sample.magnitude * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Subtle glow under waveform
    ctx.lineTo(w, midY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fillStyle = this.currentStatus?.isTriggered ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.05)';
    ctx.fill();
  }

  private wakeLock: any = null;
  private isWakeLockActive = false;

  private getMercalliIntensity(magMs2: number): { roman: string; desc: string; cls: string } {
    const gal = magMs2 * 100;
    if (gal < 1.0) return { roman: 'I', desc: 'Durgun / Hissedilmez', cls: 'text-gray-400' };
    if (gal < 3.0) return { roman: 'II', desc: 'Çok Hafif', cls: 'text-emerald-400' };
    if (gal < 8.0) return { roman: 'III', desc: 'Hafif Sarsıntı', cls: 'text-cyan-400' };
    if (gal < 25.0) return { roman: 'IV', desc: 'Belirgin Sallantı', cls: 'text-amber-400' };
    if (gal < 60.0) return { roman: 'V', desc: 'Orta Şiddetli', cls: 'text-orange-400' };
    return { roman: 'VI+', desc: 'Kuvvetli / Şiddetli', cls: 'text-rose-400' };
  }

  private async toggleWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    if (this.isWakeLockActive) {
      if (this.wakeLock) {
        try { await this.wakeLock.release(); } catch {}
        this.wakeLock = null;
      }
      this.isWakeLockActive = false;
    } else {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.isWakeLockActive = true;
        this.wakeLock.addEventListener?.('release', () => {
          this.wakeLock = null;
          this.isWakeLockActive = false;
          this.updateWakeLockBtn();
        });
      } catch {}
    }
    this.updateWakeLockBtn();
  }

  private updateWakeLockBtn(): void {
    const btn = this.container.querySelector('#btn-seismo-wakelock');
    if (btn) {
      btn.className = `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
        this.isWakeLockActive
          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
      }`;
      btn.innerHTML = `<span>💡</span><span>${this.isWakeLockActive ? 'Ekran Açık (Kilit Pasif)' : 'Ekranı Açık Tut'}</span>`;
    }
  }

  private updateStatusUI(status: SeismicNodeStatus): void {
    const ratioEl = this.container.querySelector('#sta-lta-ratio');
    if (ratioEl) ratioEl.textContent = status.staLtaRatio.toFixed(2);

    const magEl = this.container.querySelector('#current-mag');
    const gal = (status.currentMag * 100).toFixed(1);
    if (magEl) magEl.innerHTML = `${status.currentMag.toFixed(2)} <span class="text-[11px] text-gray-400 font-normal">m/s²</span><div class="text-[10px] text-gray-500 font-mono font-normal">${gal} Gal</div>`;

    const intensity = this.getMercalliIntensity(status.currentMag);
    const intensityEl = this.container.querySelector('#intensity-val');
    if (intensityEl) {
      intensityEl.className = `text-lg font-bold font-mono mt-0.5 ${intensity.cls}`;
      intensityEl.textContent = `${intensity.roman} • ${intensity.desc}`;
    }

    const rateEl = this.container.querySelector('#sample-rate');
    if (rateEl) rateEl.textContent = `${status.sampleRateHz} Hz`;

    const badge = this.container.querySelector('#trigger-badge');
    if (badge) {
      if (status.isTriggered) {
        badge.className = 'px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse';
        badge.textContent = '⚠️ SARSINTI ALGILANDI';
      } else {
        badge.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        badge.textContent = '● Durgun / İzleniyor';
      }
    }
  }

  private render(): void {
    const currentSens = seismicSensorNode.getSensitivity();

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl rounded-2xl bg-obsidian-900/95 border border-white/10 p-5 shadow-2xl backdrop-blur-xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              ${Icons.seismic('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Canlı Cihaz Sismografı & Sensör Düğümü
              </h3>
              <p class="text-[11px] text-gray-400">
                Earthquake Network mimarisi: Akıllı ivmeölçer tabanlı mikrosarsıntı izleme
              </p>
            </div>
          </div>

          <button id="btn-close-seismo" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Telemetry Metrics Bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div class="rounded-xl bg-white/5 p-2.5 text-center">
            <span class="text-[10px] text-gray-400 font-mono uppercase">STA/LTA Oranı</span>
            <div id="sta-lta-ratio" class="text-lg font-bold font-mono text-emerald-400 mt-0.5">1.00</div>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5 text-center">
            <span class="text-[10px] text-gray-400 font-mono uppercase">İvme (Gal / m/s²)</span>
            <div id="current-mag" class="text-base font-bold font-mono text-cyan-400 mt-0.5">0.00 <span class="text-[11px] text-gray-400 font-normal">m/s²</span><div class="text-[10px] text-gray-500 font-mono font-normal">0.0 Gal</div></div>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5 text-center">
            <span class="text-[10px] text-gray-400 font-mono uppercase">Şiddet (Mercalli)</span>
            <div id="intensity-val" class="text-base font-bold font-mono text-gray-400 mt-0.5 truncate">I • Durgun</div>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5 flex flex-col items-center justify-center">
            <div id="trigger-badge" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ● Durgun / İzleniyor
            </div>
            <div id="sample-rate" class="text-[10px] text-gray-500 font-mono mt-1">60 Hz</div>
          </div>
        </div>

        <!-- Canvas Oscilloscope Viewport -->
        <div class="relative w-full h-44 rounded-xl bg-obsidian-950 border border-white/10 overflow-hidden mb-3">
          <canvas id="seismo-canvas" class="w-full h-full block"></canvas>
          <div class="absolute bottom-2 left-3 text-[10px] text-gray-500 font-mono">
            STA / LTA Gerçek Zamanlı Dinamik Filtre • DC Gravite Ayrıştırma
          </div>
        </div>

        <!-- Calibration & Controls Row -->
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-3 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="text-gray-400 text-[11px] font-medium mr-1">Hassasiyet:</span>
            <button type="button" data-sens="high" class="sens-btn px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${currentSens === 'high' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}">Hassas</button>
            <button type="button" data-sens="normal" class="sens-btn px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${currentSens === 'normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}">Normal</button>
            <button type="button" data-sens="low" class="sens-btn px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${currentSens === 'low' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}">Yüksek Eşik</button>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-seismo-wakelock" type="button" class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
              <span>💡</span><span>Ekranı Açık Tut</span>
            </button>
            <button id="btn-seismo-siren-test" type="button" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition-all flex items-center gap-1.5">
              <span>🚨</span><span>Alarm Testi</span>
            </button>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-semibold text-emerald-300">Canlı Sismik Dinleme Devrede</span>
          </div>

          <span class="text-[11px] text-gray-400 font-medium hidden sm:inline">
            Cihazınızı düz bir masaya veya zemine bıraktığınızda mikrosismik titreşimler kaydedilir.
          </span>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-seismo')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-seismo-wakelock')?.addEventListener('click', () => this.toggleWakeLock());
    this.container.querySelector('#btn-seismo-siren-test')?.addEventListener('click', () => {
      import('../services/soundSynthesizer').then(({ soundSynthesizer }) => {
        soundSynthesizer.playEarlyWarningSiren(1.5);
      });
    });

    this.container.querySelectorAll('.sens-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sens = btn.getAttribute('data-sens') as 'high' | 'normal' | 'low';
        if (sens) {
          seismicSensorNode.setSensitivity(sens);
          this.container.querySelectorAll('.sens-btn').forEach((b) => {
            const isMatch = b.getAttribute('data-sens') === sens;
            b.className = `sens-btn px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              isMatch
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`;
          });
        }
      });
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
