import { Icons } from './icons';
import { soundSynthesizer } from '../services/soundSynthesizer';

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export class PsychologicalFirstAidModal {
  private container: HTMLElement;
  private activeTab: 'breath' | 'grounding' | 'shock' = 'breath';
  private isBreathingActive = false;
  private breathPhase: BreathPhase = 'inhale';
  private breathSecondsLeft = 4;
  private breathInterval: number | null = null;
  private cycleCount = 0;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'psychological-first-aid-modal';
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
    this.stopBreathing();
    this.container.classList.add('hidden');
  }

  private startBreathing(): void {
    if (this.isBreathingActive) return;
    this.isBreathingActive = true;
    this.breathPhase = 'inhale';
    this.breathSecondsLeft = 4;
    this.cycleCount = 0;
    this.tickBreath();

    this.breathInterval = window.setInterval(() => {
      this.breathSecondsLeft -= 1;
      if (this.breathSecondsLeft <= 0) {
        this.nextPhase();
      }
      this.updateBreathUI();
    }, 1000);
  }

  private stopBreathing(): void {
    this.isBreathingActive = false;
    if (this.breathInterval) {
      clearInterval(this.breathInterval);
      this.breathInterval = null;
    }
    this.render();
  }

  private nextPhase(): void {
    this.breathSecondsLeft = 4;
    if (this.breathPhase === 'inhale') {
      this.breathPhase = 'hold1';
    } else if (this.breathPhase === 'hold1') {
      this.breathPhase = 'exhale';
    } else if (this.breathPhase === 'exhale') {
      this.breathPhase = 'hold2';
    } else {
      this.breathPhase = 'inhale';
      this.cycleCount += 1;
    }
    this.tickBreath();
  }

  private tickBreath(): void {
    try {
      soundSynthesizer.playCountdownBeep(440, 80);
    } catch {}
  }

  private getPhaseInfo(): { title: string; subtitle: string; scale: string; color: string } {
    switch (this.breathPhase) {
      case 'inhale':
        return {
          title: 'NEFES AL',
          subtitle: 'Burnundan derin ve yavaşça ciğerlerini doldur',
          scale: 'scale-125',
          color: 'from-cyan-500 to-blue-500'
        };
      case 'hold1':
        return {
          title: 'TUT',
          subtitle: 'Nefesi ciğerlerinde tut, sakinliğini hisset',
          scale: 'scale-125',
          color: 'from-amber-500 to-orange-500'
        };
      case 'exhale':
        return {
          title: 'NEFES VER',
          subtitle: 'Ağzından bir mum üfler gibi yavaşça boşalt',
          scale: 'scale-90',
          color: 'from-emerald-500 to-teal-500'
        };
      case 'hold2':
        return {
          title: 'BEKLE',
          subtitle: 'Ciğerlerin boş şekilde huzurla bekle',
          scale: 'scale-90',
          color: 'from-indigo-500 to-purple-500'
        };
    }
  }

  private updateBreathUI(): void {
    const info = this.getPhaseInfo();
    const circle = this.container.querySelector('#breath-circle') as HTMLElement | null;
    const title = this.container.querySelector('#breath-phase-title') as HTMLElement | null;
    const sub = this.container.querySelector('#breath-phase-sub') as HTMLElement | null;
    const sec = this.container.querySelector('#breath-seconds') as HTMLElement | null;
    const cycle = this.container.querySelector('#breath-cycles') as HTMLElement | null;

    if (circle) {
      circle.className = `w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr ${info.color} shadow-2xl flex flex-col items-center justify-center transition-all duration-1000 ${info.scale}`;
    }
    if (title) title.textContent = info.title;
    if (sub) sub.textContent = info.subtitle;
    if (sec) sec.textContent = `${this.breathSecondsLeft}`;
    if (cycle) cycle.textContent = `Döngü: ${this.cycleCount}`;
  }

  private render(): void {
    const info = this.getPhaseInfo();

    const tabsHtml = `
      <div class="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
        <button
          id="btn-tab-breath"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'breath' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🫁 4-4-4-4 Kutu Nefesi
        </button>
        <button
          id="btn-tab-grounding"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'grounding' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🌿 5-4-3-2-1 Zeminleme
        </button>
        <button
          id="btn-tab-shock"
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            this.activeTab === 'shock' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
          }"
        >
          🤝 Panik & Şok Yönetimi
        </button>
      </div>
    `;

    let bodyContent = '';

    if (this.activeTab === 'breath') {
      bodyContent = `
        <div class="flex flex-col items-center justify-center py-4 space-y-6">
          <!-- Animated Circle -->
          <div class="relative flex items-center justify-center p-8">
            <div
              id="breath-circle"
              class="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr ${info.color} shadow-2xl flex flex-col items-center justify-center transition-all duration-1000 ${
                this.isBreathingActive ? info.scale : 'scale-100'
              }"
            >
              <span id="breath-seconds" class="font-mono text-4xl sm:text-5xl font-black text-white drop-shadow-md">
                ${this.isBreathingActive ? this.breathSecondsLeft : '4'}
              </span>
              <span id="breath-phase-title" class="text-xs sm:text-sm font-bold tracking-widest text-white/90 uppercase mt-1">
                ${this.isBreathingActive ? info.title : 'HAZIR MISINIZ?'}
              </span>
            </div>
          </div>

          <div class="text-center space-y-1 max-w-sm px-4">
            <p id="breath-phase-sub" class="text-xs sm:text-sm text-gray-200 font-medium">
              ${this.isBreathingActive ? info.subtitle : 'Panik halindeyken otonom sinir sistemini yatıştırmak için Kutu Nefesini başlatın.'}
            </p>
            <div id="breath-cycles" class="text-[11px] font-mono text-cyan-400 font-bold">
              ${this.isBreathingActive ? `Döngü: ${this.cycleCount}` : 'Standart Protokol: 4 sn Al - 4 sn Tut - 4 sn Ver - 4 sn Bekle'}
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-3">
            ${
              !this.isBreathingActive
                ? `
              <button
                id="btn-start-breath"
                type="button"
                class="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
              >
                <span>Nefes Egzersizini Başlat</span>
              </button>
            `
                : `
              <button
                id="btn-stop-breath"
                type="button"
                class="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2"
              >
                <span>Durdur</span>
              </button>
            `
            }
          </div>
        </div>
      `;
    } else if (this.activeTab === 'grounding') {
      bodyContent = `
        <div class="space-y-3 text-xs">
          <div class="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-gray-300 space-y-1">
            <h4 class="font-bold text-emerald-300 text-sm">5-4-3-2-1 Duyusal Zeminleme (Grounding) Tekniği</h4>
            <p class="leading-relaxed">
              Zihniniz deprem anısına, korkuya veya panik atağa kilitlendiğinde beyninize <strong>"Şu an hayattayım ve buradayım"</strong> mesajı vermek için 5 duyunuzu sırayla kullanın:
            </p>
          </div>

          <div class="space-y-2">
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">5</span>
              <div>
                <strong class="text-white text-xs block">GÖRDÜĞÜNÜZ 5 ŞEYİ SAYIN</strong>
                <span class="text-gray-400 text-[11px]">Etrafınıza bakın; bir ayakkabı, bir taş parçası, ağaç yaprağı, gökyüzündeki bulut veya telefon ekranı.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <strong class="text-white text-xs block">DOKUNDUĞUNUZ 4 ŞEYİ HİSSEDİN</strong>
                <span class="text-gray-400 text-[11px]">Ayaklarınızın yere bastığı zemin, montunuzun kumaşı, ellerinizi birbirine sürtmek, bir su şişesinin soğukluğu.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong class="text-white text-xs block">DUYABİLDİĞİNİZ 3 SESİ FARK EDİN</strong>
                <span class="text-gray-400 text-[11px]">Uzak bir rüzgar sesi, kendi nefes alışınız, yanınızdaki bir insanın ayak sesi.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong class="text-white text-xs block">KOKLAYABİLDİĞİNİZ 2 KOKU</strong>
                <span class="text-gray-400 text-[11px]">Toprak kokusu, kıyafetinizin kokusu, kolonyalı mendil.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong class="text-white text-xs block">TADABİLDİĞİNİZ 1 TAT</strong>
                <span class="text-gray-400 text-[11px]">Ağzınızdaki bir yudum su veya dilinizin damağınıza dokunuşunu hissedin.</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      bodyContent = `
        <div class="space-y-3 text-xs text-gray-300 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-rose-500/[0.1] border border-rose-500/20 space-y-1.5">
            <h4 class="font-bold text-rose-300 text-sm flex items-center gap-1.5">
              ${Icons.alertTriangle('w-4 h-4')}
              <span>Şok ve Histeri Yaşayan Kazazedeye Nasıl Yaklaşılır?</span>
            </h4>
            <ul class="list-disc list-inside space-y-1.5 text-[11px] text-gray-200">
              <li><strong>Asla "Sakin Ol" veya "Korkma Geçti" Demeyin:</strong> Bu sözler çaresizlik hissini artırır. Bunun yerine <strong>"Şu an yanımdasın, güvendesin ve nefes alıyorsun"</strong> deyin.</li>
              <li><strong>İzin Almadan Dokunmayın:</strong> Şoktaki kazazedenin omzuna dokunmadan önce <em>"Elini tutabilir miyim?"</em> diye izin isteyin.</li>
              <li><strong>Somut ve Basit Sorular Sorun:</strong> <em>"Adın ne?", "Kaç yaşındasın?", "Bugün günlerden ne?"</em> gibi beynin mantık lobunu (prefrontal korteks) tetikleyen net sorular yöneltin.</li>
            </ul>
          </div>

          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <strong class="text-white text-sm block">Çocuklara Afet Anında Psikolojik Yaklaşım:</strong>
            <p class="text-[11px] text-gray-300 leading-relaxed">
              Çocukların yanında çaresizlik içeren konuşmalar yapmayın. Onların sorularına yalan söylemeden ancak korkutmadan cevap verin.
              Çocuğa basit görevler verin (Örn: <em>"Bu su şişesini çantada sen koru"</em>). Görev almak kontrol hissini geri kazandırır.
            </p>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              ${Icons.brain('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Psikolojik İlk Yardım & Kutu Nefesi</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">PANİK KONTROLÜ</span>
              </div>
              <p class="text-[11px] text-gray-400">Afet şoku, panik atak ve donakalma durumlarında otonom sinir sistemini sakinleştirme rehberi.</p>
            </div>
          </div>
          <button id="btn-close-psych-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
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

    q<HTMLButtonElement>('#btn-close-psych-modal')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-tab-breath')?.addEventListener('click', () => {
      this.activeTab = 'breath';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-grounding')?.addEventListener('click', () => {
      this.stopBreathing();
      this.activeTab = 'grounding';
      this.render();
    });

    q<HTMLButtonElement>('#btn-tab-shock')?.addEventListener('click', () => {
      this.stopBreathing();
      this.activeTab = 'shock';
      this.render();
    });

    q<HTMLButtonElement>('#btn-start-breath')?.addEventListener('click', () => {
      this.startBreathing();
      this.render();
    });

    q<HTMLButtonElement>('#btn-stop-breath')?.addEventListener('click', () => {
      this.stopBreathing();
    });
  }
}
