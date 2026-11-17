export function playCelebrationFanfare(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Bright uplifting major-9th ascending fanfare: C5 - E5 - G5 - B5 - C6 - E6
    const notes = [
      { freq: 523.25, delay: 0.0, duration: 0.16, gain: 0.12 },
      { freq: 659.25, delay: 0.08, duration: 0.16, gain: 0.12 },
      { freq: 783.99, delay: 0.16, duration: 0.18, gain: 0.13 },
      { freq: 987.77, delay: 0.25, duration: 0.2, gain: 0.11 },
      { freq: 1046.5, delay: 0.34, duration: 0.38, gain: 0.14 },
      { freq: 1318.51, delay: 0.44, duration: 0.42, gain: 0.1 },
    ];

    notes.forEach(({ freq, delay, duration, gain }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      noteGain.gain.setValueAtTime(0.0001, now + delay);
      noteGain.gain.exponentialRampToValueAtTime(gain, now + delay + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(noteGain);
      noteGain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.03);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Ignore audio errors in restricted or headless environments
  }
}
