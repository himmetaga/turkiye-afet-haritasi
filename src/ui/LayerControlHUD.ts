import { Icons } from './icons';

export interface LayerToggleCallback {
  (layerKey: string, visible: boolean): void;
}

export class LayerControlHUD {
  private container: HTMLElement;
  private onToggle: LayerToggleCallback;
  private states = {
    assembly: true,
    faults: true,
    facilities: true,
    earthquakes: true,
    buildings: true
  };

  constructor(parent: HTMLElement, onToggle: LayerToggleCallback) {
    this.onToggle = onToggle;
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-xs pointer-events-auto transition-all hidden';
    parent.appendChild(this.container);
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
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
          <button id="btn-close-layers" class="p-1 text-gray-400 hover:text-white rounded-lg bg-white/5">
            ${Icons.close('w-3.5 h-3.5')}
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
              Hastaneler & Eczaneler
            </span>
            <input type="checkbox" data-layer="facilities" ${this.states.facilities ? 'checked' : ''} class="accent-cyan-500 rounded" />
          </label>

          <label class="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer select-none">
            <span class="flex items-center gap-2 text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Deprem Dalgaları
            </span>
            <input type="checkbox" data-layer="earthquakes" ${this.states.earthquakes ? 'checked' : ''} class="accent-amber-500 rounded" />
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
    closeBtn.addEventListener('click', () => this.hide());

    const inputs = this.container.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement;
        const key = el.getAttribute('data-layer') as keyof typeof this.states;
        if (key) {
          this.states[key] = el.checked;
          this.onToggle(key, el.checked);
        }
      });
    });
  }
}
