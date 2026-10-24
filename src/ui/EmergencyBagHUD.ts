import { EmergencyBagItem } from '../types';
import { Icons } from './icons';

const DEFAULT_BAG_ITEMS: EmergencyBagItem[] = [
  { id: 'bag-1', title: 'Kişi başı günlük en az 2 litre içme suyu (3 gün için 6L)', category: 'vital', checked: false, description: 'Kapalı pet şişelerde, serin yerde muhafaza edilmeli.' },
  { id: 'bag-2', title: 'Yüksek kalorili dayanıklı gıda & konserve', category: 'vital', checked: false, description: 'Bisküvi, kuru yemiş, kuru meyve, konserve barbunya/ton balığı.' },
  { id: 'bag-3', title: 'Yüksek desibel acil durum düdüğü', category: 'vital', checked: false, description: 'Enkaz altında ses çıkarmak ve enerji tasarrufu için.' },
  { id: 'bag-4', title: 'Kapsamlı ilk yardım seti', category: 'medical', checked: false, description: 'Gazlı bez, elastik bandaj, turnike, antiseptik solüsyon, yara bandı.' },
  { id: 'bag-5', title: 'Sürekli kullanılan reçeteli ilaçlar', category: 'medical', checked: false, description: 'Tansiyon, şeker veya astım ilaçlarının en az 1 haftalık stoğu.' },
  { id: 'bag-6', title: 'Pilli radyo ve yedek pilleri', category: 'tools', checked: false, description: 'Baz istasyonları çöktüğünde resmi AFAD/TRT anonslarını dinlemek için.' },
  { id: 'bag-7', title: 'LED el feneri veya kafa lambası', category: 'tools', checked: false, description: 'Karanlıkta iki eli serbest bırakacak kafa lambaları önerilir.' },
  { id: 'bag-8', title: 'Dolu Powerbank (En az 20.000 mAh) ve şarj kabloları', category: 'tools', checked: false, description: 'Telefonu acil durumlarda açık tutmak için.' },
  { id: 'bag-9', title: 'Çok amaçlı çakı ve konserve açacağı', category: 'tools', checked: false, description: 'Mekanik tamir ve paket açma gereksinimleri için.' },
  { id: 'bag-10', title: 'Önemli evrak fotokopileri ve kimlik kopyaları', category: 'documents', checked: false, description: 'Su geçirmez kilitli poşette kimlik, tapu, sigorta ve pasaport.' },
  { id: 'bag-11', title: 'Nakit para (küçük banknotlar halinde)', category: 'documents', checked: false, description: 'POS ve ATM cihazları çalışmayacağı için nakit hazır bulunmalıdır.' },
  { id: 'bag-12', title: 'Termal acil durum battaniyesi ve yağmurluk', category: 'hygiene', checked: false, description: 'Hipotermiyi önlemek için yansıtıcı folyo battaniye.' },
  { id: 'bag-13', title: 'Toz maskesi (FFP2/FFP3/N95) ve iş eldiveni', category: 'hygiene', checked: false, description: 'Yıkım tozu ve molozlardan korunmak için.' },
  { id: 'bag-14', title: 'Islak mendil, sabun ve hijyen malzemeleri', category: 'hygiene', checked: false, description: 'Salgın hastalıkları önlemek amacıyla kişisel temizlik.' }
];

export class EmergencyBagHUD {
  private container: HTMLElement;
  private items: EmergencyBagItem[] = [];

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md hidden';
    parent.appendChild(this.container);

    this.loadState();
  }

  private loadState(): void {
    const raw = localStorage.getItem('afet_emergency_bag');
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        this.items = DEFAULT_BAG_ITEMS.map((item) => {
          const match = saved.find((s: any) => s.id === item.id);
          return match ? { ...item, checked: match.checked } : item;
        });
        return;
      } catch {}
    }
    this.items = [...DEFAULT_BAG_ITEMS];
  }

  private saveState(): void {
    localStorage.setItem(
      'afet_emergency_bag',
      JSON.stringify(this.items.map((i) => ({ id: i.id, checked: i.checked })))
    );
  }

  private activeFilter: 'all' | 'missing' | 'completed' = 'all';

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private shareMissingItems(): void {
    const missing = this.items.filter((i) => !i.checked);
    if (missing.length === 0) {
      const msg = '72 Saatlik Afet Çantam %100 hazır ve eksiksiz! afet.live üzerinden sen de afet çantası hazırlığını kontrol et.';
      if (navigator.share) {
        navigator.share({ title: 'Afet Çantam Hazır', text: msg }).catch(() => {});
      } else {
        navigator.clipboard.writeText(msg);
      }
      return;
    }

    const missingList = missing.slice(0, 6).map((m) => `• ${m.title}`).join('\n');
    const msg = `72 Saatlik Afet Çantamda Tamamlanması Gereken Eksikler:\n${missingList}\n\nKontrol listeni afet.live/?mod=canta adresinden tamamlayabilirsin.`;

    if (navigator.share) {
      navigator.share({ title: 'Afet Çantası Eksikleri', text: msg }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg).then(() => {
        const shareBtn = this.container.querySelector('#btn-share-bag') as HTMLElement | null;
        if (shareBtn) {
          shareBtn.innerHTML = `✓ Kopyalandı`;
          setTimeout(() => {
            if (shareBtn) shareBtn.innerHTML = `📋 Eksikleri Paylaş`;
          }, 2000);
        }
      });
    }
  }

  private render(): void {
    const completedCount = this.items.filter((i) => i.checked).length;
    const progressPct = Math.round((completedCount / this.items.length) * 100);

    const filteredItems = this.items.filter((item) => {
      if (this.activeFilter === 'missing') return !item.checked;
      if (this.activeFilter === 'completed') return item.checked;
      return true;
    });

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl hud-glass rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[88vh] flex flex-col bg-obsidian-900/95 border border-white/10 text-white">
        <div class="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🎒</span>
            <div>
              <h2 class="text-sm font-bold tracking-wider text-emerald-400 uppercase">
                72 Saatlik Afet Çantası Rehberi
              </h2>
              <p class="text-[11px] text-gray-400">Çevrimdışı kaydedilen aile acil durum kontrol listesi</p>
            </div>
          </div>
          <button id="btn-close-bag" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <div class="my-3 p-3 rounded-2xl bg-white/5 shrink-0">
          <div class="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span class="text-gray-300">Hazırlık Durumu:</span>
            <span class="text-emerald-400 font-bold">%${progressPct} (${completedCount} / ${this.items.length})</span>
          </div>
          <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
          </div>
        </div>

        <!-- Filter tabs & Share action -->
        <div class="flex items-center justify-between gap-2 pb-2 shrink-0">
          <div class="flex items-center gap-1 text-[11px]">
            <button type="button" data-filter="all" class="filter-btn px-2.5 py-1 rounded-lg border transition-all ${this.activeFilter === 'all' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}">Tümü (${this.items.length})</button>
            <button type="button" data-filter="missing" class="filter-btn px-2.5 py-1 rounded-lg border transition-all ${this.activeFilter === 'missing' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}">Eksikler (${this.items.length - completedCount})</button>
            <button type="button" data-filter="completed" class="filter-btn px-2.5 py-1 rounded-lg border transition-all ${this.activeFilter === 'completed' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}">Hazır (${completedCount})</button>
          </div>

          <button id="btn-share-bag" type="button" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1">
            <span>📋</span><span>Eksikleri Paylaş</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          ${filteredItems
            .map(
              (item) => `
            <label
              data-id="${item.id}"
              class="bag-row flex items-start gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer select-none transition-all ${
                item.checked ? 'border-l-4 border-emerald-400 bg-emerald-500/5' : ''
              }"
            >
              <input
                type="checkbox"
                ${item.checked ? 'checked' : ''}
                class="mt-1 w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <div class="flex-1 min-w-0">
                <span class="text-xs font-medium text-white block ${
                  item.checked ? 'line-through text-gray-400' : ''
                }">
                  ${item.title}
                </span>
                <span class="text-[10px] text-gray-400 block mt-0.5">
                  ${item.description}
                </span>
              </div>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-bag') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hide());

    this.container.querySelector('#btn-share-bag')?.addEventListener('click', () => this.shareMissingItems());

    this.container.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter') as 'all' | 'missing' | 'completed';
        if (f) {
          this.activeFilter = f;
          this.render();
        }
      });
    });

    const rows = this.container.querySelectorAll('.bag-row');
    rows.forEach((row) => {
      const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        const id = row.getAttribute('data-id');
        const target = this.items.find((i) => i.id === id);
        if (target) {
          target.checked = checkbox.checked;
          this.saveState();
          this.render();
        }
      });
    });
  }
}
