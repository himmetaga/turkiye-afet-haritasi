import { Icons } from './icons';

export type GuideCategory = 'indoor' | 'rubble' | 'outdoor' | 'secondary' | 'firstaid';

interface GuideSection {
  id: GuideCategory;
  title: string;
  badge: string;
  icon: string;
  summary: string;
  dos: string[];
  donts: string[];
  criticalRules: { title: string; desc: string; isWarning?: boolean }[];
}

const SURVIVAL_DATA: Record<GuideCategory, GuideSection> = {
  indoor: {
    id: 'indoor',
    title: 'Evde & Kapalı Alanda',
    badge: 'Deprem Anı',
    icon: '🏠',
    summary: 'Sarsıntı başladığında paniğe kapılmadan hayat üçgeni oluşturun, merdiven ve asansörlerden uzak durun.',
    dos: [
      'Sağlam bir eşyanın (koltuk, baza, sağlam masa) yanına ÇÖKÜN, cenin pozisyonu alarak KAPANIN ve sabit bir nesneye TUTUNUN.',
      'Başınızı ve boynunuzu yastık, minder veya kollarınızla sert cisim çarpmalarına karşı koruyun.',
      'Sarsıntı tamamen bittiğinde gaz vanalarını, su vanasını ve ana elektrik şalterini kapatın.',
      'Binayı terk ederken mutlaka kalın tabanlı ayakkabı giyin (yerdeki cam ve molozlar tahliyeyi engeller).'
    ],
    donts: [
      'ASLA asansöre binmeyin veya balkona çıkmayın.',
      'ASLA merdivenlere koşmayın (merdivenler binaların en çabuk yıkılan ve ezilen alanlarıdır).',
      'Pencerelere, vitrinlere, ağır kitaplıklara ve avizelere yaklaşmayın.',
      'Pencereden veya balkondan aşağı atlamayın.'
    ],
    criticalRules: [
      {
        title: 'Çök - Kapan - Tutun',
        desc: 'Yere çökerek hedefinizi küçültün. Başınızı ve ensenizi koruyarak sağlam bir yere sıkıca tutunun.'
      },
      {
        title: 'Merdiven Tuzağı',
        desc: 'Deprem ölümlerinin büyük kısmı bina yıkılmadan önce merdiven boşluğuna kaçmaya çalışanların merdivenlerin çökmesiyle ezilmesinden kaynaklanır.',
        isWarning: true
      }
    ]
  },
  rubble: {
    id: 'rubble',
    title: 'Enkaz Altında Hayatta Kalma',
    badge: 'Kritik Kurtarma',
    icon: '🧱',
    summary: 'Enkaz altında en değerli varlığınız oksijeniniz, enerjiniz ve moralinizdir. Gücünüzü planlı kullanın.',
    dos: [
      'Ağzınızı ve burnunuzu tozdan korumak için mendil, tişört veya kıyafet parçasıyla kapatın.',
      'Yakınınızdaki kalorifer borusu, demir profil veya sert betona düzenli 3 VURUŞ RİTMİ (TAK - TAK - TAK) ile vurun.',
      'Kurtarma ekiplerinin arama sesini (jeneratör, dinleme cihazı çağrısı) duyduğunuzda var gücünüzle ses verin veya afet düdüğünü açın.',
      'Gereksiz hareketlerden kaçının, vücut ısınızı korumak için cenin pozisyonunda kalın.'
    ],
    donts: [
      'ASLA çakmak, kibrit veya mum yakmayın! (Gaz kaçağı durumunda anında patlamaya yol açar, ayrıca kısıtlı oksijeni hızla tüketir).',
      'Sürekli ve kontrolsüzce bağırmayın (toz yutmanıza, ses tellerinizin şişmesine ve susuz kalmanıza neden olur).',
      'Kontrolsüz biçimde üstünüzdeki molozları çekmeye çalışmayın (yeni göçüklere yol açabilir).'
    ],
    criticalRules: [
      {
        title: '3 Vuruş Uluslararası Arama Kodu',
        desc: 'Dinleme ekipleri periyodik olarak sessizlik ister ve mikrofonla dinler. "TAK - TAK - TAK" ritmi akustik filtrelerde insan işareti olarak hemen ayrışır.'
      },
      {
        title: 'Asla Ateş Yakmayın!',
        desc: 'Enkaz altında gaz kokusu hissetmeseniz bile gaz birikmiş olabilir. Ateş yakmak patlama ve anlık yangına sebep olur.',
        isWarning: true
      }
    ]
  },
  outdoor: {
    id: 'outdoor',
    title: 'Araçta & Açık Alanda',
    badge: 'Açık Alan',
    icon: '🚗',
    summary: 'Açık alanda düşen cephe kaplamaları, camlar ve enerji nakil hatlarından korunun.',
    dos: [
      'Araçtaysanız sağ şeride yanaşarak durun, yolu itfaiye ve ambulans geçişi için açık bırakın.',
      'Aracı terk ederken kontak anahtarını kontak üzerinde bırakın (itfaiye ve arama araçlarının gerektiğinde çekebilmesi için).',
      'Açık alandaysanız geniş parklar, meydanlar ve toplanma alanlarına doğru ilerleyin.',
      'Deniz kenarındaysanız deprem sonrası olası tsunami ve su baskını riskine karşı derhal yüksek tepelere çıkın.'
    ],
    donts: [
      'Üst geçitlerin, viyadüklerin, köprülerin altına veya üzerine park etmeyin.',
      'Bina cephelerinin, cam giydirme plazaların ve elektrik direklerinin dibinde beklemeyin.',
      'Telefon şebekesini sesli aramayla meşgul etmeyin (yalnızca SMS veya internet mesajı kullanın).'
    ],
    criticalRules: [
      {
        title: 'Cam ve Sıva Yağmuru',
        desc: 'Deprem anında binaların dış cephesinden kiremit, cam, klima motoru ve beton parçaları fırlar. Sokakta binaların dibinde değil, açık orta hatta durun.',
        isWarning: true
      },
      {
        title: 'Kontak Anahtarı Kuralı',
        desc: 'Trafik tıkanıklığında itfaiyenin aracı kenara çekebilmesi için anahtarı kontakta bırakmak acil servislerin hayati geçişini sağlar.'
      }
    ]
  },
  secondary: {
    id: 'secondary',
    title: 'Sel, Heyelan & Yangın',
    badge: 'İkincil Afetler',
    icon: '🌊',
    summary: 'Deprem sonrası yangınlar, şiddetli yağışlarda ani sel ve su taşkınlarına karşı anlık korunma kuralları.',
    dos: [
      'Sel anında suyun derinliğini tahmin etmeye çalışmayın, hemen yüksek katlara veya yüksek tepelere çıkın.',
      'Dumanlı bir ortamda yangından tahliye olurken yere yakın seviyede sürünün (oksijen zeminde kalır, zehirli karbonmonoksit yukarı yükselir).',
      'Duman solumamak için ağzınızı ıslak bezle kapatın.',
      'Kapalı bir kapıyı açmadan önce kapı kolunu elinizin tersiyle kontrol edin (sıcaksa arkasında yangın vardır, açmayın).'
    ],
    donts: [
      'ASLA sel suyuna adım atmayın veya araçla girmeyin (30 cm sel suyu araçları sürükler; su altında açık rögarlar ve elektrik kaçakları bulunur).',
      'Sel sırasında bodrum katlara, zemin altı otoparklara veya alt geçitlere kesinlikle girmeyin.'
    ],
    criticalRules: [
      {
        title: 'Su Altındaki Görünmez Tehlikeler',
        desc: 'Sel sularında kopmuş elektrik telleri suya yüksek voltaj verir, yerinden fırlamış rögar kapakları insanları yutar. Asla suya basmayın.',
        isWarning: true
      },
      {
        title: 'Duman Boğulması Kuralı',
        desc: 'Yangınlarda ölümlerin %80’i alevden değil zehirli duman solumaktan olur. Yere paralel sürünerek hareket edin.'
      }
    ]
  },
  firstaid: {
    id: 'firstaid',
    title: 'Acil İlk Yardım & Crush Protokolü',
    badge: 'Tıbbi Müdahale',
    icon: '🩹',
    summary: 'İlk yardımın temel kuralı önce zarar vermemektir. Bilinçsiz su içirmek veya omurgayı sarsmak kalıcı hasar bırakabilir.',
    dos: [
      'Crush (Ezilme) sendromu şüphesinde sağlık ekipleri damar yolu açmadan önce kazazedeye kontrolsüzce su içirmeyin.',
      'Şiddetli atardamar kanamasında ekstremiteye (kol/bacak) yaranın 5-7 cm yukarısına turnike uygulayın ve saati mutlaka yaralının alnına yazın.',
      'Kazazedenin bilinci kapalıysa ve solunumu varsa Koma / İyileşme (yan yatış) pozisyonuna getirin (dilin nefes borusunu tıkamasını önler).',
      'Yaralıyı sıcak tutun; şoktaki kişi hızla vücut ısısı kaybeder, battaniye veya alüminyum termal örtüyle sarın.'
    ],
    donts: [
      '⚠️ KESİNLİKLE ENKAZDAN ÇIKAN KİŞİYE HEMEN BOL SU İÇİRMEYİN!',
      'Boyun ve omurga travması şüphesi olan kazazedeyi boyunluksuz veya sedyesiz sarsarak taşımayın.',
      'Yaraya tentürdiyot, kolonya, tuz veya tütün gibi yabancı maddeler basmayın.',
      'Turnikeyi 1.5 saatten uzun süre çözmeden veya gevşetmeden tutmayın.'
    ],
    criticalRules: [
      {
        title: 'Hayati Uyarı: Ezilme (Crush) Sendromu',
        desc: 'Enkaz altında ezilen kaslarda yüksek oranda miyoglobin ve potasyum birikir. Baskı kalktığında ve kişi su içtiğinde bu toksinler hızla böbreklere ve kalbe hücum ederek ani böbrek iflası ve ritim bozukluğuna yol açar.',
        isWarning: true
      },
      {
        title: 'Turnikeye Zaman Kaydı',
        desc: 'Turnike uygulandığında turnikenin üzerine veya yaralının alnına uygulandığı saati (Örn: T: 15:40) silinmez kalemle yazın. 120 dakikayı aşan turnikeler doku kangrenine yol açar.'
      }
    ]
  }
};

export class DisasterSurvivalGuideModal {
  private container: HTMLElement;
  private activeCategory: GuideCategory = 'indoor';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'disaster-survival-guide-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(initialCategory?: GuideCategory): void {
    if (initialCategory) this.activeCategory = initialCategory;
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private setCategory(cat: GuideCategory): void {
    this.activeCategory = cat;
    this.render();
  }

  private render(): void {
    const current = SURVIVAL_DATA[this.activeCategory];

    const categoryButtons = (Object.keys(SURVIVAL_DATA) as GuideCategory[])
      .map((catKey) => {
        const item = SURVIVAL_DATA[catKey];
        const isActive = this.activeCategory === catKey;
        return `
          <button
            type="button"
            data-cat="${catKey}"
            class="tab-btn flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
              isActive
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }"
          >
            <span>${item.icon}</span>
            <span>${item.title.split('&')[0].trim()}</span>
          </button>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              ${Icons.shield('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">
                  Afet Hayatta Kalma & İlk Yardım Rehberi
                </h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">ÇEVRİMDIŞI</span>
              </div>
              <p class="text-[11px] text-gray-400">İnternet bağlantınız olmasa bile çalışan hayati afet ve ilk yardım protokolleri.</p>
            </div>
          </div>
          <button id="btn-close-guide" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2.5 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0 bg-black/20">
          ${categoryButtons}
        </div>

        <!-- Scrollable Content -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <!-- Summary Banner -->
          <div class="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
            <span class="text-2xl">${current.icon}</span>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-white text-sm sm:text-base">${current.title}</h3>
                <span class="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-gray-300 font-medium">${current.badge}</span>
              </div>
              <p class="text-gray-300 leading-relaxed text-[12px] sm:text-[13px]">${current.summary}</p>
            </div>
          </div>

          <!-- Critical Rules -->
          <div class="space-y-2">
            ${current.criticalRules
              .map(
                (rule) => `
              <div class="p-3 rounded-xl border ${
                rule.isWarning
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-100'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
              }">
                <div class="font-bold flex items-center gap-1.5 text-xs sm:text-sm mb-1 ${
                  rule.isWarning ? 'text-rose-400' : 'text-emerald-400'
                }">
                  <span>${rule.isWarning ? '⚠️' : '✅'}</span>
                  <span>${rule.title}</span>
                </div>
                <p class="text-[11.5px] sm:text-[12.5px] leading-relaxed opacity-90">${rule.desc}</p>
              </div>
            `
              )
              .join('')}
          </div>

          <!-- Dos & Don'ts Columns -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <!-- DOs -->
            <div class="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <div class="font-bold text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                <span>✓</span> MUTLAKA YAPIN
              </div>
              <ul class="space-y-2 text-[11.5px] sm:text-[12px] text-gray-200">
                ${current.dos
                  .map(
                    (d) => `
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>${d}</span>
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>

            <!-- DONTs -->
            <div class="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20">
              <div class="font-bold text-rose-400 text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                <span>✕</span> KESİNLİKLE YAPMAYIN
              </div>
              <ul class="space-y-2 text-[11.5px] sm:text-[12px] text-gray-200">
                ${current.donts
                  .map(
                    (d) => `
                  <li class="flex items-start gap-2">
                    <span class="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>${d}</span>
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 sm:p-4 border-t border-white/10 bg-white/5 flex items-center justify-between shrink-0">
          <div class="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span class="text-emerald-400">●</span> AFAD, AKUT ve Kızılay ilk yardım standartlarına uygundur.
          </div>
          <button
            id="btn-ok-guide"
            type="button"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-guide')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-ok-guide')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat') as GuideCategory;
        if (cat) this.setCategory(cat);
      });
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
