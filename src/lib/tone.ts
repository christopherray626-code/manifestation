import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useRef } from 'react';
import { Platform } from 'react-native';

import type { Frequency } from '@/lib/types';

/*
 * The frequency layer under a tape. On the web it's generated live with the Web Audio API: a pure tone
 * (or one in each ear for the dreamy ones) that never stops and restarts, so it can't dip or click the
 * way a short looping file does. On phones it plays the generated files from assets/sounds.
 */

/** Hz for each ear: one value plays in both, two play left and right (the slow pulse needs headphones). */
const HZ: Record<Frequency, [number] | [number, number]> = {
  'hz-396': [396],
  'hz-432': [432],
  'hz-528': [528],
  'hz-639': [639],
  'hz-741': [741],
  'hz-963': [963],
  'beat-delta': [200, 203],
  'beat-theta': [200, 206],
  'beat-alpha': [200, 210],
};

export type ToneLayer = {
  setFrequency: (f: Frequency | 'none') => void;
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
};

type WebState = { ctx?: AudioContext; gain?: GainNode; oscs: OscillatorNode[]; freq: Frequency | 'none'; volume: number; on: boolean };

export function useToneLayer(files: Record<Frequency, number>): ToneLayer {
  const native = useAudioPlayer(null);
  const web = useRef<WebState>({ oscs: [], freq: 'none', volume: 0.15, on: false });

  if (Platform.OS !== 'web') {
    return {
      setFrequency: (f) => {
        if (f === 'none') return native.pause();
        native.replace(files[f]);
        setLoop(native);
      },
      play: () => native.play(),
      pause: () => native.pause(),
      setVolume: (v) => setVolume(native, v),
    };
  }

  const w = web.current;
  const stopOscs = () => {
    w.oscs.forEach((o) => {
      try {
        o.stop();
      } catch {
        // Already stopped.
      }
    });
    w.oscs = [];
  };
  const startOscs = () => {
    stopOscs();
    if (w.freq === 'none' || !w.on) return;
    if (!w.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      w.ctx = new Ctx();
      w.gain = w.ctx.createGain();
      w.gain.connect(w.ctx.destination);
    }
    const ctx = w.ctx;
    ctx.resume().catch(() => {});
    // Fade in over a second so it arrives softly.
    w.gain!.gain.cancelScheduledValues(ctx.currentTime);
    w.gain!.gain.setValueAtTime(0, ctx.currentTime);
    w.gain!.gain.linearRampToValueAtTime(w.volume, ctx.currentTime + 1);
    const hz = HZ[w.freq];
    hz.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      let out: AudioNode = osc;
      if (hz.length === 2) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = i === 0 ? -1 : 1;
        osc.connect(pan);
        out = pan;
      }
      out.connect(w.gain!);
      osc.start();
      w.oscs.push(osc);
    });
  };

  return {
    setFrequency: (f) => {
      w.freq = f;
      startOscs();
    },
    play: () => {
      w.on = true;
      startOscs();
    },
    pause: () => {
      w.on = false;
      stopOscs();
    },
    setVolume: (v) => {
      w.volume = v;
      if (w.ctx && w.gain) w.gain.gain.setTargetAtTime(v, w.ctx.currentTime, 0.1);
    },
  };
}

// Outside the hook, so changing the player's settings isn't mistaken for mutating hook state.
function setLoop(player: AudioPlayer) {
  player.loop = true;
}
function setVolume(player: AudioPlayer, v: number) {
  player.volume = v;
}
