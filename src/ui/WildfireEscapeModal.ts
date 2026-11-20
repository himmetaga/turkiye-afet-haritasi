import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import { wildfireEscapeService, WildfireDirections } from '../services/wildfireEscapeService';

const WIND_OPTIONS: Array<{ deg: number; label: string }> = [
  { deg: 0, label: 'Kuzey' },
  { deg: 45, label: 'Kuzeydoğu' },
  { deg: 90, label: 'Doğu' },
  { deg: 135, label: 'Güneydoğu' },
  { deg: 180, label: 'Güney' },
  { deg: 225, label: 'Güneybatı' },
  { deg: 270, label: 'Batı' },
  { deg: 315, label: 'Kuzeybatı' }
];

export class WildfireEscapeModal {
  private container: HTMLElement;
  /** Rüzgarın GELDİĞİ yön. Kullanıcı seçene kadar null: varsayılan bir rüzgar uydurulmaz. */
  private windFromDeg: number | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'wildfire-escape-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide()
    });

    this.render();
  }

  public show(): void {
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
    registerModalOpen('wildfire-escape-modal', () => this.hide());
  }

  public hide(): void {
    registerModalClose('wildfire-escape-modal');
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private renderResult(d: WildfireDirections): string {
    const t = (deg: number) => wildfireEscapeService.bearingToText(deg);
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-black/40 rounded-2xl p-4 border border-white/5">
        <div class="relative flex flex-col items-center justify-center">
          <div class="relative w-48 h-48 sm:w-52 sm:h-52">
            ${this.renderCompassSvg(d)}
          </div>
          <div class="mt-2 text-center">
            <span class="text-[11px] text-gray-400">Girdiğiniz rüzgar: <strong class="text-sky-400">${t(d.windFromDeg)} yönünden geliyor</strong></span>
          </div>
        </div>

        <div class="space-y-3">
          <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
            <div class="text-rose-400 font-bold text-base mt-0.5">⛔</div>
            <div>
              <div class="text-[11px] font-bold text-rose-400 uppercase tracking-wide">Yangın büyük olasılıkla bu yöne ilerler</div>
              <div class="text-sm font-black text-rose-300">${t(d.downwindDeg)}</div>
              <div class="text-[10px] text-rose-200/80">Rüzgarın estiği yön. Yangın arkanızdaysa bu yöne kaçmak sizi alevin önünde bırakır.</div>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
            <div class="text-amber-300 font-bold text-base mt-0.5">🧭</div>
            <div>
              <div class="text-[11px] font-bold text-amber-300 uppercase tracking-wide">Olası kaçış yönleri (rüzgara dik)</div>
              <div class="text-sm font-black text-amber-200">${t(d.crosswindADeg)} &nbsp;veya&nbsp; ${t(d.crosswindBDeg)}</div>
              <div class="text-[10px] text-amber-100/80">
                Bu araç yangının nerede olduğunu bilmez. Alevin ve dumanın hangi tarafta olduğuna kendiniz bakın;
                ondan uzak olan yönü seçin. İki yönden biri yangına doğru olabilir.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private render(): void {
    const directions = this.windFromDeg === null ? null : wildfireEscapeService.getDirections(this.windFromDeg);

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              ${Icons.wildfire('w-5 h-5')}
            </div>
            <div>
              <h2 class="text-base font-bold text-white tracking-wide">Orman Yangını Yön Yardımcısı</h2>
              <p class="text-xs text-gray-400">Rüzgar yönüne göre genel kural — ölçüm ya da resmi tahliye talimatı değildir</p>
            </div>
          </div>
          <button id="btn-close-wildfire" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">

          <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-100 text-[12px] leading-relaxed">
            <strong class="text-white">Önce 112'yi arayın.</strong> Yetkililerin tahliye talimatı her zaman bu ekrandaki bilgiden önce gelir.
            Tahliye çağrısı yapıldıysa beklemeden, gösterilen yoldan çıkın.
          </div>

          <!-- Wind input -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div class="text-xs font-bold text-gray-200">
              Rüzgarın <span class="text-sky-300">GELDİĞİ</span> yönü seçin
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              Yüzünüzü rüzgara dönün: rüzgar yüzünüze hangi yönden vuruyorsa onu seçin. Yönü bilmiyorsanız telefonunuzun pusulasına bakın.
              Bu uygulama rüzgarı ölçmez; yalnızca sizin seçtiğiniz yönü kullanır.
            </p>
            <div class="grid grid-cols-4 gap-2">
              ${WIND_OPTIONS.map(
                (o) => `
                <button type="button" data-wind="${o.deg}" class="btn-wind p-2 rounded-xl text-center border transition-all text-xs ${
                  this.windFromDeg === o.deg
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 font-bold'
                    : 'bg-white/[0.03] border-white/5 text-gray-300 hover:text-white'
                }">
                  ${o.label}
                </button>
              `
              ).join('')}
            </div>
          </div>

          ${
            directions
              ? this.renderResult(directions)
              : `
            <div class="p-4 rounded-2xl bg-black/40 border border-white/5 text-center text-[12px] text-gray-300">
              Rüzgar yönü seçilmedi. Yön göstermek için yukarıdan rüzgarın geldiği yönü seçin.
            </div>
          `
          }

          <!-- General rules -->
          <div class="space-y-2.5">
            <div class="text-xs font-bold text-gray-300 uppercase tracking-wider">Genel kurallar</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div class="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div class="font-bold text-emerald-400">Yaya iseniz</div>
                <ul class="text-[11px] text-gray-300 space-y-1 list-disc list-inside">
                  <li>Yangının önünde yokuş yukarı kaçmayın; yangın yamaç yukarı çok daha hızlı ilerler.</li>
                  <li>Alevden ve dumandan uzaklaşan, rüzgara dik bir yön seçin.</li>
                  <li>Yol kapandıysa önceden yanmış, bitki kalmamış alana ya da geniş açıklığa, yola, su kenarına geçin.</li>
                  <li>Sıkıştıysanız bitki olmayan bir çukurda yüzüstü yatın, ağzınızı ve burnunuzu bezle kapatın.</li>
                </ul>
              </div>

              <div class="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div class="font-bold text-sky-400">Araçta alevlerin arasında kaldıysanız</div>
                <ul class="text-[11px] text-gray-300 space-y-1 list-disc list-inside">
                  <li>Aracı bitki örtüsünden uzak, açık bir yere çekin; araçtan çıkıp alevlerin içinden koşmayın.</li>
                  <li>Camları ve havalandırmayı kapatın, farları ve dörtlüleri yakın.</li>
                  <li>Cam hizasının altına eğilin, battaniye ya da ceketle örtünün.</li>
                </ul>
              </div>
            </div>
          </div>

          <button id="btn-copy-wildfire-report" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            directions ? '' : 'opacity-50 pointer-events-none'
          }">
            ${Icons.share('w-4 h-4')}
            Rüzgar ve Yön Bilgisini Kopyala
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderCompassSvg(d: WildfireDirections): string {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const r = 78;

    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const pt = (deg: number, radius: number) => ({
      x: cx + Math.cos(toRad(deg)) * radius,
      y: cy + Math.sin(toRad(deg)) * radius
    });

    const down = pt(d.downwindDeg, r - 10);
    const a = pt(d.crosswindADeg, r - 8);
    const b = pt(d.crosswindBDeg, r - 8);
    const wind = pt(d.windFromDeg, r + 14);

    return `
      <svg viewBox="0 0 ${size} ${size}" class="w-full h-full drop-shadow-md">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0A0F1D" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <circle cx="${cx}" cy="${cy}" r="${r - 20}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 3" />

        <text x="${cx}" y="${cy - r + 12}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">K</text>
        <text x="${cx + r - 12}" y="${cy + 3}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">D</text>
        <text x="${cx}" y="${cy + r - 6}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">G</text>
        <text x="${cx - r + 12}" y="${cy + 3}" fill="#9CA3AF" font-size="9" font-weight="bold" text-anchor="middle">B</text>

        <!-- Downwind: likely direction of fire travel -->
        <line x1="${cx}" y1="${cy}" x2="${down.x}" y2="${down.y}" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="${down.x}" cy="${down.y}" r="6" fill="#EF4444" />

        <!-- Crosswind: possible directions -->
        <line x1="${cx}" y1="${cy}" x2="${a.x}" y2="${a.y}" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 2" />
        <circle cx="${a.x}" cy="${a.y}" r="4" fill="#F59E0B" />
        <line x1="${cx}" y1="${cy}" x2="${b.x}" y2="${b.y}" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 2" />
        <circle cx="${b.x}" cy="${b.y}" r="4" fill="#F59E0B" />

        <!-- Wind blowing in -->
        <line x1="${wind.x}" y1="${wind.y}" x2="${cx}" y2="${cy}" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
        <circle cx="${wind.x}" cy="${wind.y}" r="3" fill="#38BDF8" />
        <text x="${wind.x}" y="${wind.y - 5}" fill="#38BDF8" font-size="7.5" font-weight="bold" text-anchor="middle">Rüzgar</text>

        <circle cx="${cx}" cy="${cy}" r="5" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2" />
      </svg>
    `;
  }

  private bindEvents(): void {
    this.container.querySelector('#btn-close-wildfire')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll('.btn-wind').forEach((btn) => {
      btn.addEventListener('click', () => {
        const deg = Number(btn.getAttribute('data-wind'));
        if (!Number.isNaN(deg)) {
          this.windFromDeg = deg;
          this.render();
        }
      });
    });

    const btnCopy = this.container.querySelector('#btn-copy-wildfire-report');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (this.windFromDeg === null) return;
        const d = wildfireEscapeService.getDirections(this.windFromDeg);
        const t = (deg: number) => wildfireEscapeService.bearingToText(deg);

        const text =
          `[ORMAN YANGINI — YÖN BİLGİSİ (kişisel gözlem, resmi talimat değildir)]\n` +
          `• Rüzgarın geldiği yön (gözlem): ${t(d.windFromDeg)}\n` +
          `• Yangının büyük olasılıkla ilerlediği yön: ${t(d.downwindDeg)}\n` +
          `• Olası kaçış yönleri (rüzgara dik): ${t(d.crosswindADeg)} veya ${t(d.crosswindBDeg)} — alevden uzak olanı seçin\n` +
          `• Yangının önünde yokuş yukarı kaçmayın. 112'yi arayın, yetkililerin tahliye talimatına uyun.\n` +
          `afet.live ile oluşturuldu.`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          btnCopy.innerHTML = `${Icons.checkCircle('w-4 h-4')} Panoya kopyalandı`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}
