import { Icons } from './icons';
import { AssemblyPoint, Earthquake } from '../types';
import { haversineDistanceMeters, findNearestAssemblyPoints } from '../utils/geoMath';

// Representative coastal reference points across Turkish waters (Marmara, Aegean, Mediterranean, Black Sea)
const TURKISH_COASTAL_POINTS: [number, number][] = [
  // Marmara Sea
  [28.98, 41.00], [28.82, 40.97], [28.58, 40.99], [28.35, 41.01], [27.95, 40.97], [27.51, 40.97],
  [27.90, 40.35], [28.30, 40.38], [28.90, 40.36], [29.20, 40.43], [29.65, 40.75], [29.90, 40.76],
  [26.40, 40.15], [26.65, 40.38],
  // Aegean Sea
  [26.10, 39.85], [26.65, 39.55], [26.90, 39.15], [27.10, 38.45], [26.75, 38.32], [26.30, 38.31],
  [26.85, 38.10], [27.25, 37.85], [27.42, 37.03], [27.70, 36.72], [28.30, 36.85],
  // Mediterranean
  [29.10, 36.62], [29.63, 36.20], [30.15, 36.25], [30.55, 36.60], [30.70, 36.88], [31.40, 36.78],
  [32.00, 36.54], [34.62, 36.80], [35.35, 36.75], [35.85, 36.60], [35.92, 36.10],
  // Black Sea
  [28.00, 41.50], [29.05, 41.25], [30.20, 41.15], [31.40, 41.10], [31.80, 41.45], [34.00, 41.95],
  [35.15, 42.02], [36.33, 41.28], [37.88, 41.00], [39.72, 41.00], [40.52, 41.03], [41.50, 41.50]
];

interface TsunamiAssessment {
  level: 'CRITICAL' | 'ADVISORY' | 'WATCH' | 'SAFE';
  title: string;
  badgeText: string;
  badgeClass: string;
  bannerClass: string;
  triggerEq: Earthquake | null;
  seaBasin: string;
  distKm: number;
  waveSpeedKmH: number;
  etaMinutes: number;
  remainingMinutes: number;
  isArrived: boolean;
  estimatedRunupMeters: number;
}

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

  /**
   * Calculates minimum distance to closest Turkish coastline in meters.
   */
  private getDistanceToCoastlineMeters(): number {
    let minDist = Infinity;
    for (const pt of TURKISH_COASTAL_POINTS) {
      const d = haversineDistanceMeters(this.userCoords, pt);
      if (d < minDist) {
        minDist = d;
      }
    }
    return Math.round(minDist);
  }

  /**
   * Detects if an earthquake has its epicenter in Turkish coastal waters.
   */
  private detectSeaBasin(eq: Earthquake): { isSea: boolean; basin: string; avgDepthM: number; speedKmH: number } {
    const [lng, lat] = eq.coordinates;
    const loc = (eq.location || eq.title || '').toLocaleUpperCase('tr-TR');

    // Marmara Sea
    const inMarmaraBox = lat >= 40.40 && lat <= 41.15 && lng >= 26.70 && lng <= 29.90;
    const isMarmaraText =
      loc.includes('MARMARA') ||
      loc.includes('SILIVRI') ||
      loc.includes('CINARCIK') ||
      loc.includes('KUMBURGAZ') ||
      loc.includes('GEMLIK') ||
      loc.includes('BANDIRMA') ||
      loc.includes('TEKIRDAG ACIK') ||
      loc.includes('SAROS');
    if (inMarmaraBox || isMarmaraText) {
      return { isSea: true, basin: 'Marmara Denizi (İç Deniz)', avgDepthM: 400, speedKmH: 225 };
    }

    // Aegean Sea
    const inAegeanBox = lat >= 35.50 && lat <= 40.70 && lng >= 23.00 && lng <= 27.60;
    const isAegeanText =
      loc.includes('EGE') ||
      loc.includes('GIRIT') ||
      loc.includes('RODOS') ||
      loc.includes('ONIKI ADALAR') ||
      loc.includes('SISAM') ||
      loc.includes('KUSADASI') ||
      loc.includes('GOKOVA') ||
      loc.includes('BODRUM ACIK') ||
      loc.includes('DATCA ACIK') ||
      loc.includes('IZMIR KORF');
    if (inAegeanBox || isAegeanText) {
      return { isSea: true, basin: 'Ege Denizi (Helen Yayı / Adalar)', avgDepthM: 350, speedKmH: 210 };
    }

    // Mediterranean Sea
    const inMedBox = lat >= 34.00 && lat <= 36.80 && lng >= 27.60 && lng <= 36.20;
    const isMedText =
      loc.includes('AKDENIZ') ||
      loc.includes('KIBRIS') ||
      loc.includes('ANTALYA KORF') ||
      loc.includes('FETHIYE ACIK') ||
      loc.includes('KAS ACIK') ||
      loc.includes('MERSIN') ||
      loc.includes('ISKENDERUN');
    if (inMedBox || isMedText) {
      return { isSea: true, basin: 'Doğu Akdeniz (Kıbrıs / Rodos Çukuru)', avgDepthM: 1500, speedKmH: 435 };
    }

    // Black Sea
    const inBlackBox = lat >= 41.20 && lat <= 43.50 && lng >= 28.00 && lng <= 41.50;
    const isBlackText = loc.includes('KARADENIZ') || loc.includes('SINOP ACIK') || loc.includes('SAMSUN ACIK');
    if (inBlackBox || isBlackText) {
      return { isSea: true, basin: 'Karadeniz Havzası', avgDepthM: 1200, speedKmH: 395 };
    }

    return { isSea: false, basin: 'Kara İçi', avgDepthM: 0, speedKmH: 0 };
  }

  /**
   * Evaluates active tsunami threat based on recent offshore earthquakes.
   */
  private evaluateTsunamiThreat(): TsunamiAssessment {
    const now = Date.now();
    const fourHoursMs = 4 * 60 * 60 * 1000;

    // Filter offshore earthquakes in Turkish waters
    let criticalTrigger: { eq: Earthquake; basin: string; speedKmH: number; runup: number } | null = null;
    let advisoryTrigger: { eq: Earthquake; basin: string; speedKmH: number; runup: number } | null = null;
    let watchTrigger: { eq: Earthquake; basin: string; speedKmH: number; runup: number } | null = null;

    for (const eq of this.earthquakes) {
      const ageMs = now - eq.timestamp;
      if (ageMs > fourHoursMs) continue;

      const seaInfo = this.detectSeaBasin(eq);
      if (!seaInfo.isSea) continue;

      const runup = Math.max(0.3, Number((10 ** (0.42 * eq.mag - 2.8)).toFixed(1)));

      if (eq.mag >= 6.4 && !criticalTrigger) {
        criticalTrigger = { eq, basin: seaInfo.basin, speedKmH: seaInfo.speedKmH, runup };
      } else if (eq.mag >= 5.4 && !advisoryTrigger) {
        advisoryTrigger = { eq, basin: seaInfo.basin, speedKmH: seaInfo.speedKmH, runup };
      } else if (eq.mag >= 4.5 && !watchTrigger) {
        watchTrigger = { eq, basin: seaInfo.basin, speedKmH: seaInfo.speedKmH, runup };
      }
    }

    const active = criticalTrigger || advisoryTrigger || watchTrigger;

    if (!active) {
      return {
        level: 'SAFE',
        title: 'Aktif Tsunami Tehdidi Bulunmuyor',
        badgeText: 'NORMAL / GÜVENLİ',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        bannerClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        triggerEq: null,
        seaBasin: 'Normal Deniz Seviyesi',
        distKm: 0,
        waveSpeedKmH: 0,
        etaMinutes: 0,
        remainingMinutes: 0,
        isArrived: false,
        estimatedRunupMeters: 0
      };
    }

    const eq = active.eq;
    const distM = haversineDistanceMeters(this.userCoords, eq.coordinates);
    const distKm = Math.round(distM / 1000);
    const waveSpeedKmH = active.speedKmH || 250;
    const etaMinutes = Math.round((distKm / waveSpeedKmH) * 60);
    const elapsedMinutes = Math.round((now - eq.timestamp) / 60000);
    const remainingMinutes = Math.max(-120, etaMinutes - elapsedMinutes);
    const isArrived = remainingMinutes <= 0;

    if (criticalTrigger) {
      return {
        level: 'CRITICAL',
        title: '🚨 TSUNAMİ ALARMI: DERHAL KIYIYI TERK EDİN!',
        badgeText: 'KIRMIZI ALARM',
        badgeClass: 'bg-rose-500/25 text-rose-300 border-rose-500/40 animate-pulse',
        bannerClass: 'bg-rose-500/15 border-rose-500/40 text-rose-200',
        triggerEq: eq,
        seaBasin: active.basin,
        distKm,
        waveSpeedKmH,
        etaMinutes,
        remainingMinutes,
        isArrived,
        estimatedRunupMeters: active.runup
      };
    }

    if (advisoryTrigger) {
      return {
        level: 'ADVISORY',
        title: '⚠️ TSUNAMİ UYARISI: GÜÇLÜ KIYI AKINTILARI BEKLENİYOR',
        badgeText: 'TURUNCU UYARI',
        badgeClass: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
        bannerClass: 'bg-amber-500/15 border-amber-500/40 text-amber-200',
        triggerEq: eq,
        seaBasin: active.basin,
        distKm,
        waveSpeedKmH,
        etaMinutes,
        remainingMinutes,
        isArrived,
        estimatedRunupMeters: active.runup
      };
    }

    return {
      level: 'WATCH',
      title: 'ℹ️ TSUNAMİ BİLGİLENDİRME: DENİZ SEVİYESİNİ TAKİP EDİN',
      badgeText: 'SARI BİLGİ',
      badgeClass: 'bg-sky-500/25 text-sky-300 border-sky-500/40',
      bannerClass: 'bg-sky-500/15 border-sky-500/40 text-sky-200',
      triggerEq: eq,
      seaBasin: active.basin,
      distKm,
      waveSpeedKmH,
      etaMinutes,
      remainingMinutes,
      isArrived,
      estimatedRunupMeters: active.runup
    };
  }

  /**
   * Synthesize NATO/Tsunami evacuation warble siren using Web Audio API
   */
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

      // Initial tone
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
        btn.classList.remove('bg-white/10', 'text-gray-300');
        btn.innerHTML = `${Icons.siren('w-4 h-4')} <span>Sireni Sustur</span>`;
      } else {
        btn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse');
        btn.classList.add('bg-white/10', 'text-gray-300');
        btn.innerHTML = `${Icons.siren('w-4 h-4')} <span>Tahliye Sirenini Çal / Test Et</span>`;
      }
    }
  }

  private render(): void {
    const coastDistMeters = this.getDistanceToCoastlineMeters();
    const isCoastalRisk = coastDistMeters <= 3500;
    const assessment = this.evaluateTsunamiThreat();

    const nearestAssemblies =
      this.assemblyPoints.length > 0
        ? findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1)
        : [];
    const nearestSafePoint = nearestAssemblies[0]?.point;
    const distanceMeters = nearestSafePoint
      ? Math.round(haversineDistanceMeters(this.userCoords, nearestSafePoint.coordinates))
      : 450;

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-obsidian-900 border border-white/15 p-5 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
              ${Icons.waves('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-white tracking-wide">
                  Tsunami Erken Uyarı & Kıyı Tahliyesi
                </h3>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  KOERI / NEAMTWS
                </span>
              </div>
              <p class="text-[11px] text-gray-400">
                Kandilli Rasathanesi & UNESCO Akdeniz-Ege-Marmara Tsunami Servis Protokolü
              </p>
            </div>
          </div>

          <button id="btn-close-tsunami" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <div class="overflow-y-auto space-y-3.5 pr-1 text-xs">
          <!-- Active Threat Evaluation Banner -->
          <div class="p-4 rounded-2xl border ${assessment.bannerClass} flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10.5px] font-bold uppercase tracking-wider opacity-90">
                Sismik Tsunami Tehdit Seviyesi
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10.5px] font-black border uppercase ${assessment.badgeClass}">
                ${assessment.badgeText}
              </span>
            </div>

            <div class="text-base sm:text-lg font-black text-white leading-snug">
              ${assessment.title}
            </div>

            ${
              assessment.triggerEq
                ? `
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                <div class="p-2 rounded-xl bg-black/30">
                  <div class="text-[9.5px] text-gray-400 uppercase">Tetikleyen Deprem</div>
                  <div class="text-xs font-black text-white mt-0.5">M${assessment.triggerEq.mag.toFixed(1)}</div>
                  <div class="text-[9px] text-gray-400 truncate">${assessment.triggerEq.location}</div>
                </div>
                <div class="p-2 rounded-xl bg-black/30">
                  <div class="text-[9.5px] text-gray-400 uppercase">Merkez Üssü</div>
                  <div class="text-xs font-black text-amber-300 mt-0.5">${assessment.distKm} km</div>
                  <div class="text-[9px] text-gray-400 truncate">${assessment.seaBasin}</div>
                </div>
                <div class="p-2 rounded-xl bg-black/30">
                  <div class="text-[9.5px] text-gray-400 uppercase">Tahmini Hız</div>
                  <div class="text-xs font-black text-sky-300 mt-0.5">${assessment.waveSpeedKmH} km/s</div>
                  <div class="text-[9px] text-gray-400">Sığ su dalgası</div>
                </div>
                <div class="p-2 rounded-xl bg-black/30">
                  <div class="text-[9.5px] text-gray-400 uppercase">Dalga Varışı (ETA)</div>
                  <div class="text-xs font-black ${assessment.isArrived ? 'text-rose-400' : 'text-emerald-400'} mt-0.5">
                    ${assessment.isArrived ? 'KIYIDA ETKİLİ' : `${assessment.remainingMinutes} dk kaldı`}
                  </div>
                  <div class="text-[9px] text-gray-400">~${assessment.estimatedRunupMeters}m run-up</div>
                </div>
              </div>
            `
                : `
              <p class="text-[11px] text-gray-300 leading-relaxed">
                Son 4 saat içinde Türkiye deniz havzalarında (Marmara, Ege, Akdeniz, Karadeniz) tsunami oluşturabilecek M5.0+ sığ odaklı deniz depremi kaydedilmedi.
              </p>
            `
            }
          </div>

          <!-- Coast Proximity Radar Bar -->
          <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="p-2.5 rounded-xl ${isCoastalRisk ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}">
                ${Icons.navigation('w-5 h-5')}
              </span>
              <div>
                <div class="text-[10px] text-gray-400 font-bold uppercase">En Yakın Kıyı Çizgisine Mesafe</div>
                <div class="text-sm font-black text-white mt-0.5">
                  ${coastDistMeters < 1000 ? `${coastDistMeters} metre` : `${(coastDistMeters / 1000).toFixed(1)} km`}
                  <span class="text-[11px] font-normal ${isCoastalRisk ? 'text-amber-400' : 'text-emerald-400'} ml-1">
                    (${isCoastalRisk ? '⚠️ Kıyı Etki Alanı' : '🏔️ Güvenli İç Kesim'})
                  </span>
                </div>
              </div>
            </div>

            <button
              id="btn-toggle-tsunami-siren"
              type="button"
              class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-gray-200 flex items-center gap-2 active:scale-95 transition-all shrink-0"
            >
              ${Icons.siren('w-4 h-4')}
              <span>Tahliye Sirenini Çal / Test Et</span>
            </button>
          </div>

          <!-- Gold Rules Box (500m & +15m) -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
              <div class="text-[9.5px] text-cyan-300 font-bold uppercase">1. Altın Kural</div>
              <div class="text-lg font-black text-cyan-200 mt-0.5">500 Metre</div>
              <div class="text-[10px] text-cyan-100/80 mt-0.5">Kıyı şeridinden derhal içeri doğru uzaklaşın</div>
            </div>
            <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div class="text-[9.5px] text-emerald-300 font-bold uppercase">2. Altın Kural</div>
              <div class="text-lg font-black text-emerald-200 mt-0.5">+15 Metre</div>
              <div class="text-[10px] text-emerald-100/80 mt-0.5">Doğal tepe veya yüksek sağlam zemine çıkın</div>
            </div>
          </div>

          <!-- Mandatory Survival Protocols -->
          <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2 text-xs text-gray-300">
            <div class="text-rose-400 font-bold flex items-center gap-1.5">
              <span>🚨 Kandilli & ODTÜ Tsunami Kural Seti:</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Ani Deniz Çekilmesi:</strong> Deniz suyu hızla geri çekilip kayalar veya deniz tabanı görünürse, <strong>3 ila 10 dakika içinde dev dalgalar kıyıya vuracak demektir</strong>. Asla balık toplamak veya fotoğraf çekmek için sahile gitmeyin!</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Çoklu Dalga Prensibi:</strong> Tsunami tek bir dalga değildir. İlk dalga çoğunlukla en küçüğüdür. 2. ve 3. dalgalar <strong>15-45 dakika arayla</strong> çok daha yüksek enerjiyle gelir. Kıyıya dönmek için en az 6 saat bekleyin.</span>
            </div>
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-blue-400 font-bold">•</span>
              <span><strong>Marmara Riski:</strong> Marmara Denizi'nde derin çukurlar sebebiyle dalgalar <strong>5 ila 15 dakika</strong> gibi çok kısa bir sürede kıyılara (Adalar, Bakırköy, Avcılar, Yalova, Mudanya) ulaşabilir.</span>
            </div>
          </div>

          <!-- Nearest Safe High Ground Point -->
          ${
            nearestSafePoint
              ? `
            <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center justify-between">
              <div class="min-w-0 pr-2">
                <div class="font-bold text-white text-xs truncate max-w-[260px]">${nearestSafePoint.name}</div>
                <div class="text-[10.5px] text-emerald-300/80 mt-0.5">En Yakın Yüksek Toplanma Alanı • ~${distanceMeters} metre</div>
              </div>
              <button
                id="btn-navigate-high-ground"
                type="button"
                class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-black text-xs active:scale-95 transition-all shrink-0"
              >
                Rota Çiz
              </button>
            </div>
          `
              : ''
          }
        </div>

        <!-- Bottom Controls -->
        <div class="flex items-center gap-2 pt-3 mt-3 border-t border-white/10 shrink-0">
          <button
            id="btn-close-tsunami-bottom"
            type="button"
            class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-tsunami')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-close-tsunami-bottom')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-toggle-tsunami-siren')?.addEventListener('click', () => this.toggleSiren());

    this.container.querySelector('#btn-navigate-high-ground')?.addEventListener('click', () => {
      if (nearestSafePoint && this.onNavigateToPoint) {
        this.hide();
        this.onNavigateToPoint(nearestSafePoint);
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
