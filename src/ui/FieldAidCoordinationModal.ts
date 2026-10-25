import { Icons } from './icons';
import { antiManipulationService, LEGAL_DISCLAIMER } from '../services/antiManipulationService';

export interface AidItem {
  id: string;
  name: string;
  category: 'bebek' | 'gida' | 'hijyen' | 'barinma' | 'giyim' | 'enerji';
  count: number;
}

export interface AidRequestState {
  type: 'need' | 'supply';
  tentLocation: string;
  contactPhone: string;
  urgency: 'vital' | 'urgent' | 'standard';
  notes: string;
  items: AidItem[];
}

const DEFAULT_CATALOG: { name: string; category: AidItem['category'] }[] = [
  // Bebek & Çocuk
  { name: 'Bebek Maması (No 1 / 2)', category: 'bebek' },
  { name: 'Bebek Bezi (Beden 1-5)', category: 'bebek' },
  { name: 'Islak Mendil (Antialerjik)', category: 'bebek' },
  { name: 'Pişik Kremi & Pudra', category: 'bebek' },
  { name: 'Biberon & Emzik Seti', category: 'bebek' },
  // Gıda & Su
  { name: 'Şişe İçme Suyu (Koli)', category: 'gida' },
  { name: 'Kuru Bakliyat (Pirinç/Mercimek)', category: 'gida' },
  { name: 'Konserve Hazır Yemek / Ton Balığı', category: 'gida' },
  { name: 'Tahin / Pekmez / Helva (Yüksek Enerji)', category: 'gida' },
  { name: 'Bisküvi / Kraker / Kuruyemiş', category: 'gida' },
  // Hijyen
  { name: 'Kadın Hijyen Pedi', category: 'hijyen' },
  { name: 'Kalıp / Sıvı Sabun & Şampuan', category: 'hijyen' },
  { name: 'Diş Fırçası & Macunu', category: 'hijyen' },
  { name: 'Tuvalet Kağıdı / Rulo Havlu', category: 'hijyen' },
  { name: 'El & Yüz Dezenfektanı', category: 'hijyen' },
  // Barınma & Isınma
  { name: 'Çadır (4-6 Kişilik)', category: 'barinma' },
  { name: 'Uyku Tulumu (-10°C Kışlık)', category: 'barinma' },
  { name: 'Polar / Yün Battaniye', category: 'barinma' },
  { name: 'Mat / Sünger Yer Yatağı', category: 'barinma' },
  { name: 'Katalitik / Tüplü Kamp Sobası', category: 'barinma' },
  { name: 'Odun / Pres Kömür Briket', category: 'barinma' },
  // Giyim
  { name: 'Termal İçlik Takımı', category: 'giyim' },
  { name: 'Kışlık Su Geçirmez Bot', category: 'giyim' },
  { name: 'Yün Çorap & İç Çamaşırı', category: 'giyim' },
  { name: 'Çocuk Montu & Yağmurluk', category: 'giyim' },
  { name: 'Bere, Polar Boyunluk & Eldiven', category: 'giyim' },
  // Enerji
  { name: 'Powerbank (20.000+ mAh Taşınabilir Şarj)', category: 'enerji' },
  { name: 'Kafa Feneri / Güneş Enerjili Lamba', category: 'enerji' },
  { name: 'Kalem Pil (AA / AAA Kutu)', category: 'enerji' },
  { name: 'Jeneratör (Benzin/Dizel)', category: 'enerji' },
  { name: 'Çoklu Uzatma Kablosu (Grup Priz)', category: 'enerji' }
];

const CATEGORIES: { id: AidItem['category']; label: string; icon: string }[] = [
  { id: 'bebek', label: 'Bebek & Çocuk', icon: '🍼' },
  { id: 'gida', label: 'Gıda & Su', icon: '💧' },
  { id: 'hijyen', label: 'Hijyen & Sağlık', icon: '🌸' },
  { id: 'barinma', label: 'Barınma & Isınma', icon: '⛺' },
  { id: 'giyim', label: 'Giyim & Bot', icon: '👕' },
  { id: 'enerji', label: 'Güç & Aydınlatma', icon: '🔋' }
];

const STORAGE_KEY = 'afet_field_aid_state_v1';

export class FieldAidCoordinationModal {
  private container: HTMLElement;
  private state: AidRequestState;
  private activeCategory: AidItem['category'] = 'bebek';
  private onBroadcast?: (text: string) => void;

  constructor(parent: HTMLElement, onBroadcast?: (text: string) => void) {
    this.onBroadcast = onBroadcast;
    this.container = document.createElement('div');
    this.container.id = 'field-aid-coordination-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.state = this.loadState();
    this.render();
  }

  private loadState(): AidRequestState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return {
      type: 'need',
      tentLocation: '',
      contactPhone: '',
      urgency: 'urgent',
      notes: '',
      items: []
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  public show(prefillType?: 'need' | 'supply'): void {
    if (prefillType) {
      this.state.type = prefillType;
      this.saveState();
    }
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private setItemCount(name: string, category: AidItem['category'], delta: number): void {
    const existing = this.state.items.find((i) => i.name === name);
    if (existing) {
      existing.count = Math.max(0, existing.count + delta);
      if (existing.count === 0) {
        this.state.items = this.state.items.filter((i) => i.name !== name);
      }
    } else if (delta > 0) {
      this.state.items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        category,
        count: delta
      });
    }
    this.saveState();
    this.render();
  }

  private formatBroadcastText(): string {
    const prefix = this.state.type === 'need' ? '🚨 [SAHRA ACİL İHTİYAÇ TALEBİ]' : '🤝 [SAHRA YARDIM / FAZLA MALZEME PAYLAŞIMI]';
    const urgencyText =
      this.state.urgency === 'vital'
        ? '🔴 ÇOK ACİL / HAYATİ'
        : this.state.urgency === 'urgent'
        ? '🟡 ACİL (24 SAAT)'
        : '🟢 GENEL İHTİYAÇ';

    const itemsSummary =
      this.state.items.length === 0
        ? 'Belirtilmedi'
        : this.state.items.map((i) => `${i.count}x ${i.name}`).join(', ');

    return `${prefix}\n` +
      `Konum/Çadır: ${this.state.tentLocation.trim() || 'Sahra Bölgesi'}\n` +
      `Aciliyet: ${urgencyText}\n` +
      `İhtiyaç/Malzeme: ${itemsSummary}\n` +
      (this.state.contactPhone ? `İletişim: ${this.state.contactPhone.trim()}\n` : '') +
      (this.state.notes ? `Not: ${this.state.notes.trim()}\n` : '') +
      `Tarih: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} (Çevrimdışı P2P Sahra Koordinasyonu)`;
  }

  private render(): void {
    const isNeed = this.state.type === 'need';
    const totalCount = this.state.items.reduce((sum, i) => sum + i.count, 0);

    const categoryTabsHtml = CATEGORIES.map((cat) => {
      const isSelected = this.activeCategory === cat.id;
      const countInCat = this.state.items
        .filter((i) => i.category === cat.id)
        .reduce((sum, i) => sum + i.count, 0);

      return `
        <button
          type="button"
          data-category="${cat.id}"
          class="cat-tab-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
            isSelected
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
          }"
        >
          <span>${cat.icon}</span>
          <span>${cat.label}</span>
          ${
            countInCat > 0
              ? `<span class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-black">${countInCat}</span>`
              : ''
          }
        </button>
      `;
    }).join('');

    const currentCatalog = DEFAULT_CATALOG.filter((i) => i.category === this.activeCategory);

    const catalogItemsHtml = currentCatalog
      .map((item) => {
        const selected = this.state.items.find((i) => i.name === item.name);
        const count = selected ? selected.count : 0;

        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
            <span class="text-xs font-medium text-gray-200">${item.name}</span>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-item-name="${item.name}"
                data-item-cat="${item.category}"
                data-delta="-1"
                class="btn-delta w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-gray-300 font-bold border border-white/5 disabled:opacity-30 disabled:pointer-events-none"
                ${count === 0 ? 'disabled' : ''}
              >
                -
              </button>
              <span class="w-7 text-center font-mono text-xs font-bold ${count > 0 ? 'text-amber-400' : 'text-gray-500'}">
                ${count}
              </span>
              <button
                type="button"
                data-item-name="${item.name}"
                data-item-cat="${item.category}"
                data-delta="1"
                class="btn-delta w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 flex items-center justify-center text-amber-300 font-bold border border-amber-500/30"
              >
                +
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    const selectedSummaryHtml =
      this.state.items.length === 0
        ? `<div class="text-center py-3 text-xs text-gray-500 italic">Henüz bir malzeme seçilmedi. Yukarıdan kategorileri tıklayarak ekleyin.</div>`
        : `
          <div class="flex flex-wrap gap-1.5">
            ${this.state.items
              .map(
                (i) => `
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-200">
                  <strong class="font-bold text-amber-400">${i.count}x</strong> ${i.name}
                  <button type="button" data-remove-name="${i.name}" class="btn-remove-chip ml-1 text-amber-400 hover:text-white">&times;</button>
                </span>
              `
              )
              .join('')}
          </div>
        `;

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              ${Icons.truck('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Afet Sahra İhtiyaç & Yardım Masası</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">ÇADIRKENT AĞI</span>
              </div>
              <p class="text-[11px] text-gray-400">Çadırkent ve sahra bölgelerinde ihtiyaç/fazla malzeme pusulası oluşturun, BitChat ağına yayınlayın.</p>
            </div>
          </div>
          <button id="btn-close-field-aid" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Mode Toggle (İhtiyacım Var vs Elimde Fazla Var) -->
        <div class="p-3 sm:p-4 border-b border-white/10 bg-black/20 flex flex-col gap-3 shrink-0">
          <div class="flex items-center gap-2">
            <button
              id="tab-mode-need"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                isNeed
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border-white/10'
              }"
            >
              <span>🚨 İhtiyacım Var (Acil Talep)</span>
            </button>
            <button
              id="tab-mode-supply"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                !isNeed
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border-white/10'
              }"
            >
              <span>🤝 Elimde Fazla Var (Paylaşım)</span>
            </button>
          </div>

          <!-- Location & Urgency Inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div class="sm:col-span-6 relative">
              <input
                id="input-aid-location"
                type="text"
                placeholder="Çadırkent / Mahalle / Çadır No (Örn: Çadır A-12)"
                value="${this.state.tentLocation}"
                class="w-full px-3 py-2 pr-8 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
              />
              <button
                id="btn-gps-location"
                type="button"
                title="Şu anki GPS Konumumu Ekle"
                class="absolute right-2 top-2 text-gray-400 hover:text-amber-400 transition-colors"
              >
                ${Icons.crosshair('w-4 h-4')}
              </button>
            </div>

            <div class="sm:col-span-3">
              <select
                id="select-aid-urgency"
                class="w-full px-3 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-xs text-gray-200 outline-none focus:border-amber-400"
              >
                <option value="vital" ${this.state.urgency === 'vital' ? 'selected' : ''}>🔴 Çok Acil (Hayati)</option>
                <option value="urgent" ${this.state.urgency === 'urgent' ? 'selected' : ''}>🟡 Acil (24 Saat)</option>
                <option value="standard" ${this.state.urgency === 'standard' ? 'selected' : ''}>🟢 Normal İhtiyaç</option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <input
                id="input-aid-phone"
                type="tel"
                placeholder="İletişim Tel (Opsiyonel)"
                value="${this.state.contactPhone}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <!-- Category Bar -->
        <div class="p-2 sm:px-4 border-b border-white/10 bg-white/[0.02] overflow-x-auto flex items-center gap-1.5 scrollbar-thin shrink-0">
          ${categoryTabsHtml}
        </div>

        <!-- Catalog Items Grid -->
        <div class="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2 scrollbar-thin">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${catalogItemsHtml}
          </div>

          <!-- Custom Item Entry -->
          <div class="pt-2 flex items-center gap-2">
            <input
              id="input-custom-item"
              type="text"
              placeholder="Listede olmayan özel bir ihtiyaç yazın (Örn: Çocuk astım ilacı)..."
              class="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
            />
            <button
              id="btn-add-custom-item"
              type="button"
              class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-200 shrink-0 border border-white/10"
            >
              + Ekle
            </button>
          </div>

          <!-- Selected Items Summary -->
          <div class="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-gray-300">
              <span>SEÇİLEN MALZEMELER (${totalCount} Adet)</span>
              ${
                this.state.items.length > 0
                  ? `<button id="btn-clear-aid" type="button" class="text-[11px] text-rose-400 hover:underline">Tümünü Sıfırla</button>`
                  : ''
              }
            </div>
            ${selectedSummaryHtml}
          </div>
        </div>

        <!-- Anti-Manipulation & Legal Notice -->
        <div class="px-3.5 py-2 bg-amber-500/10 border-t border-amber-500/20 text-[10.5px] text-amber-300 flex items-start gap-2 shrink-0">
          <span class="shrink-0 text-sm">⚖️</span>
          <p class="leading-snug">
            <strong>Sivil Afet Lojistiği & Sorumluluk Uyarısı:</strong> ${LEGAL_DISCLAIMER.shortNotice} Listeler eşler arası sivil dayanışma içindir; resmi AFAD/112 lojistik kanalı değildir. Asılsız ihtiyaç veya sahte stok beyanında bulunmak TCK m. 217/A uyarınca cezai sorumluluk doğurur.
          </p>
        </div>

        <!-- Footer Actions -->
        <div class="p-3 sm:p-4 border-t border-white/10 bg-black/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            id="btn-copy-aid-text"
            type="button"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-gray-200 active:scale-95 transition-all border border-white/10"
          >
            ${Icons.copy('w-4 h-4')}
            <span>Listeyi Kopyala (SMS / WhatsApp)</span>
          </button>

          ${
            this.onBroadcast
              ? `
            <button
              id="btn-broadcast-aid-bitchat"
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all"
            >
              ${Icons.messages('w-4 h-4')}
              <span>BitChat Afet Ağına Yayınla</span>
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-field-aid')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#tab-mode-need')?.addEventListener('click', () => {
      this.state.type = 'need';
      this.saveState();
      this.render();
    });

    q<HTMLButtonElement>('#tab-mode-supply')?.addEventListener('click', () => {
      this.state.type = 'supply';
      this.saveState();
      this.render();
    });

    q<HTMLInputElement>('#input-aid-location')?.addEventListener('input', (e) => {
      this.state.tentLocation = (e.target as HTMLInputElement).value;
      this.saveState();
    });

    q<HTMLSelectElement>('#select-aid-urgency')?.addEventListener('change', (e) => {
      this.state.urgency = (e.target as HTMLSelectElement).value as AidRequestState['urgency'];
      this.saveState();
    });

    q<HTMLInputElement>('#input-aid-phone')?.addEventListener('input', (e) => {
      this.state.contactPhone = (e.target as HTMLInputElement).value;
      this.saveState();
    });

    q<HTMLButtonElement>('#btn-gps-location')?.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
            this.state.tentLocation = this.state.tentLocation ? `${this.state.tentLocation} (${loc})` : loc;
            this.saveState();
            this.render();
          },
          () => alert('Konum alınamadı. Lütfen cihaz konum iznini kontrol edin.')
        );
      }
    });

    this.container.querySelectorAll<HTMLButtonElement>('.cat-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category') as AidItem['category'];
        if (cat) {
          this.activeCategory = cat;
          this.render();
        }
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-delta').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-item-name');
        const cat = btn.getAttribute('data-item-cat') as AidItem['category'];
        const delta = parseInt(btn.getAttribute('data-delta') || '0', 10);
        if (name && cat && delta) {
          this.setItemCount(name, cat, delta);
        }
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-remove-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-remove-name');
        if (name) {
          this.state.items = this.state.items.filter((i) => i.name !== name);
          this.saveState();
          this.render();
        }
      });
    });

    q<HTMLButtonElement>('#btn-add-custom-item')?.addEventListener('click', () => {
      const input = q<HTMLInputElement>('#input-custom-item');
      const val = input?.value.trim();
      if (val) {
        this.setItemCount(val, this.activeCategory, 1);
        if (input) input.value = '';
      }
    });

    q<HTMLButtonElement>('#btn-clear-aid')?.addEventListener('click', () => {
      if (confirm('Tüm seçili malzemeleri sıfırlamak istiyor musunuz?')) {
        this.state.items = [];
        this.saveState();
        this.render();
      }
    });

    q<HTMLButtonElement>('#btn-copy-aid-text')?.addEventListener('click', (e) => {
      const text = this.formatBroadcastText();
      navigator.clipboard.writeText(text).then(() => {
        const btn = e.currentTarget as HTMLButtonElement;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `${Icons.checkCircle('w-4 h-4 text-emerald-400')} <span class="text-emerald-400">Pusula Kopyalandı!</span>`;
        setTimeout(() => {
          btn.innerHTML = originalHtml;
        }, 1800);
      });
    });

    q<HTMLButtonElement>('#btn-broadcast-aid-bitchat')?.addEventListener('click', (e) => {
      if (this.onBroadcast) {
        // Anti-manipulation rate limiting
        const rateCheck = antiManipulationService.checkRateLimit('aid');
        if (!rateCheck.allowed) {
          alert(`⏱️ Çok sık yayın yapıldı. Lütfen ${rateCheck.waitSeconds} saniye bekleyin.`);
          return;
        }

        const text = this.formatBroadcastText();
        const safety = antiManipulationService.analyzeTextSafety(text);
        if (safety.isSuspicious) {
          const proceed = confirm(
            `⚠️ Doğrulama Uyarısı:\nListede teyitsiz veya panik yaratabilecek bir ifade tespit edildi: "${safety.detectedKeyword}"\n${
              safety.warningMessage || ''
            }\n\nYine de bu bildirimi paylaşmak istiyor musunuz?`
          );
          if (!proceed) return;
        }

        this.onBroadcast(text);
        const btn = e.currentTarget as HTMLButtonElement;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `${Icons.checkCircle('w-4 h-4 text-cyan-300')} <span class="text-cyan-300">Ağa Yayınlandı!</span>`;
        setTimeout(() => {
          btn.innerHTML = originalHtml;
        }, 1800);
      }
    });
  }
}
