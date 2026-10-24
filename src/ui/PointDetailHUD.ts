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
    const fac = point as any;

    let badgeText = '🛡️ Valilik & AFAD Onaylı Toplanma Sahası';
    let badgeColor = 'text-emerald-400';
    let statusLabel = 'Açık Saha';
    let statusClass = 'text-emerald-400';

    if (category === 'hospital') {
      badgeText = '🏥 Sağlık Bakanlığı Tescilli Hastane';
      badgeColor = 'text-cyan-400';
      statusLabel = fac.hasTraumaCenter ? 'Acil Travma & 7/24 Açık' : '7/24 Acil Servis Aktif';
      statusClass = 'text-cyan-400';
    } else if (category === 'pharmacy') {
      const isDuty = fac.isDuty === true;
      if (isDuty) {
        badgeText = '🌙 24 Saat Açık Nöbetçi Eczane';
        badgeColor = 'text-amber-400';
        statusLabel = '24/7 Kesintisiz Nöbetçi';
        statusClass = 'text-amber-400';
      } else {
        badgeText = '💊 Gündüz Eczanesi (19:00 Kapanış)';
        badgeColor = 'text-yellow-400';
        statusLabel = 'Haftaiçi 08:30 - 19:00';
        statusClass = 'text-yellow-400';
      }
    } else if (category === 'blood_center') {
      badgeText = '🩸 Türk Kızılay Kan Bankası';
      badgeColor = 'text-rose-400';
      statusLabel = 'Acil Kan Bağış Merkezi';
      statusClass = 'text-rose-400';
    }

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-white/10">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <span class="inline-flex items-center gap-1 text-[11px] font-mono ${badgeColor} uppercase tracking-wider mb-0.5">
              ${badgeText}
            </span>
            <h3 class="text-sm font-semibold text-white leading-snug">
              ${point.name}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              ${point.district ? `${point.district}, ` : ''}${point.city} ${fac.typeText ? `• ${fac.typeText}` : ''}
            </p>
            ${
              fac.address
                ? `<p class="text-[11px] text-gray-300 mt-1 line-clamp-2 font-mono">📍 ${fac.address}</p>`
                : ''
            }
          </div>
          <button id="btn-close-detail" class="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 transition-colors">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 my-3 text-xs">
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">${category === 'hospital' ? 'Acil Yatak' : category === 'pharmacy' ? 'Hizmet Türü' : 'Kapasite'}</span>
            <span class="text-xs font-semibold text-white font-mono">
              ${
                fac.emergencyBeds
                  ? `${fac.emergencyBeds} yatak`
                  : category === 'pharmacy'
                  ? fac.isDuty ? '24 Saat Nöbetçi' : 'Gündüz Eczanesi'
                  : fac.capacity
                  ? `${fac.capacity.toLocaleString()} kişi`
                  : 'Aktif Tesis'
              }
            </span>
          </div>
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">Çalışma Saati</span>
            <span class="text-xs font-semibold ${statusClass} font-mono">
              ${statusLabel}
            </span>
          </div>
        </div>

        ${
          fac.phone
            ? `
          <div class="mb-3">
            <a
              href="tel:${fac.phone.replace(/[^0-9+]/g, '')}"
              class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all"
            >
              <span>📞</span>
              <span>Ara: ${fac.phone}</span>
            </a>
          </div>
        `
            : ''
        }

        <div class="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            id="btn-route-action"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-xs font-semibold shadow-glow-emerald transition-all"
          >
            ${Icons.walking('w-4 h-4')}
            <span>Canlı Rota Çiz</span>
          </button>

          <button
            id="btn-share-point"
            type="button"
            class="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-medium border border-white/5 transition-colors"
            title="Bu Noktayı Paylaş (Derin Bağlantı)"
          >
            ${Icons.share('w-3.5 h-3.5')}
            <span class="hidden sm:inline">Paylaş</span>
          </button>

          <a
            href="${mapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Google Haritalar'da Aç"
          >
            <span class="text-xs">🗺️</span>
          </a>
        </div>
      </div>
    `;

    const sharePointBtn = this.container.querySelector('#btn-share-point') as HTMLButtonElement | null;
    sharePointBtn?.addEventListener('click', async () => {
      if (!this.currentPoint) return;
      const shareUrl = `https://afet.live/?point=${encodeURIComponent(this.currentPoint.id)}`;
      const title = `${this.currentPoint.name} - afet.live`;
      const text = `${this.currentPoint.name} (${this.currentPoint.district}, ${this.currentPoint.city}) acil toplanma/sağlık noktası harita konumu ve canlı rotası: ${shareUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({ title, text, url: shareUrl });
          return;
        } catch {}
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        if (sharePointBtn) {
          sharePointBtn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5')} <span class="hidden sm:inline">Kopyalandı!</span>`;
          setTimeout(() => {
            if (sharePointBtn) {
              sharePointBtn.innerHTML = `${Icons.share('w-3.5 h-3.5')} <span class="hidden sm:inline">Paylaş</span>`;
            }
          }, 2000);
        }
      } catch {
        alert(shareUrl);
      }
    });

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
