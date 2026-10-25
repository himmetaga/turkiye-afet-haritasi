import { Icons } from './icons';
import { advancedHardwareService } from '../services/advancedHardwareService';

export class TacticalCompassModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private targetCoords: [number, number] | null = null;
  private targetName = 'En Yakın Toplanma Alanı';
  private compassInterval: any = null;

  constructor(parent: HTMLElement, userCoords: [number, number]) {
    this.userCoords = userCoords;
    this.container = document.createElement('div');
    this.container.id = 'tactical-compass-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setCoords(user: [number, number], target?: [number, number], name?: string): void {
    this.userCoords = user;
    if (target) this.targetCoords = target;
    if (name) this.targetName = name;
  }

  public show(target?: [number, number], name?: string): void {
    if (target) this.targetCoords = target;
    if (name) this.targetName = name;
    this.container.classList.remove('hidden');
    this.render();
    this.startCompassLoop();
  }

  public hide(): void {
    this.stopCompassLoop();
    this.container.classList.add('hidden');
  }

  private startCompassLoop(): void {
    this.stopCompassLoop();
    this.compassInterval = setInterval(() => {
      this.updateCompassUI();
    }, 120);
  }

  private stopCompassLoop(): void {
    if (this.compassInterval) {
      clearInterval(this.compassInterval);
      this.compassInterval = null;
    }
  }

  private updateCompassUI(): void {
    const target = this.targetCoords || [this.userCoords[0] + 0.005, this.userCoords[1] + 0.005];
    const bearing = advancedHardwareService.calculateTacticalBearing(this.userCoords, target);
    const depth = advancedHardwareService.getBarometricDepth();

    const needle = this.container.querySelector('#compass-needle') as HTMLElement | null;
    const headingText = this.container.querySelector('#compass-heading-deg') as HTMLElement | null;
    const turnText = this.container.querySelector('#compass-turn-guidance') as HTMLElement | null;
    const depthVal = this.container.querySelector('#compass-depth-val') as HTMLElement | null;
    const floorVal = this.container.querySelector('#compass-floor-val') as HTMLElement | null;

    if (needle) {
      needle.style.transform = `rotate(${-bearing.currentHeadingDeg}deg)`;
    }
    if (headingText) {
      headingText.textContent = `${bearing.currentHeadingDeg}° ${bearing.cardinalDirection}`;
    }
    if (turnText) {
      const turn = bearing.relativeTurnDeg;
      if (Math.abs(turn) < 8) {
        turnText.innerHTML = `<span class="text-emerald-400 font-bold">🎯 DOĞRUDAN HEDEFE İLERLEYİN</span>`;
      } else if (turn > 0) {
        turnText.innerHTML = `<span class="text-amber-300 font-bold">↻ SAĞA ${Math.abs(turn)}° DÖNÜN</span>`;
      } else {
        turnText.innerHTML = `<span class="text-amber-300 font-bold">↺ SOLA ${Math.abs(turn)}° DÖNÜN</span>`;
      }
    }
    if (depthVal) {
      depthVal.textContent = depth.isUnderground ? `-${depth.estimatedDepthMeters}m` : '0.0m (Yüzey)';
    }
    if (floorVal) {
      floorVal.textContent = depth.estimatedFloorLevel;
    }
  }

  private render(): void {
    const depth = advancedHardwareService.getBarometricDepth();

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-sm sm:max-w-md flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03]">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              🧭
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Taktik Kerteriz Pusulası</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AR HUD
                </span>
              </div>
              <p class="text-[11px] text-gray-400 truncate max-w-[220px]">Hedef: ${this.targetName}</p>
            </div>
          </div>
          <button id="btn-close-compass" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Compass Visual Dial -->
        <div class="p-5 flex flex-col items-center justify-center gap-4">
          <div class="relative w-56 h-56 rounded-full ios27-glass flex items-center justify-center border-2 border-white/15 shadow-inner">
            <!-- Cardinal markers -->
            <span class="absolute top-2 font-black text-xs text-rose-400 font-mono">N</span>
            <span class="absolute bottom-2 font-bold text-xs text-gray-400 font-mono">S</span>
            <span class="absolute right-2 font-bold text-xs text-gray-400 font-mono">E</span>
            <span class="absolute left-2 font-bold text-xs text-gray-400 font-mono">W</span>

            <!-- Rotating Needle dial -->
            <div id="compass-needle" class="absolute inset-0 flex items-center justify-center ios27-spring">
              <div class="w-1.5 h-44 flex flex-col justify-between items-center">
                <!-- North pointer -->
                <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[28px] border-b-rose-500 shadow-glow-red"></div>
                <!-- Center pivot -->
                <div class="w-4 h-4 rounded-full bg-white border-2 border-obsidian-950 shadow-md"></div>
                <!-- South pointer -->
                <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[22px] border-t-gray-400"></div>
              </div>
            </div>

            <!-- Central HUD Degree -->
            <div class="relative z-10 text-center pointer-events-none mt-16">
              <div id="compass-heading-deg" class="text-base font-black font-mono tracking-tight text-white drop-shadow">
                0° Kuzey
              </div>
            </div>
          </div>

          <!-- Dynamic Turn Guidance -->
          <div id="compass-turn-guidance" class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-center font-mono w-full">
            Yön sensörü kalibre ediliyor...
          </div>

          <!-- Barometric Depth & Rubble Level Widget -->
          <div class="w-full p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="block text-[10px] uppercase font-bold text-gray-400">Barometrik Derinlik</span>
              <span id="compass-depth-val" class="text-sm font-black text-sky-400 font-mono">
                ${depth.isUnderground ? `-${depth.estimatedDepthMeters}m` : '0.0m (Yüzey)'}
              </span>
            </div>
            <div>
              <span class="block text-[10px] uppercase font-bold text-gray-400">Tahmini Enkaz Katı</span>
              <span id="compass-floor-val" class="text-xs font-semibold text-gray-200 truncate block">
                ${depth.estimatedFloorLevel}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-black/40 border-t border-white/10 text-[10.5px] text-gray-400 text-center">
          💡 Enkaz tozu ve yıkıntılarda yön şaşırdığınızda pusulayı yatay tutun ve kerteriz açısına göre ilerleyin.
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-compass')?.addEventListener('click', () => this.hide());
  }
}
