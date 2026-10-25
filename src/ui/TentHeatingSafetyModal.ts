import { Icons } from './icons';

export interface SymptomItem {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  checked: boolean;
}

const DEFAULT_SYMPTOMS: SymptomItem[] = [
  { id: 'sym-headache', name: 'Şakaklarda Zonklayıcı Baş Ağrısı', severity: 'mild', checked: false },
  { id: 'sym-dizziness', name: 'Baş Dönmesi / Sersemlik Hissi', severity: 'mild', checked: false },
  { id: 'sym-nausea', name: 'Mide Bulantısı / Kusma Hissi', severity: 'moderate', checked: false },
  { id: 'sym-fatigue', name: 'Aşırı Halsizlik / Ağır Uyku İsteği', severity: 'moderate', checked: false },
  { id: 'sym-confusion', name: 'Zihin Bulanıklığı / Konuşmada Güçlük', severity: 'severe', checked: false },
  { id: 'sym-chest-pain', name: 'Göğüs Ağrısı / Çarpıntı / Nefes Darlığı', severity: 'severe', checked: false }
];

export class TentHeatingSafetyModal {
  private container: HTMLElement;
  private symptoms: SymptomItem[] = [...DEFAULT_SYMPTOMS];
  private activeTab: 'rules' | 'checker' | 'firstaid' = 'rules';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'tent-heating-safety-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private getRiskAssessment(): {
    level: 'safe' | 'warning' | 'danger';
    title: string;
    description: string;
    badgeClass: string;
  } {
    const checkedCount = this.symptoms.filter((s) => s.checked).length;
    const hasSevere = this.symptoms.some((s) => s.checked && s.severity === 'severe');
    const hasModerate = this.symptoms.some((s) => s.checked && s.severity === 'moderate');

    if (hasSevere || checkedCount >= 3) {
      return {
        level: 'danger',
        title: '🚨 ACİL TEHLİKE: Karbonmonoksit Zehirlenmesi Şüphesi!',
        description: 'Derhal çadır kapısını/fermuarını tamamen açın. Çadırdaki herkesi açık havaya çıkarın ve 112 Acil Servis’i arayın!',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
      };
    } else if (hasModerate || checkedCount >= 1) {
      return {
        level: 'warning',
        title: '⚠️ DİKKAT: Erken Zehirlenme veya Havasızlık Belirtisi',
        description: 'Çadır içi tepe havalandırmasını en az 10 cm açın, soba borularını ve közü kontrol edin. Temiz havada nefes alın.',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    } else {
      return {
        level: 'safe',
        title: '✅ Belirti Bildirilmedi',
        description: 'Çadırda ısınırken aşağıdaki 5 güvenlik kuralına ve sürekli tepe havalandırmasına mutlaka uyun.',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    }
  }

  private render(): void {
    const risk = this.getRiskAssessment();

    const tabsHtml = `
      <div class="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
        <button
          id="btn-tab-tent-rules"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'rules' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🔥 5 Altın Güvenlik Kuralı
        </button>
        <button
          id="btn-tab-tent-checker"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'checker' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🧪 Sessiz Katil (CO) Testi
        </button>
        <button
          id="btn-tab-tent-firstaid"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'firstaid' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🚑 Acil İlk Yardım (112)
        </button>
      </div>
    `;

    let bodyContent = '';

    if (this.activeTab === 'rules') {
      bodyContent = `
        <div class="space-y-3.5">
          <!-- Critical warning banner -->
          <div class="p-3.5 rounded-2xl bg-rose-500/[0.1] border border-rose-500/30 flex items-start gap-3 text-xs">
            <span class="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
              ${Icons.alertTriangle('w-5 h-5')}
            </span>
            <div>
              <strong class="text-rose-200 text-sm block">Deprem Çadırlarında 2. Büyük Tehlike: Yangın ve Karbonmonoksit!</strong>
              <p class="text-gray-300 mt-1 leading-relaxed">
                Karbonmonoksit (CO) gazı renksiz, kokusuz ve tatsızdır. İnsan uyurken fark edemez ve derin uykuya dalarak sessizce hayatını kaybeder.
                Çadır yangınları ise naylon branda nedeniyle saniyeler içinde tüm çadırı sarar.
              </p>
            </div>
          </div>

          <!-- 5 Rules Grid -->
          <div class="space-y-2.5 text-xs">
            <!-- Rule 1 -->
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0">1</span>
                <strong class="text-white text-sm">100 CM Mesafe Kuralı (Yangın Önleme)</strong>
              </div>
              <p class="text-gray-300 pl-8 leading-relaxed">
                Soba veya katalitik ısıtıcı; çadır brandasından, sünger yataklardan, battaniyelerden ve giysilerden <strong>en az 100 cm uzakta</strong> olmalıdır. Naylon kumaşlar ısıyı görünce erir ve hızla alev alır.
              </p>
            </div>

            <!-- Rule 2 -->
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center shrink-0">2</span>
                <strong class="text-white text-sm">Tepe Havalandırması Sürekli 5 CM Açık Kalmalı</strong>
              </div>
              <p class="text-gray-300 pl-8 leading-relaxed">
                Dışarısı -15°C olsa dahi çadırın tepe havalandırma üçgeni veya karşılıklı pencere açıklığı <strong>asla tamamen kapatılmamalıdır</strong>. Isınan CO gazı yukarı yükselir ve ancak açık tepe menfezinden tahliye olur.
              </p>
            </div>

            <!-- Rule 3 -->
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center shrink-0">3</span>
                <strong class="text-white text-sm">Uykuda Soba Söndürülmeli (Gece Köz Bırakmayın)</strong>
              </div>
              <p class="text-gray-300 pl-8 leading-relaxed">
                Uyumadan önce sobanın kapağını sonuna kadar kısıp uyumak en ölümcül hatadır! Kısılan soba yetersiz oksijenle yanar ve yoğun karbonmonoksit üretir. Gece uyurken sobayı söndürün, kat kat battaniye ve uyku tulumu kullanın.
              </p>
            </div>

            <!-- Rule 4 -->
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">4</span>
                <strong class="text-white text-sm">Zemin Yanmaz Tabaka (Tepsi veya Kum)</strong>
              </div>
              <p class="text-gray-300 pl-8 leading-relaxed">
                Soba asla doğrudan çadır zeminine veya halı/palet üzerine konulmamalıdır. Sobanın altına geniş bir <strong>metal saç tepsi, tuğla veya kum tabakası</strong> serilerek kıvılcım düşmelerine karşı tampon oluşturulmalıdır.
              </p>
            </div>

            <!-- Rule 5 -->
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0">5</span>
                <strong class="text-white text-sm">Jeneratör Çadır İçi Kesinlikle YASAKTIR</strong>
              </div>
              <p class="text-gray-300 pl-8 leading-relaxed">
                Elektrik üretmek veya telefon şarj etmek için jeneratörleri <strong>asla çadır veya konteyner içine almayın</strong>. Jeneratör egzozu dakikalar içinde ölümcül yoğunlukta gaz basar. Jeneratör çadırlardan <strong>en az 6 metre uzakta</strong> dışarıda çalışmalıdır.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'checker') {
      const symptomListHtml = this.symptoms
        .map((s) => {
          return `
            <label class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-colors">
              <input
                type="checkbox"
                data-symptom-id="${s.id}"
                class="co-symptom-input w-4 h-4 rounded text-rose-500 focus:ring-rose-400 border-gray-600 bg-obsidian-900"
                ${s.checked ? 'checked' : ''}
              />
              <div class="flex-1">
                <span class="text-xs font-medium text-gray-200 select-none">${s.name}</span>
                <span class="block text-[10px] text-gray-400">
                  ${s.severity === 'severe' ? 'Kritik Eşik Belirtisi' : s.severity === 'moderate' ? 'Orta Düzey Belirti' : 'Erken Aşama'}
                </span>
              </div>
            </label>
          `;
        })
        .join('');

      bodyContent = `
        <div class="space-y-4">
          <!-- Live Result Card -->
          <div class="p-4 rounded-2xl border ${risk.badgeClass} flex flex-col gap-2">
            <h3 class="text-sm font-bold">${risk.title}</h3>
            <p class="text-xs leading-relaxed">${risk.description}</p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>ŞU AN HİSSEDİLEN BELİRTİLERİ İŞARETLEYİN:</span>
              <button id="btn-reset-symptoms" type="button" class="text-rose-400 hover:underline text-[11px]">Sıfırla</button>
            </div>
            ${symptomListHtml}
          </div>
        </div>
      `;
    } else {
      // First Aid Tab
      bodyContent = `
        <div class="space-y-3.5 text-xs text-gray-300">
          <div class="p-3.5 rounded-2xl bg-rose-500/[0.1] border border-rose-500/30 space-y-1.5">
            <h4 class="font-bold text-rose-300 text-sm flex items-center gap-1.5">
              ${Icons.health('w-4 h-4')}
              <span>Karbonmonoksit Zehirlenmesinde Hayat Kurtaran 4 Adım</span>
            </h4>
            <ol class="list-decimal list-inside space-y-2 text-xs leading-relaxed text-gray-200 mt-2">
              <li>
                <strong>Kendi Güvenliğinizi Alarak İçeri Girin:</strong> Derin bir nefes alıp burnunuzu/ağzınızı kapatın, çadır kapısını ardına kadar açın ve asla kibrit, çakmak, lamba açmayın (patlama riski).
              </li>
              <li>
                <strong>Kazazedeyi Derhal Açık Havaya Çıkarın:</strong> Kişiyi kollarından tutarak hızla çadır dışına, rüzgar alan açık alana taşıyın.
              </li>
              <li>
                <strong>Solunumu ve Nabzı Kontrol Edin:</strong> Bilinç kapalı fakat nefes alıyorsa kişiyi <strong>Koma (Derlenme) Pozisyonuna</strong> (yan yatış) getirin. Solunum yoksa derhal CPR (Kalp Masajı) başlatın.
              </li>
              <li>
                <strong>112 Acil Servis'e Açık Bilgi Verin:</strong> "Çadırda karbonmonoksit / soba zehirlenmesi, acil oksijen tüpü gerekiyor" şeklinde net anons geçin.
              </li>
            </ol>
          </div>

          <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <strong class="text-white text-sm block">Baca Montajı Güvenlik Standardı:</strong>
            <p class="text-gray-300 leading-relaxed">
              Soba borusu çadır brandasını delerek çıktığı yerde mutlaka <strong>galvaniz sac koruma plakası (çadır flanşı)</strong> ile izole edilmelidir.
              Borunun ucu çadır çatısından en az 50 cm yukarıda olmalı ve rüzgarın dumanı geri basmasını önleyen <strong>döner baca şapkası veya H baca</strong> takılmalıdır.
            </p>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              ${Icons.flame('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Çadır Isınma & Karbonmonoksit Güvenliği</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold font-mono">HAYATİ REHBER</span>
              </div>
              <p class="text-[11px] text-gray-400">Kış şartlarında çadırkent ve konteynerlerde soba zehirlenmelerini ve yangınları önleme protokolü.</p>
            </div>
          </div>
          <button id="btn-close-tent-heating" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
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

    q<HTMLButtonElement>('#btn-close-tent-heating')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-tab-tent-rules')?.addEventListener('click', () => {
      this.activeTab = 'rules';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-tent-checker')?.addEventListener('click', () => {
      this.activeTab = 'checker';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-tent-firstaid')?.addEventListener('click', () => {
      this.activeTab = 'firstaid';
      this.render();
    });

    q<HTMLButtonElement>('#btn-reset-symptoms')?.addEventListener('click', () => {
      this.symptoms.forEach((s) => (s.checked = false));
      this.render();
    });

    this.container.querySelectorAll<HTMLInputElement>('.co-symptom-input').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-symptom-id');
        const match = this.symptoms.find((s) => s.id === id);
        if (match) {
          match.checked = input.checked;
          this.render();
        }
      });
    });
  }
}
