import { Icons } from './icons';

export interface PetPassport {
  name: string;
  type: 'Kedi' | 'Köpek' | 'Kuş' | 'Diğer';
  breed: string;
  microchip: string;
  birthYear: string;
  isNeutered: boolean;
  medicalNotes: string;
  ownerName: string;
  ownerPhone: string;
  altPhone: string;
}

export interface PetChecklistItem {
  id: string;
  label: string;
  category: 'tahliye' | 'gida' | 'hijyen' | 'medikal';
  checked: boolean;
}

const DEFAULT_PET_CHECKLIST: PetChecklistItem[] = [
  { id: 'pet-crate', label: 'Sağlam Taşıma Çantası / Box (Üzerinde İsim & Tel Etiketi)', category: 'tahliye', checked: false },
  { id: 'pet-harness', label: 'Göğüs Tasması ve Kısa Gezdirme Kayışı (Kaçmayı Önler)', category: 'tahliye', checked: false },
  { id: 'pet-muzzle', label: 'Köpekler İçin Acil Durum Ağızlığı (Tahliye Araçları İçin)', category: 'tahliye', checked: false },
  { id: 'pet-food', label: 'Minimum 7 Günlük Porsiyonlanmış Kuru / Yaş Mama', category: 'gida', checked: false },
  { id: 'pet-water', label: 'Katlanabilir Silikon Su & Mama Kapları', category: 'gida', checked: false },
  { id: 'pet-water-bottle', label: 'Evcil Hayvan İçin 2 Litre Yedek Şişelenmiş Su', category: 'gida', checked: false },
  { id: 'pet-litter', label: 'Kediler İçin: Katlanabilir Su Geçirmez Kumaş Kum Kabı & Kum', category: 'hijyen', checked: false },
  { id: 'pet-poop-bags', label: 'Köpekler İçin: Kilitli Dışkı / Atık Torbaları', category: 'hijyen', checked: false },
  { id: 'pet-firstaid-antiseptic', label: 'Batikon (İyot Çözeltisi) & Steril Gazlı Bez', category: 'medikal', checked: false },
  { id: 'pet-firstaid-bandage', label: 'Kendinden Yapışkanlı Elastik Pati Bandajı', category: 'medikal', checked: false },
  { id: 'pet-calming', label: 'Sakinleştirici Bitkisel Kedi/Köpek Damlası veya Kokulu Battaniye', category: 'medikal', checked: false }
];

const STORAGE_KEY_PASSPORT = 'afet_pet_passport_v1';
const STORAGE_KEY_CHECKLIST = 'afet_pet_checklist_v1';

export class PetDisasterSafetyModal {
  private container: HTMLElement;
  private passport: PetPassport;
  private checklist: PetChecklistItem[] = [];
  private activeTab: 'id' | 'bag' | 'guide' = 'id';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'pet-disaster-safety-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.passport = this.loadPassport();
    this.checklist = this.loadChecklist();
    this.render();
  }

  private loadPassport(): PetPassport {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PASSPORT);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      name: '',
      type: 'Kedi',
      breed: '',
      microchip: '',
      birthYear: '',
      isNeutered: true,
      medicalNotes: '',
      ownerName: '',
      ownerPhone: '',
      altPhone: ''
    };
  }

  private savePassport(): void {
    try {
      localStorage.setItem(STORAGE_KEY_PASSPORT, JSON.stringify(this.passport));
    } catch {}
  }

  private loadChecklist(): PetChecklistItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHECKLIST);
      if (raw) {
        const saved: { id: string; checked: boolean }[] = JSON.parse(raw);
        return DEFAULT_PET_CHECKLIST.map((item) => {
          const match = saved.find((s) => s.id === item.id);
          return match ? { ...item, checked: match.checked } : item;
        });
      }
    } catch {}
    return [...DEFAULT_PET_CHECKLIST];
  }

  private saveChecklist(): void {
    try {
      const slim = this.checklist.map((i) => ({ id: i.id, checked: i.checked }));
      localStorage.setItem(STORAGE_KEY_CHECKLIST, JSON.stringify(slim));
    } catch {}
  }

  public show(): void {
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private getChecklistProgress(): { checked: number; total: number; percent: number } {
    const checked = this.checklist.filter((i) => i.checked).length;
    const total = this.checklist.length;
    const percent = Math.round((checked / total) * 100);
    return { checked, total, percent };
  }

  private render(): void {
    const progress = this.getChecklistProgress();

    const tabsHtml = `
      <div class="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
        <button
          id="btn-tab-pet-id"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'id' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🐾 Pati Afet Kimliği
        </button>
        <button
          id="btn-tab-pet-bag"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'bag' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🎒 Pati Çantası (%${progress.percent})
        </button>
        <button
          id="btn-tab-pet-guide"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'guide' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          📋 HayTAP & AFAD Rehberi
        </button>
      </div>
    `;

    let bodyContent = '';

    if (this.activeTab === 'id') {
      const collarTagText = `PATİ KÜNYESİ: ${this.passport.name || 'İSİMSİZ'} | ${this.passport.type} (${this.passport.breed || 'Melez'}) | Çip: ${this.passport.microchip || 'Yok'} | Sahip: ${this.passport.ownerName || '-'} | Tel: ${this.passport.ownerPhone || '-'}`;

      bodyContent = `
        <div class="space-y-4">
          <!-- Digital Collar Preview Badge -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="p-3 rounded-2xl bg-amber-500/20 text-amber-300 font-mono text-2xl">
                🐾
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-white">${this.passport.name || 'Pati Adı Giriniz'}</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                    ${this.passport.type}
                  </span>
                </div>
                <div class="text-xs text-gray-300 mt-0.5">
                  ${this.passport.breed ? `${this.passport.breed} • ` : ''}
                  Mikroçip: <strong class="font-mono text-amber-300">${this.passport.microchip || 'Kayıtsız'}</strong>
                </div>
                <div class="text-xs text-gray-400">
                  Sahibi: <span class="text-gray-200">${this.passport.ownerName || '-'}</span> | Tel: <span class="font-mono text-gray-200">${this.passport.ownerPhone || '-'}</span>
                </div>
              </div>
            </div>

            <button
              id="btn-copy-collar-tag"
              type="button"
              class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-xs font-bold text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1.5"
            >
              ${Icons.copy('w-3.5 h-3.5')}
              <span>Tasma Künyesini Kopyala</span>
            </button>
          </div>

          <!-- Edit Passport Form -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="block text-gray-400 font-medium mb-1">Evcil Hayvanın Adı</label>
              <input
                id="pet-name"
                type="text"
                placeholder="Örn: Pamuk"
                value="${this.passport.name}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label class="block text-gray-400 font-medium mb-1">Hayvan Türü</label>
              <select
                id="pet-type"
                class="w-full px-3 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white outline-none focus:border-amber-400"
              >
                <option value="Kedi" ${this.passport.type === 'Kedi' ? 'selected' : ''}>Kedi</option>
                <option value="Köpek" ${this.passport.type === 'Köpek' ? 'selected' : ''}>Köpek</option>
                <option value="Kuş" ${this.passport.type === 'Kuş' ? 'selected' : ''}>Kuş</option>
                <option value="Diğer" ${this.passport.type === 'Diğer' ? 'selected' : ''}>Diğer (Kemirgen / Sürüngen)</option>
              </select>
            </div>

            <div>
              <label class="block text-gray-400 font-medium mb-1">Irk / Cins & Renk</label>
              <input
                id="pet-breed"
                type="text"
                placeholder="Örn: Tekir, Beyaz Patili"
                value="${this.passport.breed}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label class="block text-gray-400 font-medium mb-1">15 Haneli Mikroçip Numarası</label>
              <input
                id="pet-microchip"
                type="text"
                placeholder="Örn: 981098101234567"
                value="${this.passport.microchip}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label class="block text-gray-400 font-medium mb-1">Sahip Ad Soyad</label>
              <input
                id="pet-owner-name"
                type="text"
                placeholder="Örn: Ayşe Yılmaz"
                value="${this.passport.ownerName}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label class="block text-gray-400 font-medium mb-1">Sahip Telefonu</label>
              <input
                id="pet-owner-phone"
                type="tel"
                placeholder="05xx xxx xx xx"
                value="${this.passport.ownerPhone}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-gray-400 font-medium mb-1">Kronik Rahatsızlık, Alerji & İlaç Notları</label>
              <textarea
                id="pet-medical-notes"
                rows="2"
                placeholder="Örn: Böbrek hastası, özel renal mama yiyor. Kalp ilacı günde 1 kez."
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-amber-400 resize-none"
              >${this.passport.medicalNotes}</textarea>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'bag') {
      const checklistItemsHtml = this.checklist
        .map((item) => {
          return `
            <label class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-colors">
              <input
                type="checkbox"
                data-checklist-id="${item.id}"
                class="pet-check-input mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-600 bg-obsidian-900"
                ${item.checked ? 'checked' : ''}
              />
              <span class="text-xs text-gray-200 select-none ${item.checked ? 'line-through text-gray-500' : ''}">
                ${item.label}
              </span>
            </label>
          `;
        })
        .join('');

      bodyContent = `
        <div class="space-y-4">
          <!-- Progress Bar -->
          <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-gray-300">Pati Afet Çantası Hazırlığı</span>
              <span class="font-mono text-amber-400">${progress.checked} / ${progress.total} (%${progress.percent})</span>
            </div>
            <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style="width: ${progress.percent}%"
              ></div>
            </div>
          </div>

          <!-- Items list -->
          <div class="space-y-2">
            ${checklistItemsHtml}
          </div>
        </div>
      `;
    } else {
      // Guide Tab
      bodyContent = `
        <div class="space-y-3.5 text-xs text-gray-300">
          <div class="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 space-y-1.5">
            <h4 class="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              ${Icons.alertTriangle('w-4 h-4')}
              <span>1. Deprem Sarsıntısı Anında Hayvan Davranışı</span>
            </h4>
            <p class="leading-relaxed">
              Hayvanlar yüksek frekanslı P dalgalarını insanlardan 5-10 saniye önce hissederek çıldırabilir veya saklanabilir.
              <strong>Korkan hayvanı zorla tutmaya çalışmayın</strong>; refleks olarak sizi ısırabilir veya tırmalayabilir.
              Evin en güvenli çök-kapan alanına geçerken eğer yanınızdaysa göğsünüze bastırarak koruyun.
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-sky-500/[0.08] border border-sky-500/20 space-y-1.5">
            <h4 class="font-bold text-sky-300 flex items-center gap-1.5 text-sm">
              ${Icons.shield('w-4 h-4')}
              <span>2. Tahliye ve Binadan Çıkış (Kaçmayı Önleme)</span>
            </h4>
            <p class="leading-relaxed">
              Deprem biter bitmez kedinizi <strong>asla kucağınızda veya açıkta taşımayın</strong>. Dışarıdaki toz, siren ve çığlık sesleri hayvanı paniğe sürükler ve kaçmasına yol açar.
              Mutlaka <strong>kapalı taşıma kafesine (box)</strong> koyun veya kalın bir battaniyeye sararak taşıyın.
              Köpekleri mutlaka <strong>kısa tasmayla ve göğüs tasmasıyla</strong> tutun.
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 space-y-1.5">
            <h4 class="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
              ${Icons.health('w-4 h-4')}
              <span>3. Enkaz Altında / Hasarlı Binada Kalan Hayvanlar</span>
            </h4>
            <p class="leading-relaxed">
              Eğer hayvanınız içeride kaldıysa, AFAD ve arama kurtarma ekiplerine bina girişindeki duvara silinmez sprey/tebeşirle
              <strong>"DAİRE 4: 1 KEDİ / 1 KÖPEK İÇERİDE"</strong> notu düşün.
              HayTAP (Hayvan Hakları Federasyonu) sahra kurtarma ekipleri afet bölgelerinde özel kafes ve veteriner hekimlerle enkaz içi hayvan kurtarması yürütmektedir.
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <h4 class="font-bold text-gray-200 text-sm">4. Acil Hayvan Kurtarma İhbar Hatları</h4>
            <ul class="space-y-1 text-gray-400">
              <li>• <strong>HayTAP Sahra İhbar:</strong> 0850 441 44 44 / haytap.org</li>
              <li>• <strong>Tarım ve Orman Bakanlığı HAYDİ:</strong> 112 üzerinden İçişleri HAYDİ Polisi</li>
              <li>• <strong>Türk Veteriner Hekimleri Birliği (TVHB):</strong> Bölge mobil acil klinik çadırları</li>
            </ul>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              ${Icons.paw('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Pati & Evcil Hayvan Afet Güvenliği</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">HAYTAP & AFAD</span>
              </div>
              <p class="text-[11px] text-gray-400">Afet anında kedi, köpek ve can dostlarımız için kimlik, tahliye çantası ve arama-kurtarma protokolleri.</p>
            </div>
          </div>
          <button id="btn-close-pet-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="p-3 sm:p-4 pb-2 shrink-0">
          ${tabsHtml}
        </div>

        <!-- Content Body -->
        <div class="p-3 sm:p-4 pt-1 overflow-y-auto flex-1 scrollbar-thin">
          ${bodyContent}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-pet-modal')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-tab-pet-id')?.addEventListener('click', () => {
      this.activeTab = 'id';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-pet-bag')?.addEventListener('click', () => {
      this.activeTab = 'bag';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-pet-guide')?.addEventListener('click', () => {
      this.activeTab = 'guide';
      this.render();
    });

    // Passport Form inputs
    const attachPassportInput = (id: string, key: keyof PetPassport) => {
      q<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id)?.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value;
        (this.passport as any)[key] = val;
        this.savePassport();
      });
    };

    attachPassportInput('#pet-name', 'name');
    attachPassportInput('#pet-type', 'type');
    attachPassportInput('#pet-breed', 'breed');
    attachPassportInput('#pet-microchip', 'microchip');
    attachPassportInput('#pet-owner-name', 'ownerName');
    attachPassportInput('#pet-owner-phone', 'ownerPhone');
    attachPassportInput('#pet-medical-notes', 'medicalNotes');

    q<HTMLButtonElement>('#btn-copy-collar-tag')?.addEventListener('click', (e) => {
      const text = `🐾 [PATİ AFET KÜNYESİ]\nİsim: ${this.passport.name || 'İsimsiz'}\nTür: ${this.passport.type} (${this.passport.breed || 'Melez'})\nMikroçip No: ${this.passport.microchip || 'Yok'}\nSahibi: ${this.passport.ownerName || '-'}\nİletişim: ${this.passport.ownerPhone || '-'}\nÖzel Not: ${this.passport.medicalNotes || 'Yok'}`;
      navigator.clipboard.writeText(text).then(() => {
        const btn = e.currentTarget as HTMLButtonElement;
        const original = btn.innerHTML;
        btn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5 text-emerald-400')} <span class="text-emerald-400">Künye Kopyalandı!</span>`;
        setTimeout(() => {
          btn.innerHTML = original;
        }, 1800);
      });
    });

    // Checklist toggles
    this.container.querySelectorAll<HTMLInputElement>('.pet-check-input').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-checklist-id');
        const match = this.checklist.find((i) => i.id === id);
        if (match) {
          match.checked = input.checked;
          this.saveChecklist();
          this.render();
        }
      });
    });
  }
}
