import { Icons } from './icons';
import { AssemblyPoint, Earthquake } from '../types';
import { haversineDistanceMeters, findNearestAssemblyPoints } from '../utils/geoMath';
import { escapeHtml } from '../utils/safeText';
import { hasUsableLocation } from '../utils/locationState';

/**
 * Tsunami bilgi ve kıyı tahliye rehberi.
 *
 * Bu ekran bir uyarı sistemi DEĞİLDİR: deniz seviyesi verisi, resmi tsunami
 * bülteni ya da dalga modeli yoktur. Yalnızca genel tahliye kurallarını ve
 * deprem listesindeki büyük depremleri düz bilgi olarak gösterir. Varış süresi,
 * dalga yüksekliği veya "güvenli" hükmü üretilmez.
 */

const RECENT_WINDOW_MS = 6 * 60 * 60 * 1000;
const LARGE_QUAKE_MIN_MAG = 6.0;

export class TsunamiRadarModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private assemblyPoints: AssemblyPoint[] = [];
  private earthquakes: Earthquake[] = [];
  private onNavigateToPoint?: (point: AssemblyPoint) => void;

  // Web Audio Siren
  private audioCtx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenPlaying = false;
  private sirenInterval: any = null;

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    assemblyPoints: AssemblyPoint[] = [],
    onNavigateToPoint?: (point: AssemblyPoint) => void
  ) {
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;
    this.onNavigateToPoint = onNavigateToPoint;

    this.container = document.createElement('div');
    this.container.id = 'tsunami-radar-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });

    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public setAssemblyPoints(points: AssemblyPoint[]): void {
    this.assemblyPoints = points;
  }

  public setEarthquakes(earthquakes: Earthquake[]): void {
    this.earthquakes = earthquakes;
  }

  public show(): void {
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.stopSiren();
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  /** Deprem listesindeki son 6 saatin M6.0 ve üzeri depremleri (yorum katılmadan). */
  private getRecentLargeQuakes(): Earthquake[] {
    const now = Date.now();
    return this.earthquakes
      .filter(
        (eq) =>
          typeof eq.mag === 'number' &&
          eq.mag >= LARGE_QUAKE_MIN_MAG &&
          typeof eq.timestamp === 'number' &&
          now - eq.timestamp >= 0 &&
          now - eq.timestamp <= RECENT_WINDOW_MS
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }

  private formatQuakeTime(timestamp: number): string {
    try {
      return new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  private toggleSiren(): void {
    if (this.isSirenPlaying) {
      this.stopSiren();
    } else {
      this.playSiren();
    }
  }

  private playSiren(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.sirenOsc = this.audioCtx.createOscillator();
      this.sirenGain = this.audioCtx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.audioCtx.destination);
      this.sirenOsc.start();

      let rising = true;
      const cycleTime = 1.8;
      const now = this.audioCtx.currentTime;

      this.sirenOsc.frequency.setValueAtTime(450, now);
      this.sirenOsc.frequency.linearRampToValueAtTime(780, now + cycleTime);

      this.sirenInterval = setInterval(() => {
        if (!this.audioCtx || !this.sirenOsc) return;
        const cur = this.audioCtx.currentTime;
        rising = !rising;
        if (rising) {
          this.sirenOsc.frequency.linearRampToValueAtTime(780, cur + cycleTime);
        } else {
          this.sirenOsc.frequency.linearRampToValueAtTime(450, cur + cycleTime);
        }
      }, cycleTime * 1000);

      this.isSirenPlaying = true;
      this.updateSirenButtonUI();
    } catch {}
  }

  private stopSiren(): void {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {}
      this.sirenOsc = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.isSirenPlaying = false;
    this.updateSirenButtonUI();
  }

  private updateSirenButtonUI(): void {
    const btn = this.container.querySelector('#btn-toggle-tsunami-siren');
    if (btn) {
      if (this.isSirenPlaying) {
        btn.classList.add('bg-rose-600', 'text-white', 'animate-pulse');
        btn.classList.remove('bg-white/10', 'text-gray-200');
        btn.innerHTML = `${Icons.siren('w-4 h-4')} <span>Sireni Sustur</span>`;
      } else {
        btn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse');
        btn.classList.add('bg-white/10', 'text-gray-200');
        btn.innerHTML = `${Icons.siren('w-4 h-4')} <span>Çevreyi Uyarmak İçin Siren Sesi Çal</span>`;
      }
    }
  }

  private renderQuakeSection(): string {
    if (this.earthquakes.length === 0) {
      return `
        <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-gray-300 leading-relaxed">
          <div class="font-bold text-white text-xs mb-1">Son büyük depremler</div>
          Deprem verisi alınamadı. Bu, deprem ya da tsunami tehlikesi olmadığı anlamına gelmez.
        </div>
      `;
    }

    const quakes = this.getRecentLargeQuakes();

    if (quakes.length === 0) {
      return `
        <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-gray-300 leading-relaxed">
          <div class="font-bold text-white text-xs mb-1">Son büyük depremler</div>
          Elimizdeki deprem listesinde son 6 saatte M${LARGE_QUAKE_MIN_MAG.toFixed(1)} ve üzeri deprem yok.
          Liste gecikmeli ya da eksik olabilir; bu, tsunami tehlikesi olmadığı anlamına gelmez.
        </div>
      `;
    }

    return `
      <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-gray-200 leading-relaxed space-y-2">
        <div class="font-bold text-amber-200 text-xs">Son 6 saatte listede görünen M${LARGE_QUAKE_MIN_MAG.toFixed(1)} ve üzeri depremler</div>
        ${quakes
          .map(
            (eq) => `
          <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/30">
            <span class="truncate">${escapeHtml(eq.location || eq.title || 'Yer bilgisi yok')}</span>
            <span class="font-mono font-bold text-white shrink-0">M${eq.mag.toFixed(1)} • ${escapeHtml(this.formatQuakeTime(eq.timestamp))}</span>
          </div>
        `
          )
          .join('')}
        <p class="text-gray-300">
          Bu depremlerin tsunami oluşturup oluşturmadığı bu ekrandan anlaşılamaz. Kıyıdaysanız aşağıdaki kurallara uyun
          ve resmi duyuruları (AFAD, Kandilli Rasathanesi) takip edin.
        </p>
      </div>
    `;
  }

  private render(): void {
    const locationUsable = hasUsableLocation();
    const nearestAssemblies =
      locationUsable && this.assemblyPoints.length > 0
        ? findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1)
        : [];
    const nearestPoint = nearestAssemblies[0]?.point;
    const distanceMeters = nearestPoint
      ? Math.round(haversineDistanceMeters(this.userCoords, nearestPoint.coordinates))
      : null;

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-obsidian-900 border border-white/15 p-5 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
              ${Icons.waves('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Tsunami Bilgi ve Kıyı Tahliye Rehberi
              </h3>
              <p class="text-[11px] text-gray-400">
                Genel bilgilendirme — uyarı sistemi değildir
              </p>
            </div>
          </div>

          <button id="btn-close-tsunami" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="overflow-y-auto space-y-3.5 pr-1 text-xs">
          <!-- Not-a-warning banner -->
          <div class="p-4 rounded-2xl border bg-rose-500/10 border-rose-500/30 text-rose-100 text-[12px] leading-relaxed space-y-1.5">
            <p class="font-bold text-white">Bu ekran tsunami uyarısı vermez ve deniz seviyesi verisi içermez.</p>
            <p>
              Kıyıdaysanız ve ayakta durmayı zorlaştıran ya da uzun süren bir sarsıntı hissettiyseniz
              <strong>uyarı beklemeden hemen yüksek bir yere ve iç kesime gidin.</strong>
            </p>
            <p>Duyurular için AFAD ve Kandilli Rasathanesi'ni takip edin. Acil durumda 112'yi arayın.</p>
          </div>

          ${this.renderQuakeSection()}

          <!-- Rules -->
          <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2 text-xs text-gray-300">
            <div class="text-white font-bold">Kıyıda tsunami kuralları</div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Gidebildiğiniz kadar yükseğe ve iç kesime gidin.</strong> Sık anılan ölçü deniz seviyesinden yaklaşık 30 metre yukarısı ya da kıyıdan yaklaşık 3 km içerisidir; ikisi de mümkün değilse sağlam ve yüksek bir binanın üst katlarına çıkın.</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Deniz aniden çekilirse</strong> ya da denizden alışılmadık bir uğultu gelirse bu bir tsunami işareti olabilir. Bakmak için sahile inmeyin, hemen uzaklaşın.</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>İlk dalga çoğu zaman en büyüğü değildir.</strong> Dalgalar saatlerce gelmeye devam edebilir. Yetkililer güvenli olduğunu duyurmadan kıyıya dönmeyin.</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Yaya gidin.</strong> Yollar tıkanabilir; araç yerine yürüyerek yükseğe çıkmak çoğu zaman daha hızlıdır. Dere yataklarından ve köprülerden uzak durun.</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Marmara gibi kapalı denizlerde</strong> dalga kıyıya dakikalar içinde ulaşabilir; resmi uyarı gelmesini beklemeyin.</span>
            </div>
          </div>

          <!-- Nearest assembly point (no elevation data) -->
          ${
            nearestPoint
              ? `
            <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-gray-200 text-xs flex items-center justify-between">
              <div class="min-w-0 pr-2">
                <div class="font-bold text-white text-xs truncate max-w-[260px]">${escapeHtml(nearestPoint.name)}</div>
                <div class="text-[10.5px] text-gray-300 mt-0.5">En yakın toplanma alanı (yükseklik bilgisi yok) • kuş uçuşu ~${distanceMeters} metre</div>
                <div class="text-[10px] text-amber-300 mt-0.5">Bu alan kıyıda ya da alçakta olabilir; tsunami için önce yükseğe çıkın.</div>
              </div>
              <button
                id="btn-navigate-high-ground"
                type="button"
                class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all shrink-0"
              >
                Haritada Göster
              </button>
            </div>
          `
              : `
            <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] text-gray-300">
              ${
                locationUsable
                  ? 'Yakınınızda toplanma alanı verisi bulunamadı.'
                  : 'Konum alınamadı — en yakın toplanma alanı gösterilemiyor.'
              }
            </div>
          `
          }

          <button
            id="btn-toggle-tsunami-siren"
            type="button"
            class="w-full px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-gray-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            ${Icons.siren('w-4 h-4')}
            <span>Çevreyi Uyarmak İçin Siren Sesi Çal</span>
          </button>
        </div>

        <!-- Bottom Controls -->
        <div class="flex items-center gap-2 pt-3 mt-3 border-t border-white/10 shrink-0">
          <button
            id="btn-close-tsunami-bottom"
            type="button"
            class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-tsunami')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-close-tsunami-bottom')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-toggle-tsunami-siren')?.addEventListener('click', () => this.toggleSiren());

    this.container.querySelector('#btn-navigate-high-ground')?.addEventListener('click', () => {
      if (nearestPoint && this.onNavigateToPoint) {
        this.hide();
        this.onNavigateToPoint(nearestPoint);
      }
    });
  }
}
