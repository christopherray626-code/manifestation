import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { audioContext, wantAudio } from '@/lib/mix-layer';
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
  /** Phones: starts the tone again if it stopped by itself while it's meant to be on. Safe to call often. */
  check: () => void;
};

type WebState = {
  ctx?: AudioContext;
  gain?: GainNode;
  oscs: OscillatorNode[];
  freq: Frequency | 'none';
  volume: number;
  on: boolean;
  watch?: ReturnType<typeof setInterval>;
};

export function useToneLayer(files: Record<Frequency, number>): ToneLayer {
  const native = useAudioPlayer(null);
  const web = useRef<WebState>({ oscs: [], freq: 'none', volume: 0.15, on: false });
  // Phones: whether the tone is meant to be playing, and when it was last started again.
  const phone = useRef({ on: false, freq: 'none' as Frequency | 'none', kicked: 0 });

  /*
   * Android can stop one player on its own after a long listen (a notification taking the sound for a
   * moment, the player hitting an error at the loop point) while the rest of the tape plays on. Nothing
   * else would notice, so the tone goes quiet until pause and play. Start it again instead.
   */
  const kick = () => {
    const p = phone.current;
    if (!p.on || p.freq === 'none' || native.playing || native.isBuffering) return;
    const now = Date.now();
    if (now - p.kicked < 3000) return;
    p.kicked = now;
    // A player that ended or failed needs its file again before it will play.
    if (!native.isLoaded || (native.duration > 0 && native.currentTime >= native.duration - 0.05)) {
      native.replace(files[p.freq]);
      setLoop(native);
    }
    native.play();
  };

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = native.addListener('playbackStatusUpdate', (status) => {
      if (!status.playing && phone.current.on) setTimeout(kick, 1500);
    });
    return () => sub.remove();
    // kick reads everything it needs from refs and the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  if (Platform.OS !== 'web') {
    return {
      setFrequency: (f) => {
        phone.current.freq = f;
        if (f === 'none') return native.pause();
        native.replace(files[f]);
        setLoop(native);
      },
      play: () => {
        phone.current.on = true;
        phone.current.kicked = Date.now();
        native.play();
      },
      pause: () => {
        phone.current.on = false;
        native.pause();
      },
      setVolume: (v) => setVolume(native, v),
      check: kick,
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
    wantAudio('tone', w.on && w.freq !== 'none');
    if (w.freq === 'none' || !w.on) return;
    if (!w.ctx) {
      w.ctx = audioContext();
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
      // A tone should never end on its own while it's meant to be on; if one does, start it again.
      osc.onended = () => {
        if (w.on && w.oscs.includes(osc)) setTimeout(() => w.on && w.oscs.includes(osc) && startOscs(), 200);
      };
      osc.start();
      w.oscs.push(osc);
    });
    // Belt and braces: if the tones went missing while it's meant to be on, bring them back.
    if (!w.watch) {
      w.watch = setInterval(() => {
        if (w.on && w.freq !== 'none' && !w.oscs.length) startOscs();
      }, 4000);
    }
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
      wantAudio('tone', false);
      // Ease out before stopping: cutting a tone off mid-wave clicks.
      if (w.ctx && w.gain && w.oscs.length) {
        const g = w.gain.gain;
        g.cancelScheduledValues(w.ctx.currentTime);
        g.setValueAtTime(g.value, w.ctx.currentTime);
        g.linearRampToValueAtTime(0, w.ctx.currentTime + 0.15);
        const stopping = w.oscs;
        w.oscs = [];
        setTimeout(() => stopping.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } }), 180);
        return;
      }
      stopOscs();
    },
    setVolume: (v) => {
      w.volume = v;
      if (w.ctx && w.gain) w.gain.gain.setTargetAtTime(v, w.ctx.currentTime, 0.1);
    },
    // The web has its own watch (above).
    check: () => {},
  };
}

// Outside the hook, so changing the player's settings isn't mistaken for mutating hook state.
function setLoop(player: AudioPlayer) {
  player.loop = true;
}
function setVolume(player: AudioPlayer, v: number) {
  player.volume = v;
}
