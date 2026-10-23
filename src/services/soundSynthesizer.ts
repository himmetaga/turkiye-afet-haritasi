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
}

export const soundSynthesizer = new SoundSynthesizer();
