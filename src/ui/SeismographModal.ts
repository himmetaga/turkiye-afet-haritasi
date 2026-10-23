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

  private updateStatusUI(status: SeismicNodeStatus): void {
    const ratioEl = this.container.querySelector('#sta-lta-ratio');
    if (ratioEl) ratioEl.textContent = status.staLtaRatio.toFixed(2);

    const magEl = this.container.querySelector('#current-mag');
    if (magEl) magEl.textContent = `${status.currentMag.toFixed(2)} m/s²`;

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

          <button id="btn-close-seismo" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Telemetry Metrics Bar -->
        <div class="grid grid-cols-4 gap-2.5 mb-4">
          <div class="rounded-xl bg-white/5 p-2.5 text-center">
            <span class="text-[10px] text-gray-400 font-mono uppercase">STA/LTA Oranı</span>
            <div id="sta-lta-ratio" class="text-lg font-bold font-mono text-emerald-400 mt-0.5">1.00</div>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5 text-center">
            <span class="text-[10px] text-gray-400 font-mono uppercase">İvme Vektörü</span>
            <div id="current-mag" class="text-lg font-bold font-mono text-cyan-400 mt-0.5">0.00 m/s²</div>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5 text-center">
            <span class="text-[10px] text-gray-400 font-mono uppercase">Örnekleme Hızı</span>
            <div id="sample-rate" class="text-lg font-bold font-mono text-amber-400 mt-0.5">60 Hz</div>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5 flex flex-col items-center justify-center">
            <div id="trigger-badge" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ● Durgun / İzleniyor
            </div>
          </div>
        </div>

        <!-- Canvas Oscilloscope Viewport -->
        <div class="relative w-full h-48 rounded-xl bg-obsidian-950 border border-white/10 overflow-hidden mb-4">
          <canvas id="seismo-canvas" class="w-full h-full block"></canvas>
          <div class="absolute bottom-2 left-3 text-[10px] text-gray-500 font-mono">
            STA Eşik Değeri: 3.2x LTA • Filtre: DC Gravite Ayrıştırma
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex items-center justify-between gap-3 pt-2">
          <button
            id="btn-simulate-tremor"
            class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>⚡ Test Sarsıntısı Simüle Et</span>
          </button>

          <span class="text-[11px] text-gray-400 font-medium">
            Cihazınızı düz bir zemine koyduğunuzda arka plan izlemesi başlar.
          </span>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-seismo')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-simulate-tremor')?.addEventListener('click', () => {
      seismicSensorNode.simulateTremor(2.4);
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
