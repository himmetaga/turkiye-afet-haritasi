import { nightWatchService, NightWatchState } from '../services/nightWatchService';
import { seismicSensorNode } from '../services/seismicSensorNode';
import { bindPressAndHold } from './pressAndHold';
import { Icons } from './icons';

/**
 * Night Seismograph Watch HUD
 *  - Intro sheet: explains requirements, starts the watch (tap → iOS permission prompt)
 *  - Ambient OLED screen: pure #000, very dim clock + live STA/LTA trace, anti burn-in drift
 *  - Alarm: full-brightness red/white strobe + big silence button
 */
export class NightWatchHUD {
  private intro: HTMLElement;
  private ambient: HTMLElement;
  private unsub: (() => void) | null = null;
  private clockTimer: number | null = null;
  private driftTimer: number | null = null;
  private strobeTimer: number | null = null;
  private rafId: number | null = null;
  private lastDraw = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private unbindHold: (() => void) | null = null;
  private lastPhase: NightWatchState['phase'] = 'idle';

  constructor(parent: HTMLElement) {
    this.intro = document.createElement('div');
    this.intro.id = 'night-watch-intro';
    this.intro.className =
      'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300';
    this.intro.setAttribute('role', 'dialog');
    this.intro.setAttribute('aria-modal', 'true');
    this.intro.setAttribute('aria-labelledby', 'night-watch-title');
    parent.appendChild(this.intro);

    this.ambient = document.createElement('div');
    this.ambient.id = 'night-watch-ambient';
    this.ambient.className = 'fixed inset-0 z-[95] hidden select-none';
    this.ambient.style.background = '#000000';
    parent.appendChild(this.ambient);

    this.renderIntro();
  }

  public show(): void {
    if (nightWatchService.getState().phase !== 'idle') {
      this.openAmbient();
      return;
    }
    this.renderIntro();
    this.intro.classList.remove('opacity-0', 'pointer-events-none');
    this.intro.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.intro.classList.remove('opacity-100', 'pointer-events-auto');
    this.intro.classList.add('opacity-0', 'pointer-events-none');
  }

  // ------------------------------------------------------------------ intro

  private renderIntro(): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const wakeOk = 'wakeLock' in navigator;
    const motionOk = 'DeviceMotionEvent' in window;

    const check = (ok: boolean, okText: string, badText: string) => `
      <li class="flex items-start gap-2">
        <span class="mt-0.5 grid place-items-center w-4 h-4 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}">
          ${ok ? Icons.checkCircle('w-3 h-3') : Icons.alertTriangle('w-3 h-3')}
        </span>
        <span class="${ok ? 'text-gray-300' : 'text-amber-200'}">${ok ? okText : badText}</span>
      </li>`;

    this.intro.innerHTML = `
      <div class="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl text-white">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </span>
            <div>
              <h2 id="night-watch-title" class="text-base font-bold tracking-wide">Gece Sismograf Nöbeti</h2>
              <p class="text-[11.5px] text-gray-400">Telefonunuz uyurken bekçilik yapsın</p>
            </div>
          </div>
          <button id="btn-close-night-intro" type="button" aria-label="Kapat" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <p class="text-[12.5px] text-gray-300 leading-relaxed mb-4">
          Ekran saf siyaha geçer, yalnızca çok sönük bir saat ve canlı sismograf çizgisi kalır.
          Sürekli bir sarsıntı (STA/LTA) algılanırsa ya da ağdan erken uyarı gelirse
          <strong class="text-rose-300">tam sesli 2.9 kHz siren</strong> ve <strong class="text-rose-300">kırmızı/beyaz flaşör</strong> devreye girer.
        </p>

        <div class="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3.5 mb-4">
          <div class="hud-section-label mb-2">Hazırlık</div>
          <ol class="space-y-1.5 text-[12px] text-gray-300 list-decimal list-inside marker:text-gray-500">
            <li>Telefonu <strong class="text-white">şarja takın</strong> ve sesini sonuna kadar açın.</li>
            <li>Komodin veya zemin gibi <strong class="text-white">düz, sabit bir yüzeye</strong> ekranı yukarı bakacak şekilde koyun.</li>
            <li>Uygulamayı ön planda bırakın; başka uygulamaya geçmeyin.</li>
          </ol>
        </div>

        <ul class="space-y-1.5 text-[11.5px] mb-5">
          ${check(motionOk, 'İvmeölçer desteği mevcut', 'Bu tarayıcı ivmeölçer verisi sağlamıyor — yalnızca ağ erken uyarısı çalışır')}
          ${check(wakeOk, 'Ekran açık tutma (Wake Lock) destekleniyor', 'Wake Lock desteklenmiyor — Otomatik Kilit\'i "Asla" yapın')}
          ${isIOS ? check(true, 'iPhone: Başlat\'a dokununca "Hareket ve Yön" izni istenecek', '') : ''}
        </ul>

        <div class="flex items-center gap-2">
          <button id="btn-night-test" type="button" class="hud-control px-3.5 text-[12px] font-semibold text-gray-200 flex items-center gap-1.5">
            ${Icons.bell('w-4 h-4')} Sesi Test Et
          </button>
          <button id="btn-night-start" type="button"
            class="flex-1 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white text-[13px] font-bold tracking-wide shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] transition-all">
            Gece Sismograf Nöbetini Başlat
          </button>
        </div>
        <p class="mt-3 text-[10.5px] text-gray-500 leading-relaxed">
          Bu özellik resmi bir erken uyarı sisteminin yerini tutmaz; ek bir farkındalık katmanıdır.
          AFAD ve Kandilli bildirimlerini de açık tutun.
        </p>
      </div>
    `;

    this.intro.querySelector('#btn-close-night-intro')?.addEventListener('click', () => this.hide());
    this.intro.querySelector('#btn-night-test')?.addEventListener('click', () => nightWatchService.testAlarm());
    this.intro.querySelector('#btn-night-start')?.addEventListener('click', () => this.handleStart());
    this.intro.onclick = (e) => {
      if (e.target === this.intro) this.hide();
    };
  }

  private async handleStart(): Promise<void> {
    // Fullscreen must be requested synchronously in the gesture (before any await).
    try {
      const el: any = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
    } catch {}

    const btn = this.intro.querySelector('#btn-night-start') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'İzinler alınıyor…';
    }

    const state = await nightWatchService.start();
    this.hide();

    if (state.motionPermission === 'denied') {
      // Still useful for network early warnings, but tell the user clearly.
      this.openAmbient('İvmeölçer izni reddedildi. Ayarlar › Safari › Hareket ve Yön Erişimi\'ni açın. Ağ erken uyarısı aktif.');
    } else {
      this.openAmbient();
    }
  }

  // ---------------------------------------------------------------- ambient

  private openAmbient(notice?: string): void {
    this.ambient.classList.remove('hidden');
    this.ambient.innerHTML = `
      <div id="nw-drift" class="absolute inset-0 flex flex-col items-center justify-center px-6 transition-transform duration-[3000ms] ease-in-out">
        <div id="nw-dim" class="flex flex-col items-center w-full max-w-xl" style="opacity:0.38">
          <div id="nw-clock" class="font-mono font-light tracking-tight text-[22vw] sm:text-[9rem] leading-none" style="color:#7f1d1d">--:--</div>
          <div id="nw-date" class="mt-2 text-[13px] tracking-[0.2em] uppercase" style="color:#57534e"></div>

          <div class="relative w-full h-28 mt-10">
            <canvas id="nw-canvas" class="w-full h-full block"></canvas>
          </div>

          <div id="nw-status" class="mt-6 text-center text-[13px] font-medium" style="color:#78716c">
            Sismik Nöbet Aktif — Deprem Anında Tam Sesli Alarm Çalacak
          </div>
          <div id="nw-meta" class="mt-2 font-mono text-[11px] tracking-wide" style="color:#44403c"></div>
          ${notice ? `<div class="mt-4 max-w-sm text-center text-[11.5px]" style="color:#a16207">${notice}</div>` : ''}
        </div>
      </div>

      <div id="nw-alarm" class="absolute inset-0 hidden flex-col items-center justify-center gap-6 px-6 text-center">
        <div class="text-[11vw] sm:text-7xl font-black tracking-tight leading-none text-black mix-blend-difference" style="color:#fff">DEPREM!</div>
        <div class="text-xl sm:text-2xl font-extrabold" style="color:#fff">ÇÖK · KAPAN · TUTUN</div>
        <div id="nw-alarm-src" class="text-[13px] font-semibold" style="color:#fff;opacity:.85"></div>
        <button id="btn-nw-silence" type="button"
          class="mt-4 px-8 py-5 rounded-3xl bg-black text-white text-lg font-black tracking-wide border-4 border-white active:scale-95 transition-transform">
          ALARMI SUSTUR
        </button>
      </div>

      <div class="absolute bottom-0 inset-x-0 flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button id="btn-nw-exit" type="button"
          class="relative overflow-hidden px-5 py-2.5 rounded-full text-[12px] font-semibold border"
          style="color:#57534e;border-color:#1c1917;background:#0a0a0a">
          <span id="nw-exit-fill" class="absolute inset-y-0 left-0 w-0" style="background:#1c1917"></span>
          <span class="relative">Nöbeti bitirmek için basılı tutun</span>
        </button>
      </div>
    `;

    this.canvas = this.ambient.querySelector('#nw-canvas');
    this.initCanvas();

    const exitBtn = this.ambient.querySelector('#btn-nw-exit') as HTMLElement;
    const fill = this.ambient.querySelector('#nw-exit-fill') as HTMLElement;
    this.unbindHold?.();
    this.unbindHold = bindPressAndHold(exitBtn, {
      durationMs: 1200,
      onProgress: (r) => (fill.style.width = `${r * 100}%`),
      onComplete: () => this.exit()
    });
    this.ambient.querySelector('#btn-nw-silence')?.addEventListener('click', () => nightWatchService.silenceAlarm());

    this.unsub?.();
    this.unsub = nightWatchService.subscribe((s) => this.onState(s));

    this.tickClock();
    this.clockTimer = window.setInterval(() => this.tickClock(), 1000);
    // OLED burn-in protection: drift the whole layout a few px every minute.
    this.driftTimer = window.setInterval(() => {
      const drift = this.ambient.querySelector('#nw-drift') as HTMLElement | null;
      if (drift) drift.style.transform = `translate(${Math.round((Math.random() - 0.5) * 24)}px, ${Math.round((Math.random() - 0.5) * 32)}px)`;
    }, 60_000);

    const loop = (t: number) => {
      if (t - this.lastDraw > 33) {
        this.lastDraw = t;
        this.draw();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private exit(): void {
    nightWatchService.stop();
    this.teardownAmbient();
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch {}
  }

  private teardownAmbient(): void {
    this.unsub?.();
    this.unsub = null;
    this.unbindHold?.();
    this.unbindHold = null;
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.driftTimer) clearInterval(this.driftTimer);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.clockTimer = this.driftTimer = this.rafId = null;
    this.stopStrobe();
    this.ambient.classList.add('hidden');
    this.ambient.innerHTML = '';
    this.lastPhase = 'idle';
  }

  private onState(s: NightWatchState): void {
    const meta = this.ambient.querySelector('#nw-meta');
    const status = this.ambient.querySelector('#nw-status');

    if (meta) {
      const parts = [
        `STA/LTA ${s.staLtaRatio.toFixed(2)}`,
        s.sensorReceiving ? 'SENSÖR ●' : 'SENSÖR ○',
        s.wakeLockActive ? 'EKRAN KİLİDİ AÇIK' : 'WAKE LOCK YOK'
      ];
      meta.textContent = parts.join('  ·  ');
    }
    if (status) {
      status.textContent =
        s.phase === 'arming'
          ? `Nöbet ${s.armingRemainingSec} sn içinde başlıyor — telefonu düz bir yere bırakın`
          : 'Sismik Nöbet Aktif — Deprem Anında Tam Sesli Alarm Çalacak';
    }

    if (s.phase === 'alarm' && this.lastPhase !== 'alarm') this.enterAlarm(s);
    if (s.phase !== 'alarm' && this.lastPhase === 'alarm') this.leaveAlarm();
    if (s.phase === 'idle' && this.lastPhase !== 'idle') this.teardownAmbient();
    this.lastPhase = s.phase;
  }

  private enterAlarm(s: NightWatchState): void {
    const alarm = this.ambient.querySelector('#nw-alarm') as HTMLElement | null;
    const dim = this.ambient.querySelector('#nw-drift') as HTMLElement | null;
    const src = this.ambient.querySelector('#nw-alarm-src');
    if (src) src.textContent = s.alarmSource === 'network' ? 'Ağ erken uyarısı alındı' : 'Cihaz sensörü sürekli sarsıntı algıladı';
    dim?.classList.add('hidden');
    alarm?.classList.remove('hidden');
    alarm?.classList.add('flex');
    let on = false;
    this.strobeTimer = window.setInterval(() => {
      this.ambient.style.background = on ? '#FFFFFF' : '#DC2626';
      on = !on;
    }, 140);
  }

  private leaveAlarm(): void {
    this.stopStrobe();
    const alarm = this.ambient.querySelector('#nw-alarm') as HTMLElement | null;
    alarm?.classList.add('hidden');
    alarm?.classList.remove('flex');
    this.ambient.querySelector('#nw-drift')?.classList.remove('hidden');
  }

  private stopStrobe(): void {
    if (this.strobeTimer) clearInterval(this.strobeTimer);
    this.strobeTimer = null;
    this.ambient.style.background = '#000000';
  }

  private tickClock(): void {
    const now = new Date();
    const clock = this.ambient.querySelector('#nw-clock');
    const date = this.ambient.querySelector('#nw-date');
    if (clock) clock.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (date) date.textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private initCanvas(): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.ctx = this.canvas.getContext('2d');
    this.ctx?.scale(dpr, dpr);
  }

  private draw(): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const mid = h / 2;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(120, 113, 108, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    const buf = seismicSensorNode.getBuffer();
    if (buf.length < 2) return;
    const step = w / Math.max(1, buf.length - 1);
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < buf.length; i++) {
      // Alternate sign so the trace looks like a seismogram instead of a one-sided envelope.
      const y = mid - (i % 2 === 0 ? 1 : -1) * Math.min(mid - 2, buf[i].magnitude * h * 0.45);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * step, y);
    }
    ctx.stroke();
  }
}
