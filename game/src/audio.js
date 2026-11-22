// Tiny synthesised sound effects with the Web Audio API: no audio files, no
// network. Everything is a short oscillator blip, started on a user gesture
// so browsers allow it. M toggles mute.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) context = new AC();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }

  function blip(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    muted() {
      return muted;
    },
    pickup() {
      blip(880, 0.12, 'sine', 0.12, 1320);
    },
    diamond() {
      blip(660, 0.1, 'triangle', 0.14, 990);
      setTimeout(() => blip(990, 0.16, 'triangle', 0.14, 1480), 90);
    },
    smoke() {
      blip(320, 0.25, 'sawtooth', 0.05, 90);
    },
    emp() {
      blip(1400, 0.3, 'square', 0.05, 220);
    },
    alarm() {
      blip(520, 0.22, 'square', 0.09, 780);
      setTimeout(() => blip(780, 0.22, 'square', 0.09, 520), 200);
    },
    caught() {
      blip(220, 0.5, 'sawtooth', 0.12, 55);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'triangle', 0.12), i * 110));
    },
    click() {
      blip(700, 0.05, 'sine', 0.08);
    },
  };
}
