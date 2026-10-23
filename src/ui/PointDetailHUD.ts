import { AssemblyPoint } from '../types';
import { Icons } from './icons';

export interface PointDetailCallbacks {
  onRoute: (point: AssemblyPoint) => void;
  onClose: () => void;
}

export class PointDetailHUD {
  private container: HTMLElement;
  private callbacks: PointDetailCallbacks;
  private currentPoint: AssemblyPoint | null = null;

  constructor(parent: HTMLElement, callbacks: PointDetailCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-auto transition-all hidden';
    parent.appendChild(this.container);
  }

  public show(point: AssemblyPoint): void {
    this.currentPoint = point;
    this.container.classList.remove('hidden');

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.coordinates[1]},${point.coordinates[0]}`;

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <span class="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-0.5">
              ${Icons.shield('w-3 h-3')} Onaylı Afet Toplanma Sahası
            </span>
            <h3 class="text-sm font-semibold text-white leading-snug">
              ${point.name}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              ${point.district}, ${point.city}
            </p>
          </div>
          <button id="btn-close-detail" class="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 transition-colors">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 my-3 text-xs">
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">Kapasite</span>
            <span class="text-xs font-semibold text-white font-mono">
              ${point.capacity ? point.capacity.toLocaleString() : 'Belirtilmedi'} kişi
            </span>
          </div>
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">Fiziki Alan</span>
            <span class="text-xs font-semibold text-white font-mono">
              ${point.areaSqM ? `${point.areaSqM.toLocaleString()} m²` : 'Açık Saha'}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 mb-3 text-xs">
          <div class="text-[11px] font-medium text-gray-400 mb-1">Mevcut Altyapı Olanakları</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px]">
            <span class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 ${point.hasWater ? 'text-cyan-400' : 'text-gray-500 opacity-50'}">
              ${Icons.water('w-3.5 h-3.5')} Temiz Su
            </span>
            <span class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 ${point.hasElectricity ? 'text-amber-400' : 'text-gray-500 opacity-50'}">
              ${Icons.bolt('w-3.5 h-3.5')} Şebeke/Enerji
            </span>
            <span class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 ${point.hasTentArea ? 'text-emerald-400' : 'text-gray-500 opacity-50'}">
              ${Icons.tent('w-3.5 h-3.5')} Çadır Kurulum Alanı
            </span>
            <span class="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 ${point.hasGenerator ? 'text-indigo-400' : 'text-gray-500 opacity-50'}">
              ${Icons.generator('w-3.5 h-3.5')} Jeneratör Desteği
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            id="btn-route-action"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-xs font-semibold shadow-glow-emerald transition-all"
          >
            ${Icons.walking('w-4 h-4')}
            <span>Canlı Rota Çiz</span>
          </button>

          <a
            href="${mapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Navigasyonda Aç"
          >
            ${Icons.share('w-4 h-4')}
          </a>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-detail') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.hide();
      this.callbacks.onClose();
    });

    const routeBtn = this.container.querySelector('#btn-route-action') as HTMLButtonElement;
    routeBtn.addEventListener('click', () => {
      if (this.currentPoint) {
        this.callbacks.onRoute(this.currentPoint);
      }
    });
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.currentPoint = null;
  }
}
