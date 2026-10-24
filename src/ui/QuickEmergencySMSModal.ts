import { Icons } from './icons';

export class QuickEmergencySMSModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private selectedTemplate: 'help' | 'safe' = 'help';
  private targetPhone = '';
  private customNote = '';

  constructor(parent: HTMLElement, userCoords: [number, number]) {
    this.userCoords = userCoords;
    this.container = document.createElement('div');
    this.container.id = 'quick-emergency-sms-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public show(template?: 'help' | 'safe'): void {
    if (template) this.selectedTemplate = template;
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private generateSMSMessage(): string {
    const lat = this.userCoords[1].toFixed(5);
    const lon = this.userCoords[0].toFixed(5);
    const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
    const extra = this.customNote.trim() ? ` Not: ${this.customNote.trim()}` : '';

    if (this.selectedTemplate === 'help') {
      return `ACİL DURUM! Enkaz altındayım / yardıma ihtiyacım var! Konumum: Enlem ${lat}, Boylam ${lon} (Harita: ${mapUrl}).${extra} Lütfen AFAD ve 112'ye iletin!`;
    } else {
      return `Ben ve yanımdakiler GÜVENDEYİZ. Konumum: ${lat}, ${lon} (Harita: ${mapUrl}).${extra} Şebekeyi meşgul etmemek için SMS atıyorum.`;
    }
  }

  private openSMSComposer(): void {
    const message = encodeURIComponent(this.generateSMSMessage());
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delimiter = isIOS ? '&' : '?';
    const target = this.targetPhone.trim();

    let smsUrl = `sms:${target}${delimiter}body=${message}`;
    if (!target) {
      // In iOS and modern Android, omitting number opens recipient chooser
      smsUrl = isIOS ? `sms:&body=${message}` : `sms:?body=${message}`;
    }

    window.location.href = smsUrl;
  }

  private copyMessage(): void {
    const text = this.generateSMSMessage();
    navigator.clipboard.writeText(text).then(() => {
      const copyBtn = this.container.querySelector('#btn-copy-sms') as HTMLElement | null;
      if (copyBtn) {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = `✓ Metin Kopyalandı`;
        copyBtn.classList.remove('bg-white/10');
        copyBtn.classList.add('bg-emerald-600', 'text-white');
        setTimeout(() => {
          copyBtn.innerHTML = original;
          copyBtn.classList.remove('bg-emerald-600', 'text-white');
          copyBtn.classList.add('bg-white/10');
        }, 2000);
      }
    });
  }

  private render(): void {
    const lat = this.userCoords[1].toFixed(5);
    const lon = this.userCoords[0].toFixed(5);
    const currentMessage = this.generateSMSMessage();

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              ${Icons.phone('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">
                  Acil Durum SMS & Hatlar
                </h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">2G / 3G UYUMLU</span>
              </div>
              <p class="text-[11px] text-gray-400">4G/5G veri şebekesi çöktüğünde SMS paketleri baz istasyonu sinyal kuyruğundan iletilir.</p>
            </div>
          </div>
          <button id="btn-close-sms" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <!-- GPS Coords pill -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
            <div class="flex items-center gap-2 text-emerald-400 font-mono text-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>GPS: ${lat}, ${lon}</span>
            </div>
            <a
              href="https://maps.google.com/?q=${lat},${lon}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
            >
              Haritada Aç ↗
            </a>
          </div>

          <!-- Template Selector -->
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Şablon Seçin</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-template-help"
                class="p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all select-none ${
                  this.selectedTemplate === 'help'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }"
              >
                <span class="font-bold text-xs flex items-center gap-1.5 ${
                  this.selectedTemplate === 'help' ? 'text-rose-400' : 'text-gray-300'
                }">
                  🚨 Enkaz Altındayım / Yardım
                </span>
                <span class="text-[10px] opacity-80">Kurtarma ekipleri ve yakınlar için acil konum çağrısı.</span>
              </button>

              <button
                type="button"
                id="btn-template-safe"
                class="p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all select-none ${
                  this.selectedTemplate === 'safe'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }"
              >
                <span class="font-bold text-xs flex items-center gap-1.5 ${
                  this.selectedTemplate === 'safe' ? 'text-emerald-400' : 'text-gray-300'
                }">
                  🟢 Güvendeyim Bildirimi
                </span>
                <span class="text-[10px] opacity-80">Şebekeyi sesli aramayla tıkamadan bilgi verin.</span>
              </button>
            </div>
          </div>

          <!-- Target Phone (Optional) -->
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Alıcı Telefon Numarası <span class="text-[10px] text-gray-500 font-normal">(Boş bırakırsanız rehberden seçersiniz)</span>
            </label>
            <input
              id="input-sms-target"
              type="tel"
              placeholder="Örn: 0532 123 45 67 veya boş bırakın"
              value="${this.targetPhone}"
              class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <!-- Custom Note -->
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Ekstra Durum Notu <span class="text-[10px] text-gray-500 font-normal">(Opsiyonel - Örn: 2. kat arka oda, yaralı var)</span>
            </label>
            <input
              id="input-sms-note"
              type="text"
              placeholder="Örn: Apartman no 14, 2. kat veya İyiyiz toplanma alanındayız"
              value="${this.customNote}"
              class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <!-- SMS Preview Area -->
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Gönderilecek SMS Metni</label>
            <div id="sms-preview-box" class="p-3 rounded-xl bg-black/40 border border-white/10 text-gray-200 font-mono text-[11.5px] leading-relaxed select-all">
              ${currentMessage}
            </div>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-open-sms-composer"
              type="button"
              class="py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                this.selectedTemplate === 'help'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-obsidian-950 shadow-emerald-500/20'
              }"
            >
              <span>📱</span> SMS Uygulamasını Aç
            </button>

            <button
              id="btn-copy-sms"
              type="button"
              class="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>📋</span> Metni Kopyala
            </button>
          </div>

          <!-- Speed Dial Emergency Phone Cards -->
          <div class="pt-2 border-t border-white/10">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Acil Çağrı Hatları (Tek Dokunuşla Ara)</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href="tel:112"
                class="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 hover:bg-rose-500/25 flex flex-col items-center text-center transition-all group"
              >
                <span class="text-base font-black text-rose-400 group-hover:scale-110 transition-transform">112</span>
                <span class="text-[10px] font-medium text-gray-300">Acil Çağrı</span>
              </a>

              <a
                href="tel:122"
                class="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 hover:bg-amber-500/25 flex flex-col items-center text-center transition-all group"
              >
                <span class="text-base font-black text-amber-400 group-hover:scale-110 transition-transform">122</span>
                <span class="text-[10px] font-medium text-gray-300">AFAD</span>
              </a>

              <a
                href="tel:187"
                class="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 hover:bg-sky-500/25 flex flex-col items-center text-center transition-all group"
              >
                <span class="text-base font-black text-sky-400 group-hover:scale-110 transition-transform">187</span>
                <span class="text-[10px] font-medium text-gray-300">Doğalgaz</span>
              </a>

              <a
                href="tel:186"
                class="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 hover:bg-purple-500/25 flex flex-col items-center text-center transition-all group"
              >
                <span class="text-base font-black text-purple-400 group-hover:scale-110 transition-transform">186</span>
                <span class="text-[10px] font-medium text-gray-300">Elektrik</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q('#btn-close-sms')?.addEventListener('click', () => this.hide());

    q('#btn-template-help')?.addEventListener('click', () => {
      this.selectedTemplate = 'help';
      this.render();
    });

    q('#btn-template-safe')?.addEventListener('click', () => {
      this.selectedTemplate = 'safe';
      this.render();
    });

    const targetInput = q<HTMLInputElement>('#input-sms-target');
    targetInput?.addEventListener('input', (e) => {
      this.targetPhone = (e.target as HTMLInputElement).value;
    });

    const noteInput = q<HTMLInputElement>('#input-sms-note');
    noteInput?.addEventListener('input', (e) => {
      this.customNote = (e.target as HTMLInputElement).value;
      const previewBox = q<HTMLElement>('#sms-preview-box');
      if (previewBox) {
        previewBox.textContent = this.generateSMSMessage();
      }
    });

    q('#btn-open-sms-composer')?.addEventListener('click', () => this.openSMSComposer());
    q('#btn-copy-sms')?.addEventListener('click', () => this.copyMessage());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
