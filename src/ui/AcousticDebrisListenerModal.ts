import { Icons } from './icons';
import { soundSynthesizer } from '../services/soundSynthesizer';

export class AcousticDebrisListenerModal {
  private container: HTMLElement;
  private isListening = false;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  // Eşik, mikrofon sinyalinin göreli seviyesidir (%). Kalibre edilmiş dB DEĞİLDİR.
  private threshold = 50;
  private triggeredCount = 0;
  private lastTriggerTime = 0;
  private onTriggerWhistle?: () => void;

  constructor(parent: HTMLElement, onTriggerWhistle?: () => void) {
    this.onTriggerWhistle = onTriggerWhistle;

    this.container = document.createElement('div');
    this.container.id = 'acoustic-debris-listener-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.stopListening();
    this.container.classList.add('hidden');
  }

  public async startListening(): Promise<void> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.micStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.isListening = true;
      this.render();
      this.monitorAudio();
    } catch (err) {
      alert('Mikrofon erişimi sağlanamadı. Lütfen tarayıcı izinlerini kontrol edin.');
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.render();
  }

  private monitorAudio(): void {
    if (!this.isListening || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Göreli seviye (0-100). Telefon mikrofonu kalibre olmadığı için dB olarak gösterilmez.
    const currentDb = Math.round((average / 255) * 100);

    const meterBar = this.container.querySelector('#vu-meter-bar') as HTMLElement | null;
    const dbValueEl = this.container.querySelector('#vu-db-value') as HTMLElement | null;

    if (meterBar) {
      const pct = Math.min(100, Math.max(2, currentDb));
      meterBar.style.width = `${pct}%`;
      meterBar.className = `h-full rounded-full transition-all duration-75 ${
        currentDb >= this.threshold ? 'bg-rose-500' : currentDb >= this.threshold - 10 ? 'bg-amber-400' : 'bg-emerald-400'
      }`;
    }

    if (dbValueEl) {
      dbValueEl.textContent = `%${currentDb}`;
    }

    const now = Date.now();
    if (currentDb >= this.threshold && now - this.lastTriggerTime > 2500) {
      this.lastTriggerTime = now;
      this.handleSoundTriggered(currentDb);
    }

    this.animFrameId = requestAnimationFrame(() => this.monitorAudio());
  }

  private handleSoundTriggered(db: number): void {
    this.triggeredCount += 1;
    const countEl = this.container.querySelector('#trigger-count') as HTMLElement | null;
    if (countEl) countEl.textContent = `${this.triggeredCount} Kez`;

    // Kısa bir bip çalar ve düdük ekranını açar (düdüğü kendiliğinden başlatmaz)
    try {
      soundSynthesizer.playCountdownBeep(950, 200);
      if (this.onTriggerWhistle) {
        this.onTriggerWhistle();
      }
    } catch {}

    const banner = this.container.querySelector('#trigger-banner') as HTMLElement | null;
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => banner?.classList.add('hidden'), 2000);
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              ${Icons.mic('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Gürültü Eşiği Uyarıcısı (deneysel)</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  this.isListening ? 'bg-emerald-500 text-black animate-pulse' : 'bg-white/10 text-gray-400'
                }">
                  ${this.isListening ? 'DİNLİYOR...' : 'PASİF'}
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Ortam sesi ayarladığınız eşiği aşınca kısa bir bip çalar ve düdük ekranını açar. Sesin kaynağını ayırt edemez.</p>
            </div>
          </div>
          <button id="btn-close-listener-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <!-- Alert Banner on Trigger -->
          <div id="trigger-banner" class="hidden p-3 rounded-xl bg-rose-500 text-white font-bold text-center animate-bounce">
            Eşik üstü ses algılandı — kısa bip çalındı. Düdüğü kendiniz başlatın.
          </div>

          <!-- VU Meter -->
          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-gray-300">MİKROFON SEVİYESİ (göreli, dB değil)</span>
              <span id="vu-db-value" class="font-mono text-cyan-400 text-sm">Ölçüm yok</span>
            </div>
            <div class="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div id="vu-meter-bar" class="h-full rounded-full bg-emerald-400 transition-all duration-75" style="width: 5%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Sessiz (%0)</span>
              <span class="text-amber-400">Eşik (%${this.threshold})</span>
              <span>Gürültülü (%100)</span>
            </div>
          </div>

          <!-- Threshold Slider -->
          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <label for="input-db-threshold" class="font-bold text-gray-200">Tetiklenme Eşiği:</label>
              <span id="label-threshold" class="font-mono text-amber-300 font-bold">%${this.threshold}</span>
            </div>
            <input
              id="input-db-threshold"
              type="range"
              min="20"
              max="80"
              step="1"
              value="${this.threshold}"
              class="w-full accent-amber-400 cursor-pointer"
            />
            <p class="text-[10px] text-gray-400">Eşiği düşürürseniz daha sessiz seslerde, yükseltirseniz yalnızca yüksek seslerde bip çalar. Her tür gürültü (konuşma, rüzgar, kendi bip sesi) tetikleyebilir.</p>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-3">
            ${
              !this.isListening
                ? `
              <button
                id="btn-start-mic-listening"
                type="button"
                class="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                ${Icons.mic('w-4 h-4')}
                <span>Dinlemeyi Başlat</span>
              </button>
            `
                : `
              <button
                id="btn-stop-mic-listening"
                type="button"
                class="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Dinlemeyi Durdur</span>
              </button>
            `
            }
          </div>

          <!-- Stats & Guide -->
          <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-gray-300">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-gray-400">Eşik aşımı sayısı:</span>
              <span id="trigger-count" class="font-mono font-bold text-rose-400">${this.triggeredCount} Kez</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed pt-1 border-t border-white/5">
              ⚠️ <strong>Sınırlar:</strong> Bu araç kurtarma ekiplerini tanıyamaz ve yerinizi kimseye bildirmez; yalnızca gürültü eşiği aşılınca bip çalar. Ekran kapanırsa veya tarayıcı arka plana geçerse çalışmaz, pili de tüketir. Sesinizi duyurmak için düdük ekranını veya üç vuruş yöntemini kullanın.
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-listener-modal')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-start-mic-listening')?.addEventListener('click', () => {
      this.startListening();
    });

    q<HTMLButtonElement>('#btn-stop-mic-listening')?.addEventListener('click', () => {
      this.stopListening();
    });

    q<HTMLInputElement>('#input-db-threshold')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      this.threshold = val;
      const label = q<HTMLElement>('#label-threshold');
      if (label) label.textContent = `%${val}`;
    });
  }
}
