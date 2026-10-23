import { AssemblyPoint, EmergencyFacility } from '../types';
import { Icons } from './icons';

export interface PointDetailCallbacks {
  onRoute: (point: AssemblyPoint | EmergencyFacility) => void;
  onClose: () => void;
}

export class PointDetailHUD {
  private container: HTMLElement;
  private callbacks: PointDetailCallbacks;
  private currentPoint: AssemblyPoint | EmergencyFacility | null = null;

  constructor(parent: HTMLElement, callbacks: PointDetailCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-auto transition-all hidden';
    parent.appendChild(this.container);
  }

  public show(point: AssemblyPoint | EmergencyFacility): void {
    this.currentPoint = point;
    this.container.classList.remove('hidden');

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.coordinates[1]},${point.coordinates[0]}`;
    const category = (point as any).category || 'assembly';

    let badgeText = '🛡️ Onaylı Afet Toplanma Sahası';
    let badgeColor = 'text-emerald-400';
    if (category === 'hospital') {
      badgeText = '🏥 Acil Travma & Şehir Hastanesi';
      badgeColor = 'text-cyan-400';
    } else if (category === 'pharmacy') {
      badgeText = '💊 24 Saat Açık Nöbetçi Eczane';
      badgeColor = 'text-amber-400';
    } else if (category === 'blood_center') {
      badgeText = '🩸 Türk Kızılay Kan Bankası';
      badgeColor = 'text-rose-400';
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <span class="inline-flex items-center gap-1 text-[11px] font-mono ${badgeColor} uppercase tracking-wider mb-0.5">
              ${badgeText}
            </span>
            <h3 class="text-sm font-semibold text-white leading-snug">
              ${point.name}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              ${point.district}, ${point.city} ${(point as any).typeText ? `• ${(point as any).typeText}` : ''}
            </p>
          </div>
          <button id="btn-close-detail" class="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 transition-colors">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 my-3 text-xs">
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">${category === 'hospital' ? 'Acil Yatak' : 'Kapasite'}</span>
            <span class="text-xs font-semibold text-white font-mono">
              ${
                (point as any).emergencyBeds
                  ? `${(point as any).emergencyBeds} yatak`
                  : (point as any).capacity
                  ? `${(point as any).capacity.toLocaleString()} kişi`
                  : 'Aktif Hizmet'
              }
            </span>
          </div>
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">Durum</span>
            <span class="text-xs font-semibold text-emerald-400 font-mono">
              ${category === 'pharmacy' ? '24/7 Açık' : category === 'hospital' ? 'Acil Servis Aktif' : 'Açık Saha'}
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
        this.setRoutingState(true);
        this.callbacks.onRoute(this.currentPoint);
      }
    });
  }

  public setRoutingState(isLoading: boolean): void {
    const routeBtn = this.container.querySelector('#btn-route-action') as HTMLButtonElement;
    if (!routeBtn) return;
    if (isLoading) {
      routeBtn.disabled = true;
      routeBtn.classList.add('opacity-75');
      routeBtn.innerHTML = `
        <span class="inline-block w-3.5 h-3.5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin"></span>
        <span>Sokak Rotası Çiziliyor...</span>
      `;
    } else {
      routeBtn.disabled = false;
      routeBtn.classList.remove('opacity-75');
      routeBtn.innerHTML = `
        ${Icons.walking('w-4 h-4')}
        <span>Canlı Rota Çiz</span>
      `;
    }
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.currentPoint = null;
  }
}
