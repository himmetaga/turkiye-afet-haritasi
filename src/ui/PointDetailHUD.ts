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
      'fixed bottom-[74px] sm:bottom-auto sm:top-4 left-3 right-3 sm:left-auto sm:right-4 z-40 flex flex-col gap-2 sm:w-auto sm:max-w-sm pointer-events-auto transition-all hidden';
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
      <div class="hud-glass rounded-3xl p-4 shadow-2xl backdrop-blur-xl border border-white/10">
        <!-- Mobile Drag/Swipe Down Handle -->
        <div id="btn-drag-detail-handle" class="sm:hidden w-10 h-1.5 bg-white/20 hover:bg-white/40 rounded-full mx-auto -mt-1 mb-2 cursor-pointer transition-colors" title="Aşağı İndir / Kapat"></div>

        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0 flex-1">
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
          <button
            id="btn-close-detail"
            type="button"
            aria-label="Kapat"
            class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-gray-200 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all shrink-0 cursor-pointer touch-manipulation"
          >
            ${Icons.close('w-4.5 h-4.5')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 my-3 text-xs">
          <div class="p-2 rounded-xl bg-white/5">
            <span class="text-[10px] text-gray-400 block">${category === 'hospital' ? 'Acil Yatak' : category === 'pharmacy' ? 'Hizmet Türü' : category === 'blood_center' ? 'Kurum' : 'Kapasite'}</span>
            <span class="text-xs font-semibold text-white font-mono">
              ${
                fac.emergencyBeds
                  ? `${fac.emergencyBeds} yatak`
                  : category === 'pharmacy'
                  ? fac.isDuty ? '24 Saat Nöbetçi' : 'Gündüz Eczanesi'
                  : category === 'blood_center'
                  ? 'Türk Kızılay'
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

        <!-- Safe Check-In Action Button -->
        <div class="mt-2.5">
          <button
            id="btn-checkin-point"
            type="button"
            class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all active:scale-[0.98]"
            title="Bu toplanma alanına güvenle ulaştığınızı yakınlarınıza SMS / WhatsApp ile iletin"
          >
            <span>📍</span>
            <span>Buradayım (Aileme & Yakınlarıma Bildir)</span>
          </button>
        </div>

        <!-- Community Crowdsourced Verification Button (GitHub) -->
        <div class="mt-2 pt-2 border-t border-white/5">
          <a
            id="btn-verify-point-github"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white text-[11px] font-medium border border-white/5 transition-colors"
            title="Bu toplanma alanı veya hastaneyi yerinde doğrulayın / GitHub'a bildirin"
          >
            <span class="text-gray-400">${Icons.github('w-3.5 h-3.5')}</span>
            <span>📍 Bu Noktayı Doğrula / Hata Bildir (GitHub)</span>
          </a>
        </div>
      </div>
    `;

    const githubVerifyBtn = this.container.querySelector('#btn-verify-point-github') as HTMLAnchorElement | null;
    if (githubVerifyBtn && this.currentPoint) {
      const p = this.currentPoint;
      const title = `[Doğrulama]: ${p.name} (${p.city || ''}/${p.district || ''})`;
      const issueUrl = `https://github.com/himmetaga/turkiye-afet-haritasi/issues/new?template=verify-point.yml&title=${encodeURIComponent(title)}&point_name=${encodeURIComponent(p.name)}&point_id=${encodeURIComponent(p.id)}&location=${encodeURIComponent(`${p.city || ''} / ${p.district || ''}`)}&coordinates=${encodeURIComponent(`${p.coordinates[1].toFixed(5)}, ${p.coordinates[0].toFixed(5)}`)}`;
      githubVerifyBtn.href = issueUrl;
    }

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

    const checkinBtn = this.container.querySelector('#btn-checkin-point') as HTMLButtonElement | null;
    checkinBtn?.addEventListener('click', async () => {
      if (!this.currentPoint) return;
      const p = this.currentPoint;
      const lat = p.coordinates[1].toFixed(5);
      const lon = p.coordinates[0].toFixed(5);
      const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
      const msg = `Ben "${p.name}" (${p.district ? p.district + ', ' : ''}${p.city}) toplanma alanına güvenle ulaştım! Konumum: ${mapUrl} — afet.live`;

      try {
        localStorage.setItem(
          'afet_last_checkin',
          JSON.stringify({
            name: p.name,
            city: p.city,
            district: p.district,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString('tr-TR'),
            coords: p.coordinates
          })
        );
      } catch {}

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Toplanma Alanına Ulaştım',
            text: msg
          });
          checkinBtn.innerHTML = `<span>✓</span><span>Aileye İletildi</span>`;
          return;
        } catch {}
      }

      try {
        await navigator.clipboard.writeText(msg);
        checkinBtn.innerHTML = `<span>✓</span><span>Konum Kopyalandı (SMS / WhatsApp'a Yapıştırın)</span>`;
        setTimeout(() => {
          if (checkinBtn) {
            checkinBtn.innerHTML = `<span>📍</span><span>Buradayım (Aileme & Yakınlarıma Bildir)</span>`;
          }
        }, 3000);
      } catch {
        alert(msg);
      }
    });

    const closeBtn = this.container.querySelector('#btn-close-detail') as HTMLButtonElement;
    const closeHandler = (e: Event) => {
      e.preventDefault();
      this.hide();
      this.callbacks.onClose();
    };
    closeBtn?.addEventListener('click', closeHandler);
    closeBtn?.addEventListener('touchend', closeHandler);

    const dragHandle = this.container.querySelector('#btn-drag-detail-handle');
    dragHandle?.addEventListener('click', closeHandler);
    dragHandle?.addEventListener('touchend', closeHandler);

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
