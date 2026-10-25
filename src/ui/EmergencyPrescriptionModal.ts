import { Icons } from './icons';

export interface ChronicMedication {
  id: string;
  brandName: string;
  activeIngredient: string;
  dosage: string;
  frequency: string;
  category: 'diabetes' | 'cardio' | 'respiratory' | 'neuro' | 'blood' | 'thyroid' | 'other';
  notes?: string;
}

export interface GenericDrugReference {
  brand: string;
  active: string;
  category: ChronicMedication['category'];
  categoryLabel: string;
  equivalents: string[];
  fieldAdvice: string;
}

const COMMON_DRUGS: GenericDrugReference[] = [
  {
    brand: 'Beloc ZOK / Saneloc',
    active: 'Metoprolol',
    category: 'cardio',
    categoryLabel: 'Kalp & Hipertansiyon',
    equivalents: ['Saneloc', 'Mecorlong', 'Lopresor', 'Cardiostad'],
    fieldAdvice: 'Sahra eczanesinde Beloc yoksa; Metoprolol içeren herhangi bir beta bloker aynı etkiyi sağlar.'
  },
  {
    brand: 'Delix / Triatec',
    active: 'Ramipril',
    category: 'cardio',
    categoryLabel: 'Kalp & Hipertansiyon',
    equivalents: ['Triatec', 'Ramitec', 'Ramicard'],
    fieldAdvice: 'ACE inhibitörüdür. Sahra çadırında Ramipril eşdeğeri verilebilir.'
  },
  {
    brand: 'Norvasc / Amlodis',
    active: 'Amlodipin',
    category: 'cardio',
    categoryLabel: 'Kalp & Hipertansiyon',
    equivalents: ['Amlodis', 'Vazkor', 'Amlovas'],
    fieldAdvice: 'Kalsiyum kanal blokeridir. Dozaj (5mg / 10mg) birebir eşleşmelidir.'
  },
  {
    brand: 'Lantus / Toujeo (İnsülin)',
    active: 'İnsülin Glarjin',
    category: 'diabetes',
    categoryLabel: 'Diyabet & İnsülin',
    equivalents: ['Basaglar', 'Semglee', 'Abasaglar'],
    fieldAdvice: 'Uzun etkili bazal insülindir. Elektriksiz ortamda çömlek içi ıslak kumla 15-25°C arası 28 gün korunabilir.'
  },
  {
    brand: 'Humalog / NovoRapid (İnsülin)',
    active: 'İnsülin Lispro / Aspart',
    category: 'diabetes',
    categoryLabel: 'Diyabet & İnsülin',
    equivalents: ['Novorapid', 'Apidra', 'Fiasp'],
    fieldAdvice: 'Hızlı etkili yemek insülinidir. Donmasına kesinlikle izin vermeyin (donan insülin bozulur).'
  },
  {
    brand: 'Glifor / Matofin / Diaformin',
    active: 'Metformin',
    category: 'diabetes',
    categoryLabel: 'Diyabet & İnsülin',
    equivalents: ['Glucophage', 'Diaformin', 'Matofin'],
    fieldAdvice: 'Tip 2 diyabetin en temel ilacıdır. Sahra depolarında genellikle bol miktarda bulunur.'
  },
  {
    brand: 'Ventolin / Salbutamol',
    active: 'Salbutamol İnhalatör',
    category: 'respiratory',
    categoryLabel: 'Astım & KOAH',
    equivalents: ['Salbutamol', 'Ventisal', 'Ronkotol'],
    fieldAdvice: 'Akut nefes darlığında bronş açıcıdır. Enkaz tozu veya duman maruziyetinde hayati kurtarıcıdır.'
  },
  {
    brand: 'Seretide / Foster / Symbicort',
    active: 'Budesonid / Formoterol',
    category: 'respiratory',
    categoryLabel: 'Astım & KOAH',
    equivalents: ['Foster', 'Symbicort', 'Bufomix'],
    fieldAdvice: 'Kortikosteroid + uzun etkili bronkodilatör. Doz atlanmamalıdır.'
  },
  {
    brand: 'Tegretol / Karazepin',
    active: 'Karbamazepin',
    category: 'neuro',
    categoryLabel: 'Epilepsi & Nöroloji',
    equivalents: ['Karazepin', 'Temporol'],
    fieldAdvice: 'Epilepsi nöbetini önler. Aniden kesilirse status epileptikus (durmayan nöbet) tetiklenebilir.'
  },
  {
    brand: 'Depakin / Convulex',
    active: 'Sodyum Valproat',
    category: 'neuro',
    categoryLabel: 'Epilepsi & Nöroloji',
    equivalents: ['Convulex', 'Valposim'],
    fieldAdvice: 'Antiepileptiktir. Sahra eczacısına günlük toplam miligramı belirtilmelidir.'
  },
  {
    brand: 'Coumadin / Varfarin',
    active: 'Varfarin',
    category: 'blood',
    categoryLabel: 'Kan Sulandırıcı',
    equivalents: ['Varfarin'],
    fieldAdvice: '⚠️ HAYATİ UYARI: Enkaz altında yaralanan veya kanaması olan kazazedelerde acil cerraha Coumadin kullandığı bildirilmelidir!'
  },
  {
    brand: 'Plavix / Karum',
    active: 'Klopidogrel',
    category: 'blood',
    categoryLabel: 'Kan Sulandırıcı',
    equivalents: ['Karum', 'Atervix', 'Pingel'],
    fieldAdvice: 'Stentli kalp hastalarında pıhtı önler. Cerrah ve ilk yardımcı mutlaka bilgilendirilmelidir.'
  },
  {
    brand: 'Euthyrox / Levotiron',
    active: 'Levotiroksin',
    category: 'thyroid',
    categoryLabel: 'Tiroid Hormonu',
    equivalents: ['Levotiron', 'Tefor'],
    fieldAdvice: 'Sabah aç karnına tek doz alınır. Birkaç gün aksaması ölümcül değildir ancak halsizlik yapar.'
  }
];

const STORAGE_KEY = 'afet_chronic_prescriptions_v1';

export class EmergencyPrescriptionModal {
  private container: HTMLElement;
  private myMeds: ChronicMedication[] = [];
  private searchQuery = '';
  private onBroadcast?: (text: string) => void;

  constructor(parent: HTMLElement, onBroadcast?: (text: string) => void) {
    this.onBroadcast = onBroadcast;
    this.container = document.createElement('div');
    this.container.id = 'emergency-prescription-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.loadMeds();
    this.render();
  }

  private loadMeds(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.myMeds = JSON.parse(stored);
      }
    } catch {}
  }

  private saveMeds(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.myMeds));
    } catch {}
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private addMed(med: Omit<ChronicMedication, 'id'>): void {
    const newMed: ChronicMedication = {
      ...med,
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    this.myMeds.push(newMed);
    this.saveMeds();
    this.render();
  }

  private removeMed(id: string): void {
    this.myMeds = this.myMeds.filter((m) => m.id !== id);
    this.saveMeds();
    this.render();
  }

  private render(): void {
    const query = this.searchQuery.toLowerCase().trim();
    const filteredRef = COMMON_DRUGS.filter(
      (d) =>
        !query ||
        d.brand.toLowerCase().includes(query) ||
        d.active.toLowerCase().includes(query) ||
        d.equivalents.some((eq) => eq.toLowerCase().includes(query)) ||
        d.categoryLabel.toLowerCase().includes(query)
    );

    const myMedsHtml =
      this.myMeds.length === 0
        ? `
          <div class="text-center py-5 text-gray-400 bg-white/[0.02] rounded-xl border border-dashed border-white/10 p-3">
            <span class="text-xs">Henüz kayıtlı kronik ilacınız yok. Aşağıdan düzenli kullandığınız ilaçları ekleyin.</span>
          </div>
        `
        : this.myMeds
            .map(
              (m) => `
                <div class="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs sm:text-sm font-bold text-white">${m.brandName}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-medium">${m.dosage}</span>
                    </div>
                    <div class="text-[11px] text-gray-300 mt-0.5">
                      Etken Madde: <strong class="text-amber-300">${m.activeIngredient}</strong> · <span class="text-gray-400">${m.frequency}</span>
                    </div>
                    ${m.notes ? `<div class="text-[10px] text-gray-400 italic mt-0.5">${m.notes}</div>` : ''}
                  </div>
                  <button
                    type="button"
                    data-remove-med="${m.id}"
                    class="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                    title="İlacı kaldır"
                  >
                    ${Icons.close('w-3.5 h-3.5')}
                  </button>
                </div>
              `
            )
            .join('');

    const drugRefHtml = filteredRef
      .map(
        (d) => `
          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/15 transition-all">
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-xs font-bold text-white">${d.brand}</span>
                <span class="text-[10px] text-gray-400 ml-1.5">(${d.categoryLabel})</span>
                <div class="text-[11.5px] text-amber-300 font-medium mt-0.5">
                  Etken Madde: <strong>${d.active}</strong>
                </div>
              </div>
              <button
                type="button"
                data-quick-add-brand="${d.brand}"
                data-quick-add-active="${d.active}"
                data-quick-add-cat="${d.category}"
                class="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10.5px] font-semibold active:scale-95 transition-all shrink-0"
              >
                + İlaçlarıma Ekle
              </button>
            </div>
            <div class="text-[11px] text-gray-300 mt-1.5">
              <strong class="text-cyan-300">Sahra Eşdeğerleri:</strong> ${d.equivalents.join(', ')}
            </div>
            <p class="text-[10.5px] text-gray-400 mt-1 bg-black/20 p-2 rounded-lg border border-white/5">
              💡 ${d.fieldAdvice}
            </p>
          </div>
        `
      )
      .join('');

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              ${Icons.pill('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Afet İlaç & Tedavi Pasaportu</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">SAHRA EŞDEĞER</span>
              </div>
              <p class="text-[11px] text-gray-400">Enkaz ve tahliyede kaybolan kronik reçetelerin sahra eczanelerinden temini için eşdeğer etken madde rehberi.</p>
            </div>
          </div>
          <button id="btn-close-med-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          
          <!-- My Chronic Medications Section -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">KAYITLI KRONİK İLAÇLARIM (${this.myMeds.length})</span>
              ${
                this.myMeds.length > 0
                  ? `
                <div class="flex items-center gap-1.5">
                  <button id="btn-copy-prescription" type="button" class="text-[10.5px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 transition-colors">
                    Reçeteyi Kopyala
                  </button>
                  ${
                    this.onBroadcast
                      ? `
                    <button id="btn-broadcast-meds" type="button" class="text-[10.5px] px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors">
                      Ağa İlaç Talebi İlet
                    </button>
                  `
                      : ''
                  }
                </div>
              `
                  : ''
              }
            </div>
            ${myMedsHtml}
          </div>

          <!-- Add Custom Medication Form -->
          <div class="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2.5">
            <div class="text-[11px] font-bold text-gray-300 uppercase tracking-wide">YENİ İLAÇ EKLE</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                id="med-input-brand"
                type="text"
                placeholder="İlaç Adı (Örn: Beloc)"
                class="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
              />
              <input
                id="med-input-active"
                type="text"
                placeholder="Etken Madde (Örn: Metoprolol)"
                class="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
              />
              <input
                id="med-input-dosage"
                type="text"
                placeholder="Dozaj (Örn: 50 mg)"
                class="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
              />
              <input
                id="med-input-freq"
                type="text"
                placeholder="Kullanım (Örn: Günde 1)"
                class="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
              />
            </div>
            <button
              id="btn-add-custom-med"
              type="button"
              class="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white transition-all"
            >
              + Listeme Kaydet (Çevrimdışı Saklanır)
            </button>
          </div>

          <!-- Cold-Chain & Insulin Field Storage Directives -->
          <div class="p-3.5 rounded-xl bg-sky-500/[0.08] border border-sky-500/20 text-xs text-sky-200/90 space-y-1.5">
            <div class="font-bold flex items-center gap-1.5 text-sky-300">
              <span>❄️ Elektriksiz Sahra Koşullarında İnsülin ve Aşı Saklama (Soğuk Zincir):</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-[11px] text-gray-300">
              <li><strong>Toprak Çömlek (Zeer Pot) Yöntemi:</strong> İki iç içe konmuş saksı arasındaki kumu sürekli ıslatın; su buharlaşırken ısıyı çekerek çömlek içini 15-20°C serinlikte tutar.</li>
              <li>Açılmış insülin oda sıcaklığında (25°C altı) <strong>28 gün</strong> boyunca etkisini kaybetmez; doğrudan güneş ışığından korumak yeterlidir.</li>
              <li><strong>Asla Dondurmayın:</strong> Donan insülinin protein molekülleri parçalanır ve çözünse dahi biyolojik etkisini tamamen kaybeder.</li>
            </ul>
          </div>

          <!-- Search Generic Equivalents -->
          <div class="space-y-2 pt-2 border-t border-white/10">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400">SAHRA ECZANESİ EŞDEĞER ARAMA REHBERİ</span>
            </div>
            <div class="relative">
              <input
                id="med-search-input"
                type="text"
                placeholder="İlaç adı, etken madde veya hastalık ara (örn: Beloc, İnsülin, Ventolin)..."
                value="${this.searchQuery}"
                class="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
              />
              <span class="absolute left-3 top-2.5 text-gray-400">${Icons.search('w-4 h-4')}</span>
            </div>
            <div class="space-y-2">
              ${drugRefHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-med-modal')?.addEventListener('click', () => this.hide());

    const searchInput = q<HTMLInputElement>('#med-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
      const updatedInput = q<HTMLInputElement>('#med-search-input');
      if (updatedInput) {
        updatedInput.focus();
        updatedInput.selectionStart = updatedInput.value.length;
      }
    });

    q<HTMLButtonElement>('#btn-add-custom-med')?.addEventListener('click', () => {
      const brand = q<HTMLInputElement>('#med-input-brand')?.value.trim();
      const active = q<HTMLInputElement>('#med-input-active')?.value.trim() || brand;
      const dosage = q<HTMLInputElement>('#med-input-dosage')?.value.trim() || 'Standart';
      const frequency = q<HTMLInputElement>('#med-input-freq')?.value.trim() || 'Günde 1';

      if (brand) {
        this.addMed({
          brandName: brand,
          activeIngredient: active || brand,
          dosage,
          frequency,
          category: 'other'
        });
      }
    });

    this.container.querySelectorAll<HTMLButtonElement>('[data-quick-add-brand]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const brand = btn.getAttribute('data-quick-add-brand') || '';
        const active = btn.getAttribute('data-quick-add-active') || '';
        const cat = (btn.getAttribute('data-quick-add-cat') as ChronicMedication['category']) || 'other';
        this.addMed({
          brandName: brand,
          activeIngredient: active,
          dosage: 'Doktor Dozu',
          frequency: 'Düzenli',
          category: cat
        });
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('[data-remove-med]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-med');
        if (id) this.removeMed(id);
      });
    });

    q<HTMLButtonElement>('#btn-copy-prescription')?.addEventListener('click', () => {
      const text = this.myMeds
        .map((m) => `• ${m.brandName} (${m.activeIngredient}) - Doz: ${m.dosage} - Sıklık: ${m.frequency}`)
        .join('\n');
      const fullText = `📋 AFET KRONİK İLAÇ PASAPORTUM:\n${text}\n(Sahra eczanesi muadil ilaç temini içindir)`;
      navigator.clipboard.writeText(fullText).then(() => {
        const btn = q<HTMLButtonElement>('#btn-copy-prescription');
        if (btn) btn.textContent = 'Kopyalandı!';
        setTimeout(() => this.render(), 1500);
      });
    });

    q<HTMLButtonElement>('#btn-broadcast-meds')?.addEventListener('click', () => {
      if (!this.onBroadcast) return;
      const text = this.myMeds.map((m) => `${m.brandName} (${m.activeIngredient})`).join(', ');
      const msg = `🚨 [ACİL KRONİK İLAÇ İHTİYACI] Sahra eczanesi / UMKE dikkatine! Acil ihtiyaç duyulan ilaçlar: ${text}. Eşdeğer etken maddeler kabul edilir.`;
      this.onBroadcast(msg);
      const btn = q<HTMLButtonElement>('#btn-broadcast-meds');
      if (btn) btn.textContent = 'Ağa İletildi!';
      setTimeout(() => this.render(), 1800);
    });
  }
}
