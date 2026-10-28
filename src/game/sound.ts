export type Cue = 'coin' | 'tap' | 'add' | 'whirr' | 'thud' | 'buy' | 'error' | 'print' | 'key';

type Note = { frequency: number; endFrequency?: number; duration: number; delay?: number; wave?: OscillatorType; volume?: number };

const CUES: Record<Cue, Note[]> = {
  coin: [
    { frequency: 988, duration: 0.06, wave: 'square', volume: 0.05 },
    { frequency: 1319, duration: 0.18, delay: 0.06, wave: 'square', volume: 0.05 },
  ],
  tap: [{ frequency: 520, endFrequency: 880, duration: 0.08, wave: 'triangle', volume: 0.12 }],
  key: [{ frequency: 1400, duration: 0.03, wave: 'square', volume: 0.03 }],
  add: [
    { frequency: 660, duration: 0.07, wave: 'triangle', volume: 0.12 },
    { frequency: 990, duration: 0.12, delay: 0.07, wave: 'triangle', volume: 0.12 },
  ],
  whirr: [{ frequency: 90, endFrequency: 140, duration: 0.7, wave: 'sawtooth', volume: 0.04 }],
  thud: [{ frequency: 140, endFrequency: 40, duration: 0.18, wave: 'sine', volume: 0.35 }],
  buy: [
    { frequency: 523, duration: 0.08, wave: 'triangle', volume: 0.1 },
    { frequency: 659, duration: 0.08, delay: 0.08, wave: 'triangle', volume: 0.1 },
    { frequency: 784, duration: 0.2, delay: 0.16, wave: 'triangle', volume: 0.1 },
  ],
  error: [{ frequency: 180, endFrequency: 120, duration: 0.22, wave: 'square', volume: 0.05 }],
  print: [{ frequency: 2400, endFrequency: 1800, duration: 0.04, wave: 'square', volume: 0.015 }],
};

let context: AudioContext | null = null;

const audioContext = () => {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  context ??= new AudioContext();
  return context;
};

const playNote = (audio: AudioContext, note: Note) => {
  const startAt = audio.currentTime + (note.delay ?? 0);
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = note.wave ?? 'sine';
  oscillator.frequency.setValueAtTime(note.frequency, startAt);
  if (note.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, startAt + note.duration);
  gain.gain.setValueAtTime(note.volume ?? 0.1, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + note.duration + 0.02);
};

export const play = (cue: Cue) => {
  try {
    const audio = audioContext();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume();
    CUES[cue].forEach((note) => playNote(audio, note));
  } catch (error) {
    console.warn('Sound effect failed', error);
  }
};
