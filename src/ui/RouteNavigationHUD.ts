import { WalkingRouteResult } from '../services/routingService';
import { AssemblyPoint, EmergencyFacility } from '../types';
import { Icons } from './icons';

export interface RouteNavigationCallbacks {
  onClose: () => void;
}

export class RouteNavigationHUD {
  private container: HTMLElement;
  private callbacks: RouteNavigationCallbacks;
  private isStepsExpanded = false;
  private currentRoute: WalkingRouteResult | null = null;
  private currentDestination: AssemblyPoint | EmergencyFacility | null = null;

  constructor(parent: HTMLElement, callbacks: RouteNavigationCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-md pointer-events-auto transition-all hidden';
    parent.appendChild(this.container);
  }

  public show(
    route: WalkingRouteResult,
    destination: AssemblyPoint | EmergencyFacility
  ): void {
    this.currentRoute = route;
    this.currentDestination = destination;
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.currentRoute = null;
    this.currentDestination = null;
    this.isStepsExpanded = false;
  }

  private render(): void {
    if (!this.currentRoute || !this.currentDestination) return;

    const route = this.currentRoute;
    const dest = this.currentDestination;
    const distanceText =
      route.distanceMeters >= 1000
        ? `${(route.distanceMeters / 1000).toFixed(1)} km`
        : `${route.distanceMeters} m`;

    const nextStep =
      route.steps.length > 0 ? route.steps[0] : { instruction: 'Hedefe doğru sokak boyunca ilerleyin', distanceMeters: route.distanceMeters, name: dest.name };

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest.coordinates[1]},${dest.coordinates[0]}&travelmode=walking`;

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-emerald-500/30">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                ${route.isOffline ? '🛡️ Güvenli Sokak Rotası' : '🚶 Canlı Yürüyüş Navigasyonu'}
              </span>
            </div>
            <h3 class="text-sm font-bold text-white leading-snug">
              ${dest.name}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              ${dest.district}, ${dest.city}
            </p>
          </div>
          <button id="btn-close-nav" class="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 transition-colors" title="Rotayı Kapat">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 my-2.5">
          <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span class="text-[10px] text-emerald-300/80 block font-mono">Yaya Mesafesi</span>
            <span class="text-base font-bold text-emerald-400 font-mono">
              ${distanceText}
            </span>
          </div>
          <div class="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span class="text-[10px] text-gray-400 block font-mono">Tahmini Süre</span>
            <span class="text-base font-bold text-white font-mono">
              ~${route.durationMinutes} dk
            </span>
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-obsidian-900/60 border border-white/5 mb-3">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              ${Icons.navigation('w-3.5 h-3.5')}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[10px] text-gray-400 font-mono">Sıradaki Manevra</div>
              <div class="text-xs font-semibold text-white truncate">
                ${nextStep.instruction}: ${nextStep.name}
              </div>
            </div>
            <span class="text-xs font-mono font-bold text-emerald-400 shrink-0">
              ${nextStep.distanceMeters}m
            </span>
          </div>
        </div>

        ${
          route.steps.length > 1
            ? `
          <button
            id="btn-toggle-steps"
            class="w-full text-center py-1.5 text-[11px] text-gray-400 hover:text-emerald-300 font-mono flex items-center justify-center gap-1 transition-colors"
          >
            <span>${this.isStepsExpanded ? 'Adımları Gizle' : `Tüm Yol Tarifini Gör (${route.steps.length} Sokak)`}</span>
            <span class="transform transition-transform ${this.isStepsExpanded ? 'rotate-180' : ''}">▼</span>
          </button>
        `
            : ''
        }

        ${
          this.isStepsExpanded
            ? `
          <div class="max-h-48 overflow-y-auto space-y-1.5 my-2 pr-1 custom-scrollbar border-t border-white/5 pt-2">
            ${route.steps
              .map(
                (step, idx) => `
              <div class="flex items-start gap-2 text-xs p-1.5 rounded-lg bg-white/[0.03]">
                <span class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                  ${idx + 1}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-gray-200 font-medium">${step.instruction}</div>
                  <div class="text-[11px] text-gray-400">${step.name}</div>
                </div>
                <span class="text-[11px] font-mono text-gray-400 shrink-0">${step.distanceMeters}m</span>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="flex items-center gap-2 pt-2 border-t border-white/5">
          <a
            href="${mapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            ${Icons.share('w-3.5 h-3.5')}
            <span>Google Haritalar'da Aç</span>
          </a>
          <button
            id="btn-cancel-nav"
            class="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors"
          >
            Rotayı Sonlandır
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-nav') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
        this.callbacks.onClose();
      });
    }

    const cancelBtn = this.container.querySelector('#btn-cancel-nav') as HTMLButtonElement;
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
        this.callbacks.onClose();
      });
    }

    const toggleStepsBtn = this.container.querySelector('#btn-toggle-steps') as HTMLButtonElement;
    if (toggleStepsBtn) {
      toggleStepsBtn.addEventListener('click', () => {
        this.isStepsExpanded = !this.isStepsExpanded;
        this.render();
      });
    }
  }
}
