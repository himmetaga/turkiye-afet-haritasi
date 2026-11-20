/**
 * INSARAGMarkingModal.ts
 * =============================================================================
 * Enkaz üzerindeki arama işaretleri için BASİTLEŞTİRİLMİŞ yardımcı ekran.
 * Resmi INSARAG el kitabı değildir; hiçbir işareti "bina güvenli" ya da
 * "kişiler kurtarıldı" diye yorumlamaz. Ayrıntı: services/insaragService.ts
 * =============================================================================
 */

import { Icons } from './icons';
import {
  insaragService,
  InsaragTag,
  COMMON_HAZARDS,
  DecodedExplanation,
  INSARAG_FIXED_RECOMMENDATION
} from '../services/insaragService';
import { registerModalOpen, registerModalClose, setupModalMobileDismiss } from '../utils/mobileModalHelper';
import { escapeHtml } from '../utils/safeText';

export class INSARAGMarkingModal {
  private container: HTMLElement;
  private activeTab: 'decoder' | 'reference' = 'decoder';

  // Boş başlar: örnek ekip kodu, tarih ya da sayı gösterilmez.
  private tagState: InsaragTag = {
    teamId: '',
    startDate: '',
    liveCount: 0,
    deadCount: 0,
    hazards: [],
    status: 'in_progress'
  };

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'insarag-marking-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide(),
      closeBtnSelector: '#btn-close-insarag'
    });
  }

  public show(): void {
    this.container.classList.remove('hidden');
    registerModalOpen('insarag-marking-modal', () => this.hide());
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    registerModalClose('insarag-marking-modal');
  }

  private render(): void {
    const decoded: DecodedExplanation = insaragService.decode(this.tagState);
    const svgPreview = insaragService.generateSvg(this.tagState, 220);

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
              ${Icons.sprayCan('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Enkaz İşaretleri</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BASİTLEŞTİRİLMİŞ YARDIMCI
                </span>
              </div>
              <p class="text-[11px] text-white/60">Arama ekiplerinin duvara yazdığı işaretleri okumaya yardımcı olur</p>
            </div>
          </div>
          <button id="btn-close-insarag" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="p-2.5 border-b border-white/10 bg-white/[0.02] flex items-center gap-1.5 shrink-0">
          <button
            id="tab-btn-decoder"
            class="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              this.activeTab === 'decoder'
                ? 'bg-rose-500 text-obsidian-950 font-black shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }"
          >
            🔍 Duvardaki İşareti Oku
          </button>
          <button
            id="tab-btn-reference"
            class="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              this.activeTab === 'reference'
                ? 'bg-rose-500 text-obsidian-950 font-black shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }"
          >
            📖 Kılavuz
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 overflow-y-auto space-y-4 text-xs">
          <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11.5px] leading-relaxed text-amber-200">
            <strong>Bu ekran basitleştirilmiş bir yardımcıdır; resmi INSARAG el kitabı değildir.</strong>
            Ekipler farklı işaret sistemleri kullanabilir ve aynı şekil başka anlama gelebilir.
            ${INSARAG_FIXED_RECOMMENDATION} Acil durumda 112'yi arayın.
          </div>

          <!-- Visual SVG & Result Banner -->
          <div class="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/10">
            <div class="shrink-0 flex flex-col items-center">
              ${svgPreview}
              <span class="text-[9.5px] text-white/40 mt-1 font-mono">Şematik çizim (ölçekli değildir)</span>
            </div>

            <div class="flex-1 space-y-2 w-full">
              <div class="p-2.5 rounded-xl ${
                this.tagState.status === 'in_progress'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                  : 'bg-sky-500/15 border-sky-500/30 text-sky-200'
              } border">
                <div class="font-black text-xs sm:text-sm tracking-tight mb-1">
                  ${decoded.headline}
                </div>
                <div class="text-[11px] leading-relaxed">
                  ${decoded.recommendation}
                </div>
              </div>

              <div class="space-y-1 text-[11px] text-white/80">
                <p>• <strong>Ekip:</strong> ${escapeHtml(decoded.teamSummary)}</p>
                <p>• <strong>L / D sayıları:</strong> ${escapeHtml(decoded.victimSummary)}</p>
                <p>• <strong>Tehlike notu:</strong> <span class="text-rose-300 font-bold">${escapeHtml(decoded.hazardSummary)}</span></p>
              </div>
            </div>
          </div>

          ${
            this.activeTab === 'decoder'
              ? `
            <!-- Interactive Quadrant Controls -->
            <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3.5">
              <h3 class="font-bold text-xs uppercase tracking-wider text-white/80 flex items-center justify-between">
                <span>Duvarda Gördüğünüz Parçaları Seçin</span>
              </h3>

              <!-- Slaş / Operasyon Durumu -->
              <div class="space-y-1.5">
                <label class="text-[11px] text-white/70 font-bold block">1. Çizgi şekli:</label>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    data-status="in_progress"
                    class="btn-status-sel p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      this.tagState.status === 'in_progress'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }"
                  >
                    / Tek Çizgi<br><span class="text-[9px] font-normal opacity-70">Arama başlamış olabilir</span>
                  </button>
                  <button
                    data-status="completed"
                    class="btn-status-sel p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      this.tagState.status === 'completed'
                        ? 'bg-sky-500/25 border-sky-500 text-sky-300'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }"
                  >
                    X Çarpı<br><span class="text-[9px] font-normal opacity-70">Arama bitmiş olabilir</span>
                  </button>
                </div>
              </div>

              <!-- Ekip Kodu ve Tarih -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="text-[11px] text-white/70 font-bold block mb-1">Sol bölme (ekip kodu):</label>
                  <input
                    id="insarag-team-input"
                    type="text"
                    value="${escapeHtml(this.tagState.teamId)}"
                    placeholder="Duvarda yazan ekip kodu"
                    class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-white/70 font-bold block mb-1">Üst bölme (tarih ve saat):</label>
                  <input
                    id="insarag-date-input"
                    type="text"
                    value="${escapeHtml(this.tagState.startDate)}"
                    placeholder="Duvarda yazan tarih / saat"
                    class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <!-- Kazazedeler: Canlı (L) ve Vefat (D) -->
              <div class="grid grid-cols-2 gap-2.5">
                <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <label class="text-[11px] text-emerald-300 font-bold block mb-1">Alt bölme: L (canlı, işaretlenen):</label>
                  <div class="flex items-center gap-2">
                    <button id="btn-dec-live" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">-</button>
                    <span class="font-mono text-base font-black text-emerald-300 w-8 text-center">${this.tagState.liveCount}</span>
                    <button id="btn-inc-live" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">+</button>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <label class="text-[11px] text-rose-300 font-bold block mb-1">Alt bölme: D (vefat, işaretlenen):</label>
                  <div class="flex items-center gap-2">
                    <button id="btn-dec-dead" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">-</button>
                    <span class="font-mono text-base font-black text-rose-300 w-8 text-center">${this.tagState.deadCount}</span>
                    <button id="btn-inc-dead" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">+</button>
                  </div>
                </div>
              </div>

              <!-- Sağ Kadran: Tehlikeler -->
              <div class="space-y-1.5">
                <label class="text-[11px] text-white/70 font-bold block">Sağ bölme (tehlike notları — kısaltmalar yalnızca bu ekrana aittir):</label>
                <div class="flex flex-wrap gap-1.5">
                  ${COMMON_HAZARDS.map((h) => {
                    const isSelected = this.tagState.hazards.includes(h.code);
                    return `
                      <button
                        data-hazard="${h.code}"
                        class="btn-hazard-toggle px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                          isSelected
                            ? 'bg-rose-500 text-white border-rose-400 font-black shadow-sm'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }"
                      >
                        ${h.label}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `
              : `
            <!-- Reference Manual & Guide -->
            <div class="space-y-3 leading-relaxed text-[11.5px] text-white/70">
              <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <h4 class="font-bold text-white text-xs">Enkaz işaretleri nedir?</h4>
                <p>
                  Arama kurtarma ekipleri, bir binada ne yaptıklarını diğer ekiplere bildirmek için duvara sprey boyayla işaret bırakır.
                  Birden fazla sistem vardır (INSARAG, ABD FEMA vb.) ve ekipler kendi sistemini kullanır.
                  Buradaki "çizgi / çarpı ve dört bölme" düzeni yaygın görülen bir örnektir; her işaret buna uymayabilir.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-amber-300 font-black block mb-0.5">/ (Tek Eğik Çizgi)</span>
                  <p class="text-[11px]">Bir ekip aramaya başlamış; içeride çalışma sürüyor olabilir. Yakınında gürültü yapmayın, ekip dinleme yapıyor olabilir.</p>
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-sky-300 font-black block mb-0.5">X (Çarpı İşareti)</span>
                  <p class="text-[11px]">Bir ekip bu noktadaki aramasını bitirmiş olabilir. Bu, binanın güvenli ya da boş olduğu anlamına gelmez.</p>
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-emerald-300 font-black block mb-0.5">L ve D sayıları</span>
                  <p class="text-[11px]">L canlı, D vefat eden kişileri gösterir. Bu sayılar içeride tespit edilen kişileri anlatıyor olabilir; "kurtarıldı" diye okumayın.</p>
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-rose-300 font-black block mb-0.5">Tehlike notları</span>
                  <p class="text-[11px]">Gaz, elektrik, çökme gibi tehlikeler çoğu zaman açık yazıyla not edilir. Not yoksa bile bina tehlikeli olabilir.</p>
                </div>
                <div class="sm:col-span-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                  <p class="text-[11px]"><strong>Tanımadığınız bir işaret görürseniz</strong> (kutu içinde çarpı, harfler, oklar vb.) anlamını tahmin etmeyin; en kötü ihtimali varsayın ve binaya girmeyin. ${INSARAG_FIXED_RECOMMENDATION}</p>
                </div>
              </div>
            </div>
          `
          }
        </div>

        <!-- Footer -->
        <div class="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span>Resmi kaynak değildir</span>
          <button id="btn-copy-insarag-log" class="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-1.5 transition-all">
            ${Icons.copy('w-3.5 h-3.5')} Notu Kopyala
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Tab switching
    this.container.querySelector('#tab-btn-decoder')?.addEventListener('click', () => {
      this.activeTab = 'decoder';
      this.render();
    });
    this.container.querySelector('#tab-btn-reference')?.addEventListener('click', () => {
      this.activeTab = 'reference';
      this.render();
    });

    // Status selection
    this.container.querySelectorAll<HTMLButtonElement>('.btn-status-sel').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tagState.status = btn.dataset.status === 'completed' ? 'completed' : 'in_progress';
        this.render();
      });
    });

    // Inputs
    const teamInput = this.container.querySelector<HTMLInputElement>('#insarag-team-input');
    teamInput?.addEventListener('input', (e) => {
      this.tagState.teamId = (e.target as HTMLInputElement).value;
    });

    const dateInput = this.container.querySelector<HTMLInputElement>('#insarag-date-input');
    dateInput?.addEventListener('input', (e) => {
      this.tagState.startDate = (e.target as HTMLInputElement).value;
    });

    // Increment/decrement live and dead
    this.container.querySelector('#btn-dec-live')?.addEventListener('click', () => {
      if (this.tagState.liveCount > 0) this.tagState.liveCount--;
      this.render();
    });
    this.container.querySelector('#btn-inc-live')?.addEventListener('click', () => {
      this.tagState.liveCount++;
      this.render();
    });
    this.container.querySelector('#btn-dec-dead')?.addEventListener('click', () => {
      if (this.tagState.deadCount > 0) this.tagState.deadCount--;
      this.render();
    });
    this.container.querySelector('#btn-inc-dead')?.addEventListener('click', () => {
      this.tagState.deadCount++;
      this.render();
    });

    // Hazard toggles
    this.container.querySelectorAll<HTMLButtonElement>('.btn-hazard-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hCode = btn.dataset.hazard;
        if (!hCode) return;
        if (this.tagState.hazards.includes(hCode)) {
          this.tagState.hazards = this.tagState.hazards.filter((h) => h !== hCode);
        } else {
          this.tagState.hazards.push(hCode);
        }
        this.render();
      });
    });

    // Copy log
    this.container.querySelector('#btn-copy-insarag-log')?.addEventListener('click', () => {
      const decodedNow = insaragService.decode(this.tagState);
      const log = `[ENKAZ İŞARETİ NOTU — resmi tutanak değildir]\nGörülen çizgi: ${decodedNow.statusBadge}\nEkip kodu: ${this.tagState.teamId || 'girilmedi'}\nTarih/Saat: ${this.tagState.startDate || 'girilmedi'}\nİşaretlenen canlı (L): ${this.tagState.liveCount}\nİşaretlenen vefat (D): ${this.tagState.deadCount}\nTehlike notları: ${this.tagState.hazards.join(', ') || 'seçilmedi'}\n${INSARAG_FIXED_RECOMMENDATION}`;
      navigator.clipboard?.writeText(log).then(() => {
        alert('Not panoya kopyalandı.');
      });
    });
  }
}

