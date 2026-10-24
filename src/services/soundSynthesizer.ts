// Web Audio API Sound Synthesizer
// Generates critical disaster audio signals offline without external audio files.

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private whistleOsc: OscillatorNode | null = null;
  private whistleGain: GainNode | null = null;
  private isWhistleActive = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. P-Wave / S-Wave Early Warning Countdown Tick (1000 Hz beep)
  public playCountdownBeep(frequency = 950, durationMs = 120): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  }

  // 2. High-Urgency Disaster Early Warning Siren
  public playEarlyWarningSiren(durationSec = 4): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;

      // Frequency modulation (pitch sweep 440Hz -> 880Hz -> 440Hz)
      osc.frequency.setValueAtTime(440, now);
      for (let t = 0; t < durationSec; t += 0.8) {
        osc.frequency.linearRampToValueAtTime(880, now + t + 0.4);
        osc.frequency.linearRampToValueAtTime(440, now + t + 0.8);
      }

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + durationSec);
    } catch {}
  }

  // 3. High-Penetration Disaster Rescue Whistle (Afet Düdüğü)
  // Generates 2.9 kHz harmonic resonance designed to penetrate concrete rubble with low power.
  public startWhistle(frequency = 2900): void {
    if (this.isWhistleActive) return;
    try {
      const ctx = this.getAudioContext();
      this.whistleOsc = ctx.createOscillator();
      this.whistleGain = ctx.createGain();

      // Combined square/sine harmonic feel
      this.whistleOsc.type = 'triangle';
      this.whistleOsc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Micro vibrato for acoustic whistle character
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(14, ctx.currentTime); // 14 Hz flutter
      lfoGain.gain.setValueAtTime(45, ctx.currentTime);
      lfo.connect(this.whistleOsc.frequency);
      lfo.start();

      this.whistleGain.gain.setValueAtTime(0.7, ctx.currentTime);

      this.whistleOsc.connect(this.whistleGain);
      this.whistleGain.connect(ctx.destination);

      this.whistleOsc.start();
      this.isWhistleActive = true;
    } catch {}
  }

  public stopWhistle(): void {
    if (!this.isWhistleActive || !this.whistleGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.whistleGain.gain.setValueAtTime(this.whistleGain.gain.value, now);
      this.whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      setTimeout(() => {
        if (this.whistleOsc) {
          try {
            this.whistleOsc.stop();
            this.whistleOsc.disconnect();
          } catch {}
          this.whistleOsc = null;
        }
        this.isWhistleActive = false;
      }, 60);
    } catch {
      this.isWhistleActive = false;
    }
  }

  public toggleWhistle(): boolean {
    if (this.isWhistleActive) {
      this.stopWhistle();
      return false;
    } else {
      this.startWhistle();
      return true;
    }
  }

  public isWhistleRunning(): boolean {
    return this.isWhistleActive;
  }

  /**
   * Must be called synchronously inside a user gesture (tap/click).
   * Resumes the AudioContext and plays an inaudible blip so that later,
   * gesture-less playback (e.g. Night Watch alarm at 03:00) is allowed on iOS/Android.
   */
  public unlock(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  private alarmInterval: number | null = null;

  /** Full-volume continuous alarm: 2.9 kHz whistle + repeating 440↔880 Hz siren sweep. */
  public startAlarm(): void {
    if (this.alarmInterval !== null) return;
    this.startWhistle(2900);
    this.playEarlyWarningSiren(4);
    this.alarmInterval = window.setInterval(() => this.playEarlyWarningSiren(4), 4000);
  }

  public stopAlarm(): void {
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.stopWhistle();
  }

  public isAlarmRunning(): boolean {
    return this.alarmInterval !== null;
  }

  // 4. International Morse Code SOS Audio (... --- ...)
  public playMorseSOS(onFinished?: () => void): void {
    try {
      const ctx = this.getAudioContext();
      const dot = 0.12;
      const dash = dot * 3;
      const intraChar = dot;
      const interChar = dot * 3;

      const scheduleTone = (start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2600, start);
        gain.gain.setValueAtTime(0.5, start);
        gain.gain.setValueAtTime(0, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      let t = ctx.currentTime + 0.05;

      // S: . . .
      for (let i = 0; i < 3; i++) {
        scheduleTone(t, dot);
        t += dot + intraChar;
      }
      t += interChar;

      // O: - - -
      for (let i = 0; i < 3; i++) {
        scheduleTone(t, dash);
        t += dash + intraChar;
      }
      t += interChar;

      // S: . . .
      for (let i = 0; i < 3; i++) {
        scheduleTone(t, dot);
        t += dot + intraChar;
      }

      if (onFinished) {
        setTimeout(onFinished, (t - ctx.currentTime) * 1000);
      }
    } catch {}
  }

  // 5. Geophone Resonant Rubble-Penetrating Beacon (3.5 kHz Acoustic Pulses)
  // Designed for AFAD / INSARAG seismic listening devices (geophones) with battery conservation.
  private geophoneInterval: number | null = null;
  private isGeophoneActive = false;

  public startGeophoneBeacon(intervalSec = 15): void {
    if (this.isGeophoneActive) return;
    this.isGeophoneActive = true;

    const fireBurst = () => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;
        // Fire 3 sharp 100ms resonant clicks at 3500 Hz
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.25;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(3500, t);
          gain.gain.setValueAtTime(0.85, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
        }

        // Hardware haptic vibration pulse if supported
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([120, 100, 120, 100, 250]);
          } catch {}
        }
      } catch {}
    };

    fireBurst();
    this.geophoneInterval = window.setInterval(fireBurst, intervalSec * 1000);
  }

  public stopGeophoneBeacon(): void {
    if (this.geophoneInterval !== null) {
      clearInterval(this.geophoneInterval);
      this.geophoneInterval = null;
    }
    this.isGeophoneActive = false;
  }

  public isGeophoneRunning(): boolean {
    return this.isGeophoneActive;
  }

  // 6. K9 SAR Dog Ultrasonic Whistle (18.5 kHz High-Frequency Modulation)
  // Direct acoustic attractor for Search and Rescue dogs without human auditory fatigue.
  private dogOsc: OscillatorNode | null = null;
  private dogGain: GainNode | null = null;
  private isDogWhistleActive = false;

  public startDogWhistle(): void {
    if (this.isDogWhistleActive) return;
    try {
      const ctx = this.getAudioContext();
      this.dogOsc = ctx.createOscillator();
      this.dogGain = ctx.createGain();

      this.dogOsc.type = 'sine';
      this.dogOsc.frequency.setValueAtTime(18500, ctx.currentTime);

      // 6 Hz micro-frequency warble to attract canine attention
      const warble = ctx.createOscillator();
      const warbleGain = ctx.createGain();
      warble.frequency.setValueAtTime(6, ctx.currentTime);
      warbleGain.gain.setValueAtTime(400, ctx.currentTime);
      warble.connect(this.dogOsc.frequency);
      warble.start();

      this.dogGain.gain.setValueAtTime(0.7, ctx.currentTime);
      this.dogOsc.connect(this.dogGain);
      this.dogGain.connect(ctx.destination);

      this.dogOsc.start();
      this.isDogWhistleActive = true;
    } catch {}
  }

  public stopDogWhistle(): void {
    if (!this.isDogWhistleActive || !this.dogGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.dogGain.gain.setValueAtTime(this.dogGain.gain.value, now);
      this.dogGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      setTimeout(() => {
        if (this.dogOsc) {
          try {
            this.dogOsc.stop();
            this.dogOsc.disconnect();
          } catch {}
          this.dogOsc = null;
        }
        this.isDogWhistleActive = false;
      }, 60);
    } catch {
      this.isDogWhistleActive = false;
    }
  }

  public isDogWhistleRunning(): boolean {
    return this.isDogWhistleActive;
  }
}

export const soundSynthesizer = new SoundSynthesizer();

