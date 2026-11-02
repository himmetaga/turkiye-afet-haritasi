import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import {
  kitExpirationService,
  ExpirationCategory,
  ExpirationItem,
  ExpirationEvaluation
} from '../services/kitExpirationService';

export class KitExpirationTrackerModal {
  private container: HTMLElement;
  private selectedCategory: ExpirationCategory | 'all' = 'all';
  private isAddFormOpen = false;

  // New item form state
  private formName = '';
  private formCategory: ExpirationCategory = 'food';
  private formQuantity = '';
  private formExpiry = '';
  private formNotes = '';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'kit-expiration-modal';
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
    registerModalOpen('kit-expiration-modal', () => this.hide());
  }

  public hide(): void {
    registerModalClose('kit-expiration-modal');
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
    this.isAddFormOpen = false;
  }

  private render(): void {
    const { evaluations, expiredCount, soonCount, freshCount, readinessScore } =
      kitExpirationService.evaluateAll();

    const filteredEvaluations =
      this.selectedCategory === 'all'
        ? evaluations
        : evaluations.filter((e) => e.item.category === this.selectedCategory);

    // Score Color
    const scoreColor =
      readinessScore >= 80 ? '#10B981' : readinessScore >= 50 ? '#F59E0B' : '#EF4444';

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              ${Icons.kitTimer('w-5 h-5')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-wide">Deprem Çantası SKT Takibi</h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider" style="color: ${scoreColor}; background: ${scoreColor}20; border: 1px solid ${scoreColor}40;">
                  %${readinessScore} HAZIRLIK
                </span>
              </div>
              <p class="text-xs text-gray-400">Su, Gıda, İlaç & Pil Miadı Rotasyon Motoru</p>
            </div>
          </div>
          <button id="btn-close-kit-tracker" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Score & KPI Cards -->
        <div class="px-5 pt-4 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Çanta Skoru</div>
            <div class="text-2xl font-black mt-0.5" style="color: ${scoreColor}">%${readinessScore}</div>
            <div class="text-[9px] text-gray-500">${readinessScore >= 80 ? 'Kullanıma Hazır' : 'Yenileme Gerekiyor'}</div>
          </div>

          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-rose-400 uppercase font-semibold">Günü Geçen</div>
            <div class="text-2xl font-black text-rose-400 mt-0.5">${expiredCount}</div>
            <div class="text-[9px] text-gray-500">İmha / Değiştir</div>
          </div>

          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-amber-400 uppercase font-semibold">Rotasyon Vakti</div>
            <div class="text-2xl font-black text-amber-400 mt-0.5">${soonCount}</div>
            <div class="text-[9px] text-gray-500">&lt; 90 Gün Kalan</div>
          </div>

          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-emerald-400 uppercase font-semibold">Taze & Güvenli</div>
            <div class="text-2xl font-black text-emerald-400 mt-0.5">${freshCount}</div>
            <div class="text-[9px] text-gray-500">Sorunsuz Stok</div>
          </div>
        </div>

        <!-- Category Filter Chips & Add Action -->
        <div class="px-5 py-2 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar border-b border-white/5 bg-white/[0.01]">
          <div class="flex items-center gap-1.5 text-xs">
            ${this.renderCategoryChip('all', 'Tümü')}
            ${this.renderCategoryChip('water', '💧 Su')}
            ${this.renderCategoryChip('food', '🥫 Gıda')}
            ${this.renderCategoryChip('medicine', '💊 İlaç')}
            ${this.renderCategoryChip('batteries', '🔋 Pil')}
            ${this.renderCategoryChip('hygiene', '🧼 Hijyen')}
            ${this.renderCategoryChip('infant', '🍼 Bebek')}
          </div>

          <button id="btn-toggle-add-form" class="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-all">
            <span>${this.isAddFormOpen ? '✖ Kapat' : '➕ Yeni Malzeme'}</span>
          </button>
        </div>

        <!-- Add Item Form (Expandable) -->
        ${this.isAddFormOpen ? this.renderAddForm() : ''}

        <!-- Item List Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar text-xs">
          ${
            filteredEvaluations.length === 0
              ? `<div class="text-center py-8 text-gray-500">Bu kategoride henüz malzeme kaydı yok.</div>`
              : filteredEvaluations.map((ev) => this.renderItemCard(ev)).join('')
          }
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 text-xs">
          <button id="btn-reset-kit-defaults" class="text-gray-400 hover:text-gray-200 text-[11px] underline">
            Standart Listeye Sıfırla
          </button>

          <button id="btn-copy-kit-report" class="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-[0.98]">
            ${Icons.copy('w-4 h-4')}
            Muayene Tutanağını Kopyala / Paylaş
          </button>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  private renderCategoryChip(cat: ExpirationCategory | 'all', label: string): string {
    const isSelected = this.selectedCategory === cat;
    return `
      <button data-cat="${cat}" class="btn-category-chip px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
        isSelected
          ? 'bg-white/20 text-white border border-white/30 shadow'
          : 'text-gray-400 hover:text-gray-200 bg-white/[0.03]'
      }">
        ${label}
      </button>
    `;
  }

  private renderAddForm(): string {
    return `
      <div class="px-5 py-3 bg-black/60 border-b border-white/10 space-y-3 text-xs animate-fadeIn">
        <div class="font-bold text-emerald-400 flex items-center gap-1.5">
          <span>📝</span> Çantaya Yeni Malzeme / İlaç Kaydet
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Malzeme / İlaç Adı *</label>
            <input id="input-item-name" type="text" placeholder="Örn: Bebek Maması veya Ağrı Kesici" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Kategori</label>
              <select id="select-item-category" class="w-full px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs outline-none">
                <option value="food">🥫 Gıda</option>
                <option value="water">💧 Su</option>
                <option value="medicine">💊 İlaç</option>
                <option value="batteries">🔋 Pil</option>
                <option value="hygiene">🧼 Hijyen</option>
                <option value="infant">🍼 Bebek</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Miktar / Adet</label>
              <input id="input-item-quantity" type="text" placeholder="Örn: 4 Adet" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Son Kullanma Tarihi (SKT) *</label>
            <input id="input-item-date" type="date" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
          </div>

          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Özel Saklama Notu (İsteğe bağlı)</label>
            <input id="input-item-notes" type="text" placeholder="Örn: Işık görmeyen cepte saklayın" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button id="btn-save-new-item" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all">
            Kaydet
          </button>
        </div>
      </div>
    `;
  }

  private renderItemCard(ev: ExpirationEvaluation): string {
    const { item, daysRemaining, status, statusLabel, statusColor } = ev;

    const categoryIcons: Record<ExpirationCategory, string> = {
      water: '💧 Su',
      food: '🥫 Gıda',
      medicine: '💊 İlaç',
      batteries: '🔋 Pil',
      hygiene: '🧼 Hijyen',
      infant: '🍼 Bebek'
    };

    return `
      <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-1 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-white">${item.name}</span>
            <span class="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400">
              ${categoryIcons[item.category] || item.category}
            </span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
              ${statusLabel}
            </span>
          </div>

          <div class="flex items-center gap-3 text-[11px] text-gray-400">
            <span>Miktar: <strong class="text-gray-200">${item.quantity}</strong></span>
            <span>SKT: <strong class="text-gray-200 font-mono">${item.expiryDateStr}</strong></span>
          </div>

          ${
            item.notes
              ? `<div class="text-[10px] text-gray-500 italic mt-0.5">⚠️ ${item.notes}</div>`
              : ''
          }
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button data-action="rotate" data-id="${item.id}" title="Malzemeyi Tüket & Yeni Tarih Ata (+6 Ay)" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-cyan-300 font-medium text-[11px] border border-white/10 flex items-center gap-1 transition-all">
            <span>🔄</span> +6 Ay Yenile
          </button>
          
          <button data-action="delete" data-id="${item.id}" title="Malzemeyi Listeden Sil" class="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all">
            ${Icons.close('w-3.5 h-3.5')}
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const btnClose = this.container.querySelector('#btn-close-kit-tracker');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.hide());
    }

    // Category chips
    const chipBtns = this.container.querySelectorAll('.btn-category-chip');
    chipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat') as any;
        if (cat) {
          this.selectedCategory = cat;
          this.render();
        }
      });
    });

    // Toggle add form
    const btnToggleForm = this.container.querySelector('#btn-toggle-add-form');
    if (btnToggleForm) {
      btnToggleForm.addEventListener('click', () => {
        this.isAddFormOpen = !this.isAddFormOpen;
        this.render();
      });
    }

    // Save new item
    const btnSaveNew = this.container.querySelector('#btn-save-new-item');
    if (btnSaveNew) {
      btnSaveNew.addEventListener('click', () => {
        const nameInput = this.container.querySelector('#input-item-name') as HTMLInputElement;
        const catSelect = this.container.querySelector('#select-item-category') as HTMLSelectElement;
        const qtyInput = this.container.querySelector('#input-item-quantity') as HTMLInputElement;
        const dateInput = this.container.querySelector('#input-item-date') as HTMLInputElement;
        const notesInput = this.container.querySelector('#input-item-notes') as HTMLInputElement;

        if (!nameInput?.value.trim()) {
          alert('Lütfen malzeme adını yazın.');
          return;
        }
        if (!dateInput?.value) {
          alert('Lütfen geçerli bir Son Kullanma Tarihi (SKT) seçin.');
          return;
        }

        kitExpirationService.addItem({
          name: nameInput.value.trim(),
          category: catSelect.value as ExpirationCategory,
          quantity: qtyInput?.value.trim() || '1 Adet',
          expiryDateStr: dateInput.value,
          recommendedShelfLifeMonths: 12,
          notes: notesInput?.value.trim() || ''
        });

        this.isAddFormOpen = false;
        this.render();
      });
    }

    // Rotate and delete item buttons
    this.container.querySelectorAll('[data-action="rotate"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          kitExpirationService.rotateItem(id, 6);
          this.render();
        }
      });
    });

    this.container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          kitExpirationService.removeItem(id);
          this.render();
        }
      });
    });

    // Reset defaults
    const btnReset = this.container.querySelector('#btn-reset-kit-defaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Tüm çantayı standart afet seti malzemelerine ve tarihlerine sıfırlamak istiyor musunuz?')) {
          kitExpirationService.resetToDefaults();
          this.render();
        }
      });
    }

    // Copy report
    const btnCopy = this.container.querySelector('#btn-copy-kit-report');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const { evaluations, readinessScore, expiredCount, soonCount } = kitExpirationService.evaluateAll();
        
        let report = `🎒 [DEPREM ÇANTASI SKT & STOK MUAYENE TUTANAĞI]\n`;
        report += `• Genel Hazırlık Skoru: %${readinessScore}\n`;
        report += `• Tarihi Dolan / Tehlikeli: ${expiredCount} Kalem\n`;
        report += `• Rotasyon / Yaklaşan: ${soonCount} Kalem\n\n`;
        report += `📋 MALZEME LİSTESİ & MİAD DURUMU:\n`;

        evaluations.forEach((e, idx) => {
          report += `${idx + 1}. ${e.item.name} (${e.item.quantity})\n`;
          report += `   - SKT: ${e.item.expiryDateStr} (${e.statusLabel})\n`;
          if (e.item.notes) report += `   - Not: ${e.item.notes}\n`;
        });

        report += `\n⚠️ Bu tutanak afet.live Deprem Çantası Takip Sistemi ile üretilmiştir.`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(report);
          btnCopy.innerHTML = `${Icons.checkCircle('w-4 h-4')} Tutanak Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}

