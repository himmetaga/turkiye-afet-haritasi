import { Earthquake } from '../types';
import { haversineDistanceMeters } from '../utils/geoMath';
import { soundSynthesizer } from './soundSynthesizer';

export interface EarlyWarningStatus {
  isActive: boolean;
  earthquake: Earthquake | null;
  distanceKm: number;
  pWaveEtaSeconds: number;
  sWaveEtaSeconds: number;
  pWaveRadiusKm: number;
  sWaveRadiusKm: number;
  estimatedMMI: string;
  intensityLevel: 'low' | 'moderate' | 'strong' | 'severe';
  protocolText: string;
  hasPWaveArrived: boolean;
  hasSWaveArrived: boolean;
}

export type EarlyWarningListener = (status: EarlyWarningStatus) => void;

class EarlyWarningEngine {
  private P_WAVE_VELOCITY_KM_S = 6.5; // Primary compression wave speed
  private S_WAVE_VELOCITY_KM_S = 3.8; // Secondary destructive shear wave speed

  private activeEarthquake: Earthquake | null = null;
  private originTimestamp = 0;
  private timer: number | null = null;
  private listeners: Set<EarlyWarningListener> = new Set();
  private userCoords: [number, number] = [29.03367, 40.98527]; // Kadikoy default
  private soundEnabled = true;
  private lastBeepSec = -1;

  public setUserCoordinates(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public subscribe(listener: EarlyWarningListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public startWarning(eq: Earthquake, originTimeMs = Date.now()): void {
    this.activeEarthquake = eq;
    this.originTimestamp = originTimeMs;

    if (this.soundEnabled) {
      soundSynthesizer.playEarlyWarningSiren(3.5);
    }

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.tick();
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  public dismiss(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeEarthquake = null;
    this.lastBeepSec = -1;

    const idleStatus: EarlyWarningStatus = {
      isActive: false,
      earthquake: null,
      distanceKm: 0,
      pWaveEtaSeconds: 0,
      sWaveEtaSeconds: 0,
      pWaveRadiusKm: 0,
      sWaveRadiusKm: 0,
      estimatedMMI: 'I',
      intensityLevel: 'low',
      protocolText: 'Sistem tetikte ve aktif izlemede.',
      hasPWaveArrived: false,
      hasSWaveArrived: false
    };

    this.notify(idleStatus);
  }

  public getWaveRadii(): { pRadiusKm: number; sRadiusKm: number; center: [number, number] | null } {
    if (!this.activeEarthquake) {
      return { pRadiusKm: 0, sRadiusKm: 0, center: null };
    }
    const elapsedSec = (Date.now() - this.originTimestamp) / 1000;
    return {
      pRadiusKm: elapsedSec * this.P_WAVE_VELOCITY_KM_S,
      sRadiusKm: elapsedSec * this.S_WAVE_VELOCITY_KM_S,
      center: this.activeEarthquake.coordinates
    };
  }

  private tick(): void {
    if (!this.activeEarthquake) return;

    const elapsedSec = Math.max(0, (Date.now() - this.originTimestamp) / 1000);
    const dist2D = haversineDistanceMeters(this.userCoords, this.activeEarthquake.coordinates) / 1000;
    const hypoDist = Math.sqrt(dist2D * dist2D + (this.activeEarthquake.depth || 10) ** 2);

    const pTravelTime = hypoDist / this.P_WAVE_VELOCITY_KM_S;
    const sTravelTime = hypoDist / this.S_WAVE_VELOCITY_KM_S;

    const pWaveEta = Math.max(0, Math.ceil(pTravelTime - elapsedSec));
    const sWaveEta = Math.max(0, Math.ceil(sTravelTime - elapsedSec));

    const pRadius = elapsedSec * this.P_WAVE_VELOCITY_KM_S;
    const sRadius = elapsedSec * this.S_WAVE_VELOCITY_KM_S;

    const hasPWaveArrived = elapsedSec >= pTravelTime;
    const hasSWaveArrived = elapsedSec >= sTravelTime;

    // Countdown audio beeps on last 10 seconds of S-Wave
    if (this.soundEnabled && sWaveEta <= 10 && sWaveEta > 0 && sWaveEta !== this.lastBeepSec) {
      this.lastBeepSec = sWaveEta;
      soundSynthesizer.playCountdownBeep(1200 - sWaveEta * 50, 90);
    }

    // Estimate MMI Intensity
    // Empirical: MMI ~ 1.5 * M - 2.8 * log10(hypoDist + 5) + 1.2
    const rawMMI = 1.5 * this.activeEarthquake.mag - 2.8 * Math.log10(Math.max(1, hypoDist) + 5) + 1.2;
    const mmiValue = Math.min(12, Math.max(1, Math.round(rawMMI)));
    const mmiRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][mmiValue - 1];

    let intensityLevel: 'low' | 'moderate' | 'strong' | 'severe' = 'low';
    let protocolText = 'Hafif titreşim hissedilebilir. Güvenli bölgede kalın.';

    if (mmiValue >= 8) {
      intensityLevel = 'severe';
      protocolText = 'ŞİDDETLİ YIKICI SARSINTI! DERHAL ÇÖK-KAPAN-TUTUN!';
    } else if (mmiValue >= 6) {
      intensityLevel = 'strong';
      protocolText = 'GÜÇLÜ SARSINTI BEKLENİYOR! Pencerelerden ve dolaplardan uzaklaşın!';
    } else if (mmiValue >= 4) {
      intensityLevel = 'moderate';
      protocolText = 'Hissedilir sarsıntı bekleniyor. Sağlam bir masa altına çökün.';
    }

    // Auto-dismiss after wave passes + 45 seconds of shaking
    if (elapsedSec > sTravelTime + 45) {
      this.dismiss();
      return;
    }

    const status: EarlyWarningStatus = {
      isActive: true,
      earthquake: this.activeEarthquake,
      distanceKm: Number(dist2D.toFixed(1)),
      pWaveEtaSeconds: pWaveEta,
      sWaveEtaSeconds: sWaveEta,
      pWaveRadiusKm: Number(pRadius.toFixed(1)),
      sWaveRadiusKm: Number(sRadius.toFixed(1)),
      estimatedMMI: mmiRoman,
      intensityLevel,
      protocolText,
      hasPWaveArrived,
      hasSWaveArrived
    };

    this.notify(status);
  }

  private notify(status: EarlyWarningStatus): void {
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch {}
    }
  }
}

export const earlyWarningEngine = new EarlyWarningEngine();
