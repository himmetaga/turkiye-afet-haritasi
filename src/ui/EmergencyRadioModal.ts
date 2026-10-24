import { Icons } from './icons';

interface RadioChannel {
  channel: string;
  freq: string;
  purpose: string;
  role: string;
  isPriority?: boolean;
}

const PMR_CHANNELS: RadioChannel[] = [
  { channel: 'Kanal 1', freq: '446.00625 MHz', purpose: 'Genel Afet Çağrı & İmdat', role: 'İlk temas ve yardım çağrısı', isPriority: true },
  { channel: 'Kanal 2', freq: '446.01875 MHz', purpose: 'Mahalle & Sokak Koordinasyonu', role: 'Yerel toplanma alanı içi iletişim' },
  { channel: 'Kanal 3', freq: '446.03125 MHz', purpose: 'Lojistik & Erzak Dağıtımı', role: 'Çadır ve gıda dağıtım ekipleri' },
  { channel: 'Kanal 4', freq: '446.04375 MHz', purpose: 'İlk Yardım & Tıbbi İhtiyaçlar', role: 'Yaralı transferi ve ecza koordinasyonu' },
  { channel: 'Kanal 5', freq: '446.05625 MHz', purpose: 'Aile & Komşular İletişim', role: 'Kişisel ve yakın çevre takibi' },
  { channel: 'Kanal 6', freq: '446.06875 MHz', purpose: 'Genel Bilgi & Durum Paylaşımı', role: 'Şebeke dışı durum bilgilendirmesi' },
  { channel: 'Kanal 7', freq: '446.08125 MHz', purpose: 'Tahliye & Güzergah Kontrolü', role: 'Yol durumu ve araç konvoyları' },
  { channel: 'Kanal 8', freq: '446.09375 MHz', purpose: 'Arama Kurtarma & TRAC Dinleme', role: 'Enkaz çevresi dinleme ve STK koordinasyonu', isPriority: true }
];

const TRAC_FREQUENCIES: RadioChannel[] = [
  { channel: 'VHF Simpleks', freq: '145.500 MHz', purpose: 'Ulusal Afet & İlk Çağrı', role: 'Tüm Türkiye ortak afet toplanma frekansı', isPriority: true },
  { channel: 'UHF Simpleks', freq: '433.500 MHz', purpose: 'Enkaz & Bina İçi Penetrasyon', role: 'Beton geçişi avantajlı arama kurtarma frekansı', isPriority: true },
  { channel: 'HF Gündüz (40m)', freq: '7.092 MHz LSB', purpose: 'Şehirlerarası Kriz Masası', role: 'GSM/İnternet yokken iller arası telsiz köprüsü' },
  { channel: 'HF Gece (80m)', freq: '3.777 MHz LSB', purpose: 'Şehirlerarası Gece İletişimi', role: 'İyonosferik gece yayılımında ulusal afet ağı' }
];

export class EmergencyRadioModal {
  private container: HTMLElement;
  private isVisible = false;
  private audioCtx: AudioContext | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'emergency-radio-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/80 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);
  }

  public show(): void {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playRogerBeep(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } catch {}
  }

  private play1750HzTone(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {}
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-obsidian-900/95 border border-white/10 shadow-2xl backdrop-blur-xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              ${Icons.radio('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
                Afet Telsizi & Frekans Rehberi
              </h3>
              <p class="text-[11px] text-gray-400">
                GSM ve internet çöktüğünde kullanılan TRAC & PMR 446 telsiz frekansları
              </p>
            </div>
          </div>

          <button id="btn-close-radio" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Critical Rule: CTCSS Tone OFF Banner -->
          <div class="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent border border-amber-500/30 flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div class="leading-relaxed">
              <strong class="text-amber-300 font-bold block mb-0.5">HAYATİ KURAL: ALT TONU (CTCSS/DCS) KAPATIN</strong>
              <p class="text-[11.5px] text-gray-200">
                Afet durumunda telsizinizdeki alt tonu mutlaka <strong>"0" veya "KAPALI / OFF"</strong> yapın. Alt ton açık kalırsa sadece aynı ton kodunu kullanan cihazları duyabilirsiniz; kurtarma ekiplerinin ve vatandaşların çağrıları filtrelenir!
              </p>
            </div>
          </div>

          <!-- Section 1: PMR 446 (Lisanssız El Telsizleri) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📻</span><span>PMR 446 El Telsizi Kanalları (Halk Tipi - Lisanssız)</span>
              </h4>
              <span class="text-[10px] text-gray-400 font-mono">0.5W Güç • Serbest Kullanım</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${PMR_CHANNELS.map(
                (ch) => `
                <div class="p-2.5 rounded-xl border transition-all ${
                  ch.isPriority
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm'
                    : 'bg-white/5 border-white/5'
                }">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="font-bold text-white text-xs">${ch.channel}</span>
                    <span class="font-mono text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">${ch.freq}</span>
                  </div>
                  <div class="text-[11px] font-medium text-gray-200">${ch.purpose}</div>
                  <div class="text-[10px] text-gray-400 mt-0.5">${ch.role}</div>
                </div>
              `
              ).join('')}
            </div>
          </div>

          <!-- Section 2: TRAC Amatör Telsiz Frekansları -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📡</span><span>TRAC & Amatör Telsiz Afet Frekansları</span>
              </h4>
              <span class="text-[10px] text-gray-400 font-mono">TAMP Haberleşme Grubu</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${TRAC_FREQUENCIES.map(
                (ch) => `
                <div class="p-2.5 rounded-xl border bg-white/5 border-white/5 hover:border-sky-500/30 transition-all">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="font-bold text-white text-xs">${ch.channel}</span>
                    <span class="font-mono text-[11px] font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">${ch.freq}</span>
                  </div>
                  <div class="text-[11px] font-medium text-gray-200">${ch.purpose}</div>
                  <div class="text-[10px] text-gray-400 mt-0.5">${ch.role}</div>
                </div>
              `
              ).join('')}
            </div>
          </div>

          <!-- Section 3: Mandal Basma & İletişim Protokolü -->
          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <h4 class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎙️</span><span>Telsiz İletişim ve Mandal Basma Protokolü</span>
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-300">
              <div class="p-2 rounded-lg bg-white/5">
                <strong class="text-white block mb-0.5">1. Önce 5 Saniye Dinleyin</strong>
                Mandalı basmadan önce kanalı dinleyin. Biri konuşurken mandalı basarsanız iki ses de birbirini boğar.
              </div>
              <div class="p-2 rounded-lg bg-white/5">
                <strong class="text-white block mb-0.5">2. Bas - Bekle - Konuş</strong>
                Mandalı basın, 1 saniye bekleyin, sonra konuşmaya başlayın (ilk harfleriniz kesilmesin).
              </div>
              <div class="p-2 rounded-lg bg-white/5">
                <strong class="text-white block mb-0.5">3. Kısa ve Öz Olun</strong>
                "Burası [İsim/Kod], [Konumdayız], [İhtiyaç/Yaralı Durumu], tamam." Bataryayı korumak için gereksiz konuşmayın.
              </div>
              <div class="p-2 rounded-lg bg-white/5">
                <strong class="text-white block mb-0.5">4. "TAMAM" Diyerek Bırakın</strong>
                Konuşmanız bittiğinde mandalı bırakın ve karşı istasyonun cevabı için frekansı boş bırakın.
              </div>
            </div>
          </div>

          <!-- Audio Simulation Tests -->
          <div class="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-[11px] text-gray-400 font-medium">Telsiz Ton Testi:</span>
              <button
                id="btn-test-roger"
                type="button"
                class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-gray-300 transition-all flex items-center gap-1 active:scale-95"
              >
                <span>🔊</span><span>Roger Bip Sesi</span>
              </button>
              <button
                id="btn-test-repeater"
                type="button"
                class="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[11px] font-semibold text-sky-300 transition-all flex items-center gap-1 active:scale-95"
              >
                <span>📡</span><span>1750 Hz Röle Tonu</span>
              </button>
            </div>

            <button
              id="btn-copy-radio"
              type="button"
              class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>📋</span><span>Frekansları Kopyala</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-radio')?.addEventListener('click', () => this.hide());

    this.container.querySelector('#btn-test-roger')?.addEventListener('click', () => {
      this.playRogerBeep();
    });

    this.container.querySelector('#btn-test-repeater')?.addEventListener('click', () => {
      this.play1750HzTone();
    });

    this.container.querySelector('#btn-copy-radio')?.addEventListener('click', () => {
      const summary = `📻 afet.live Afet Telsiz Frekansları:\n` +
        `• PMR Kanal 1 (446.00625 MHz): Genel Afet Çağrı\n` +
        `• PMR Kanal 8 (446.09375 MHz): Arama Kurtarma Dinleme\n` +
        `• VHF 145.500 MHz: TRAC Ulusal Afet Çağrı\n` +
        `• UHF 433.500 MHz: TRAC Enkaz & Bina İçi Penetrasyon\n` +
        `• Önemli: Afette alt tonu (CTCSS) MUTLAKA KAPATIN (Ton: 0 / OFF)!`;
      navigator.clipboard.writeText(summary);
      alert('Afet telsiz frekansları panoya kopyalandı.');
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
