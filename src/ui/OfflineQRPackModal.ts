import qrcode from 'qrcode-generator';
import { Icons } from './icons';

export interface QRPackState {
  status: 'SAFE' | 'HELP';
  name: string;
  bloodGroup: string;
  peopleCount: number;
  note: string;
  batteryLevel?: number;
}

const STORAGE_KEY = 'afet_live_qr_pack_v2';

export class OfflineQRPackModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private state: QRPackState;

  constructor(parent: HTMLElement, userCoords: [number, number]) {
    this.userCoords = userCoords;
    this.state = this.loadState();

    this.container = document.createElement('div');
    this.container.id = 'offline-qr-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.initBattery();
    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public show(preferredStatus?: 'SAFE' | 'HELP'): void {
    if (preferredStatus) {
      this.state.status = preferredStatus;
    }
    this.updateBatteryAndRender();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private loadState(): QRPackState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      status: 'SAFE',
      name: '',
      bloodGroup: 'Bilinmiyor',
      peopleCount: 1,
      note: ''
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  private async initBattery(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const b: any = await (navigator as any).getBattery();
        this.state.batteryLevel = Math.round(b.level * 100);
      } catch {}
    }
  }

  private async updateBatteryAndRender(): Promise<void> {
    await this.initBattery();
    this.render();
  }

  private generatePayload(): string {
    const isSafe = this.state.status === 'SAFE';
    const [lng, lat] = this.userCoords;
    const now = new Date();
    const timeStr = now.toLocaleString('tr-TR');
    const mapsLink = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    // Concise, standard plain text that any mobile phone camera or terminal can parse
    const lines = [
      `AFET.LIVE ACİL DURUM KİMLİĞİ`,
      `DURUM: ${isSafe ? 'GÜVENDEYİM (İyiyim)' : 'ACİL YARDIM GEREKLİ!'}`,
      `ZAMAN: ${timeStr}`,
      `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      `HARİTA: ${mapsLink}`,
      this.state.name ? `KİŞİ: ${this.state.name}` : '',
      `KİŞİ SAYISI: ${this.state.peopleCount}`,
      this.state.bloodGroup !== 'Bilinmiyor' ? `KAN GRUBU: ${this.state.bloodGroup}` : '',
      this.state.batteryLevel !== undefined ? `PİL: %${this.state.batteryLevel}` : '',
      this.state.note ? `NOT: ${this.state.note}` : ''
    ].filter(Boolean);

    return lines.join('\n');
  }

  private generateQRCodeSvg(text: string): string {
    try {
      // Type 0 = auto-fit, 'M' error correction gives high reliability even with dirt/scratches
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      // createSvgTag returns an SVG string with white background and black modules
      return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) {
      return `<div class="p-8 text-rose-400 text-xs">QR oluşturulamadı.</div>`;
    }
  }

  private render(): void {
    const payload = this.generatePayload();
    const qrSvg = this.generateQRCodeSvg(payload);
    const isSafe = this.state.status === 'SAFE';

    const bloodOptions = ['Bilinmiyor', '0 RH+', '0 RH-', 'A RH+', 'A RH-', 'B RH+', 'B RH-', 'AB RH+', 'AB RH-'];

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-obsidian-900 border border-white/10 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-obsidian-950/60">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
              ${Icons.qrCode('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
                  Çevrimdışı "Güvendeyim" QR Paketi
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300">
                  %100 İnternetsiz
                </span>
              </div>
              <p class="text-[11px] text-gray-400">
                Baz istasyonu çöktüğünde arama-kurtarma görevlilerine kamerayla anında okunur
              </p>
            </div>
          </div>

          <button id="btn-close-qr" type="button" aria-label="Kapat" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <!-- Status Toggle Tabs -->
          <div class="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              id="btn-qr-status-safe"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isSafe
                  ? 'bg-emerald-500 text-obsidian-950 shadow-glow-emerald'
                  : 'text-gray-400 hover:text-white'
              }"
            >
              <span>✓</span>
              <span>GÜVENDEYİM</span>
            </button>
            <button
              id="btn-qr-status-help"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                !isSafe
                  ? 'bg-rose-500 text-white shadow-glow-rose'
                  : 'text-gray-400 hover:text-white'
              }"
            >
              <span>🚨</span>
              <span>ACİL YARDIM LAZIM</span>
            </button>
          </div>

          <!-- Crisp QR Display Frame -->
          <div class="flex flex-col items-center justify-center">
            <div class="p-3 sm:p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center max-w-[280px] sm:max-w-[300px] aspect-square w-full">
              <div class="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block">
                ${qrSvg}
              </div>
            </div>
            <div class="mt-2 text-center text-[10.5px] text-gray-400">
              Parlaklığı artırın. Herhangi bir telefon kamerası veya barkod okuyucuyla taranabilir.
            </div>
          </div>

          <!-- Quick Metadata Inputs -->
          <div class="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5 space-y-3">
            <div class="hud-section-label">Kimlik ve Sağlık Bilgileri (İsteğe Bağlı)</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">Ad Soyad</label>
                <input
                  id="qr-input-name"
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz"
                  value="${this.state.name}"
                  class="w-full px-3 py-1.5 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label class="block text-[11px] text-gray-400 mb-1">Kan Grubu</label>
                <select
                  id="qr-select-blood"
                  class="w-full px-3 py-1.5 text-xs text-gray-200 bg-white/5 rounded-xl border border-white/10 outline-none cursor-pointer focus:border-emerald-500/50"
                >
                  ${bloodOptions
                    .map(
                      (b) =>
                        `<option value="${b}" ${this.state.bloodGroup === b ? 'selected' : ''}>${b}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">Yanınızdaki Kişi Sayısı</label>
                <input
                  id="qr-input-count"
                  type="number"
                  min="1"
                  max="50"
                  value="${this.state.peopleCount}"
                  class="w-full px-3 py-1.5 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              <div>
                <label class="block text-[11px] text-gray-400 mb-1">Cihaz Pili & GPS</label>
                <div class="px-3 py-1.5 text-[11.5px] font-mono text-emerald-400 bg-white/5 rounded-xl border border-white/10 truncate">
                  ${this.state.batteryLevel !== undefined ? `🔋 %${this.state.batteryLevel} · ` : ''}GPS Kilitli
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[11px] text-gray-400 mb-1">Kısa Not / Tıbbi İhtiyaç</label>
              <input
                id="qr-input-note"
                type="text"
                placeholder="Örn: İnsülin ilacı gerekli / Enkaz yok bahçedeyiz"
                value="${this.state.note}"
                class="w-full px-3 py-1.5 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-3.5 border-t border-white/10 bg-obsidian-950/80 flex items-center gap-2">
          <button
            id="btn-copy-qr-text"
            type="button"
            class="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            ${Icons.copy('w-4 h-4')}
            <span>Metni Panoya Kopyala</span>
          </button>
          <button
            id="btn-done-qr"
            type="button"
            class="px-5 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-black text-xs shadow-glow-emerald active:scale-[0.98] transition-all"
          >
            Tamam
          </button>
        </div>
      </div>
    `;

    // Event binding
    this.container.querySelector('#btn-close-qr')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-done-qr')?.addEventListener('click', () => this.hide());

    this.container.querySelector('#btn-qr-status-safe')?.addEventListener('click', () => {
      this.state.status = 'SAFE';
      this.saveState();
      this.render();
    });

    this.container.querySelector('#btn-qr-status-help')?.addEventListener('click', () => {
      this.state.status = 'HELP';
      this.saveState();
      this.render();
    });

    const nameInput = this.container.querySelector('#qr-input-name') as HTMLInputElement | null;
    nameInput?.addEventListener('input', (e) => {
      this.state.name = (e.target as HTMLInputElement).value;
      this.saveState();
    });

    const bloodSelect = this.container.querySelector('#qr-select-blood') as HTMLSelectElement | null;
    bloodSelect?.addEventListener('change', (e) => {
      this.state.bloodGroup = (e.target as HTMLSelectElement).value;
      this.saveState();
      this.render();
    });

    const countInput = this.container.querySelector('#qr-input-count') as HTMLInputElement | null;
    countInput?.addEventListener('input', (e) => {
      this.state.peopleCount = parseInt((e.target as HTMLInputElement).value) || 1;
      this.saveState();
    });

    const noteInput = this.container.querySelector('#qr-input-note') as HTMLInputElement | null;
    noteInput?.addEventListener('input', (e) => {
      this.state.note = (e.target as HTMLInputElement).value;
      this.saveState();
    });

    const copyBtn = this.container.querySelector('#btn-copy-qr-text') as HTMLButtonElement | null;
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(payload);
        if (copyBtn) {
          copyBtn.innerHTML = `${Icons.checkCircle('w-4 h-4')} <span>Kopyalandı!</span>`;
          setTimeout(() => {
            if (copyBtn) copyBtn.innerHTML = `${Icons.copy('w-4 h-4')} <span>Metni Panoya Kopyala</span>`;
          }, 2000);
        }
      } catch {
        alert(payload);
      }
    });

    this.container.onclick = (e) => {
      if (e.target === this.container) this.hide();
    };
  }
}
