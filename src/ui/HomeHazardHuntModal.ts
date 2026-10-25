import { Icons } from './icons';

interface HazardItem {
  id: string;
  room: 'bedroom' | 'living' | 'kitchen' | 'hallway' | 'utility';
  roomLabel: string;
  title: string;
  description: string;
  points: number;
  fixTip: string;
}

const HAZARD_QUESTIONS: HazardItem[] = [
  {
    id: 'h-bed-wardrobe',
    room: 'bedroom',
    roomLabel: 'Yatak Odası',
    title: 'Gardırop ve ağır dolaplar duvara L-demirle sabitlendi mi?',
    description: 'Deprem sarsıntısında devrilen gardıroplar yatakta uyuyanların üzerine yıkılarak can kayıplarının en sık sebebidir.',
    points: 10,
    fixTip: 'Hırdavatçıdan 4x4 cm L-braket ve duvar tipine uygun dübel (tuğla için çelik, alçıpan için kanatlı dübel) ile en az 2 noktadan duvara vidalayın.'
  },
  {
    id: 'h-bed-window',
    room: 'bedroom',
    roomLabel: 'Yatak Odası',
    title: 'Yatak başı pencere, cam veya ağır tablodan uzakta mı?',
    description: 'Sarsıntıda kırılan pencere camları ve duvardan fırlayan çerçeveler uyurken doğrudan baş bölgesine düşer.',
    points: 10,
    fixTip: 'Yatağı pencerelerden en az 1 metre uzağa çekin; yatak başucundaki ağır ayna ve cam tabloları kaldırın.'
  },
  {
    id: 'h-bed-shoes',
    room: 'bedroom',
    roomLabel: 'Yatak Odası',
    title: 'Yatak başucunda el feneri ve kalın tabanlı ayakkabı var mı?',
    description: 'Gece depremlerinde elektrik kesilir ve yerler kırık camla kaplanır. Çıplak ayakla yürümek tahliyeyi imkansız kılar.',
    points: 5,
    fixTip: 'Eski ama altı kalın bir spor ayakkabıyı ve pilli bir el fenerini doğrudan yatağın altına sabitleyin.'
  },
  {
    id: 'h-liv-tv',
    room: 'living',
    roomLabel: 'Salon',
    title: 'Kitaplık, vitrin ve TV ünitesi duvara sabitlendi mi?',
    description: 'Ağır kitaplıklar devrildiğinde altındaki kişiyi ezer; cam vitrinler patlayarak odayı şarapnele boğar.',
    points: 10,
    fixTip: 'Mobilyaları üst köşelerinden duvara sabitleyin; cam kapaklı vitrinlerin camlarına güvenlik filmi çekin.'
  },
  {
    id: 'h-liv-chandelier',
    room: 'living',
    roomLabel: 'Salon',
    title: 'Ağır asma avizeler tavana çelik kancayla mı asılı?',
    description: 'Sallantıda kopan avizeler yangına ve baş yaralanmalarına yol açar.',
    points: 5,
    fixTip: 'Avize kancasının tavandaki betonarmeye doğrudan çelik açılır kancayla bağlı olduğundan emin olun.'
  },
  {
    id: 'h-kit-latches',
    room: 'kitchen',
    roomLabel: 'Mutfak',
    title: 'Üst mutfak dolaplarında deprem/çocuk kilit mandalı var mı?',
    description: 'Sarsıntıda dolap kapakları açılarak yüzlerce tabak, bardak ve cam kavanoz yerlere saçılır.',
    points: 10,
    fixTip: 'Mutfak dolaplarının iç tarafına bas-çek mandallı veya yaylı çocuk kilitleri takın (Tanesi 15-20 TL).'
  },
  {
    id: 'h-kit-heavy-low',
    room: 'kitchen',
    roomLabel: 'Mutfak',
    title: 'Ağır tencereler ve döküm tavalar alt dolaplarda mı?',
    description: 'Ağır metallerin yüksekten düşmesi doğrudan travma yaratır.',
    points: 5,
    fixTip: 'Düdüklü tencere, fırın kapları ve cam tepsileri tezgah altı çekmece veya dolaplara indirin.'
  },
  {
    id: 'h-kit-gas-hose',
    room: 'kitchen',
    roomLabel: 'Mutfak',
    title: 'Ocak ve gaz bağlantı hortumu esnek ve kelepçeli mi?',
    description: 'Ocak sarsıntıyla öne kaydığında sert bakır boru kırılır veya eski hortum yırtılarak yangın çıkarır.',
    points: 5,
    fixTip: 'Sarı renkli esnek paslanmaz çelik fleks gaz hortumu kullanın ve son kullanma tarihini kontrol edin.'
  },
  {
    id: 'h-hall-escape',
    room: 'hallway',
    roomLabel: 'Antre & Kaçış',
    title: 'Dış kapıya giden kaçış koridorunda hiçbir engel yok mu?',
    description: 'Karanlıkta ve duman altında kaçarken ayakkabılığa veya bisiklete takılıp düşmek ezilmeye yol açar.',
    points: 10,
    fixTip: 'Koridor zeminindeki tüm puset, ayakkabılık ve kutuları kaldırın; kapı çıkış hattını tamamen boşaltın.'
  },
  {
    id: 'h-hall-valves',
    room: 'hallway',
    roomLabel: 'Antre & Kaçış',
    title: 'Elektrik sigortası ve doğalgaz ana vanasının yeri biliniyor mu?',
    description: 'Sarsıntı bittiğinde evi terk etmeden önce gaz ve elektriği kesmek ikincil patlama ve yangınları %100 engeller.',
    points: 10,
    fixTip: 'Ana vana kolunun üzerine parlak fosforlu bant yapıştırın; gaz vanasını kapatmak için yanında kurbağacık anahtar bulundurun.'
  },
  {
    id: 'h-hall-keys',
    room: 'hallway',
    roomLabel: 'Antre & Kaçış',
    title: 'Dış kapı ve bina anahtarları kapı yanındaki askıda asılı mı?',
    description: 'Panik anında anahtar aramak dakikalar kaybettirir ve sıkışmaya yol açar.',
    points: 5,
    fixTip: 'Dış kapının hemen yanına anahtarlık askısı monte edin ve evin anahtarını daima orada tutun.'
  },
  {
    id: 'h-util-boiler',
    room: 'utility',
    roomLabel: 'Tesisat & Banyo',
    title: 'Kombi veya termosifon duvara çelik dübelle sabitlendi mi?',
    description: 'Su dolu kombi 60-80 kg ağırlığa ulaşır. Devrildiğinde gaz borusunu kopararak evi anında havaya uçurur.',
    points: 10,
    fixTip: 'Kombiyi duvara en az 4 adet çelik gömlekli dübel ile sabitleyin (asla plastik dübel kullanmayın).'
  },
  {
    id: 'h-util-extinguisher',
    room: 'utility',
    roomLabel: 'Tesisat & Banyo',
    title: 'Evde çalışır durumda yangın söndürme tüpü var mı?',
    description: 'Deprem sonrası çıkan küçük elektrik veya gaz alevlerini ilk 60 saniyede söndürmek binanın yanmasını önler.',
    points: 5,
    fixTip: 'En az 2 kg Kuru Kimyevi Tozlu (ABC tipi) yangın tüpü edinin ve yılda bir manometre ibresini kontrol edin.'
  }
];

const STORAGE_KEY = 'afet_hazard_hunt_v1';

export class HomeHazardHuntModal {
  private container: HTMLElement;
  private checkedIds: Set<string> = new Set();
  private activeRoom: 'all' | HazardItem['room'] = 'all';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'home-hazard-hunt-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.loadState();
    this.render();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        this.checkedIds = new Set(arr);
      }
    } catch {}
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.checkedIds)));
    } catch {}
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private toggleItem(id: string): void {
    if (this.checkedIds.has(id)) {
      this.checkedIds.delete(id);
    } else {
      this.checkedIds.add(id);
    }
    this.saveState();
    this.render();
  }

  private calculateScore(): { score: number; grade: string; gradeText: string; badgeColor: string } {
    let earned = 0;
    const total = HAZARD_QUESTIONS.reduce((acc, q) => acc + q.points, 0);

    HAZARD_QUESTIONS.forEach((q) => {
      if (this.checkedIds.has(q.id)) earned += q.points;
    });

    const score = Math.round((earned / total) * 100);

    if (score >= 85) {
      return {
        score,
        grade: 'A',
        gradeText: 'Depreme Karşı Yüksek Güvenlik',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      };
    } else if (score >= 65) {
      return {
        score,
        grade: 'B',
        gradeText: 'İyi Seviye (Küçük Eksikler Var)',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
      };
    } else if (score >= 45) {
      return {
        score,
        grade: 'C',
        gradeText: 'Orta Risk (Sabitleme Gerekli)',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    } else {
      return {
        score,
        grade: 'D',
        gradeText: 'Yüksek Tehlike (Acil Önlem Gerekli)',
        badgeColor: 'bg-rose-500/25 text-rose-300 border-rose-500/50'
      };
    }
  }

  private render(): void {
    const { score, grade, gradeText, badgeColor } = this.calculateScore();

    const rooms: { key: 'all' | HazardItem['room']; label: string; icon: string }[] = [
      { key: 'all', label: 'Tüm Ev', icon: '🏠' },
      { key: 'bedroom', label: 'Yatak Odası', icon: '🛏️' },
      { key: 'living', label: 'Salon', icon: '🛋️' },
      { key: 'kitchen', label: 'Mutfak', icon: '🍳' },
      { key: 'hallway', label: 'Antre & Kaçış', icon: '🚪' },
      { key: 'utility', label: 'Tesisat & Banyo', icon: '🚿' }
    ];

    const roomTabsHtml = rooms
      .map((r) => {
        const isActive = this.activeRoom === r.key;
        return `
          <button
            type="button"
            data-room-tab="${r.key}"
            class="room-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
              isActive
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }"
          >
            <span>${r.icon}</span>
            <span>${r.label}</span>
          </button>
        `;
      })
      .join('');

    const filteredQuestions =
      this.activeRoom === 'all'
        ? HAZARD_QUESTIONS
        : HAZARD_QUESTIONS.filter((q) => q.room === this.activeRoom);

    const questionsHtml = filteredQuestions
      .map((q) => {
        const isChecked = this.checkedIds.has(q.id);
        return `
          <div
            data-hazard-item="${q.id}"
            class="p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              isChecked
                ? 'bg-emerald-500/[0.07] border-emerald-500/30 text-white'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-gray-200'
            }"
          >
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                ${isChecked ? 'checked' : ''}
                class="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-white/10 border-white/20 pointer-events-none"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs sm:text-sm font-bold ${isChecked ? 'text-emerald-300' : 'text-white'}">
                    ${q.title}
                  </span>
                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isChecked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'
                  }">
                    +${q.points} Puan
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                  ${q.description}
                </p>
                <div class="text-[11px] text-amber-300/90 mt-2 bg-black/30 p-2 rounded-xl border border-white/5">
                  🛠️ <strong>Önlem İpucu:</strong> ${q.fixTip}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              ${Icons.home('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Ev İçi Tehlike Avı</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">DEPREM GÜVENLİK DENETİMİ</span>
              </div>
              <p class="text-[11px] text-gray-400">Deprem yaralanmalarının %70'i mobilya devrilmesi kaynaklıdır. Odanızı denetleyin.</p>
            </div>
          </div>
          <button id="btn-close-hazard-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Score Banner -->
        <div class="p-3.5 sm:p-4 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">EV DEPREM GÜVENLİK PUANI</div>
            <div class="flex items-baseline gap-2 mt-0.5">
              <span class="font-mono text-3xl sm:text-4xl font-black text-white tabular-nums">${score}</span>
              <span class="text-xs text-gray-400 font-mono">/ 100</span>
              <span class="text-xs px-2.5 py-1 rounded-full border font-bold ml-2 ${badgeColor}">
                SEVİYE ${grade} · ${gradeText}
              </span>
            </div>
          </div>
          <button
            id="btn-copy-hazard-report"
            type="button"
            class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-gray-200 transition-all shrink-0 flex items-center gap-1.5"
          >
            ${Icons.copy('w-3.5 h-3.5')}
            <span class="hidden sm:inline">Raporu Kopyala</span>
          </button>
        </div>

        <!-- Room Filter Tabs -->
        <div class="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2.5 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0 bg-black/20">
          ${roomTabsHtml}
        </div>

        <!-- Questions Checklist -->
        <div class="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          <div class="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>DENETİM SORULARI (${filteredQuestions.length})</span>
            <span class="text-emerald-400 font-semibold">${this.checkedIds.size} / ${HAZARD_QUESTIONS.length} tamamlandı</span>
          </div>
          ${questionsHtml}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-hazard-modal')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll<HTMLButtonElement>('.room-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const roomKey = btn.getAttribute('data-room-tab') as 'all' | HazardItem['room'];
        if (roomKey) {
          this.activeRoom = roomKey;
          this.render();
        }
      });
    });

    this.container.querySelectorAll<HTMLElement>('[data-hazard-item]').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-hazard-item');
        if (id) {
          this.toggleItem(id);
        }
      });
    });

    q<HTMLButtonElement>('#btn-copy-hazard-report')?.addEventListener('click', () => {
      const { score, grade, gradeText } = this.calculateScore();
      const completedCount = this.checkedIds.size;
      const totalCount = HAZARD_QUESTIONS.length;

      const unchecked = HAZARD_QUESTIONS.filter((q) => !this.checkedIds.has(q.id))
        .map((q) => `❌ [${q.roomLabel}] ${q.title} -> Öneri: ${q.fixTip}`)
        .join('\n');

      const report = `🏠 EV DEPREM GÜVENLİK DENETİM RAPORU (afet.live)
Puan: %${score} / 100 (Seviye ${grade} - ${gradeText})
Tamamlanan Önlemler: ${completedCount}/${totalCount}

ACİL YAPILMASI GEREKENLER (Eksikler):
${unchecked || 'Tebrikler! Tüm ev sabitleme önlemleri eksiksiz tamamlanmış.'}`;

      navigator.clipboard.writeText(report).then(() => {
        const btn = q<HTMLButtonElement>('#btn-copy-hazard-report');
        if (btn) btn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5 text-emerald-400')} <span class="text-emerald-400">Kopyalandı!</span>`;
        setTimeout(() => this.render(), 1500);
      });
    });
  }
}
