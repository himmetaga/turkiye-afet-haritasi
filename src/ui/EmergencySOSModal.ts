import { rescueWhistle } from '../services/audioService';
import { AssemblyPoint } from '../types';
import { Icons } from './icons';

export interface SOSContext {
  userCoords: [number, number] | null;
  nearestPoint: AssemblyPoint | null;
}

export class EmergencySOSModal {
  private container: HTMLElement;
  private isWhistleActive = false;
  private currentContext: SOSContext = { userCoords: null, nearestPoint: null };

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md hidden transition-opacity';
    parent.appendChild(this.container);
  }

  public show(context: SOSContext): void {
    this.currentContext = context;
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    if (this.isWhistleActive) {
      rescueWhistle.stop();
      this.isWhistleActive = false;
    }
    this.container.classList.add('hidden');
  }

  private generateSOSText(): string {
    const coords = this.currentContext.userCoords;
    const point = this.currentContext.nearestPoint;

    let text = `ACİL DURUM / AFET BİLDİRİMİ!\n`;
    if (coords) {
      text += `Konum Koordinatım: ${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}\n`;
      text += `Harita Linki: https://maps.google.com/?q=${coords[1]},${coords[0]}\n`;
    } else {
      text += `Konum: GPS sinyali bekleniyor.\n`;
    }

    if (point) {
      text += `Yöneldiğim / En Yakın Toplanma Alanı: ${point.name} (${point.district}, ${point.city})\n`;
    }
    text += `Durum: Güvenli alana ulaşmaya çalışıyorum / Yardıma ihtiyacım var.\nZaman: ${new Date().toLocaleString('tr-TR')}`;
    return text;
  }

  private toggleWhistle(): void {
    this.isWhistleActive = rescueWhistle.toggle();
    const btn = this.container.querySelector('#btn-toggle-whistle');
    const statusText = this.container.querySelector('#whistle-status-text');
    const visualizer = this.container.querySelector('#whistle-visualizer');

    if (this.isWhistleActive) {
      btn?.classList.add('bg-rose-600', 'text-white', 'shadow-glow-red');
      btn?.classList.remove('bg-white/10', 'text-rose-400');
      if (statusText) statusText.textContent = 'DÜDÜK ÇALIYOR (3000 Hz) - DURDURMAK İÇİN DOKUNUN';
      visualizer?.classList.remove('opacity-0');
    } else {
      btn?.classList.remove('bg-rose-600', 'text-white', 'shadow-glow-red');
      btn?.classList.add('bg-white/10', 'text-rose-400');
      if (statusText) statusText.textContent = '3000 Hz KURTARMA DÜDÜĞÜNÜ BAŞLAT';
      visualizer?.classList.add('opacity-0');
    }
  }

  private render(): void {
    const sosMessage = this.generateSOSText();
    const smsUrl = `sms:?body=${encodeURIComponent(sosMessage)}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(sosMessage)}`;

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg hud-glass rounded-3xl p-6 shadow-2xl border-none">
        <div class="flex items-center justify-between pb-4 border-b border-white/10">
          <div class="flex items-center gap-2.5">
            <div class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
            <h2 class="text-base font-bold tracking-wider text-rose-400 uppercase">
              Acil Durum & Kurtarma Modu
            </h2>
          </div>
          <button id="btn-close-sos" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <div class="my-5 text-center">
          <div id="whistle-visualizer" class="flex justify-center items-center gap-1.5 h-10 mb-2 transition-opacity opacity-0">
            <span class="w-1.5 h-8 bg-rose-500 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-10 bg-rose-400 rounded-full animate-pulse"></span>
            <span class="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-10 bg-rose-400 rounded-full animate-pulse"></span>
            <span class="w-1.5 h-8 bg-rose-500 rounded-full animate-bounce"></span>
          </div>

          <button
            id="btn-toggle-whistle"
            class="w-full py-4 px-6 rounded-2xl ${
              this.isWhistleActive ? 'bg-rose-600 text-white shadow-glow-red' : 'bg-white/10 text-rose-400'
            } hover:bg-rose-500 hover:text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-3"
          >
            ${Icons.whistle('w-6 h-6')}
            <span id="whistle-status-text">
              ${this.isWhistleActive ? 'DÜDÜK ÇALIYOR (3000 Hz) - DURDUR' : '3000 Hz KURTARMA DÜDÜĞÜNÜ BAŞLAT'}
            </span>
          </button>
          <p class="text-[11px] text-gray-400 mt-2">
            İnternet veya ses dosyası gerektirmez. Doğrudan tarayıcı çipinden 3000 Hz SAR standardında periyodik sinyal yayar.
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs text-gray-300">
            <span class="font-medium">Hazır SOS Kurtarma Mesajı</span>
            <button id="btn-copy-sos" class="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
              ${Icons.copy('w-3.5 h-3.5')}
              <span id="copy-text">Panoya Kopyala</span>
            </button>
          </div>

          <textarea
            id="sos-textarea"
            readonly
            rows="4"
            class="w-full p-3 text-xs font-mono text-gray-200 bg-black/40 rounded-xl resize-none outline-none border-none selection:bg-rose-500/30"
          >${sosMessage}</textarea>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <a
              href="${smsUrl}"
              class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-glow-red transition-all text-center"
            >
              ${Icons.share('w-4 h-4')}
              <span>SMS ile Gönder</span>
            </a>

            <a
              href="${waUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-emerald transition-all text-center"
            >
              ${Icons.share('w-4 h-4')}
              <span>WhatsApp İlet</span>
            </a>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-sos') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hide());

    const whistleBtn = this.container.querySelector('#btn-toggle-whistle') as HTMLButtonElement;
    whistleBtn.addEventListener('click', () => this.toggleWhistle());

    const copyBtn = this.container.querySelector('#btn-copy-sos') as HTMLButtonElement;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(sosMessage);
        const copyText = this.container.querySelector('#copy-text');
        if (copyText) {
          copyText.textContent = 'Kopyalandı!';
          setTimeout(() => {
            copyText.textContent = 'Panoya Kopyala';
          }, 2000);
        }
      } catch {}
    });
  }
}
