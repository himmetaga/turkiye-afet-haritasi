class RescueWhistleService {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: any = null;

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(duration = 0.65, frequency = 3000): void {
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Subtle frequency modulation for authentic emergency whistle acoustic timbre
    osc.frequency.linearRampToValueAtTime(frequency + 40, ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(frequency - 20, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.95, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.95, ctx.currentTime + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playTone(0.65, 3000);

    // 3 blasts pattern (Standard SAR Emergency Signal)
    let blastCount = 0;
    this.intervalId = setInterval(() => {
      blastCount++;
      if (blastCount % 4 !== 0) {
        this.playTone(0.65, 3000);
      }
    }, 950);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const rescueWhistle = new RescueWhistleService();
