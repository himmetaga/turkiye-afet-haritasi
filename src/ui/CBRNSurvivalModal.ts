import { Icons } from './icons';
import { civilDefenseProtocols } from '../services/civilDefenseProtocols';

type CardinalDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

interface DirectionOption {
  key: CardinalDir;
  label: string;
  deg: number;
}

const DIRECTIONS: DirectionOption[] = [
  { key: 'N', label: 'Kuzey (Yıldız)', deg: 0 },
  { key: 'NE', label: 'Kuzeydoğu (Poyraz)', deg: 45 },
  { key: 'E', label: 'Doğu (Gündoğusu)', deg: 90 },
  { key: 'SE', label: 'Güneydoğu (Keşişleme)', deg: 135 },
  { key: 'S', label: 'Güney (Kıble)', deg: 180 },
  { key: 'SW', label: 'Güneybatı (Lodos)', deg: 225 },
  { key: 'W', label: 'Batı (Günbatısı)', deg: 270 },
  { key: 'NW', label: 'Kuzeybatı (Karayel)', deg: 315 }
];

interface GasHazardProfile {
  name: string;
  code: string;
  density: 'heavy' | 'light' | 'particulate';
  densityText: string;
  odorVisual: string;
  behavior: string;
  escapeRule: string;
  fieldRemedy: string;
}

const GAS_HAZARDS: GasHazardProfile[] = [
  {
    name: 'Klor Gazı (Chlorine)',
    code: 'Cl₂ · CAS 7782-50-5',
    density: 'heavy',
    densityText: 'Havadan 2.5 kat AĞIR',
    odorVisual: 'Sarı-yeşil duman, keskin çamaşır suyu kokusu',
    behavior: 'Zemin seviyesinde, çukurlarda, bodrum katlarda ve metro kanallarında birikir.',
    escapeRule: 'ASLA bodruma inmeyin! Binanın en üst katına veya yüksek tepeye tırmanın.',
    fieldRemedy: 'Karbonatlı veya hafif sirkeli/nemli bezle ağız ve burnu kapatın.'
  },
  {
    name: 'Amonyak (Ammonia)',
    code: 'NH₃ · CAS 7664-41-7',
    density: 'light',
    densityText: 'Havadan %40 HAFİF',
    odorVisual: 'Renksiz, genzi yakan çok keskin idrar kokusu',
    behavior: 'Gökyüzüne hızla yükselir, havadaki nemle birleşip kimyasal bulut oluşturur.',
    escapeRule: 'Yere yakın çömelerek veya hafif eğilerek kaçın, yüksek katlardan inin.',
    fieldRemedy: 'Gözleri bol temiz suyla yıkayın, kuru kumaş yerine ıslak bezle soluyun.'
  },
  {
    name: 'Karbonmonoksit & Yangın Dumanı',
    code: 'CO + Toksik İs & Siyanür',
    density: 'light',
    densityText: 'Sıcak duman tavan seviyesinde toplanır',
    odorVisual: 'Yoğun siyah/gri duman, plastik ve kimyasal yanık kokusu',
    behavior: 'Yangınlarda en çok can kaybı alevden değil, yükselen duman solunmasından olur.',
    escapeRule: 'Zeminden 10-15 cm yukarıda temiz hava cebi kalır; sürünerek tahliye olun.',
    fieldRemedy: 'Nemli pamuklu bez solunum direncini korur; ağzı yere yaklaştırın.'
  },
  {
    name: 'Radyoaktif Serpinti (Fallout)',
    code: 'Cs-137, I-131, Sr-90',
    density: 'particulate',
    densityText: 'Mikroskobik radyoaktif toz partikülleri',
    odorVisual: 'Gözle görülmez, kokusuz (iyonize edici gama/beta ışını)',
    behavior: 'Rüzgarla yüzlerce kilometre yayılır, çatılarda, toprakta ve giysilerde birikir.',
    escapeRule: 'Kalın beton veya toprak sığınak; ilk 48 saat kesinlikle dışarı çıkmayın.',
    fieldRemedy: 'FFP3 maske, kapı/pencere koli bandıyla izolasyon, KI tableti (tiroid koruması).'
  }
];

export class CBRNSurvivalModal {
  private container: HTMLElement;
  private selectedWindDir: CardinalDir = 'NE'; // Poyraz dominant in Turkey
  private selectedHazardDir: CardinalDir = 'N';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'cbrn-survival-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  /**
   * Calculates downwind and 90-degree crosswind escape corridors.
   * If wind is blowing FROM direction W_deg, the plume blows TOWARDS (W_deg + 180) % 360.
   * The 90-degree perpendicular escape corridors are (PlumeDir + 90) and (PlumeDir - 90).
   */
  private calculatePlumeVectors(): {
    windFromDeg: number;
    plumeBlowsToDeg: number;
    escapeLeftDeg: number;
    escapeRightDeg: number;
    escapeLeftLabel: string;
    escapeRightLabel: string;
    dangerConeLabel: string;
  } {
    const windOpt = DIRECTIONS.find((d) => d.key === this.selectedWindDir) || DIRECTIONS[1];
    const windFromDeg = windOpt.deg;
    const plumeBlowsToDeg = (windFromDeg + 180) % 360;

    const escapeLeftDeg = (plumeBlowsToDeg + 90) % 360;
    const escapeRightDeg = (plumeBlowsToDeg + 270) % 360;

    const getCardinalLabel = (deg: number): string => {
      const idx = Math.round(deg / 45) % 8;
      return DIRECTIONS[idx].label;
    };

    return {
      windFromDeg,
      plumeBlowsToDeg,
      escapeLeftDeg,
      escapeRightDeg,
      escapeLeftLabel: getCardinalLabel(escapeLeftDeg),
      escapeRightLabel: getCardinalLabel(escapeRightDeg),
      dangerConeLabel: getCardinalLabel(plumeBlowsToDeg)
    };
  }

  private render(): void {
    const protocols = civilDefenseProtocols.getCBRNProtocols();
    const plume = this.calculatePlumeVectors();

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
              ☢️
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">KBRN, Toksik Gaz & Serpinti Sığınağı</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  CIVIL DEFENSE
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Rüzgar altı plüm kaçışı, kimyasal ajan davranışı ve sığınak yalıtımı</p>
            </div>
          </div>
          <button id="btn-close-cbrn" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body Content -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs pr-1">
          <!-- 3 Golden Rules Alert -->
          <div class="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 space-y-1">
            <span class="font-bold block text-xs">⚠️ 3 Altın Kural: ZAMAN · MESAFE · ZIRH</span>
            <p class="text-[10.5px] text-gray-300 leading-relaxed">
              Kimyasal veya radyoaktif serpintide en ölümcül hata rüzgar altına (dumanın aktığı yöne) doğru koşmaktır.
              Kurtuluş kuralı: <strong>Rüzgar eksenine 90° dik (çapraz) kaçış</strong> yaparak toksik koridordan en kısa sürede çıkmaktır!
            </p>
          </div>

          <!-- Interactive Plume Vector & Crosswind Escape Calculator -->
          <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>🧭 Rüzgar Altı Gaz Yayılım & Çapraz Kaçış Hesaplayıcı</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-gray-300 font-mono">
                90° Crosswind
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[10.5px] text-gray-400 mb-1 font-bold">Rüzgar Hangi Yönden Esiyor?</label>
                <select id="cbrn-wind-select" class="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-yellow-500/50">
                  ${DIRECTIONS.map(
                    (d) =>
                      `<option value="${d.key}" ${d.key === this.selectedWindDir ? 'selected' : ''}>${d.label} (${d.deg}°)</option>`
                  ).join('')}
                </select>
              </div>

              <div>
                <label class="block text-[10.5px] text-gray-400 mb-1 font-bold">Zehirli Gaz / Duman Kaynağı Nerede?</label>
                <select id="cbrn-hazard-select" class="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-yellow-500/50">
                  ${DIRECTIONS.map(
                    (d) =>
                      `<option value="${d.key}" ${d.key === this.selectedHazardDir ? 'selected' : ''}>${d.label} Tarafımda</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <!-- Plume Vector Direction Card -->
            <div class="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-rose-400 font-bold flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  ÖLÜMCÜL RÜZGAR ALTI ALAN:
                </span>
                <span class="text-rose-300 font-mono font-bold">${plume.dangerConeLabel} (${plume.plumeBlowsToDeg}°)</span>
              </div>
              <p class="text-[10px] text-rose-300/80 leading-tight">
                Gaz ve kimyasal bulut bu doğrultuda 40° genişleyen koni şeklinde akar. Bu yöne asla koşmayın!
              </p>

              <div class="pt-2 border-t border-white/10">
                <div class="text-emerald-400 font-bold text-[11px] mb-1">
                  ✅ HAYATTA KALMA KAÇIŞ YÖNLERİ (90° DİK ÇAPRAZ HATLARI):
                </div>
                <div class="grid grid-cols-2 gap-2 text-center text-[10.5px]">
                  <div class="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                    <span class="block text-[9px] text-emerald-400/80 uppercase">1. Kaçış Koridoru</span>
                    <strong class="text-xs text-white">${plume.escapeLeftLabel}</strong>
                    <span class="block text-[9.5px] font-mono text-emerald-300 mt-0.5">${plume.escapeLeftDeg}°</span>
                  </div>
                  <div class="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                    <span class="block text-[9px] text-emerald-400/80 uppercase">2. Kaçış Koridoru</span>
                    <strong class="text-xs text-white">${plume.escapeRightLabel}</strong>
                    <span class="block text-[9.5px] font-mono text-emerald-300 mt-0.5">${plume.escapeRightDeg}°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Toxic Agents & Behaviors Comparison Grid -->
          <div class="space-y-2.5">
            <span class="font-bold text-white text-xs block">☣️ Tehlikeli Kimyasal Maddeler & Sahra Kaçış Kuralları:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${GAS_HAZARDS.map(
                (g) => `
                <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <strong class="text-white text-xs">${g.name}</strong>
                    <span class="text-[9.5px] px-2 py-0.5 rounded-md font-mono ${
                      g.density === 'heavy'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : g.density === 'light'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }">
                      ${g.densityText}
                    </span>
                  </div>
                  <div class="text-[10px] text-gray-400">${g.code} • ${g.odorVisual}</div>
                  <div class="text-[10.5px] text-gray-300 leading-snug">
                    <strong class="text-amber-400">Kaçış:</strong> ${g.escapeRule}
                  </div>
                  <div class="text-[10px] text-emerald-300/90 bg-black/30 p-1.5 rounded-lg">
                    💡 <strong>Sahra Önlemi:</strong> ${g.fieldRemedy}
                  </div>
                </div>
              `
              ).join('')}
            </div>
          </div>

          <!-- Section 1: Shelter In Place -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-white block">🏠 1. Ev İçi Sığınak Hazırlığı (Shelter-in-Place):</span>
            ${protocols.shelterInPlaceRules
              .map((rule) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${rule}</p>`)
              .join('')}
          </div>

          <!-- Section 2: Potassium Iodide (KI) Dosage -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-white block">💊 2. Potasyum İyodür (KI) Dozaj Tablosu:</span>
            ${protocols.potassiumIodideDosage
              .map((dose) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${dose}</p>`)
              .join('')}
          </div>

          <!-- Section 3: Decontamination -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-white block">🧼 3. Arındırma & Dekontaminasyon Adımları:</span>
            ${protocols.decontaminationSteps
              .map((step) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${step}</p>`)
              .join('')}
          </div>

          <!-- AFAD Siren Codes -->
          <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <span class="font-bold text-white block">📢 AFAD Resmi KBRN İkaz & Siren Kodları:</span>
            <div class="space-y-1.5 text-[10.5px] text-gray-300">
              <div><strong class="text-yellow-400">Sarı İkaz (Saldırı/Tehlike İhtimali):</strong> 3 dakika süreli sürekli düz siren sesi.</div>
              <div><strong class="text-rose-400">Kırmızı İkaz (Doğrudan Tehlike):</strong> 3 dakika süreli yükselip alçalan dalgalı siren sesi.</div>
              <div><strong class="text-purple-400">Radyoaktif / Kimyasal Tehdit:</strong> Kesik kesik siren sesi veya cankurtaran kornası (Sığınağa girin!).</div>
              <div><strong class="text-emerald-400">Beyaz İkaz (Tehlike Geçti):</strong> Kesintisiz düz siren veya radyo duyurusu.</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3.5 bg-black/40 border-t border-white/10 text-[10.5px] text-gray-400 text-center shrink-0">
          💡 Resmi sivil savunma sirenleri ve AFAD anonsları gelmeden sığınağı asla terk etmeyiniz.
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-cbrn')?.addEventListener('click', () => this.hide());

    const windSelect = this.container.querySelector('#cbrn-wind-select') as HTMLSelectElement;
    windSelect?.addEventListener('change', (e) => {
      this.selectedWindDir = (e.target as HTMLSelectElement).value as CardinalDir;
      this.render();
    });

    const hazardSelect = this.container.querySelector('#cbrn-hazard-select') as HTMLSelectElement;
    hazardSelect?.addEventListener('change', (e) => {
      this.selectedHazardDir = (e.target as HTMLSelectElement).value as CardinalDir;
      this.render();
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
