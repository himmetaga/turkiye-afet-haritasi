import { Icons } from './icons';
import { AssemblyPoint } from '../types';
import { haversineDistanceMeters, findNearestAssemblyPoints } from '../utils/geoMath';

export class TsunamiRadarModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private assemblyPoints: AssemblyPoint[] = [];
  private onNavigateToPoint?: (point: AssemblyPoint) => void;

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    assemblyPoints: AssemblyPoint[] = [],
    onNavigateToPoint?: (point: AssemblyPoint) => void
  ) {
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;
    this.onNavigateToPoint = onNavigateToPoint;

    this.container = document.createElement('div');
    this.container.id = 'tsunami-radar-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public setAssemblyPoints(points: AssemblyPoint[]): void {
    this.assemblyPoints = points;
  }

  public show(): void {
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private isNearSea(): boolean {
    const [lng, lat] = this.userCoords;
    // Approximated coastal zones in Turkey: Marmara, Aegean, Black Sea, Mediterranean
    // Marmara: lat 40.5 - 41.2, lng 26.5 - 30.0
    // Aegean: lat 36.5 - 40.2, lng 26.0 - 28.5
    // Mediterranean: lat 36.0 - 37.0, lng 28.5 - 36.5
    // Black sea: lat 41.0 - 42.2, lng 28.0 - 41.8
    const inMarmara = lat >= 40.5 && lat <= 41.2 && lng >= 26.5 && lng <= 30.0;
    const inAegean = lat >= 36.5 && lat <= 40.2 && lng >= 26.0 && lng <= 28.5;
    const inMed = lat >= 36.0 && lat <= 37.0 && lng >= 28.5 && lng <= 36.5;
    const inBlack = lat >= 41.0 && lat <= 42.2 && lng >= 28.0 && lng <= 41.8;
    return inMarmara || inAegean || inMed || inBlack;
  }

  private render(): void {
    const nearSea = this.isNearSea();
    const nearestAssemblies =
      this.assemblyPoints.length > 0
        ? findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1)
        : [];
    const nearestSafePoint = nearestAssemblies[0]?.point;
    const distanceMeters = nearestSafePoint
      ? Math.round(haversineDistanceMeters(this.userCoords, nearestSafePoint.coordinates))
      : 450;

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              ${Icons.waves('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Tsunami Erken Uyarı & Kıyı Tahliye Radarı
              </h3>
              <p class="text-[11px] text-gray-400">
                Kandilli Rasathanesi & ODTÜ Tsunami Protokolü (Marmara, Ege, Akdeniz)
              </p>
            </div>
          </div>

          <button id="btn-close-tsunami" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Coast Status Banner -->
        <div class="p-4 rounded-xl border ${
          nearSea
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        } mb-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-wider opacity-85">Kıyı Konum Değerlendirmesi</div>
            <div class="text-lg font-black mt-0.5 text-white">
              ${nearSea ? '🌊 Kıyı Şeridi / Tsunami Etki Alanı' : '🏔️ İç Bölge / Tsunami Riski Düşük'}
            </div>
            <div class="text-[11px] opacity-80 mt-0.5">
              ${nearSea ? 'Marmara/Ege kıyısında sığ deniz depremlerinde dalga riski mevcuttur.' : 'Deniz kıyısından uzakta güvenli rakımdasınız.'}
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
            nearSea ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
          }">
            ${nearSea ? 'DİKKAT' : 'GÜVENLİ'}
          </span>
        </div>

        <!-- Gold Rules Box (500m & +15m) -->
        <div class="grid grid-cols-2 gap-2.5 mb-4">
          <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
            <div class="text-[10px] text-gray-400 font-semibold uppercase">1. Altın Kural</div>
            <div class="text-lg font-black text-cyan-300 mt-0.5">500 Metre</div>
            <div class="text-[10px] text-gray-300 mt-0.5">Kıyı çizgisinden derhal iç kesimlere uzaklaşın</div>
          </div>
          <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
            <div class="text-[10px] text-gray-400 font-semibold uppercase">2. Altın Kural</div>
            <div class="text-lg font-black text-emerald-300 mt-0.5">+15 Metre</div>
            <div class="text-[10px] text-gray-300 mt-0.5">Doğal tepe veya yüksek sağlam zemine tırmanın</div>
          </div>
        </div>

        <!-- Warning Signs & Protocols -->
        <div class="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-2 mb-4 text-xs text-gray-300">
          <div class="text-rose-400 font-bold flex items-center gap-1.5">
            <span>🚨 Hayati Tsunami Belirtileri & Direktifleri:</span>
          </div>
          <div class="flex items-start gap-2 leading-relaxed">
            <span class="text-blue-400 font-bold">•</span>
            <span><strong>Deniz Çekilmesi:</strong> Deniz suyu aniden kıyıdan onlarca metre çekilirse veya dipteki taşlar görünürse, <strong>5-10 dakika içinde dev dalgalar gelecek demektir</strong>. Asla balık toplamaya veya fotoğraf çekmeye gitmeyin!</span>
          </div>
          <div class="flex items-start gap-2 leading-relaxed">
            <span class="text-blue-400 font-bold">•</span>
            <span><strong>İlk Dalga Kuralı:</strong> Tsunami tek bir dalga değildir. İlk dalga genellikle en büyüğü değildir; sonraki dalgalar <strong>12-24 saat</strong> boyunca daha yıkıcı güçle gelmeye devam edebilir.</span>
          </div>
          <div class="flex items-start gap-2 leading-relaxed">
            <span class="text-blue-400 font-bold">•</span>
            <span><strong>Liman ve Tekneler:</strong> Asla marinada veya teknelerde kalmayın. Akıntı tonlarca ağırlıktaki tekneleri karadaki binaların üzerine fırlatabilir.</span>
          </div>
        </div>

        <!-- Nearest Safe High Ground Point -->
        ${
          nearestSafePoint
            ? `
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs mb-4 flex items-center justify-between">
            <div>
              <div class="font-bold text-white text-xs truncate max-w-[260px]">${nearestSafePoint.name}</div>
              <div class="text-[10.5px] text-emerald-300/80 mt-0.5">En Yakın Güvenli Toplanma Noktası • ~${distanceMeters} metre</div>
            </div>
            <button
              id="btn-navigate-high-ground"
              type="button"
              class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold text-xs active:scale-95 transition-all"
            >
              Rota Çiz
            </button>
          </div>
        `
            : ''
        }

        <!-- Bottom Controls -->
        <div class="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            id="btn-close-tsunami-bottom"
            type="button"
            class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-tsunami')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-close-tsunami-bottom')?.addEventListener('click', () => this.hide());

    this.container.querySelector('#btn-navigate-high-ground')?.addEventListener('click', () => {
      if (nearestSafePoint && this.onNavigateToPoint) {
        this.hide();
        this.onNavigateToPoint(nearestSafePoint);
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
