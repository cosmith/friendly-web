// ============================================================
// Sound Manager - Procedural audio using Web Audio API
// ============================================================

type SoundName = 'shoot' | 'hit' | 'death' | 'explode' | 'jump' | 'pickup';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.enabled = false;
        return null;
      }
    }
    return this.ctx;
  }

  play(name: SoundName): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    try {
      switch (name) {
        case 'shoot':
          this.playNoise(ctx, 0.05, 800, 200, 0.1);
          break;
        case 'hit':
          this.playNoise(ctx, 0.03, 400, 100, 0.08);
          break;
        case 'death':
          this.playNoise(ctx, 0.1, 300, 50, 0.2);
          this.playTone(ctx, 200, 80, 0.15, 'sawtooth');
          break;
        case 'explode':
          this.playNoise(ctx, 0.15, 200, 30, 0.3);
          this.playTone(ctx, 80, 20, 0.25, 'square');
          break;
        case 'jump':
          this.playTone(ctx, 300, 500, 0.08, 'sine');
          break;
        case 'pickup':
          this.playTone(ctx, 600, 900, 0.08, 'sine');
          setTimeout(() => this.playTone(ctx, 900, 1200, 0.06, 'sine'), 80);
          break;
      }
    } catch {
      // Silently fail on audio errors
    }
  }

  private playNoise(ctx: AudioContext, volume: number, freqStart: number, freqEnd: number, duration: number): void {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freqStart, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  private playTone(ctx: AudioContext, freqStart: number, freqEnd: number, duration: number, type: OscillatorType): void {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
