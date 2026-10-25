import { Icons } from './icons';

export class InfantFeedingSafetyModal {
  private container: HTMLElement;
  private activeTab: 'relactation' | 'cup' | 'formula' = 'relactation';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'infant-feeding-safety-modal';
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

  private render(): void {
    const tabsHtml = `
      <div class="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
        <button
          id="btn-tab-relactation"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'relactation' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🤱 Anne Sütü & Relaktasyon
        </button>
        <button
          id="btn-tab-cup"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'cup' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🥛 Biberonsuz Fincan Besleme
        </button>
        <button
          id="btn-tab-formula"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'formula' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🍼 Güvenli Mama Standartları
        </button>
      </div>
    `;

    let bodyContent = '';

    if (this.activeTab === 'relactation') {
      bodyContent = `
        <div class="space-y-3.5 text-xs text-gray-300 leading-relaxed">
          <div class="p-3.5 rounded-2xl bg-pink-500/[0.1] border border-pink-500/25 space-y-1.5">
            <h4 class="font-bold text-pink-300 text-sm flex items-center gap-1.5">
              ${Icons.baby('w-4 h-4')}
              <span>"Korkudan Sütüm Kesildi" Yanılgısı ve Relaktasyon</span>
            </h4>
            <p>
              Deprem ve afet stresi süt üretimini (prolaktin) durdurmaz; yalnızca sütün memeden akmasını sağlayan <strong>oksitosin hormonunu geçici olarak bloke eder</strong>.
              Süt memede mevcuttur ancak stres nedeniyle kanallardan akmakta zorlanır.
            </p>
          </div>

          <div class="space-y-2">
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <strong class="text-white text-xs block">1. Ten Tene Temas (En Güçlü Tetikleyici):</strong>
              <p class="text-gray-400 text-[11px]">
                Bebeğin çıplak göğsünü annenin çıplak tenine yaslayın, üzerinizi battaniyeyle örtün. Annenin bebeğin kokusunu alması oksitosin salgısını saniyeler içinde aktive eder.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <strong class="text-white text-xs block">2. Sık ve Kesintisiz Emzirme Uyarımı:</strong>
              <p class="text-gray-400 text-[11px]">
                Süt gelmese dahi bebeği her 1.5 - 2 saatte bir memede tutun. Emme refleksi beyne acil süt üretimi sinyali gönderir.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <strong class="text-white text-xs block">3. Annenin Sıvı Alımı ve Sıcak Uygulama:</strong>
              <p class="text-gray-400 text-[11px]">
                Anneye ılık içme suyu, çay veya komposto sağlayın. Göğüslere ılık temiz bezle hafif masaj yapmak süt kanallarını açar.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'cup') {
      bodyContent = `
        <div class="space-y-3.5 text-xs text-gray-300 leading-relaxed">
          <div class="p-3.5 rounded-2xl bg-rose-500/[0.1] border border-rose-500/25 space-y-1.5">
            <h4 class="font-bold text-rose-300 text-sm flex items-center gap-1.5">
              ${Icons.alertTriangle('w-4 h-4')}
              <span>Çadırkentlerde Biberon ve Emzik Neden Ölümcül Olabilir?</span>
            </h4>
            <p>
              Afet sahasında su kısıtlıdır; plastik biberon ve emzikleri her beslemede 10 dakika kaynatmak imkansızdır.
              Biberon içinde üreyen bakteriler yenidoğanlarda <strong>akut sahra ishali, dizanteri ve ölümcül su kaybına (dehidratasyon)</strong> yol açar.
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <strong class="text-white text-sm block">Güvenli Çözüm: Kağıt Bardak veya Fincanla Besleme (Cup Feeding)</strong>
            <ol class="list-decimal list-inside space-y-1.5 text-[11px] text-gray-300">
              <li>Bebeği dik pozisyonda kucağınıza oturtun (Asla sırtüstü yatırarak beslemeyin).</li>
              <li>Küçük temiz bir fincanın veya tek kullanımlık kağıt bardağın kenarını bebeğin üst dudağına ve alt dudağının kenarına hafifçe dokundurun.</li>
              <li><strong>Sütü bebeğin ağzına dökmeyin!</strong> Bardağı hafifçe eğerek sütün bebeğin dudaklarına temas etmesini sağlayın; bebek diliyle yalayarak kendi hızında içecektir.</li>
              <li>Böylece biberon enfeksiyonu riski tamamen sıfırlanır ve bebek anne memesini reddetmez.</li>
            </ol>
          </div>
        </div>
      `;
    } else {
      bodyContent = `
        <div class="space-y-3 text-xs text-gray-300 leading-relaxed">
          <div class="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 space-y-1.5">
            <h4 class="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              ${Icons.shield('w-4 h-4')}
              <span>Sahra Koşullarında Toz Mama Hazırlama Kuralları (DSÖ Standardı)</span>
            </h4>
            <p>
              Toz bebek mamaları steril değildir; bakteri içerebilir. Bu nedenle suyu sadece ılıtmak yetersizdir.
            </p>
          </div>

          <div class="space-y-2">
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <strong class="text-white text-xs block">1. 1 Dakika Fokurdayarak Kaynatma:</strong>
              <p class="text-gray-400 text-[11px]">
                Şişe veya kaynak suyunu en az 1 tam dakika kaynatın. Ardından suyun yaklaşık 70°C'ye (ılık ile sıcak arası) inmesini bekleyin ve mamayı karıştırın (70°C sıcaklık mamanın içindeki <em>Cronobacter</em> bakterilerini öldürür).
              </p>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <strong class="text-white text-xs block">2. Bilek İçi Isı Kontrolü:</strong>
              <p class="text-gray-400 text-[11px]">
                Mamayı hazırladıktan sonra kabı soğuk suyun içinde bekleterek vücut sıcaklığına getirin. Bileğinizin içine damlatarak yakmadığından emin olmadan bebeğe vermeyin.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <strong class="text-white text-xs block">3. 1 Saat Kuralı (Asla Bekletmeyin):</strong>
              <p class="text-gray-400 text-[11px]">
                Hazırlanan mama oda sıcaklığında en fazla 1 saat içinde tüketilmelidir. Bebeğin artırdığı mamayı asla tekrar ısıtıp vermeyin, dökün.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-pink-500/15 text-pink-400">
              ${Icons.baby('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Bebek Besleme & Relaktasyon</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold font-mono">DSÖ / UNICEF</span>
              </div>
              <p class="text-[11px] text-gray-400">Afet ve çadırkent koşullarında bebekleri kirli su ve biberon enfeksiyonlarından koruma rehberi.</p>
            </div>
          </div>
          <button id="btn-close-infant-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="p-3 sm:p-4 pb-2 shrink-0">
          ${tabsHtml}
        </div>

        <!-- Body -->
        <div class="p-3 sm:p-4 pt-1 overflow-y-auto flex-1 scrollbar-thin">
          ${bodyContent}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-infant-modal')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-tab-relactation')?.addEventListener('click', () => {
      this.activeTab = 'relactation';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-cup')?.addEventListener('click', () => {
      this.activeTab = 'cup';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-formula')?.addEventListener('click', () => {
      this.activeTab = 'formula';
      this.render();
    });
  }
}
