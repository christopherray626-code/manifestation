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

/**
 * A background loop on the web, played from memory with Web Audio's own looping, which is seamless.
 * An <audio> element pauses for a moment each time it loops, and MP3s carry a sliver of silence at
 * each end, so a one-minute loop stuttered every minute. The quiet ends are trimmed off here.
 */
class WebLoop {
  private buffer?: AudioBuffer;
  private loading?: Promise<void>;
  private uri = '';
  private gain?: GainNode;
  private node?: AudioBufferSourceNode;
  private level = 1;
  private startedAt = 0;
  private offset = 0;
  private loopStart = 0;
  private loopEnd = 0;
  private wantPlaying = false;
  loop = true;

  private out() {
    if (!this.gain) {
      const ctx = audioContext();
      this.gain = ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(ctx.destination);
    }
    return this.gain;
  }

  private rampTo(value: number, seconds: number) {
    const ctx = audioContext();
    const g = this.out().gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(value, ctx.currentTime + seconds);
  }

  get volume() {
    return this.level;
  }
  set volume(v: number) {
    this.level = v;
    if (this.node) this.rampTo(v, 0.08);
  }

  replace(source: Source) {
    const uri = resolve(source);
    if (!uri || uri === this.uri) return;
    this.uri = uri;
    const wasPlaying = this.wantPlaying;
    this.stopNode(0.25);
    this.buffer = undefined;
    this.offset = 0;
    this.loading = (async () => {
      try {
        const bytes = await (await fetch(uri)).arrayBuffer();
        const buffer = await audioContext().decodeAudioData(bytes);
        if (uri !== this.uri) return;
        this.buffer = buffer;
        [this.loopStart, this.loopEnd] = audibleSpan(buffer);
        this.offset = this.loopStart;
      } catch {
        // Couldn't load it; the layer stays quiet.
      }
    })();
    if (wasPlaying) this.play();
  }

  play() {
    this.wantPlaying = true;
    audioContext().resume().catch(() => {});
    if (this.node) return this.rampTo(this.level, FADE_IN);
    const start = () => {
      if (!this.wantPlaying || this.node || !this.buffer) return;
      const ctx = audioContext();
      const node = ctx.createBufferSource();
      node.buffer = this.buffer;
      node.loop = true;
      node.loopStart = this.loopStart;
      node.loopEnd = this.loopEnd;
      node.connect(this.out());
      const at = Math.min(Math.max(this.offset, this.loopStart), this.loopEnd - 0.01);
      node.start(0, at);
      this.node = node;
      this.startedAt = ctx.currentTime - (at - this.loopStart);
      this.out().gain.value = 0;
      this.rampTo(this.level, FADE_IN);
    };
    if (this.buffer) start();
    else this.loading?.then(start);
  }

  private stopNode(fade: number) {
    const node = this.node;
    if (!node) return;
    const ctx = audioContext();
    const span = this.loopEnd - this.loopStart || 1;
    this.offset = this.loopStart + ((ctx.currentTime - this.startedAt) % span);
    this.node = undefined;
    this.rampTo(0, fade);
    setTimeout(() => {
      try {
        node.stop();
      } catch {
        // Already stopped.
      }
      node.disconnect();
    }, fade * 1000 + 30);
  }

  pause() {
    this.wantPlaying = false;
    this.stopNode(FADE_OUT);
  }

  async seekTo(seconds: number) {
    this.offset = this.loopStart + seconds;
  }

  setPlaybackRate() {
    // Backgrounds always play at normal speed.
  }

  addListener() {
    return { remove: () => {} };
  }
}

/** Where the sound is: from its first audible sample to its last, so the loop has no silent gap. */
function audibleSpan(buffer: AudioBuffer): [number, number] {
  const data = buffer.getChannelData(0);
  const quiet = 0.0005;
  let first = 0;
  while (first < data.length && Math.abs(data[first]) < quiet) first++;
  let last = data.length - 1;
  while (last > first && Math.abs(data[last]) < quiet) last--;
  // Only trim what looks like encoder padding (well under a second); keep real quiet passages.
  const max = buffer.sampleRate * 0.25;
  if (first > max) first = 0;
  if (data.length - 1 - last > max) last = data.length - 1;
  return [first / buffer.sampleRate, (last + 1) / buffer.sampleRate];
}

function resolve(source: Source) {
  if (source == null) return '';
  return typeof source === 'string' ? source : typeof source === 'number' ? Asset.fromModule(source).uri : source.uri;
}

/** A player for one layer of the mix: expo-audio on phones, an eased Web Audio layer on the web. */
export function useMixLayer(source: Source, updateInterval?: number, kind: 'stream' | 'loop' = 'stream'): MixLayer {
  const native = useAudioPlayer(isWeb ? null : source, updateInterval ? { updateInterval } : undefined);
  const [web] = useState(() => {
    if (!isWeb) return null;
    const layer = kind === 'loop' ? new WebLoop() : new WebLayer();
    layer.replace(source);
    return layer;
  });
  return (web ?? native) as unknown as MixLayer;
}
