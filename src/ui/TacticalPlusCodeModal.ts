/**
 * TacticalPlusCodeModal.ts
 * =============================================================================
 * Google Open Location Code (Plus Codes) Taktik Afet & Telsiz Grid Kodlayıcı
 * Açık Kaynak: https://github.com/google/open-location-code (Apache 2.0)
 * =============================================================================
 * Enkazda ve afet alanında adreslerin yok olduğu anlarda enlem/boylamı
 * telsizden hatasız aktarmak için 10 haneli Plus Code ve NATO Fonetik Alfabesi.
 */

import { Icons } from './icons';
import { openLocationCodeService, PlusCodeArea } from '../services/openLocationCodeService';
import { registerModalOpen, registerModalClose, setupModalMobileDismiss } from '../utils/mobileModalHelper';

export class TacticalPlusCodeModal {
  private container: HTMLElement;
  private currentCoords: [number, number] = [29.03367, 40.98527]; // [lng, lat]
  private inputCode = '';
  private decodedResult: PlusCodeArea | null = null;
  private onJumpToCoords?: (coords: [number, number], title: string) => void;
  private copyToastTimeout: any = null;

  constructor(parent: HTMLElement, onJumpToCoords?: (coords: [number, number], title: string) => void) {
    this.onJumpToCoords = onJumpToCoords;

    this.container = document.createElement('div');
    this.container.id = 'tactical-pluscode-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide(),
      closeBtnSelector: '#btn-close-pluscode'
    });
  }

  public show(coords?: [number, number]): void {
    if (coords) {
      this.currentCoords = coords;
    }
    this.container.classList.remove('hidden');
    registerModalOpen('tactical-pluscode-modal', () => this.hide());
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    registerModalClose('tactical-pluscode-modal');
  }

  private copyToClipboard(text: string, label: string): void {
    navigator.clipboard?.writeText(text).then(() => {
      const toast = this.container.querySelector('#pluscode-toast');
      if (toast) {
        toast.textContent = `✓ ${label} panoya kopyalandı!`;
        toast.classList.remove('hidden', 'opacity-0');
        clearTimeout(this.copyToastTimeout);
        this.copyToastTimeout = setTimeout(() => {
          toast.classList.add('opacity-0');
          setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2200);
      }
    });
  }

  private speakRadioCode(code: string): void {
    if (!('speechSynthesis' in window)) {
      alert('Cihazınızda sesli okuma desteği bulunmuyor.');
      return;
    }
    const phrase = openLocationCodeService.getRadioSpokenPhrase(code);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.85; // Telsiz netliği için yavaş
    window.speechSynthesis.speak(utterance);
  }

  private handleDecodeInput(): void {
    const inputEl = this.container.querySelector<HTMLInputElement>('#pluscode-input');
    if (!inputEl) return;
    const val = inputEl.value.trim().toUpperCase();
    this.inputCode = val;

    if (openLocationCodeService.isValid(val)) {
      this.decodedResult = openLocationCodeService.decode(val);
    } else {
      this.decodedResult = null;
    }
    this.render();
  }

  private render(): void {
    const [lng, lat] = this.currentCoords;
    const currentCode = openLocationCodeService.encode(lat, lng, 10);
    const phoneticList = openLocationCodeService.getPhoneticBreakdown(currentCode);
    const spokenPhrase = openLocationCodeService.getRadioSpokenPhrase(currentCode);

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              ${Icons.plusCode('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Taktik Plus Code & Telsiz Grid</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google OLC
                </span>
              </div>
              <p class="text-[11px] text-white/60">Sokaksız Alanda %100 Çevrimdışı 14x14m SAR Adresi</p>
            </div>
          </div>
          <button id="btn-close-pluscode" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Toast -->
        <div id="pluscode-toast" class="hidden opacity-0 transition-opacity duration-300 mx-4 mt-2 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold text-center"></div>

        <!-- Content Body -->
        <div class="p-4 overflow-y-auto space-y-4 text-xs">
          <!-- Active Current Location Plus Code Hero Card -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-obsidian-900/60 to-black/80 border border-emerald-500/30 shadow-lg relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 opacity-10 text-emerald-400 pointer-events-none">
              ${Icons.plusCode('w-32 h-32')}
            </div>

            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Bulunduğunuz Konumun Plus Kodu
              </span>
              <span class="text-[10px] text-white/50 font-mono">14m x 14m Hassasiyet</span>
            </div>

            <div class="flex items-center justify-between gap-2 my-2">
              <span class="font-mono text-2xl sm:text-3xl font-black tracking-widest text-emerald-300 select-all">
                ${currentCode}
              </span>
              <button id="btn-copy-main-code" class="px-3 py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 active:scale-95 text-emerald-200 border border-emerald-500/40 font-bold flex items-center gap-1.5 transition-all">
                ${Icons.copy('w-3.5 h-3.5')} Kopyala
              </button>
            </div>

            <p class="text-[11px] text-white/70 font-mono">
              GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </p>

            <!-- Telsiz Çağrı Butonu -->
            <div class="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
              <button id="btn-speak-radio" class="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white font-bold flex items-center justify-center gap-2 transition-all">
                🗣️ Telsizle Sesli Oku
              </button>
              <button id="btn-sms-code" class="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1.5 transition-all">
                ${Icons.share('w-3.5 h-3.5')} 112 / SMS Gönder
              </button>
            </div>
          </div>

          <!-- NATO & TR Telsiz Fonetik Heceleme Kartları -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                📻 Telsiz Fonetik Okunuşu (AFAD / TRAC / AKUT)
              </h3>
              <span class="text-[10px] text-white/40">Gürültülü Sahra Telsiz Kuralı</span>
            </div>

            <div class="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center">
              ${phoneticList
                .map(
                  (p) => `
                <div class="p-2 rounded-xl ${p.char === '+' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-white'} border flex flex-col items-center">
                  <span class="text-base font-black font-mono leading-none">${p.char}</span>
                  <span class="text-[9px] font-bold mt-1 text-white/70 truncate w-full">${p.tr}</span>
                  <span class="text-[8px] text-white/40 truncate w-full">${p.nato}</span>
                </div>
              `
                )
                .join('')}
            </div>

            <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-white/70 italic">
              "Telsiz anonsu örneği: <strong>${spokenPhrase}</strong>"
            </div>
          </div>

          <!-- Plus Code Çözücü & Koordinata Dönüştürücü (Decoder) -->
          <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white flex items-center gap-1.5">
                🔍 Telsizden Alınan Plus Code'u Çöz
              </span>
              <span class="text-[10px] text-white/50">Çevrimdışı Harita Konumu</span>
            </div>

            <div class="flex gap-2">
              <input
                id="pluscode-input"
                type="text"
                placeholder="Örn: 8GG3VX2Q+9R"
                value="${this.inputCode}"
                class="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-mono placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400"
              />
              <button
                id="btn-decode-action"
                class="px-4 py-2.5 rounded-xl bg-emerald-500 text-obsidian-950 font-black hover:bg-emerald-400 active:scale-95 transition-all"
              >
                Çöz
              </button>
            </div>

            ${
              this.decodedResult
                ? `
              <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold">✓ Geçerli Koordinat Çözüldü</span>
                  <span class="font-mono text-[11px]">${this.decodedResult.latitudeCenter}, ${this.decodedResult.longitudeCenter}</span>
                </div>
                <div class="text-[11px] text-white/70">
                  Kapsama Alanı: Enlem [${this.decodedResult.latitudeLo} - ${this.decodedResult.latitudeHi}], Boylam [${this.decodedResult.longitudeLo} - ${this.decodedResult.longitudeHi}]
                </div>
                <button
                  id="btn-jump-decoded"
                  class="w-full py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-200 font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  📍 Haritada Göster ve Rota Çiz
                </button>
              </div>
            `
                : this.inputCode && !this.decodedResult
                ? `
              <div class="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                ⚠️ Geçersiz Plus Code formatı. Kod en az 8 karakter ve '+' işareti içermelidir (Örn: 8GG3VX2Q+9R).
              </div>
            `
                : ''
            }
          </div>

          <!-- Bilgilendirme -->
          <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-white/60 space-y-1.5 leading-relaxed">
            <p><strong>Neden Plus Code?</strong></p>
            <p>
              Deprem anında sokak tabelaları, binalar ve elektrik direkleri yıkılır. Klasik adresler geçersiz kalır.
              Google Open Location Code, Dünya'yı 14x14 metrelik karelere böler. Harf ve rakamlar sesli harf içermez (küfür ve kelime oluşmaz),
              'O' ve '0', '1' ve 'I' harfleri çıkartılarak telsiz telsiz karışıklığı önlenmiştir.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span>%100 Çevrimdışı Algoritma</span>
          <span>Google Open Location Code (Apache 2.0)</span>
        </div>
      </div>
    `;

    this.bindEvents(currentCode, lat, lng);
  }

  private bindEvents(currentCode: string, lat: number, lng: number): void {
    const copyBtn = this.container.querySelector('#btn-copy-main-code');
    copyBtn?.addEventListener('click', () => {
      this.copyToClipboard(currentCode, 'Plus Code');
    });

    const speakBtn = this.container.querySelector('#btn-speak-radio');
    speakBtn?.addEventListener('click', () => {
      this.speakRadioCode(currentCode);
    });

    const smsBtn = this.container.querySelector('#btn-sms-code');
    smsBtn?.addEventListener('click', () => {
      const msg = encodeURIComponent(
        `ACİL DURUM KONUMUM: Plus Code: ${currentCode} (GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}). Arama kurtarma talep ediyorum.`
      );
      window.location.href = `sms:?body=${msg}`;
    });

    const decodeBtn = this.container.querySelector('#btn-decode-action');
    decodeBtn?.addEventListener('click', () => {
      this.handleDecodeInput();
    });

    const inputEl = this.container.querySelector<HTMLInputElement>('#pluscode-input');
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleDecodeInput();
      }
    });

    const jumpBtn = this.container.querySelector('#btn-jump-decoded');
    jumpBtn?.addEventListener('click', () => {
      if (this.decodedResult && this.onJumpToCoords) {
        this.onJumpToCoords(
          [this.decodedResult.longitudeCenter, this.decodedResult.latitudeCenter],
          `Plus Code: ${this.inputCode}`
        );
        this.hide();
      }
    });
  }
}

