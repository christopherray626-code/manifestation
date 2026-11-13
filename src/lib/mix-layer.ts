import { Asset } from 'expo-asset';
import { useAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { useState } from 'react';
import { Platform } from 'react-native';

/*
 * One sound in the mix (the voice track, the background). On phones it's an expo-audio player. On the
 * web it's an <audio> element routed through the Web Audio API, so its level is a gain that can be
 * eased: an <audio> element on its own cuts in, cuts out and changes volume instantly, and each instant
 * change is a click. Starts fade in, stops fade out, and volume changes glide.
 */

const isWeb = Platform.OS === 'web';
const FADE_IN = 0.12;
const FADE_OUT = 0.12;

let shared: AudioContext | undefined;
/** The one Web Audio context everything on the web plays through. */
export function audioContext() {
  if (!shared) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    shared = new Ctx();
  }
  return shared;
}

type Source = number | string | { uri: string } | null;
type Listener = (status: Pick<AudioStatus, 'playing' | 'currentTime' | 'duration' | 'didJustFinish'>) => void;

/** The parts of an AudioPlayer the tape uses, so the web version can stand in for it. */
export type MixLayer = Pick<AudioPlayer, 'play' | 'pause' | 'seekTo' | 'volume' | 'loop'> & {
  replace: (source: Source) => void;
  setPlaybackRate: (rate: number, quality?: 'high' | 'medium' | 'low') => void;
  addListener: (event: 'playbackStatusUpdate', listener: Listener) => { remove: () => void };
};

class WebLayer {
  private el = new Audio();
  private node?: MediaElementAudioSourceNode;
  private gain?: GainNode;
  private level = 1;
  private stopTimer?: ReturnType<typeof setTimeout>;
  private listeners = new Set<Listener>();

  constructor() {
    this.el.preload = 'auto';
    this.el.crossOrigin = 'anonymous';
    const tell = () => {
      const status = { playing: !this.el.paused, currentTime: this.el.currentTime, duration: this.el.duration || 0, didJustFinish: false };
      this.listeners.forEach((l) => l(status));
    };
    this.el.addEventListener('timeupdate', tell);
    this.el.addEventListener('ended', () =>
      this.listeners.forEach((l) => l({ playing: false, currentTime: this.el.currentTime, duration: this.el.duration || 0, didJustFinish: true })),
    );
  }

  /** Wires the element into Web Audio the first time it plays (a context needs a tap to start). */
  private wire() {
    if (this.gain) return this.gain;
    const ctx = audioContext();
    this.node = ctx.createMediaElementSource(this.el);
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.node.connect(this.gain).connect(ctx.destination);
    return this.gain;
  }

  private rampTo(value: number, seconds: number) {
    if (!this.gain) return;
    const ctx = audioContext();
    const g = this.gain.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(value, ctx.currentTime + seconds);
  }

  get volume() {
    return this.level;
  }
  set volume(v: number) {
    this.level = v;
    if (!this.el.paused) this.rampTo(v, 0.08);
  }
  get loop() {
    return this.el.loop;
  }
  set loop(on: boolean) {
    this.el.loop = on;
  }

  replace(source: Source) {
    if (source == null) return;
    // On the web a bundled sound arrives as its URL already; a number is an asset id.
    const uri =
      typeof source === 'string' ? source : typeof source === 'number' ? Asset.fromModule(source).uri : source.uri;
    if (!uri) return;
    if (this.el.src === new URL(uri, location.href).href) return;
    const wasPlaying = !this.el.paused;
    this.el.src = uri;
    if (wasPlaying) this.play();
  }

  play() {
    clearTimeout(this.stopTimer);
    const gain = this.wire();
    audioContext().resume().catch(() => {});
    if (this.el.paused) gain.gain.value = 0;
    this.el.play().catch(() => {});
    this.rampTo(this.level, FADE_IN);
  }

  pause() {
    if (this.el.paused) return;
    this.rampTo(0, FADE_OUT);
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => this.el.pause(), FADE_OUT * 1000 + 20);
  }

  async seekTo(seconds: number) {
    this.el.currentTime = seconds;
  }

  setPlaybackRate(rate: number) {
    // <audio> keeps the pitch the same when it speeds up.
    this.el.playbackRate = rate;
  }

  addListener(_event: 'playbackStatusUpdate', listener: Listener) {
    this.listeners.add(listener);
    return { remove: () => void this.listeners.delete(listener) };
  }
}

/** A player for one layer of the mix: expo-audio on phones, an eased Web Audio layer on the web. */
export function useMixLayer(source: Source, updateInterval?: number): MixLayer {
  const native = useAudioPlayer(isWeb ? null : source, updateInterval ? { updateInterval } : undefined);
  const [web] = useState(() => {
    if (!isWeb) return null;
    const layer = new WebLayer();
    layer.replace(source);
    return layer;
  });
  return (web ?? native) as unknown as MixLayer;
}
