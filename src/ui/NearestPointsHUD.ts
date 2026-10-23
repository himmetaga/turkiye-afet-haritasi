import { NearestResult, AssemblyPoint } from '../types';
import { Icons } from './icons';
import { getBearingDirectionText } from '../utils/geoMath';

export class NearestPointsHUD {
  private container: HTMLElement;
  private onSelectPoint: (point: AssemblyPoint) => void;
  private currentResults: NearestResult[] = [];

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

    const titleText = userContextText || 'En Yakın 3 Afet Toplanma Alanı';

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-semibold tracking-wider text-gray-200 uppercase">${titleText}</span>
          </div>
          <span class="text-[10px] text-emerald-400/90 font-mono">Canlı Rota Hazır</span>
        </div>

        <div class="flex flex-col gap-2">
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
                  class="point-item group p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 active:scale-[0.99] cursor-pointer transition-all border-none"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-mono text-emerald-400">#${idx + 1}</span>
                        <h4 class="text-xs font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                          ${p.name}
                        </h4>
                      </div>
                      <p class="text-[11px] text-gray-400 mt-0.5 truncate">
                        ${p.district}, ${p.city} • Kapasite: ${p.capacity ? p.capacity.toLocaleString() : 'Belirtilmedi'} kişi
                      </p>
                    </div>

                    <div class="text-right flex flex-col items-end">
                      <div class="flex items-center gap-1 text-emerald-400 text-xs font-semibold font-mono">
                        <span>${distText}</span>
                        <span title="${res.bearingDegrees}° ${dirText}">
                          ${Icons.compass('w-3.5 h-3.5', res.bearingDegrees)}
                        </span>
                      </div>
                      <span class="text-[10px] text-gray-400 mt-0.5 font-mono">~${res.walkingMinutes} dk</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5 text-[10px] text-gray-400">
                    <span class="flex items-center gap-0.5 ${p.hasWater ? 'text-cyan-400' : 'opacity-40'}">
                      ${Icons.water('w-3 h-3')} Su
                    </span>
                    <span class="flex items-center gap-0.5 ${p.hasElectricity ? 'text-amber-400' : 'opacity-40'}">
                      ${Icons.bolt('w-3 h-3')} Elektrik
                    </span>
                    <span class="flex items-center gap-0.5 ${p.hasTentArea ? 'text-emerald-400' : 'opacity-40'}">
                      ${Icons.tent('w-3 h-3')} Çadır Alanı
                    </span>
                    <span class="flex items-center gap-0.5 ${p.hasGenerator ? 'text-indigo-400' : 'opacity-40'}">
                      ${Icons.generator('w-3 h-3')} Jeneratör
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
  }

  public hide(): void {
    this.container.innerHTML = '';
  }
}
