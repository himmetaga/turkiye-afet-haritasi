import { NearestResult, AssemblyPoint } from '../types';
import { Icons } from './icons';
import { getBearingDirectionText } from '../utils/geoMath';
import { voiceGuide } from '../services/voiceGuideService';

export class NearestPointsHUD {
  private container: HTMLElement;
  private onSelectPoint: (point: AssemblyPoint) => void;
  private currentResults: NearestResult[] = [];
  private isCollapsed = false;

  constructor(parent: HTMLElement, onSelectPoint: (point: AssemblyPoint) => void) {
    this.onSelectPoint = onSelectPoint;
    this.container = document.createElement('div');
    this.container.className =
      'absolute bottom-6 left-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-auto transition-all';
    parent.appendChild(this.container);
  }

  public updatePoints(results: NearestResult[], userContextText?: string): void {
    this.currentResults = results;
    if (results.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    const titleText = userContextText || 'En Yakın 3 Toplanma Alanı';

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all">
        <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-bold tracking-wider text-white uppercase">${titleText}</span>
          </div>
          <div class="flex items-center gap-1">
            <button id="btn-voice-guide" title="Sesli Pusula Rehberi" class="p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 px-2 transition-colors">
              <span>🔊</span>
              <span>Sesli Yön</span>
            </button>
            <button id="btn-collapse-nearest" class="p-1 text-gray-400 hover:text-white rounded-lg bg-white/5 text-[10px]">
              ${this.isCollapsed ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <div id="nearest-items-list" class="flex flex-col gap-2 ${this.isCollapsed ? 'hidden' : ''}">
          ${results
            .map((res, idx) => {
              const p = res.point;
              const dirText = getBearingDirectionText(res.bearingDegrees);
              const distText =
                res.distanceMeters > 1000
                  ? `${(res.distanceMeters / 1000).toFixed(1)} km`
                  : `${res.distanceMeters} m`;

              return `
                <div
                  data-point-id="${p.id}"
                  class="point-item group p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 active:scale-[0.99] cursor-pointer transition-all border border-white/5 hover:border-emerald-500/30"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold font-mono text-emerald-400">#${idx + 1}</span>
                        <h4 class="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                          ${p.name}
                        </h4>
                      </div>
                      <p class="text-[11px] text-gray-400 mt-0.5 truncate">
                        ${p.district}, ${p.city} • Kapasite: ${p.capacity ? p.capacity.toLocaleString() : 'Belirtilmedi'}
                      </p>
                    </div>

                    <!-- Pusula ve Mesafe Rozeti -->
                    <div class="text-right flex flex-col items-end flex-shrink-0">
                      <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold font-mono">
                        <span class="text-emerald-300 font-semibold">${distText}</span>
                        <span class="inline-block transition-transform duration-300" style="transform: rotate(${res.bearingDegrees}deg);" title="${res.bearingDegrees}° ${dirText}">
                          ▲
                        </span>
                      </div>
                      <span class="text-[10px] text-gray-300 font-mono mt-0.5 font-medium">
                        ${dirText} • ~${res.walkingMinutes} dk
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/5 text-[10px] text-gray-400">
                    <div class="flex items-center gap-2">
                      <span class="flex items-center gap-0.5 ${p.hasWater ? 'text-cyan-400' : 'opacity-30'}">
                        ${Icons.water('w-3 h-3')} Su
                      </span>
                      <span class="flex items-center gap-0.5 ${p.hasElectricity ? 'text-amber-400' : 'opacity-30'}">
                        ${Icons.bolt('w-3 h-3')} Elektrik
                      </span>
                      <span class="flex items-center gap-0.5 ${p.hasTentArea ? 'text-emerald-400' : 'opacity-30'}">
                        ${Icons.tent('w-3 h-3')} Çadır
                      </span>
                    </div>

                    <span class="text-[10px] text-emerald-400 group-hover:underline font-mono">
                      Haritada Odaklan & Rota →
                    </span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    const items = this.container.querySelectorAll('.point-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-point-id');
        const found = this.currentResults.find((r) => r.point.id === id);
        if (found) {
          this.onSelectPoint(found.point);
        }
      });
    });

    const collapseBtn = this.container.querySelector('#btn-collapse-nearest');
    collapseBtn?.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      const listEl = this.container.querySelector('#nearest-items-list');
      if (listEl) {
        listEl.classList.toggle('hidden', this.isCollapsed);
      }
      if (collapseBtn) collapseBtn.textContent = this.isCollapsed ? '▲' : '▼';
    });

    const voiceBtn = this.container.querySelector('#btn-voice-guide');
    voiceBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.currentResults.length > 0) {
        const top = this.currentResults[0];
        const dir = getBearingDirectionText(top.bearingDegrees);
        voiceGuide.requestWakeLock();
        voiceGuide.speak(
          `En yakın afet toplanma alanı: ${top.point.name}. Mesafe: ${top.distanceMeters} metre. Pusula yönü: ${dir}, ${top.bearingDegrees} derece. Tahmini yürüyüş süresi: ${top.walkingMinutes} dakika.`
        );
      }
    });
  }

  public hide(): void {
    this.container.innerHTML = '';
  }
}
