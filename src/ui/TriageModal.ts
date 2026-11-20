import { Icons } from './icons';
import { describeLocationForMessage } from '../utils/locationState';

/** Sohbet kanalına gönderim. Gönderilemediyse { sent: false } döner ya da hata fırlatır. */
export type BroadcastCallback = (text: string) => void | Promise<unknown>;

export type TriageCategory = 'green' | 'yellow' | 'red' | 'black';

interface TriageResult {
  category: TriageCategory;
  title: string;
  badge: string;
  bgClass: string;
  textClass: string;
  summary: string;
  directives: string[];
  immediateAction: string;
  /** Triyaj sonucu değil, genel yönlendirme: sohbet kanalına gönderilmez. */
  guidanceOnly?: boolean;
}

export class TriageModal {
  private container: HTMLElement;
  private currentStep = 0;
  private answers: Record<string, boolean> = {};
  private result: TriageResult | null = null;
  private onBroadcast?: BroadcastCallback;
  /** Uygulamadan gelen konum. Varsayılan bir şehir merkezi KULLANILMAZ. */
  private userCoords: [number, number] | null = null;

  constructor(parent: HTMLElement, onBroadcast?: BroadcastCallback) {
    this.container = document.createElement('div');
    this.container.id = 'triage-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);
    this.onBroadcast = onBroadcast;

    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public show(): void {
    this.reset();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private reset(): void {
    this.currentStep = 0;
    this.answers = {};
    this.result = null;
    this.render();
  }

  /** START yalnızca çok yaralılı durumda geçerlidir; tek yaralıda doğrudan yardım edilir. */
  private showSingleCasualtyGuidance(): void {
    this.result = {
      category: 'red',
      title: 'Triyaj gerekmiyor — yaralıya doğrudan yardım edin',
      badge: 'TEK YARALI',
      bgClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      textClass: 'text-cyan-200',
      summary:
        'Triyaj, yaralı sayısı yardım edebilecek kişi sayısından çok olduğunda öncelik belirlemek içindir. Tek yaralı varsa ya da herkese yardım edebiliyorsanız kimseyi sona bırakmayın.',
      immediateAction: '112\'yi arayın. Yaralı tepki vermiyor ve normal nefes almıyorsa hemen kalp masajına başlayın; sağlık ekibi gelene kadar bırakmayın.',
      directives: [
        'Şiddetli kanama varsa temiz bir bezle üzerine sıkıca bastırın.',
        'Bilinci kapalı ama nefes alıyorsa yan yatırın ve solunumunu izleyin.',
        'Boyun ya da omurga yaralanmasından şüpheleniyorsanız, tehlike yoksa yaralıyı hareket ettirmeyin.',
        'Yaralıyı sıcak tutun ve yalnız bırakmayın.'
      ],
      guidanceOnly: true
    };
    this.render();
  }

  private evaluateTriage(): void {
    // START Algorithm (Simple Triage and Rapid Treatment)
    // 1. Can walk? -> GREEN
    if (this.answers.canWalk) {
      this.result = {
        category: 'green',
        title: 'YEŞİL KOD — Hafif Yaralı (Ayakta Tedavi)',
        badge: 'ÖNCELİK 3 (DÜŞÜK)',
        bgClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        textClass: 'text-emerald-300',
        summary: 'Yaralı yürüyebiliyor, bilinci açık ve hayati tehlikesi bulunmuyor.',
        immediateAction: 'Yaralıyı güvenli toplanma alanına yönlendirin. Enerjinizi ağır yaralılara ayırın.',
        directives: [
          'Yaralıyı en yakın toplanma veya sahra ilk yardım noktasına sevk edin.',
          'Hipotermiye karşı sıcak tutun, sakinleştirin.',
          'Durumunun aniden kötüleşme ihtimaline karşı gözlem altında tutun.'
        ]
      };
      this.render();
      return;
    }

    // 2. Breathing?
    if (!this.answers.isBreathing) {
      if (!this.answers.airwayRecovery) {
        // Did not breathe even after opening airway -> BLACK
        this.result = {
          category: 'black',
          title: 'SİYAH KOD — Hava yolu açıldığı halde solunum yok',
          badge: 'YALNIZCA ÇOK YARALILI DURUMDA SONA BIRAKILIR',
          bgClass: 'bg-gray-800/60 border-gray-700 text-gray-400',
          textClass: 'text-gray-300',
          summary: 'Hava yolu açılmasına rağmen spontan solunum ve yaşam belirtisi yok.',
          immediateAction: 'Bu kural yalnızca çok sayıda ağır yaralı varken ve yardım yetersizken geçerlidir: o durumda yaşama şansı olan diğer yaralılara geçin. Tek yaralı varsa ya da bekleyen başka ağır yaralı yoksa 112\'yi arayın ve kalp masajına başlayın.',
          directives: [
            'Bu sonuç bir ölüm tespiti değildir; ölüm kararını yalnızca sağlık ekibi verir.',
            'Bekleyen başka ağır yaralı kalmadığında bu yaralıya dönün ve kalp masajına başlayın.',
            'Yaralının yerini not alın ve gelen sağlık ekibine bildirin.'
          ]
        };
        this.render();
        return;
      } else {
        // Airway opened and began breathing -> RED
        this.result = {
          category: 'red',
          title: 'KIRMIZI KOD — Acil Müdahale (Hayati Tehlike)',
          badge: 'ÖNCELİK 1 (EN ACİL)',
          bgClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          textClass: 'text-rose-300',
          summary: 'Hava yolu manevrasıyla solunum döndü ancak stabil değil.',
          immediateAction: 'Hava yolunu açık tutun (Koma/İyileşme pozisyonu) ve hemen 112\'yi arayın.',
          directives: [
            'Hastayı yan yatırarak (Koma pozisyonu) dilin arkaya kaçmasını önleyin.',
            'Solunumu sürekli takip edin, boyun travması şüphesi varsa başı sabitleyin.',
            'İlk ambulans/sahra helikopteri ile derhal sevk edilmelidir.'
          ]
        };
        this.render();
        return;
      }
    }

    // 3. Respiratory Rate > 30/min? -> RED
    if (this.answers.rapidBreathing) {
      this.result = {
        category: 'red',
        title: 'KIRMIZI KOD — Acil Solunum Yetmezliği',
        badge: 'ÖNCELİK 1 (EN ACİL)',
        bgClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        textClass: 'text-rose-300',
        summary: 'Dakikadaki solunum sayısı 30\'un üzerinde veya ağır hırıltılı.',
        immediateAction: 'Göğüs kafesi kontrolü yapın, göğüste delik varsa tek taraflı valf ile kapatın.',
        directives: [
          'Yaralıyı yarı oturur pozisyona getirin.',
          'Göğüs travması (tansiyon pnömotoraks) açısından gözlemleyin.',
          'Hızlı solunum iç kanama veya akciğer hasarı belirtisidir, öncelikli sevktir.'
        ]
      };
      this.render();
      return;
    }

    // 4. Radial Pulse absent OR severe bleeding? -> RED
    if (!this.answers.hasPulse || this.answers.severeBleeding) {
      this.result = {
        category: 'red',
        title: 'KIRMIZI KOD — Ağır Şok & Masif Kanama',
        badge: 'ÖNCELİK 1 (EN ACİL)',
        bgClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        textClass: 'text-rose-300',
        summary: 'Bilekten radyal nabız zayıf/yok veya fışkıran kontrolsüz kanama var.',
        immediateAction: 'Kanamalı uzva hemen TURNİKE uygulayın ve üzerine saati yazın (Örn: T: 14:35).',
        directives: [
          'Fışkıran kanamalarda yaranın 5-7 cm yukarısına kemik üzerine sıkı turnike bağlayın.',
          'Alnına veya turnike bandına mutlaka takıldığı tam saati yazın.',
          'Şok pozisyonu verin (bacakları 30 cm yukarı kaldırın), sıcak tutun.'
        ]
      };
      this.render();
      return;
    }

    // 5. Follows commands? -> No: RED, Yes: YELLOW
    if (!this.answers.followsCommands) {
      this.result = {
        category: 'red',
        title: 'KIRMIZI KOD — Ağır Kafa Travması & Bilinç Kaybı',
        badge: 'ÖNCELİK 1 (EN ACİL)',
        bgClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        textClass: 'text-rose-300',
        summary: 'Solunum ve dolaşım var ancak yaralı basit komutlara yanıt veremiyor (Gözü açmıyor / eli sıkmıyor).',
        immediateAction: 'Boyunluk uygulayın veya boynu kıpırdatmayın, hava yolunu koruyun.',
        directives: [
          'Kafa içi basınç artışı veya beyin kanaması şüphesi.',
          'Kusma riskine karşı baş-boyun eksenini bozmadan dikkatle pozisyonlayın.',
          'Acil tomografi ve nöroşirürji müdahalesi için en öncelikli gruptur.'
        ]
      };
    } else {
      this.result = {
        category: 'yellow',
        title: 'SARI KOD — Gecikebilir Tedavi (Stabil Yaralı)',
        badge: 'ÖNCELİK 2 (ORTA)',
        bgClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        textClass: 'text-amber-300',
        summary: 'Yaralı yürüyemiyor ancak solunumu stabil, radyal nabzı var ve bilinci açık.',
        immediateAction: 'Kırıkları atelle sabitleyin, yaraları temiz bezle kapatın, 1-2 saat gözlemde bekleyebilir.',
        directives: [
          'Kırık veya ezilme olan uzuvları mukavva/tahta ile hareketsiz hale getirin.',
          'Ezilme sendromuna (Crush) karşı idrar rengini ve sıvı alımını takip edin.',
          'Kırmızı kodlu acil yaralılar sevk edildikten sonra ikinci sırada nakledilir.'
        ]
      };
    }
    this.render();
  }

  private render(): void {
    if (this.result) {
      this.renderResult();
      return;
    }

    const steps: Array<{
      id: string;
      title: string;
      desc: string;
      yesLabel: string;
      noLabel: string;
      condition?: () => boolean;
    }> = [
      {
        id: 'massCasualty',
        title: 'Önce: Birden fazla ağır yaralı var ve yardım yetersiz mi?',
        desc: 'Triyaj (öncelik sıralaması) yalnızca yaralı sayısı yardım edebilecek kişi sayısından çok olduğunda yapılır. Tek yaralı varsa ya da herkese yardım edebiliyorsanız triyaj yapmayın.',
        yesLabel: 'Evet, çok yaralı var — sıralama gerekli',
        noLabel: 'Hayır, tek yaralı / herkese yetişebiliyorum'
      },
      {
        id: 'canWalk',
        title: '1. Adım: Yaralı Yürüyebiliyor mu?',
        desc: 'Yaralı kendi başına ayağa kalkıp yürüyebiliyor veya komutla güvenli alana geçebiliyor mu?',
        yesLabel: 'Evet, Yürüyebiliyor (Yeşil Kod)',
        noLabel: 'Hayır, Yürüyemiyor / Yerde'
      },
      {
        id: 'isBreathing',
        title: '2. Adım: Spontan Solunum Var mı?',
        desc: 'Göğüs kafesi inip kalkıyor mu? Ağız ve burundan hava akışı hissediliyor mu?',
        yesLabel: 'Evet, Nefes Alıyor',
        noLabel: 'Hayır, Nefes Almıyor'
      },
      {
        id: 'airwayRecovery',
        condition: () => this.answers.isBreathing === false,
        title: 'Hava Yolunu Açın: Baş Geri - Çene Yukarı',
        desc: 'Yaralının çenesini yukarı kaldırıp hava yolunu açtığınızda solunum başladı mı?',
        yesLabel: 'Evet, Solunum Başladı (Kırmızı)',
        noLabel: 'Hayır, Hala Nefes Almıyor (Siyah)'
      },
      {
        id: 'rapidBreathing',
        condition: () => this.answers.isBreathing === true,
        title: '3. Adım: Solunum Hızı Dakikada 30\'un Üzerinde mi?',
        desc: 'Soluk alıp verme çok mu hızlı, kesik veya nefes almakta şiddetli zorlanıyor mu?',
        yesLabel: 'Evet, Hızlı / Zorlanıyor (>30/dk)',
        noLabel: 'Hayır, Solunum Normal (<30/dk)'
      },
      {
        id: 'hasPulse',
        condition: () => this.answers.isBreathing === true && !this.answers.rapidBreathing,
        title: '4. Adım: Bilekten Radyal Nabız Alınıyor mu?',
        desc: 'Yaralının el bileğinde (başparmak hizasında) nabız hissediliyor mu veya durdurulamayan masif fışkıran kanama var mı?',
        yesLabel: 'Evet, Nabız Alınıyor & Kanama Yok',
        noLabel: 'Hayır, Nabız Yok / Masif Fışkıran Kanama'
      },
      {
        id: 'followsCommands',
        condition: () =>
          this.answers.isBreathing === true &&
          !this.answers.rapidBreathing &&
          this.answers.hasPulse === true,
        title: '5. Adım: Basit Komutları Yerine Getiriyor mu?',
        desc: '"Gözünüzü açın", "Elimi sıkın" gibi basit komutlara tepki veriyor mu? Bilinci açık mı?',
        yesLabel: 'Evet, Komutları Anlıyor & Yanıtlıyor',
        noLabel: 'Hayır, Tepki Vermiyor / Bilinci Kapalı'
      }
    ];

    // Find current active step based on conditions
    let activeStepIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (s.condition && !s.condition()) continue;
      if (this.answers[s.id] === undefined) {
        activeStepIndex = i;
        break;
      }
    }

    const current = steps[activeStepIndex];

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              ${Icons.health('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Afet Triyaj Asistanı (START Protokolü)
              </h3>
              <p class="text-[11px] text-gray-400">
                START hızlı triyaj algoritması — eğitimli personel içindir, tıbbi tanı değildir
              </p>
            </div>
          </div>

          <button id="btn-close-triage" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Question Card -->
        <div class="my-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
              15 Saniye Hızlı Karar
            </span>
          </div>

          <h4 class="text-base font-bold text-white leading-snug">
            ${current.title}
          </h4>
          <p class="text-xs text-gray-300 leading-relaxed">
            ${current.desc}
          </p>
        </div>

        <!-- Yes / No Big Choice Buttons -->
        <div class="space-y-2.5 mb-4">
          <button
            id="btn-triage-yes"
            type="button"
            class="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-black text-sm active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            ✓ ${current.yesLabel}
          </button>
          <button
            id="btn-triage-no"
            type="button"
            class="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            ✕ ${current.noLabel}
          </button>
        </div>

        <!-- Protocol Disclaimer -->
        <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
          ⚠️ <strong>Yalnızca çok yaralılı durumda:</strong> Sıralama yaparken tek bir yaralıya 60 saniyeden fazla zaman ayırmayın. Tek yaralı varsa triyaj yapmayın; 112'yi arayın ve yardım edin.
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-triage')?.addEventListener('click', () => this.hide());

    this.container.querySelector('#btn-triage-yes')?.addEventListener('click', () => {
      this.answers[current.id] = true;
      this.checkNext();
    });

    this.container.querySelector('#btn-triage-no')?.addEventListener('click', () => {
      this.answers[current.id] = false;
      this.checkNext();
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }

  private checkNext(): void {
    if (this.answers.massCasualty === false) {
      this.showSingleCasualtyGuidance();
      return;
    }
    if (this.answers.canWalk !== undefined) {
      if (this.answers.canWalk) {
        this.evaluateTriage();
        return;
      }
    }
    if (this.answers.isBreathing !== undefined) {
      if (this.answers.isBreathing === false && this.answers.airwayRecovery !== undefined) {
        this.evaluateTriage();
        return;
      }
    }
    if (this.answers.rapidBreathing !== undefined && this.answers.rapidBreathing === true) {
      this.evaluateTriage();
      return;
    }
    if (this.answers.hasPulse !== undefined && this.answers.hasPulse === false) {
      this.evaluateTriage();
      return;
    }
    if (this.answers.followsCommands !== undefined) {
      this.evaluateTriage();
      return;
    }

    this.render();
  }

  private renderResult(): void {
    if (!this.result) return;
    const res = this.result;

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase ${res.bgClass}">
              ${res.badge}
            </span>
          </div>

          <button id="btn-close-triage-res" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Result Card -->
        <div class="p-4 rounded-xl border ${res.bgClass} mb-4">
          <h3 class="text-lg font-black tracking-wide mb-1 ${res.textClass}">
            ${res.title}
          </h3>
          <p class="text-xs text-gray-200 leading-relaxed font-normal">
            ${res.summary}
          </p>
        </div>

        <!-- Immediate Directive -->
        <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 mb-4 text-xs font-semibold leading-relaxed">
          ⚡ <strong>${res.guidanceOnly ? 'ŞİMDİ YAPIN:' : 'İLK YAPILACAK:'}</strong><br/>
          ${res.immediateAction}
        </div>

        <!-- Step Guidelines -->
        <div class="space-y-1.5 mb-4 text-xs text-gray-300">
          ${res.directives.map((d) => `<div class="flex items-start gap-2"><span>•</span><span>${d}</span></div>`).join('')}
        </div>

        <!-- Action Buttons -->
        <div id="triage-broadcast-status" class="hidden text-[11px] font-semibold leading-snug mb-2"></div>
        <div class="flex items-center gap-2 pt-2 border-t border-white/10">
          ${
            res.guidanceOnly
              ? `
          <a
            href="tel:112"
            class="flex-1 py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            📞 112'yi Ara
          </a>`
              : `
          <button
            id="btn-triage-broadcast"
            type="button"
            class="flex-1 py-3 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            title="Triyaj notunu sohbet kanalına yazar. 112'ye iletilmez."
          >
            📡 Sohbet Kanalına Yaz
          </button>`
          }
          <button
            id="btn-triage-restart"
            type="button"
            class="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all"
          >
            Yeniden Başlat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-triage-res')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-triage-restart')?.addEventListener('click', () => this.reset());

    const broadcastBtn = this.container.querySelector<HTMLButtonElement>('#btn-triage-broadcast');
    broadcastBtn?.addEventListener('click', async () => {
      // Gerçek konum ölçümü yoksa koordinat yazılmaz (varsayılan şehir merkezi asla gönderilmez).
      const locationLine = this.userCoords
        ? describeLocationForMessage(this.userCoords)
        : 'Konum alınamadı — adresimi ayrıca yazıyorum:';
      const text = `🚨 TRİYAJ NOTU: [${res.title}] - ${locationLine}`;

      if (!this.onBroadcast) {
        navigator.clipboard?.writeText(text);
        alert("Triyaj notu panoya kopyalandı. 112'ye iletilmez; ayrıca 112'yi arayın.");
        return;
      }

      // Gönderimin sonucu bilinmeden "gönderildi" deme.
      let sent = true;
      broadcastBtn.disabled = true;
      try {
        const result = await Promise.resolve(this.onBroadcast(text));
        if (result && typeof result === 'object' && (result as { sent?: unknown }).sent === false) {
          sent = false;
        }
      } catch {
        sent = false;
      }
      broadcastBtn.disabled = false;

      const statusEl = this.container.querySelector('#triage-broadcast-status');
      if (statusEl) {
        statusEl.className = `text-[11px] font-semibold leading-snug mb-2 ${sent ? 'text-cyan-300' : 'text-rose-300'}`;
        statusEl.textContent = sent
          ? "Sohbet kanalına gönderildi (112'ye iletilmez — ayrıca 112'yi arayın)"
          : "İnternet yok — gönderilemedi. 112'yi arayın.";
      }
      if (sent) window.setTimeout(() => this.hide(), 2500);
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
