import { Icons } from './icons';
import { registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';

export interface LayerToggleCallback {
  (layerKey: string, visible: boolean): void;
}

export class LayerControlHUD {
  private container: HTMLElement;
  private onToggle: LayerToggleCallback;
  private states: Record<string, boolean> = {
    assembly: true,
    faults: true,
    hospitals: true,
    bloodCenters: true,
    pharmacies: true,
    dutyOnly: true,
    earthquakes: true,
    buildings: true
  };

  constructor(parent: HTMLElement, onToggle: LayerToggleCallback) {
    this.onToggle = onToggle;
    this.container = document.createElement('div');
    this.container.className =
      'fixed top-16 sm:top-4 right-2 sm:right-4 z-40 flex flex-col gap-2 max-w-[calc(100vw-16px)] sm:max-w-xs pointer-events-auto transition-all hidden';
    parent.appendChild(this.container);
  }

  public show(): void {
    this.container.classList.remove('hidden');
    registerModalOpen('layer-control-hud', () => this.hide());
    this.render();
  }

  public hide(): void {
    registerModalClose('layer-control-hud');
    this.container.classList.add('hidden');
  }

  public toggle(): void {
    if (this.container.classList.contains('hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/5">
          <div class="flex items-center gap-1.5">
            ${Icons.layers('w-4 h-4 text-emerald-400')}
            <span class="text-xs font-semibold text-white uppercase tracking-wider">Harita Katmanları</span>
          </div>
          <button id="btn-close-layers" class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all cursor-pointer touch-manipulation" title="Kapat">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="space-y-1.5 text-xs">
          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Toplanma Alanları (3B)
            </span>
            <input type="checkbox" data-layer="assembly" ${this.states.assembly ? 'checked' : ''} class="accent-emerald-500 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Diri Fay Hatları (MTA)
            </span>
            <input type="checkbox" data-layer="faults" ${this.states.faults ? 'checked' : ''} class="accent-rose-500 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Acil Servis Hastaneleri
            </span>
            <input type="checkbox" data-layer="hospitals" ${this.states.hospitals ? 'checked' : ''} class="accent-cyan-500 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              Kızılay Kan Merkezleri
            </span>
            <input type="checkbox" data-layer="bloodCenters" ${this.states.bloodCenters ? 'checked' : ''} class="accent-rose-600 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Eczaneler
            </span>
            <input type="checkbox" data-layer="pharmacies" ${this.states.pharmacies ? 'checked' : ''} class="accent-amber-500 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-amber-300">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              🌙 Yalnızca Nöbetçiler (19:00 Kuralı)
            </span>
            <input type="checkbox" data-layer="dutyOnly" ${this.states.dutyOnly ? 'checked' : ''} class="accent-amber-400 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              Canlı Deprem Dalgaları
            </span>
            <input type="checkbox" data-layer="earthquakes" ${this.states.earthquakes ? 'checked' : ''} class="accent-red-500 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              3B Şehir Binaları
            </span>
            <input type="checkbox" data-layer="buildings" ${this.states.buildings ? 'checked' : ''} class="accent-indigo-500 rounded" />
          </label>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-layers') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
      closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      });
    }

    const inputs = this.container.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement;
        const key = el.getAttribute('data-layer');
        if (key) {
          this.states[key] = el.checked;
          this.onToggle(key, el.checked);
        }
      });
    });
  }
}
