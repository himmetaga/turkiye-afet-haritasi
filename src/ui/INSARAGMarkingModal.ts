/**
 * INSARAGMarkingModal.ts
 * =============================================================================
 * UN OCHA / INSARAG Uluslararası USAR Enkaz İşaretleme Sistemi
 * Açık Standart: INSARAG Guidelines Vol II: Operations, Manual B
 * AFAD & AKUT & İtfaiye Kentsel Arama Kurtarma Standartları
 * =============================================================================
 * 1. Enkaz İşaret Çözücü: Sahadaki bir binanın üzerine boyanmış 1x1m INSARAG
 *    kutusunu okuyarak arama durumunu, canlı/vefat sayısını ve gaz tehlikesini çözer.
 * 2. İşaret Oluşturucu: Sahra ekiplerinin hatasız uluslararası işaret çizmesini sağlar.
 */

import { Icons } from './icons';
import {
  insaragService,
  InsaragTag,
  InsaragStatus,
  COMMON_HAZARDS,
  DecodedExplanation
} from '../services/insaragService';
import { registerModalOpen, registerModalClose, setupModalMobileDismiss } from '../utils/mobileModalHelper';

export class INSARAGMarkingModal {
  private container: HTMLElement;
  private activeTab: 'decoder' | 'generator' | 'reference' = 'decoder';

  private tagState: InsaragTag = {
    teamId: 'TR-AFAD-01',
    startDate: '06.02 09:30',
    endDate: '06.02 18:00',
    liveCount: 2,
    deadCount: 0,
    hazards: ['G', 'COL'],
    status: 'in_progress',
    notes: '2. kat mutfak boşluğunda canlı ses teması alındı.'
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
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">INSARAG Enkaz İşaretleme</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  UN OCHA / AFAD USAR
                </span>
              </div>
              <p class="text-[11px] text-white/60">Uluslararası Arama Kurtarma Duvar Sprey Şifreleri</p>
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
            🔍 Duvardaki İşareti Çöz
          </button>
          <button
            id="tab-btn-generator"
            class="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              this.activeTab === 'generator'
                ? 'bg-rose-500 text-obsidian-950 font-black shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }"
          >
            🎨 İşaret Oluştur / Çiz
          </button>
          <button
            id="tab-btn-reference"
            class="py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
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
          <!-- Visual SVG & Result Banner -->
          <div class="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/10">
            <div class="shrink-0 flex flex-col items-center">
              ${svgPreview}
              <span class="text-[9.5px] text-white/40 mt-1 font-mono">1x1 Metre Sprey Boya Şablonu</span>
            </div>

            <div class="flex-1 space-y-2 w-full">
              <div class="p-2.5 rounded-xl ${
                this.tagState.status === 'in_progress'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                  : this.tagState.status === 'cleared'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
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
                <p>• <strong>Ekip:</strong> ${decoded.teamSummary}</p>
                <p>• <strong>Kazazede Durumu:</strong> ${decoded.victimSummary}</p>
                <p>• <strong>Tehlike Durumu:</strong> <span class="text-rose-300 font-bold">${decoded.hazardSummary}</span></p>
              </div>
            </div>
          </div>

          ${
            this.activeTab === 'decoder' || this.activeTab === 'generator'
              ? `
            <!-- Interactive Quadrant Controls -->
            <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3.5">
              <h3 class="font-bold text-xs uppercase tracking-wider text-white/80 flex items-center justify-between">
                <span>${this.activeTab === 'decoder' ? 'Duvarda Gördüğünüz Sembolleri Seçin' : 'Saha İşaretini Yapılandırın'}</span>
                <span class="text-[10px] text-white/40 font-mono">INSARAG USAR Box</span>
              </h3>

              <!-- Slaş / Operasyon Durumu -->
              <div class="space-y-1.5">
                <label class="text-[11px] text-white/70 font-bold block">1. Çizgi / Slaş Şekli (Operasyon Durumu):</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    data-status="in_progress"
                    class="btn-status-sel p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      this.tagState.status === 'in_progress'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }"
                  >
                    / Tek Çizgi<br><span class="text-[9px] font-normal opacity-70">Arama Sürüyor</span>
                  </button>
                  <button
                    data-status="completed"
                    class="btn-status-sel p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      this.tagState.status === 'completed'
                        ? 'bg-sky-500/25 border-sky-500 text-sky-300'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }"
                  >
                    X Çarpı<br><span class="text-[9px] font-normal opacity-70">Arama Bitti</span>
                  </button>
                  <button
                    data-status="cleared"
                    class="btn-status-sel p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      this.tagState.status === 'cleared'
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }"
                  >
                    [X] Kutulu Çarpı<br><span class="text-[9px] font-normal opacity-70">Bina Temizlendi</span>
                  </button>
                  <button
                    data-status="passed"
                    class="btn-status-sel p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      this.tagState.status === 'passed'
                        ? 'bg-purple-500/25 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }"
                  >
                    G Harfi<br><span class="text-[9px] font-normal opacity-70">Boş / İlerlendi</span>
                  </button>
                </div>
              </div>

              <!-- Ekip Kodu ve Tarih -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="text-[11px] text-white/70 font-bold block mb-1">Sol Kadran (Ekip ID):</label>
                  <input
                    id="insarag-team-input"
                    type="text"
                    value="${this.tagState.teamId}"
                    placeholder="TR-AFAD-01, AKUT, FR-USAR"
                    class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-white/70 font-bold block mb-1">Üst Kadran (Tarih ve Saat):</label>
                  <input
                    id="insarag-date-input"
                    type="text"
                    value="${this.tagState.startDate}"
                    placeholder="06.02 09:30"
                    class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <!-- Kazazedeler: Canlı (L) ve Vefat (D) -->
              <div class="grid grid-cols-2 gap-2.5">
                <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <label class="text-[11px] text-emerald-300 font-bold block mb-1">Alt Kadran: L (Canlı Kazazede):</label>
                  <div class="flex items-center gap-2">
                    <button id="btn-dec-live" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">-</button>
                    <span class="font-mono text-base font-black text-emerald-300 w-8 text-center">${this.tagState.liveCount}</span>
                    <button id="btn-inc-live" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">+</button>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <label class="text-[11px] text-rose-300 font-bold block mb-1">Alt Kadran: D (Çıkarılan Vefat):</label>
                  <div class="flex items-center gap-2">
                    <button id="btn-dec-dead" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">-</button>
                    <span class="font-mono text-base font-black text-rose-300 w-8 text-center">${this.tagState.deadCount}</span>
                    <button id="btn-inc-dead" class="w-7 h-7 rounded-lg bg-white/10 font-black text-sm">+</button>
                  </div>
                </div>
              </div>

              <!-- Sağ Kadran: Tehlikeler -->
              <div class="space-y-1.5">
                <label class="text-[11px] text-white/70 font-bold block">Sağ Kadran (Tehlike Kodları):</label>
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
                        [${h.code}] ${h.label.split('/')[0]}
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
                <h4 class="font-bold text-white text-xs">INSARAG Enkaz İşaretleme Sistemi Nedir?</h4>
                <p>
                  Birleşmiş Milletler İnsani Yardım Koordinasyon Ofisi (UN OCHA) ve INSARAG rehberliğinde geliştirilmiş,
                  AFAD, AKUT ve uluslararası arama kurtarma timlerinin (USAR) enkaz üzerinde kullandığı standart sprey işaretleme dilidir.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-amber-300 font-black block mb-0.5">/ (Tek Eğik Çizgi)</span>
                  <p class="text-[11px]">Ekip binaya giriş yaptı, içeride arama çalışması sürüyor. Kesinlikle dışarıdan gürültü yapılmamalı, sesli dinleme yapılıyor olabilir.</p>
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-sky-300 font-black block mb-0.5">X (Çarpı İşareti)</span>
                  <p class="text-[11px]">Arama tamamlandı. Ekip sahadan çıktı. Dört kadrandaki veriler güncellendi.</p>
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-emerald-300 font-black block mb-0.5">[X] (Kutu İçi Çarpı)</span>
                  <p class="text-[11px]">Bina tamamen temizlendi. İçeride canlı ya da vefat kalmadı. Ağır iş makineleriyle enkaz kaldırmaya uygundur.</p>
                </div>
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span class="text-rose-300 font-black block mb-0.5">G / COL / A / E Kodları</span>
                  <p class="text-[11px]"><strong>G:</strong> Gaz kaçağı, <strong>COL:</strong> Ağır çökme riski, <strong>A:</strong> Asbest/toksik toz, <strong>E:</strong> Elektrik tehlikesi.</p>
                </div>
              </div>
            </div>
          `
          }
        </div>

        <!-- Footer -->
        <div class="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span>INSARAG Guidelines Vol II</span>
          <button id="btn-copy-insarag-log" class="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-1.5 transition-all">
            ${Icons.copy('w-3.5 h-3.5')} Saha Tutanağını Kopyala
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
    this.container.querySelector('#tab-btn-generator')?.addEventListener('click', () => {
      this.activeTab = 'generator';
      this.render();
    });
    this.container.querySelector('#tab-btn-reference')?.addEventListener('click', () => {
      this.activeTab = 'reference';
      this.render();
    });

    // Status selection
    this.container.querySelectorAll<HTMLButtonElement>('.btn-status-sel').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tagState.status = (btn.dataset.status as InsaragStatus) || 'in_progress';
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
        if (hCode === 'OK') {
          this.tagState.hazards = ['OK'];
        } else {
          this.tagState.hazards = this.tagState.hazards.filter((h) => h !== 'OK');
          if (this.tagState.hazards.includes(hCode)) {
            this.tagState.hazards = this.tagState.hazards.filter((h) => h !== hCode);
          } else {
            this.tagState.hazards.push(hCode);
          }
        }
        this.render();
      });
    });

    // Copy log
    this.container.querySelector('#btn-copy-insarag-log')?.addEventListener('click', () => {
      const log = `[INSARAG USAR SAHA TUTANAĞI]\nEkip: ${this.tagState.teamId}\nTarih/Saat: ${this.tagState.startDate}\nDurum: ${this.tagState.status}\nKurtarılan Canlı (L): ${this.tagState.liveCount}\nÇıkarılan Vefat (D): ${this.tagState.deadCount}\nTehlikeler: ${this.tagState.hazards.join(', ')}\nNot: ${this.tagState.notes || 'Yok'}\nafet.live INSARAG Çözücü`;
      navigator.clipboard?.writeText(log).then(() => {
        alert('INSARAG saha tutanağı panoya kopyalandı.');
      });
    });
  }
}

