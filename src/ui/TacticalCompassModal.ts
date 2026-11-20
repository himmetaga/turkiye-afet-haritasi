import { Icons } from './icons';
import { advancedHardwareService } from '../services/advancedHardwareService';
import { haversineDistanceMeters } from '../utils/geoMath';
import { escapeHtml } from '../utils/safeText';
import { getLocationSourceLabel, hasUsableLocation } from '../utils/locationState';

/**
 * Pusula: en yakın toplanma alanının yönünü gösterir.
 *
 * Kural: hedef, yön ve mesafe yalnızca gerçek veri varken gösterilir.
 * - Hedef yoksa (toplanma alanı verisi yüklenmediyse) ok ve mesafe çizilmez.
 * - Pusula sensörü okuma vermiyorsa "dönün" talimatı verilmez.
 * - Konum GPS'ten gelmiyorsa mesafe ve yön yaklaşık olarak işaretlenir.
 */
export class TacticalCompassModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private targetCoords: [number, number] | null = null;
  private targetName = '';
  private compassInterval: any = null;
  private lastAlignedHaptic = false;

  constructor(parent: HTMLElement, userCoords: [number, number]) {
    this.userCoords = userCoords;
    this.container = document.createElement('div');
    this.container.id = 'tactical-compass-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  /** target `null` verilirse hedef temizlenir; `undefined` ise mevcut hedef korunur. */
  public setCoords(user: [number, number], target?: [number, number] | null, name?: string): void {
    this.userCoords = user;
    if (target === null) {
      this.targetCoords = null;
      this.targetName = '';
    } else if (target) {
      this.targetCoords = target;
      this.targetName = name || '';
    }
  }

  public show(target?: [number, number], name?: string): void {
    if (target) {
      this.targetCoords = target;
      this.targetName = name || '';
    }
    this.container.classList.remove('hidden');
    this.render();
    this.startCompassLoop();
    advancedHardwareService.requestCompassPermission().catch(() => {});
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

  private formatDistance(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  }

  private updateCompassUI(): void {
    const needle = this.container.querySelector('#compass-needle') as HTMLElement | null;
    const targetPointer = this.container.querySelector('#compass-target-pointer') as HTMLElement | null;
    const headingText = this.container.querySelector('#compass-heading-deg') as HTMLElement | null;
    const turnText = this.container.querySelector('#compass-turn-guidance') as HTMLElement | null;
    const distVal = this.container.querySelector('#compass-target-distance') as HTMLElement | null;

    const heading = advancedHardwareService.getCompassHeading();
    const target = this.targetCoords;

    const targetLabel = this.container.querySelector('#compass-target-label') as HTMLElement | null;
    if (targetLabel) {
      targetLabel.textContent = target ? `Hedef: ${this.targetName || 'En yakın toplanma alanı'}` : 'Hedef seçilmedi';
    }
    const sourceLabel = this.container.querySelector('#compass-location-source') as HTMLElement | null;
    if (sourceLabel) sourceLabel.textContent = getLocationSourceLabel();

    if (needle) {
      needle.style.opacity = heading ? '0.85' : '0.2';
      if (heading) needle.style.transform = `rotate(${-heading.deg}deg)`;
    }
    if (headingText) {
      headingText.textContent = heading ? `${heading.deg}° ${heading.cardinal}` : 'Pusula okunamıyor';
    }

    if (!target) {
      if (targetPointer) targetPointer.style.display = 'none';
      if (distVal) distVal.textContent = '';
      if (turnText) {
        turnText.textContent = hasUsableLocation()
          ? 'Hedef yok: toplanma alanı verisi yüklenemedi.'
          : 'Hedef gösterilemiyor: konumunuz alınamadı. Konum iznini açıp yeniden deneyin.';
      }
      return;
    }

    const bearing = advancedHardwareService.calculateTacticalBearing(this.userCoords, target);
    const distMeters = Math.round(haversineDistanceMeters(this.userCoords, target));
    if (distVal) {
      distVal.textContent = `${hasUsableLocation() ? '' : '≈ '}${this.formatDistance(distMeters)}`;
    }

    if (!heading) {
      // Sensör yok: ok çizilmez, yalnızca hedefin coğrafi yönü yazılır.
      if (targetPointer) targetPointer.style.display = 'none';
      if (turnText) {
        turnText.textContent = `Pusula sensörü yok ya da izin verilmedi. Hedef ${bearing.cardinalDirection} yönünde (${bearing.targetBearingDeg}°).`;
      }
      return;
    }

    if (targetPointer) {
      targetPointer.style.display = '';
      targetPointer.style.transform = `rotate(${bearing.relativeTurnDeg}deg)`;
    }
    if (turnText) {
      const turn = bearing.relativeTurnDeg;
      if (Math.abs(turn) < 8) {
        turnText.innerHTML = `<span class="text-emerald-400 font-bold">🎯 Hedef tam karşınızda</span>`;
        if (!this.lastAlignedHaptic) {
          this.lastAlignedHaptic = true;
          if ('vibrate' in navigator) {
            try { navigator.vibrate(35); } catch {}
          }
        }
      } else {
        if (Math.abs(turn) > 15) {
          this.lastAlignedHaptic = false;
        }
        turnText.innerHTML =
          turn > 0
            ? `<span class="text-amber-300 font-bold">↻ Sağa ${Math.abs(turn)}° dönün</span>`
            : `<span class="text-amber-300 font-bold">↺ Sola ${Math.abs(turn)}° dönün</span>`;
      }
    }
  }

  private render(): void {
    const hasTarget = !!this.targetCoords;
    const targetLabel = hasTarget
      ? `Hedef: ${escapeHtml(this.targetName || 'En yakın toplanma alanı')}`
      : 'Hedef seçilmedi';

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-sm sm:max-w-md flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03]">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              🧭
            </span>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Toplanma Alanı Pusulası</h2>
              <p id="compass-target-label" class="text-[11px] text-gray-400 truncate max-w-[220px]">${targetLabel}</p>
            </div>
          </div>
          <button id="btn-close-compass" aria-label="Kapat" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Compass Visual Dial -->
        <div class="p-5 flex flex-col items-center justify-center gap-4 cursor-pointer" id="compass-dial-container" title="Pusula iznini yeniden istemek için dokunun">
          <div class="relative w-56 h-56 rounded-full ios27-glass flex items-center justify-center border-2 border-white/15 shadow-inner">
            <span class="absolute top-2 font-black text-xs text-rose-400 font-mono">K</span>
            <span class="absolute bottom-2 font-bold text-xs text-gray-400 font-mono">G</span>
            <span class="absolute right-2 font-bold text-xs text-gray-400 font-mono">D</span>
            <span class="absolute left-2 font-bold text-xs text-gray-400 font-mono">B</span>

            <!-- Hedef yönü (yeşil ok): yalnızca hedef ve pusula okuması varken görünür -->
            <div id="compass-target-pointer" class="absolute inset-0 flex items-center justify-center ios27-spring" style="display:none">
              <div class="w-2 h-48 flex flex-col justify-start items-center">
                <div class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[24px] border-b-emerald-400 shadow-glow-emerald"></div>
              </div>
            </div>

            <!-- Kuzey / güney iğnesi -->
            <div id="compass-needle" class="absolute inset-0 flex items-center justify-center ios27-spring" style="opacity:0.2">
              <div class="w-1.5 h-44 flex flex-col justify-between items-center">
                <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[28px] border-b-rose-500 shadow-glow-red"></div>
                <div class="w-4 h-4 rounded-full bg-white border-2 border-obsidian-950 shadow-md"></div>
                <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[22px] border-t-gray-400"></div>
              </div>
            </div>

            <div class="relative z-10 text-center pointer-events-none mt-16">
              <div id="compass-heading-deg" class="text-base font-black font-mono tracking-tight text-white drop-shadow">
                Pusula okunuyor…
              </div>
              <div id="compass-target-distance" class="text-[11px] font-mono text-emerald-400 font-bold drop-shadow"></div>
            </div>
          </div>

          <div id="compass-turn-guidance" class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-center w-full">
            Pusula sensörü bekleniyor…
          </div>

          <p class="w-full text-[10.5px] text-gray-400 text-center leading-snug">
            Konum: <span id="compass-location-source">${escapeHtml(getLocationSourceLabel())}</span>. Yön kuş uçuşudur; sokakları ve engelleri hesaba katmaz.
            Metal ve betonarme yakınında pusula sapabilir.
          </p>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-black/40 border-t border-white/10 text-[10.5px] text-gray-400 text-center flex items-center justify-between px-4">
          <span>🟢 Yeşil ok: hedefin yönü</span>
          <button id="btn-calibrate-compass" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] text-gray-300 font-semibold">
            Pusula iznini iste ↻
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-compass')?.addEventListener('click', () => this.hide());
    const calHandler = () => {
      advancedHardwareService.requestCompassPermission().catch(() => {});
    };
    this.container.querySelector('#btn-calibrate-compass')?.addEventListener('click', calHandler);
    this.container.querySelector('#compass-dial-container')?.addEventListener('click', calHandler);
  }
}
