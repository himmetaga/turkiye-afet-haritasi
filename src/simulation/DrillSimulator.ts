import { MapEngine } from '../map/mapEngine';
import { AssemblyPoint } from '../types';
import { haversineDistanceMeters, estimateWalkingMinutes, findNearestAssemblyPoints } from '../utils/geoMath';
import { soundSynthesizer } from '../services/soundSynthesizer';
import { Icons } from '../ui/icons';

export interface DrillScenario {
  id: string;
  name: string;
  location: string;
  mag: number;
  depthKm: number;
  coordinates: [number, number]; // [lng, lat]
  description: string;
}

export const DRILL_SCENARIOS: DrillScenario[] = [
  {
    id: 'marmara',
    name: 'Marmara 7.2 Senaryosu (Kumburgaz Fayı)',
    location: 'Marmara Denizi - Kumburgaz / Silivri Fayı',
    mag: 7.2,
    depthKm: 10,
    coordinates: [28.25, 40.85],
    description: 'İstanbul ve Marmara kıyılarını doğrudan etkileyen Mw 7.2 büyüklüğünde olası kırılma senaryosu.'
  },
  {
    id: 'izmir',
    name: 'İzmir Körfezi 6.8 Senaryosu (İzmir Fayı)',
    location: 'Ege Denizi - İzmir Körfezi açıkları',
    mag: 6.8,
    depthKm: 8,
    coordinates: [26.9, 38.45],
    description: 'İzmir Körfezi merkezli sığ odaklı Mw 6.8 büyüklüğünde yerel fay kırılma simülasyonu.'
  },
  {
    id: 'maras',
    name: 'Kahramanmaraş 7.8 Tarihsel Simülasyonu',
    location: 'Kahramanmaraş - Pazarcık Fayı',
    mag: 7.8,
    depthKm: 8.6,
    coordinates: [37.043, 37.288],
    description: '6 Şubat 2023 04:17 Pazarcık Mw 7.8 depreminin sismik dalga yayılımının yeniden canlandırılması.'
  },
  {
    id: 'custom',
    name: 'Haritada Seçilen Noktada Test Depremi',
    location: 'Kullanıcı Tanımlı Merkez Üssü',
    mag: 7.0,
    depthKm: 10,
    coordinates: [29.03, 40.98],
    description: 'Harita üzerinde tıklanan herhangi bir koordinattan sismik P ve S dalgası yayılım testi.'
  }
];

export class DrillSimulator {
  private mapEngine: MapEngine;
  private assemblyPoints: AssemblyPoint[];
  private userCoords: [number, number];
  private container: HTMLElement;

  private P_SPEED = 6.5; // km/s
  private S_SPEED = 3.8; // km/s

  private activeScenario: DrillScenario = DRILL_SCENARIOS[0];
  private isRunning = false;
  private isPaused = false;
  private speedMultiplier = 1;
  private soundEnabled = true;
  private elapsedSeconds = 0;
  private timer: number | null = null;
  private lastTickMs = 0;

  constructor(
    parent: HTMLElement,
    mapEngine: MapEngine,
    userCoords: [number, number],
    assemblyPoints: AssemblyPoint[]
  ) {
    this.mapEngine = mapEngine;
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;

    this.container = document.createElement('div');
    this.container.id = 'drill-simulator-hud';
    this.container.className =
      'fixed inset-x-0 top-0 z-40 pointer-events-auto transition-transform duration-300 -translate-y-full';
    parent.appendChild(this.container);

    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public setAssemblyPoints(points: AssemblyPoint[]): void {
    this.assemblyPoints = points;
  }

  public show(): void {
    this.container.classList.remove('-translate-y-full');
    this.container.classList.add('translate-y-0');
    this.startScenario(this.activeScenario);
  }

  public hide(): void {
    this.stop();
    this.container.classList.remove('translate-y-0');
    this.container.classList.add('-translate-y-full');
    this.mapEngine.clearEarlyWarningWaves();
  }

  public startScenario(scenario: DrillScenario): void {
    this.activeScenario = scenario;
    this.elapsedSeconds = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTickMs = performance.now();

    // Fly map to show both epicenter and user location
    const [uLng, uLat] = this.userCoords;
    const [eLng, eLat] = scenario.coordinates;
    const centerLng = (uLng + eLng) / 2;
    const centerLat = (uLat + eLat) / 2;
    this.mapEngine.flyTo([centerLng, centerLat], 8.5, 35, 0);

    // Draw escape route to nearest assembly point
    const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
    if (nearest.length > 0) {
      this.mapEngine.drawRoute(this.userCoords, nearest[0].point.coordinates);
    }

    if (this.soundEnabled) {
      soundSynthesizer.unlock();
      soundSynthesizer.playEarlyWarningSiren(1.5);
    }

    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = window.setInterval(() => this.tick(), 100);
    this.render();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.isPaused = false;
    this.elapsedSeconds = 0;
    this.mapEngine.clearEarlyWarningWaves();
    this.render();
  }

  private tick(): void {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    const dt = (now - this.lastTickMs) / 1000;
    this.lastTickMs = now;

    this.elapsedSeconds += dt * this.speedMultiplier;

    const pRadiusKm = this.elapsedSeconds * this.P_SPEED;
    const sRadiusKm = this.elapsedSeconds * this.S_SPEED;

    this.mapEngine.updateEarlyWarningWaves(this.activeScenario.coordinates, pRadiusKm, sRadiusKm);

    this.updateHUDLiveValues();
  }

  private updateHUDLiveValues(): void {
    const distM = haversineDistanceMeters(this.userCoords, this.activeScenario.coordinates);
    const distKm = distM / 1000;

    const pEta = Math.max(0, distKm / this.P_SPEED - this.elapsedSeconds);
    const sEta = Math.max(0, distKm / this.S_SPEED - this.elapsedSeconds);

    const timerEl = this.container.querySelector('#drill-elapsed-timer');
    if (timerEl) {
      timerEl.textContent = `t = ${this.elapsedSeconds.toFixed(1)} sn`;
    }

    const sCountdownEl = this.container.querySelector('#drill-s-countdown');
    if (sCountdownEl) {
      if (sEta <= 0) {
        sCountdownEl.textContent = 'ŞİDDETLİ SARSINTI ALANDASINIZ!';
        sCountdownEl.className = 'font-mono text-base font-black text-rose-400 animate-pulse';
      } else {
        sCountdownEl.textContent = `${Math.ceil(sEta)} sn`;
        sCountdownEl.className = 'font-mono text-xl font-black text-amber-400';
      }
    }

    const pStatusEl = this.container.querySelector('#drill-p-status');
    if (pStatusEl) {
      if (pEta <= 0) {
        pStatusEl.textContent = 'P-Dalgası Ulaştı (Hafif titreşim)';
        pStatusEl.className = 'text-xs font-semibold text-sky-400';
      } else {
        pStatusEl.textContent = `P-Dalgasına: ${Math.ceil(pEta)} sn`;
        pStatusEl.className = 'text-xs text-gray-300 font-mono';
      }
    }
  }

  private render(): void {
    const distM = haversineDistanceMeters(this.userCoords, this.activeScenario.coordinates);
    const distKm = (distM / 1000).toFixed(1);
    const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
    const nearestPoint = nearest[0]?.point || null;
    const escapeDist = nearest[0]?.distanceMeters || 0;
    const escapeMin = nearest[0]?.walkingMinutes || 1;

    this.container.innerHTML = `
      <div class="w-full bg-gradient-to-b from-obsidian-950/98 via-obsidian-950/92 to-obsidian-950/80 border-b border-rose-500/30 backdrop-blur-xl shadow-2xl p-2.5 sm:p-4 text-white">
        <!-- Top Emergency Drill Banner -->
        <div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/90 via-amber-600/90 to-red-600/90 text-white shadow-lg mb-2.5 animate-pulse">
          <div class="flex items-center gap-2 text-xs sm:text-sm font-black tracking-wide uppercase">
            <span>⚠️</span>
            <span>TATBİKAT SİMÜLASYONU (GERÇEK DEPREM DEĞİLDİR)</span>
          </div>
          <span class="text-[10px] font-mono uppercase bg-black/30 px-2 py-0.5 rounded font-bold">
            EĞİTİM & TATBİKAT MODU
          </span>
        </div>

        <!-- Main Simulator Control Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
          <!-- Scenario Selector -->
          <div class="flex items-center gap-2">
            <span class="text-rose-400 font-bold hidden sm:inline">Senaryo:</span>
            <select
              id="drill-scenario-select"
              class="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-xs focus:outline-none focus:border-rose-400 cursor-pointer"
            >
              ${DRILL_SCENARIOS.map(
                (s) =>
                  `<option value="${s.id}" class="bg-obsidian-950 text-white" ${
                    s.id === this.activeScenario.id ? 'selected' : ''
                  }>${s.name} (Mw ${s.mag.toFixed(1)})</option>`
              ).join('')}
            </select>
          </div>

          <!-- Live Timers & Wave Status -->
          <div class="flex items-center gap-3 sm:gap-6 bg-white/[0.04] px-3 py-1.5 rounded-2xl border border-white/10">
            <div>
              <span class="text-[10px] text-gray-400 block">Merkez Üssüne</span>
              <span class="font-mono font-bold text-white text-xs sm:text-sm">${distKm} km</span>
            </div>

            <div class="border-l border-white/10 pl-3">
              <span class="text-[10px] text-gray-400 block">P-Dalgası (6.5 km/s)</span>
              <span id="drill-p-status" class="text-xs text-sky-400 font-semibold">Hesaplanıyor</span>
            </div>

            <div class="border-l border-white/10 pl-3">
              <span class="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">Yıkıcı S-Dalgası</span>
              <span id="drill-s-countdown" class="font-mono text-base sm:text-xl font-black text-amber-400">0 sn</span>
            </div>

            <div class="border-l border-white/10 pl-3 hidden md:block">
              <span class="text-[10px] text-gray-400 block">Geçen Süre</span>
              <span id="drill-elapsed-timer" class="font-mono text-xs text-gray-300">t = 0.0 sn</span>
            </div>
          </div>

          <!-- Escape Route Preview -->
          <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span>🛡️</span>
            <div>
              <span class="text-[10px] text-emerald-400 font-bold uppercase block">Kaçış Rotası</span>
              <span class="text-xs font-semibold text-white truncate max-w-[170px] inline-block">
                ${nearestPoint ? nearestPoint.name : 'Toplanma Alanı'}
              </span>
              <span class="text-[10px] font-mono text-emerald-300 ml-1">(${escapeDist} m • ~${escapeMin} dk)</span>
            </div>
          </div>

          <!-- Controls: Speed, Pause, Sound, Exit -->
          <div class="flex items-center gap-2 ml-auto">
            <!-- Speed Multiplier Buttons -->
            <div class="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
              <button
                class="drill-speed-btn px-2 py-1 rounded-lg text-[10px] font-bold ${
                  this.speedMultiplier === 1 ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
                }"
                data-speed="1"
              >
                1x
              </button>
              <button
                class="drill-speed-btn px-2 py-1 rounded-lg text-[10px] font-bold ${
                  this.speedMultiplier === 2 ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
                }"
                data-speed="2"
              >
                2x
              </button>
              <button
                class="drill-speed-btn px-2 py-1 rounded-lg text-[10px] font-bold ${
                  this.speedMultiplier === 5 ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
                }"
                data-speed="5"
              >
                5x
              </button>
            </div>

            <!-- Pause / Play -->
            <button
              id="btn-drill-pause"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="${this.isPaused ? 'Devam Et' : 'Duraklat'}"
            >
              <span>${this.isPaused ? '▶️' : '⏸️'}</span>
            </button>

            <!-- Reset -->
            <button
              id="btn-drill-reset"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Başa Sar"
            >
              <span>🔄</span>
            </button>

            <!-- Sound toggle -->
            <button
              id="btn-drill-sound"
              class="p-2 rounded-xl ${
                this.soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'
              } transition-colors"
              title="Siren Sesi"
            >
              <span>${this.soundEnabled ? '🔊' : '🔇'}</span>
            </button>

            <!-- Exit Button -->
            <button
              id="btn-drill-exit"
              class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors shadow-glow-rose ml-1"
            >
              ${Icons.close('w-3.5 h-3.5')}
              <span>Tatbikatı Bitir</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Scenario Select
    const select = this.container.querySelector('#drill-scenario-select') as HTMLSelectElement | null;
    select?.addEventListener('change', (e) => {
      const id = (e.target as HTMLSelectElement).value;
      const found = DRILL_SCENARIOS.find((s) => s.id === id);
      if (found) {
        this.startScenario(found);
      }
    });

    // Speed Buttons
    const speedBtns = this.container.querySelectorAll('.drill-speed-btn');
    speedBtns.forEach((b) => {
      b.addEventListener('click', () => {
        const speed = Number((b as HTMLElement).dataset.speed || 1);
        this.speedMultiplier = speed;
        this.render();
      });
    });

    // Pause / Resume
    const pauseBtn = this.container.querySelector('#btn-drill-pause');
    pauseBtn?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      this.lastTickMs = performance.now();
      this.render();
    });

    // Reset
    const resetBtn = this.container.querySelector('#btn-drill-reset');
    resetBtn?.addEventListener('click', () => {
      this.startScenario(this.activeScenario);
    });

    // Sound Toggle
    const soundBtn = this.container.querySelector('#btn-drill-sound');
    soundBtn?.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.render();
    });

    // Exit
    const exitBtn = this.container.querySelector('#btn-drill-exit');
    exitBtn?.addEventListener('click', () => {
      this.hide();
    });
  }
}
