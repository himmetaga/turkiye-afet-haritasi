// Night Seismograph Watch ("Gece Sismograf Nöbeti")
// ---------------------------------------------------------------------------
// Keeps the phone awake on the charger as a bedside seismic sentinel:
//  1. iOS 13+ DeviceMotionEvent.requestPermission() (must run inside a tap)
//  2. Screen Wake Lock (re-acquired automatically when the tab becomes visible)
//  3. AudioContext unlock so the alarm can fire at 03:00 without a tap
//  4. Sustained STA/LTA trigger (debounced) OR network early-warning → full alarm
// ---------------------------------------------------------------------------

import { seismicSensorNode, SeismicNodeStatus } from './seismicSensorNode';
import { soundSynthesizer } from './soundSynthesizer';
import { earlyWarningEngine } from './earlyWarningEngine';

export type NightWatchPhase = 'idle' | 'arming' | 'watching' | 'alarm';
export type MotionPermission = 'granted' | 'denied' | 'not-required' | 'unsupported';
export type AlarmSource = 'sensor' | 'network' | null;

export interface NightWatchState {
  phase: NightWatchPhase;
  motionPermission: MotionPermission;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  sensorReceiving: boolean;
  staLtaRatio: number;
  currentMag: number;
  startedAt: number | null;
  armingRemainingSec: number;
  alarmSource: AlarmSource;
  alarmCount: number;
}

export type NightWatchListener = (state: NightWatchState) => void;

/** LTA window (~8 s) must fill before STA/LTA is meaningful; plus time to put the phone down. */
const ARMING_MS = 12_000;
/** Trigger must persist this long (with gaps < TRIGGER_GAP_MS) to count as shaking, not a bump. */
const SUSTAIN_MS = 700;
const TRIGGER_GAP_MS = 300;

class NightWatchService {
  private listeners = new Set<NightWatchListener>();
  private wakeLock: any = null;
  private unsubSensor: (() => void) | null = null;
  private unsubEarlyWarning: (() => void) | null = null;
  private armingTimer: number | null = null;
  private sensorCheckTimer: number | null = null;
  private triggerStart = 0;
  private lastTriggerAt = 0;
  private lastSampleAt = 0;
  private lastPatchAt = 0;

  private state: NightWatchState = {
    phase: 'idle',
    motionPermission: 'unsupported',
    wakeLockActive: false,
    wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    sensorReceiving: false,
    staLtaRatio: 1,
    currentMag: 0,
    startedAt: null,
    armingRemainingSec: 0,
    alarmSource: null,
    alarmCount: 0
  };

  constructor() {
    this.handleVisibility = this.handleVisibility.bind(this);
  }

  public getState(): NightWatchState {
    return { ...this.state };
  }

  public subscribe(listener: NightWatchListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /**
   * iOS Safari requires DeviceMotionEvent.requestPermission() to be invoked
   * directly from a user gesture. Call this as the FIRST await in a click handler.
   */
  public async requestMotionPermission(): Promise<MotionPermission> {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      return 'unsupported';
    }
    const DME: any = (window as any).DeviceMotionEvent;
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        return result === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }
    return 'not-required';
  }

  /** Start the watch. Must be called from a user gesture (tap). */
  public async start(): Promise<NightWatchState> {
    if (this.state.phase !== 'idle') return this.getState();

    // Synchronous gesture-bound work first (audio unlock), then the permission prompt.
    soundSynthesizer.unlock();
    const permission = await this.requestMotionPermission();

    this.patch({
      motionPermission: permission,
      phase: 'arming',
      startedAt: Date.now(),
      armingRemainingSec: Math.ceil(ARMING_MS / 1000),
      alarmSource: null,
      sensorReceiving: false
    });

    if (permission === 'granted' || permission === 'not-required') {
      // seismicSensorNode.start() will see permission already granted on iOS.
      await seismicSensorNode.start();
      this.unsubSensor = seismicSensorNode.subscribe((status) => this.onSensor(status));
    }

    // Network-based early warning also fires the bedside alarm.
    this.unsubEarlyWarning = earlyWarningEngine.subscribe((ew) => {
      if (ew.isActive && this.state.phase === 'watching') this.triggerAlarm('network');
    });

    await this.acquireWakeLock();
    document.addEventListener('visibilitychange', this.handleVisibility);

    const armEnd = Date.now() + ARMING_MS;
    this.armingTimer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((armEnd - Date.now()) / 1000));
      if (remaining <= 0) {
        if (this.armingTimer) clearInterval(this.armingTimer);
        this.armingTimer = null;
        this.triggerStart = 0;
        this.patch({ phase: 'watching', armingRemainingSec: 0 });
      } else {
        this.patch({ armingRemainingSec: remaining });
      }
    }, 250);

    // Detect devices that never deliver motion samples (desktop browsers).
    this.sensorCheckTimer = window.setInterval(() => {
      const receiving = Date.now() - this.lastSampleAt < 2500;
      if (receiving !== this.state.sensorReceiving) this.patch({ sensorReceiving: receiving });
    }, 1000);

    return this.getState();
  }

  public stop(): void {
    if (this.state.phase === 'idle') return;
    soundSynthesizer.stopAlarm();
    this.unsubSensor?.();
    this.unsubSensor = null;
    this.unsubEarlyWarning?.();
    this.unsubEarlyWarning = null;
    seismicSensorNode.stop();
    if (this.armingTimer) clearInterval(this.armingTimer);
    if (this.sensorCheckTimer) clearInterval(this.sensorCheckTimer);
    this.armingTimer = null;
    this.sensorCheckTimer = null;
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.releaseWakeLock();
    try { navigator.vibrate?.(0); } catch {}
    this.patch({ phase: 'idle', startedAt: null, alarmSource: null, armingRemainingSec: 0 });
  }

  /** Silence the alarm and go back to watching (false alarm / shaking over). */
  public silenceAlarm(): void {
    if (this.state.phase !== 'alarm') return;
    soundSynthesizer.stopAlarm();
    try { navigator.vibrate?.(0); } catch {}
    this.triggerStart = 0;
    this.patch({ phase: 'watching', alarmSource: null });
  }

  /** Manual test of the full alarm path (sound + flash) from the intro screen. */
  public testAlarm(durationMs = 1800): void {
    soundSynthesizer.unlock();
    soundSynthesizer.playEarlyWarningSiren(durationMs / 1000);
  }

  private onSensor(status: SeismicNodeStatus): void {
    const now = Date.now();
    this.lastSampleAt = now;

    // Throttle UI patches to ~10 Hz; the HUD reads the raw buffer for drawing.
    if (now - this.lastPatchAt > 100) {
      this.lastPatchAt = now;
      this.patch({ staLtaRatio: status.staLtaRatio, currentMag: status.currentMag, sensorReceiving: true });
    }

    if (this.state.phase !== 'watching') return;

    if (status.isTriggered) {
      if (!this.triggerStart || now - this.lastTriggerAt > TRIGGER_GAP_MS) {
        this.triggerStart = now;
      }
      this.lastTriggerAt = now;
      if (now - this.triggerStart >= SUSTAIN_MS) {
        this.triggerAlarm('sensor');
      }
    } else if (this.triggerStart && now - this.lastTriggerAt > TRIGGER_GAP_MS) {
      this.triggerStart = 0;
    }
  }

  private triggerAlarm(source: Exclude<AlarmSource, null>): void {
    if (this.state.phase === 'alarm') return;
    soundSynthesizer.startAlarm();
    try { navigator.vibrate?.([600, 200, 600, 200, 600, 200, 1200]); } catch {}
    this.patch({ phase: 'alarm', alarmSource: source, alarmCount: this.state.alarmCount + 1 });
  }

  private async acquireWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) {
      this.patch({ wakeLockActive: false, wakeLockSupported: false });
      return;
    }
    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      this.patch({ wakeLockActive: true });
      this.wakeLock.addEventListener?.('release', () => {
        this.wakeLock = null;
        this.patch({ wakeLockActive: false });
      });
    } catch {
      this.patch({ wakeLockActive: false });
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
    this.patch({ wakeLockActive: false });
  }

  /** The browser drops the wake lock whenever the page is hidden; take it back on return. */
  private handleVisibility(): void {
    if (document.visibilityState === 'visible' && this.state.phase !== 'idle' && !this.wakeLock) {
      this.acquireWakeLock();
    }
  }

  private patch(partial: Partial<NightWatchState>): void {
    this.state = { ...this.state, ...partial };
    const snapshot = this.getState();
    for (const l of this.listeners) {
      try { l(snapshot); } catch {}
    }
  }
}

export const nightWatchService = new NightWatchService();
