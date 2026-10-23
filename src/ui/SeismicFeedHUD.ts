import { Earthquake } from '../types';
import { Icons } from './icons';

export interface SeismicFeedCallbacks {
  onSelectEarthquake: (eq: Earthquake) => void;
  onClose: () => void;
}

export class SeismicFeedHUD {
  private container: HTMLElement;
  private earthquakes: Earthquake[] = [];
  private callbacks: SeismicFeedCallbacks;
  private filterMinMag = 0;

  constructor(parent: HTMLElement, callbacks: SeismicFeedCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-auto transition-all hidden';
    parent.appendChild(this.container);
  }

  public show(earthquakes: Earthquake[], isOfflineCache = false): void {
    this.earthquakes = earthquakes;
    this.container.classList.remove('hidden');
    this.render(isOfflineCache);
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.callbacks.onClose();
  }

  private render(isOfflineCache = false): void {
    const filtered = this.earthquakes.filter((eq) => eq.mag >= this.filterMinMag);

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-white/5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-white">
              Son Depremler (Kandilli/AFAD)
            </h3>
          </div>
          <button id="btn-close-seismic" class="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 transition-colors">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        ${
          isOfflineCache
            ? `<div class="mt-2 p-2 rounded-xl bg-amber-500/10 text-amber-300 text-[11px] flex items-center gap-1.5">
                ${Icons.wifiOff('w-3.5 h-3.5')}
                <span>Çevrimdışı Önbellek Verisi Görüntüleniyor</span>
              </div>`
            : ''
        }

        <div class="flex items-center gap-1.5 my-3 text-[11px]">
          <span class="text-gray-400 mr-1">Filtrele:</span>
          <button data-mag="0" class="filter-btn px-2.5 py-1 rounded-lg ${
            this.filterMinMag === 0 ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
          }">Tümü (${this.earthquakes.length})</button>
          <button data-mag="3" class="filter-btn px-2.5 py-1 rounded-lg ${
            this.filterMinMag === 3 ? 'bg-amber-500/30 text-amber-200' : 'bg-white/5 text-gray-400 hover:text-white'
          }">M ≥ 3.0</button>
          <button data-mag="4" class="filter-btn px-2.5 py-1 rounded-lg ${
            this.filterMinMag === 4 ? 'bg-rose-500/30 text-rose-200' : 'bg-white/5 text-gray-400 hover:text-white'
          }">M ≥ 4.0</button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
          ${
            filtered.length === 0
              ? '<p class="text-xs text-gray-400 text-center py-4">Seçilen kritere uygun deprem bulunamadı.</p>'
              : filtered
                  .map((eq) => {
                    const isMajor = eq.mag >= 4.0;
                    return `
                      <div
                        data-eq-id="${eq.id}"
                        class="eq-row flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] cursor-pointer transition-all"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            isMajor ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                          }">
                            ${eq.mag.toFixed(1)}
                          </span>
                          <div class="min-w-0 truncate">
                            <h4 class="text-xs font-medium text-white truncate">${eq.location || eq.title}</h4>
                            <p class="text-[10px] text-gray-400 font-mono">Derinlik: ${eq.depth.toFixed(1)} km • ${eq.date || 'Son 24s'}</p>
                          </div>
                        </div>
                        <span class="text-gray-500 hover:text-white text-xs pl-2">
                          ${Icons.compass('w-3.5 h-3.5 -rotate-45')}
                        </span>
                      </div>
                    `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-seismic') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hide());

    const filterBtns = this.container.querySelectorAll('.filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterMinMag = Number(btn.getAttribute('data-mag') || 0);
        this.render(isOfflineCache);
      });
    });

    const rows = this.container.querySelectorAll('.eq-row');
    rows.forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-eq-id');
        const found = this.earthquakes.find((e) => e.id === id);
        if (found) {
          this.callbacks.onSelectEarthquake(found);
        }
      });
    });
  }
}
