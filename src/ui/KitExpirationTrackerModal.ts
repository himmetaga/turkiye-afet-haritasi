import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import { escapeHtml } from '../utils/safeText';
import {
  kitExpirationService,
  ExpirationCategory,
  ExpirationEvaluation,
  KIT_SUGGESTIONS
} from '../services/kitExpirationService';

export class KitExpirationTrackerModal {
  private container: HTMLElement;
  private selectedCategory: ExpirationCategory | 'all' = 'all';
  private isAddFormOpen = false;
  /** SKT'si yenilenmekte olan malzemenin kimliği (satır içi tarih girişi açık). */
  private editingDateId: string | null = null;

  // Yeni malzeme formu (öneriye dokununca isim/kategori/not ön doldurulur; tarih asla doldurulmaz)
  private formName = '';
  private formCategory: ExpirationCategory = 'food';
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
    this.editingDateId = null;
  }

  private render(): void {
    const { evaluations, expiredCount, soonCount, freshCount, readinessScore } =
      kitExpirationService.evaluateAll();

    const hasItems = evaluations.length > 0;

    const filteredEvaluations =
      this.selectedCategory === 'all'
        ? evaluations
        : evaluations.filter((e) => e.item.category === this.selectedCategory);

    const scoreColor =
      readinessScore === null
        ? '#9CA3AF'
        : readinessScore >= 80
        ? '#10B981'
        : readinessScore >= 50
        ? '#F59E0B'
        : '#EF4444';
    const scoreText = readinessScore === null ? '—' : `%${readinessScore}`;
    const scoreHint =
      readinessScore === null ? 'Kayıt yok' : readinessScore >= 80 ? 'Tarihler uygun' : 'Yenileme gerekiyor';

    this.container.innerHTML = `
      <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              ${Icons.kitTimer('w-5 h-5')}
            </div>
            <div>
              <h2 class="text-base font-bold text-white tracking-wide">Deprem Çantası SKT Takibi</h2>
              <p class="text-xs text-gray-400">Yalnızca sizin girdiğiniz malzemeleri ve ambalajdan okuduğunuz tarihleri takip eder</p>
            </div>
          </div>
          <button id="btn-close-kit-tracker" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Score & KPI Cards -->
        <div class="px-5 pt-4 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">SKT Skoru</div>
            <div class="text-2xl font-black mt-0.5" style="color: ${scoreColor}">${scoreText}</div>
            <div class="text-[9px] text-gray-500">${scoreHint}</div>
          </div>

          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-rose-400 uppercase font-semibold">Günü Geçen</div>
            <div class="text-2xl font-black text-rose-400 mt-0.5">${expiredCount}</div>
            <div class="text-[9px] text-gray-500">Değiştirin</div>
          </div>

          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-amber-400 uppercase font-semibold">Yaklaşan</div>
            <div class="text-2xl font-black text-amber-400 mt-0.5">${soonCount}</div>
            <div class="text-[9px] text-gray-500">&lt; 90 gün kalan</div>
          </div>

          <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <div class="text-[10px] text-emerald-400 uppercase font-semibold">SKT Uzak</div>
            <div class="text-2xl font-black text-emerald-400 mt-0.5">${freshCount}</div>
            <div class="text-[9px] text-gray-500">&gt; 90 gün kalan</div>
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
            !hasItems
              ? this.renderEmptyState()
              : filteredEvaluations.length === 0
              ? `<div class="text-center py-8 text-gray-500">Bu kategoride henüz malzeme kaydı yok.</div>`
              : filteredEvaluations.map((ev) => this.renderItemCard(ev)).join('')
          }
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 text-xs">
          ${
            hasItems
              ? `
          <button id="btn-clear-kit" class="text-gray-400 hover:text-gray-200 text-[11px] underline">
            Listeyi Temizle
          </button>

          <button id="btn-copy-kit-report" class="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-[0.98]">
            ${Icons.copy('w-4 h-4')}
            Listeyi Kopyala
          </button>`
              : `<span class="text-[11px] text-gray-500">Skor yalnızca girdiğiniz tarihlere bakar; çantanızın eksiksiz olduğunu göstermez.</span>`
          }
        </div>

      </div>
    `;

    this.bindEvents();
  }

  private renderEmptyState(): string {
    return `
      <div class="text-center py-4 text-gray-300 space-y-1">
        <div class="font-bold text-sm text-white">Henüz malzeme eklemediniz.</div>
        <div class="text-gray-400">Çantanızdaki ürünlerin son kullanma tarihini ambalajdan okuyup girin.</div>
      </div>
      <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
        <div class="text-[11px] text-gray-400">Öneriler (yalnızca isim — tarihi siz gireceksiniz):</div>
        <div class="flex flex-wrap gap-1.5">
          ${KIT_SUGGESTIONS.map(
            (s, idx) => `
            <button type="button" data-suggest="${idx}" class="btn-kit-suggest px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-200 transition-all">
              ➕ ${escapeHtml(s.name)}
            </button>`
          ).join('')}
        </div>
      </div>
    `;
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
    const opt = (value: ExpirationCategory, label: string) =>
      `<option value="${value}" ${this.formCategory === value ? 'selected' : ''}>${label}</option>`;

    return `
      <div class="px-5 py-3 bg-black/60 border-b border-white/10 space-y-3 text-xs animate-fadeIn">
        <div class="font-bold text-emerald-400 flex items-center gap-1.5">
          <span>📝</span> Çantaya Yeni Malzeme / İlaç Kaydet
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Malzeme / İlaç Adı *</label>
            <input id="input-item-name" type="text" value="${escapeHtml(this.formName)}" placeholder="Örn: Bebek Maması veya Ağrı Kesici" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Kategori</label>
              <select id="select-item-category" class="w-full px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs outline-none">
                ${opt('food', '🥫 Gıda')}
                ${opt('water', '💧 Su')}
                ${opt('medicine', '💊 İlaç')}
                ${opt('batteries', '🔋 Pil')}
                ${opt('hygiene', '🧼 Hijyen')}
                ${opt('infant', '🍼 Bebek')}
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Miktar / Adet</label>
              <input id="input-item-quantity" type="text" placeholder="Örn: 4 Adet" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Son Kullanma Tarihi (ambalajda yazan) *</label>
            <input id="input-item-date" type="date" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
          </div>

          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Özel Saklama Notu (İsteğe bağlı)</label>
            <input id="input-item-notes" type="text" value="${escapeHtml(this.formNotes)}" placeholder="Örn: Işık görmeyen cepte saklayın" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
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
    const { item, statusLabel, statusColor } = ev;

    const categoryIcons: Record<ExpirationCategory, string> = {
      water: '💧 Su',
      food: '🥫 Gıda',
      medicine: '💊 İlaç',
      batteries: '🔋 Pil',
      hygiene: '🧼 Hijyen',
      infant: '🍼 Bebek'
    };

    const safeId = escapeHtml(item.id);
    const isEditing = this.editingDateId === item.id;

    return `
      <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-1 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-white">${escapeHtml(item.name)}</span>
            <span class="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400">
              ${categoryIcons[item.category] || escapeHtml(item.category)}
            </span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
              ${escapeHtml(statusLabel)}
            </span>
          </div>

          <div class="flex items-center gap-3 text-[11px] text-gray-400">
            <span>Miktar: <strong class="text-gray-200">${escapeHtml(item.quantity)}</strong></span>
            <span>SKT: <strong class="text-gray-200 font-mono">${escapeHtml(item.expiryDateStr)}</strong></span>
          </div>

          ${
            item.notes
              ? `<div class="text-[10px] text-gray-500 italic mt-0.5">⚠️ ${escapeHtml(item.notes)}</div>`
              : ''
          }

          ${
            isEditing
              ? `
          <div class="flex items-center gap-2 pt-1.5">
            <input type="date" data-new-date-for="${safeId}" class="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[11px] outline-none" />
            <button data-action="save-date" data-id="${safeId}" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]">Kaydet</button>
            <button data-action="cancel-date" class="px-2 py-1.5 text-gray-400 hover:text-gray-200 text-[11px] underline">Vazgeç</button>
          </div>
          <div class="text-[10px] text-gray-500">Yeni ürünün ambalajında yazan son kullanma tarihini girin.</div>`
              : ''
          }
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button data-action="renew" data-id="${safeId}" title="Ürünü yenilediyseniz yeni ambalajdaki tarihi girin" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-cyan-300 font-medium text-[11px] border border-white/10 flex items-center gap-1 transition-all">
            <span>🔄</span> Yenisini aldım — yeni SKT gir
          </button>

          <button data-action="delete" data-id="${safeId}" title="Malzemeyi Listeden Sil" class="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all">
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
        if (!this.isAddFormOpen) {
          this.formName = '';
          this.formNotes = '';
        }
        this.render();
      });
    }

    // Suggestions: prefill name / category / note only; the date is always typed by the user
    this.container.querySelectorAll('.btn-kit-suggest').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = KIT_SUGGESTIONS[Number(btn.getAttribute('data-suggest'))];
        if (!s) return;
        this.formName = s.name;
        this.formCategory = s.category;
        this.formNotes = s.notes;
        this.isAddFormOpen = true;
        this.render();
        (this.container.querySelector('#input-item-date') as HTMLInputElement | null)?.focus();
      });
    });

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
          alert('Lütfen ambalajda yazan Son Kullanma Tarihini (SKT) seçin.');
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
        this.formName = '';
        this.formNotes = '';
        this.render();
      });
    }

    // Renew: ask for the real date printed on the new package
    this.container.querySelectorAll('[data-action="renew"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          this.editingDateId = this.editingDateId === id ? null : id;
          this.render();
        }
      });
    });

    this.container.querySelectorAll('[data-action="save-date"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        const input = Array.from(this.container.querySelectorAll<HTMLInputElement>('[data-new-date-for]')).find(
          (el) => el.getAttribute('data-new-date-for') === id
        );
        if (!input?.value || !kitExpirationService.setExpiryDate(id, input.value)) {
          alert('Lütfen yeni ürünün ambalajında yazan tarihi seçin.');
          return;
        }
        this.editingDateId = null;
        this.render();
      });
    });

    this.container.querySelectorAll('[data-action="cancel-date"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.editingDateId = null;
        this.render();
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

    // Clear list
    const btnClear = this.container.querySelector('#btn-clear-kit');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Girdiğiniz tüm malzeme kayıtlarını silmek istiyor musunuz?')) {
          kitExpirationService.clearAll();
          this.render();
        }
      });
    }

    // Copy report
    const btnCopy = this.container.querySelector('#btn-copy-kit-report');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const { evaluations, readinessScore, expiredCount, soonCount } = kitExpirationService.evaluateAll();
        if (evaluations.length === 0) return;

        let report = `🎒 [DEPREM ÇANTASI SKT LİSTESİ — kişisel kayıt]\n`;
        report += `• SKT skoru (yalnızca girilen tarihlere göre): %${readinessScore}\n`;
        report += `• Süresi dolan: ${expiredCount} kalem\n`;
        report += `• 90 günden az kalan: ${soonCount} kalem\n\n`;
        report += `📋 MALZEME LİSTESİ:\n`;

        evaluations.forEach((e, idx) => {
          report += `${idx + 1}. ${e.item.name} (${e.item.quantity})\n`;
          report += `   - SKT: ${e.item.expiryDateStr} (${e.statusLabel})\n`;
          if (e.item.notes) report += `   - Not: ${e.item.notes}\n`;
        });

        report += `\nTarihler kullanıcının kendi girdiği bilgilerdir (afet.live).`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(report);
          btnCopy.innerHTML = `${Icons.checkCircle('w-4 h-4')} Liste Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}
