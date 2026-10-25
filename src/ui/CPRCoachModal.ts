import { Icons } from './icons';
import { civilDefenseProtocols, CPRState } from '../services/civilDefenseProtocols';

export class CPRCoachModal {
  private container: HTMLElement;
  private isRunning = false;
  private currentCycle = 1;
  private currentCount = 0;
  private currentPhase: 'compress' | 'breathe' = 'compress';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'cpr-coach-modal';
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
    this.stopCPR();
    this.container.classList.add('hidden');
  }

  private toggleCPR(): void {
    if (this.isRunning) {
      this.stopCPR();
    } else {
      this.startCPR();
    }
    this.render();
  }

  private startCPR(): void {
    this.isRunning = true;
    civilDefenseProtocols.startCPRCoach((state: CPRState) => {
      this.currentCycle = state.cycleCount;
      this.currentCount = state.compressionCount;
      this.currentPhase = state.phase;
      this.updateCPRDisplay();
    });
  }

  private stopCPR(): void {
    this.isRunning = false;
    civilDefenseProtocols.stopCPRCoach();
    this.currentCount = 0;
    this.currentPhase = 'compress';
  }

  private updateCPRDisplay(): void {
    const countEl = this.container.querySelector('#cpr-count-display') as HTMLElement | null;
    const cycleEl = this.container.querySelector('#cpr-cycle-display') as HTMLElement | null;
    const promptEl = this.container.querySelector('#cpr-prompt-display') as HTMLElement | null;
    const beatRing = this.container.querySelector('#cpr-beat-ring') as HTMLElement | null;

    if (countEl) countEl.textContent = this.currentPhase === 'compress' ? `${this.currentCount}` : '2 NEFES';
    if (cycleEl) cycleEl.textContent = `Döngü #${this.currentCycle}`;
    if (promptEl) {
      if (this.currentPhase === 'compress') {
        promptEl.innerHTML = `<span class="text-rose-400 font-bold">GÖĞÜS BASISI YAPIN (5-6 CM)</span>`;
      } else {
        promptEl.innerHTML = `<span class="text-sky-300 font-bold">2 GÜÇLÜ SUNİ SOLUK VERİN</span>`;
      }
    }
    if (beatRing) {
      beatRing.classList.remove('scale-100');
      beatRing.classList.add('scale-110');
      setTimeout(() => {
        beatRing.classList.remove('scale-110');
        beatRing.classList.add('scale-100');
      }, 90);
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-sm sm:max-w-md flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03]">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
              🫀
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Sahra Kalp Masajı (CPR)</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  110 BPM
                </span>
              </div>
              <p class="text-[11px] text-gray-400">AHA & ERC Standartlarında Sesli & Titreşimli Metronom</p>
            </div>
          </div>
          <button id="btn-close-cpr" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body & Visual Metronome Circle -->
        <div class="p-5 flex flex-col items-center justify-center gap-4 text-center">
          <div
            id="cpr-beat-ring"
            class="relative w-44 h-44 rounded-full ios27-glass border-4 ${
              this.isRunning ? 'border-rose-500 shadow-glow-red' : 'border-white/15'
            } flex flex-col items-center justify-center transition-transform ios27-spring"
          >
            <span id="cpr-cycle-display" class="text-[10px] font-mono font-bold text-gray-400">Döngü #${this.currentCycle}</span>
            <span id="cpr-count-display" class="text-5xl font-black font-mono tracking-tight text-white my-1">
              ${this.isRunning ? (this.currentPhase === 'compress' ? this.currentCount : '2 NEFES') : '110'}
            </span>
            <span class="text-[9.5px] font-mono text-gray-400 uppercase tracking-widest">
              ${this.isRunning ? '30 BASI : 2 NEFES' : 'BPM TEMPO'}
            </span>
          </div>

          <div id="cpr-prompt-display" class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-center font-mono w-full">
            ${this.isRunning ? 'Ritimle birlikte göğüs kemiğine bastırın' : 'Başlamak için butona dokunun'}
          </div>

          <!-- Main Action Button -->
          <button
            id="btn-toggle-cpr-active"
            type="button"
            class="w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl transition-all ios27-spring ios27-tap-bounce ${
              this.isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-red'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald'
            }"
          >
            <span>${this.isRunning ? '⏹' : '▶'}</span>
            <span>${this.isRunning ? 'METRONOMU DURDUR' : '110 BPM CPR BAŞLAT'}</span>
          </button>

          <!-- Critical Field Medicine Rules -->
          <div class="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-300 text-left space-y-1">
            <p><strong>⚠️ Ezilme (Crush) Sendromu:</strong> Enkazdan çıkan ve saatlerce sıkışmış kişiye ASLA aniden bol su içirmeyin! Kas toksinleri böbrek iflasına ve ani kalp durmasına yol açabilir.</p>
            <p><strong>🩺 Bası Noktası:</strong> İki meme ucunun tam ortasına, göğüs kemiğinin alt yarısına el ayasını kilitleyerek dik açıyla en az 5-6 cm bastırın.</p>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-cpr')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-toggle-cpr-active')?.addEventListener('click', () => this.toggleCPR());
  }
}
