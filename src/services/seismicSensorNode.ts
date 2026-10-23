// Crowdsourced Client Seismic Sensor Node & STA/LTA Trigger
// Turns device into a real-time micro-seismograph using DeviceMotionEvent

export interface AccelerationSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export interface SeismicNodeStatus {
  isSupported: boolean;
  isListening: boolean;
  currentMag: number;
  staLtaRatio: number;
  isTriggered: boolean;
  sampleRateHz: number;
  totalTriggerCount: number;
}

export type SeismicNodeListener = (status: SeismicNodeStatus, sample: AccelerationSample) => void;

class SeismicSensorNode {
  private isListening = false;
  private isSupported = typeof window !== 'undefined' && ('DeviceMotionEvent' in window);
  private listeners: Set<SeismicNodeListener> = new Set();

  private buffer: AccelerationSample[] = [];
  private maxBufferSize = 300; // ~5 seconds of 60Hz data

  // STA/LTA seismological trigger parameters
  private staSamples: number[] = [];
  private ltaSamples: number[] = [];
  private staWindowSize = 25;  // ~0.4s
  private ltaWindowSize = 480; // ~8.0s
  private triggerThreshold = 3.2; // Ratio threshold
  private minMagThreshold = 0.35; // m/s^2 above noise

  private currentRatio = 1.0;
  private isTriggered = false;
  private triggerCount = 0;
  private lastSampleTime = 0;
  private sampleCount = 0;
  private sampleRate = 0;
  private rateInterval: number | null = null;
  private simInterval: number | null = null;

  constructor() {
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
  }

  public async start(): Promise<boolean> {
    if (this.isListening) return true;

    // iOS 13+ requires explicit permission request
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const perm = await (DeviceMotionEvent as any).requestPermission();
        if (perm !== 'granted') return false;
      } catch {
        return false;
      }
    }

    window.addEventListener('devicemotion', this.handleDeviceMotion);
    this.isListening = true;

    this.rateInterval = window.setInterval(() => {
      this.sampleRate = this.sampleCount;
      this.sampleCount = 0;
    }, 1000);

    return true;
  }

  public stop(): void {
    if (!this.isListening) return;
    window.removeEventListener('devicemotion', this.handleDeviceMotion);
    if (this.rateInterval) {
      clearInterval(this.rateInterval);
      this.rateInterval = null;
    }
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.isListening = false;
  }

  public getBuffer(): AccelerationSample[] {
    return this.buffer;
  }

  public subscribe(listener: SeismicNodeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Desktop / Test simulation of micro-tremor shake
  public simulateTremor(intensity = 1.8): void {
    let t = 0;
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    if (this.simInterval) clearInterval(this.simInterval);

    this.simInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        clearInterval(this.simInterval!);
        this.simInterval = null;
        return;
      }

      t += 0.05;
      const decay = Math.exp(-elapsed / 1200);
      const amp = intensity * decay;

      const simX = Math.sin(t * 18) * amp + (Math.random() - 0.5) * 0.1;
      const simY = Math.cos(t * 14) * amp + (Math.random() - 0.5) * 0.1;
      const simZ = Math.sin(t * 22) * amp * 0.7 + (Math.random() - 0.5) * 0.1;

      this.processSample(simX, simY, simZ);
    }, 16);
  }

  private handleDeviceMotion(e: DeviceMotionEvent): void {
    const acc = e.acceleration || e.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    this.processSample(x, y, z);
  }

  private processSample(x: number, y: number, z: number): void {
    this.sampleCount++;
    const now = Date.now();

    // Instantaneous acceleration magnitude (approx vector norm)
    const rawMag = Math.sqrt(x * x + y * y + z * z);
    // Remove steady gravity component if accelerationIncludingGravity was used (~9.81)
    const mag = Math.abs(rawMag > 5 ? rawMag - 9.81 : rawMag);

    const sample: AccelerationSample = {
      timestamp: now,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      z: Number(z.toFixed(3)),
      magnitude: Number(mag.toFixed(3))
    };

    this.buffer.push(sample);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // STA/LTA calculation
    this.staSamples.push(mag);
    if (this.staSamples.length > this.staWindowSize) this.staSamples.shift();

    this.ltaSamples.push(mag);
    if (this.ltaSamples.length > this.ltaWindowSize) this.ltaSamples.shift();

    const staAvg = this.staSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.staSamples.length);
    const ltaAvg = this.ltaSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.ltaSamples.length);

    this.currentRatio = ltaAvg > 0.02 ? staAvg / ltaAvg : 1.0;

    const triggeredNow = this.currentRatio >= this.triggerThreshold && mag >= this.minMagThreshold;
    if (triggeredNow && !this.isTriggered) {
      this.triggerCount++;
    }
    this.isTriggered = triggeredNow;

    const status: SeismicNodeStatus = {
      isSupported: this.isSupported,
      isListening: this.isListening,
      currentMag: Number(mag.toFixed(3)),
      staLtaRatio: Number(this.currentRatio.toFixed(2)),
      isTriggered: this.isTriggered,
      sampleRateHz: this.sampleRate,
      totalTriggerCount: this.triggerCount
    };

    for (const listener of this.listeners) {
      try {
        listener(status, sample);
      } catch {}
    }
  }
}

export const seismicSensorNode = new SeismicSensorNode();
