/**
 * AfetBilgiCatalogModal.ts
 * =============================================================================
 * Yardım hatları sayfası.
 *
 * Eskiden burada elle yazılmış bir yardım noktası listesi gösteriliyordu.
 * Liste güncel bir kaynağa bağlı olmadığı için kaldırıldı; sayfa artık yalnızca
 * çağrı hatlarını ve güncel bilginin nereden alınacağını gösterir.
 */

import { Icons } from './icons';
import { afetBilgiService } from '../services/afetBilgiService';
import { registerModalOpen, registerModalClose, setupModalMobileDismiss } from '../utils/mobileModalHelper';
import { escapeHtml } from '../utils/safeText';

export class AfetBilgiCatalogModal {
  private container: HTMLElement;

  // İkinci parametre eski çağrı imzasıyla uyum için duruyor; artık kullanılmıyor.
  constructor(parent: HTMLElement, _onNavigateToPoint?: (coords: [number, number], title: string) => void) {
    this.container = document.createElement('div');
    this.container.id = 'afetbilgi-catalog-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide(),
      closeBtnSelector: '#btn-close-afetbilgi'
    });
  }

  public show(_coords?: [number, number]): void {
    this.container.classList.remove('hidden');
    registerModalOpen('afetbilgi-catalog-modal', () => this.hide());
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    registerModalClose('afetbilgi-catalog-modal');
  }

  private render(): void {
    const hotlines = afetBilgiService.getEmergencyHotlines();

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              ${Icons.soupKitchen('w-5 h-5')}
            </span>
            <div>
              <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Yardım Hatları</h2>
              <p class="text-[11px] text-white/60">Aşevi, barınma ve yardım noktaları için kime sorulur?</p>
            </div>
          </div>
          <button id="btn-close-afetbilgi" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="p-3 sm:p-4 overflow-y-auto space-y-3">
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[12px] text-amber-100 leading-relaxed">
            Bu uygulamada güncel bir aşevi, çadırkent veya yardım noktası listesi <strong>yoktur</strong>.
            Açık olan yardım noktaları afet sırasında AFAD ve Kızılay tarafından duyurulur.
            Güncel bilgi için aşağıdaki hatları arayın veya valilik ve belediye duyurularını takip edin.
          </div>

          ${hotlines
            .map(
              (h) => `
            <a
              href="tel:${escapeHtml(h.number.replace(/\s+/g, ''))}"
              class="block p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-rose-500/40 transition-all"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-black text-white">${escapeHtml(h.name)}</div>
                  <div class="text-[11px] text-white/60 mt-0.5">${escapeHtml(h.operator)}</div>
                  <div class="text-[11px] text-white/70 mt-1 leading-snug">${escapeHtml(h.purpose)}</div>
                </div>
                <span class="shrink-0 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-bold text-sm">
                  📞 ${escapeHtml(h.number)}
                </span>
              </div>
            </a>
          `
            )
            .join('')}
        </div>

        <div class="p-3 border-t border-white/10 bg-white/[0.02] text-[11px] text-white/50 shrink-0">
          Hayati acil durumda tek numara 112'dir. Bu sayfa bilgilendirme amaçlıdır.
        </div>
      </div>
    `;
  }
}
