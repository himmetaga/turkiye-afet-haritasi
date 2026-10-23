import { AssemblyPoint } from '../types';
import { Icons } from './icons';

export interface FamilySafetyContext {
  userCoords: [number, number] | null;
  nearestPoint: AssemblyPoint | null;
  onReportObstacle?: () => void;
}

export class FamilySafetyHUD {
  private container: HTMLElement;
  private context: FamilySafetyContext = { userCoords: null, nearestPoint: null };
  private batteryPct = 'Bilinmiyor';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md hidden';
    parent.appendChild(this.container);

    this.checkBattery();
  }

  private async checkBattery(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const b = await (navigator as any).getBattery();
        this.batteryPct = `%${Math.round(b.level * 100)}`;
      } catch {}
    }
  }

  public show(context: FamilySafetyContext): void {
    this.context = context;
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private getSafeMessage(): string {
    const coords = this.context.userCoords;
    const point = this.context.nearestPoint;
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let msg = `[AFET BİLDİRİMİ - BEN GÜVENDEYİM]\n`;
    msg += `Saat: ${time}\n`;
    msg += `Şarjım: ${this.batteryPct}\n`;
    if (coords) {
      msg += `Konumum: https://maps.google.com/?q=${coords[1]},${coords[0]}\n`;
    }
    if (point) {
      msg += `Bulunduğum/Gittiğim Toplanma Alanı: ${point.name} (${point.district})\n`;
    }
    msg += `Durumum iyi, lütfen hatları meşgul etmeyin. SMS ile haberleşelim.`;
    return msg;
  }

  private getNeedHelpMessage(): string {
    const coords = this.context.userCoords;
    const point = this.context.nearestPoint;
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let msg = `[ACİL YARDIM ÇAĞRISI]\n`;
    msg += `Saat: ${time}\n`;
    msg += `Şarjım: ${this.batteryPct}\n`;
    if (coords) {
      msg += `Tam Konumum: https://maps.google.com/?q=${coords[1]},${coords[0]} (${coords[1].toFixed(5)}, ${coords[0].toFixed(5)})\n`;
    }
    if (point) {
      msg += `En Yakın Toplanma Alanı: ${point.name}\n`;
    }
    msg += `Acil desteğe / arama-kurtarmaya ihtiyacım var!`;
    return msg;
  }

  private render(): void {
    const safeMsg = this.getSafeMessage();
    const helpMsg = this.getNeedHelpMessage();

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg hud-glass rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="text-xl">👨‍👩‍👧‍👦</span>
            <div>
              <h2 class="text-sm font-bold tracking-wider text-emerald-400 uppercase">
                Ailem Güvende & Durum Bildir
              </h2>
              <p class="text-[11px] text-gray-400">Şebeke kilitlendiğinde tek tıkla konumlu durum iletisi</p>
            </div>
          </div>
          <button id="btn-close-family" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Ben Güvendeyim -->
          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase mb-1">
                <span>🟢</span>
                <span>Ben İyiyim / Güvendeyim</span>
              </div>
              <p class="text-[11px] text-gray-300 mb-3">
                Aile fertlerine iyi olduğunuzu, şarjınızı ve konumunuzu tek tıkla iletin.
              </p>
            </div>

            <div class="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <a
                href="sms:?body=${encodeURIComponent(safeMsg)}"
                class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-emerald transition-all text-center"
              >
                ${Icons.share('w-3.5 h-3.5')}
                <span>SMS ile Herkese Gönder</span>
              </a>
              <a
                href="https://api.whatsapp.com/send?text=${encodeURIComponent(safeMsg)}"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition-colors text-center"
              >
                <span>WhatsApp Paylaş</span>
              </a>
            </div>
          </div>

          <!-- Acil Yardım Lazım -->
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase mb-1">
                <span>🔴</span>
                <span>Acil Yardım Lazım</span>
              </div>
              <p class="text-[11px] text-gray-300 mb-3">
                Tam koordinatlarınızı ve en yakın toplanma alanını kurtarma ekiplerine iletir.
              </p>
            </div>

            <div class="space-y-1.5 pt-2 border-t border-rose-500/20">
              <a
                href="sms:?body=${encodeURIComponent(helpMsg)}"
                class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-glow-red transition-all text-center"
              >
                ${Icons.share('w-3.5 h-3.5')}
                <span>Acil SMS İlet</span>
              </a>
              <a
                href="https://api.whatsapp.com/send?text=${encodeURIComponent(helpMsg)}"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition-colors text-center"
              >
                <span>WhatsApp İlet</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Enkaz ve Kapalı Yol Bildirimi -->
        <div class="p-3.5 rounded-2xl bg-white/5 flex items-center justify-between gap-3">
          <div>
            <span class="text-xs font-semibold text-white block">Enkaz / Kapalı Sokak Bildir</span>
            <span class="text-[10px] text-gray-400 block">Bulunduğunuz noktayı kapalı rota olarak haritaya ekleyin</span>
          </div>
          <button
            id="btn-report-obstacle"
            class="py-2 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>⚠️</span>
            <span>Enkaz Ekle</span>
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-family') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hide());

    const obstacleBtn = this.container.querySelector('#btn-report-obstacle') as HTMLButtonElement;
    obstacleBtn.addEventListener('click', () => {
      this.hide();
      this.context.onReportObstacle?.();
    });
  }
}
