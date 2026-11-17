import { Asset } from 'expo-asset';
import { useAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { useState } from 'react';
import { Platform } from 'react-native';

import { decode, keepLoop, keptLoop } from '@/lib/audio-io';
import { later } from '@/lib/clock';
import { hash } from '@/lib/today';
import { wav } from '@/lib/wav';

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
/** What is playing through the context right now, so it's woken again if the phone pauses it. */
const wanted = new Set<string>();

/** Marks something as playing (or not) through the shared context. */
export function wantAudio(key: string, on: boolean) {
  if (on) wanted.add(key);
  else wanted.delete(key);
  if (on) wake();
}

// Phones can suspend or "interrupt" Web Audio mid-play (a notification, a call, Bluetooth reconnecting,
// the screen going off) and don't always resume it. Anything still meant to be playing wakes it up.
function wake() {
  if (shared && wanted.size && shared.state !== 'running' && shared.state !== 'closed') shared.resume().catch(() => {});
}

/** The one Web Audio context everything on the web plays through. */
export function audioContext() {
  if (!shared) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    shared = new Ctx();
    shared.addEventListener('statechange', () => setTimeout(wake, 300));
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('pointerdown', wake, true);
    setInterval(wake, 3000);
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
        this.buffer = seamless(buffer);
        this.loopStart = 0;
        this.loopEnd = this.buffer.duration;
        this.offset = 0;
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

const BLEND_SEC = 1.5;

/**
 * A copy of the sound that loops without a seam. Its quiet ends are cut, then its last moments are
 * blended into its first (equal-power, so the level doesn't dip): wherever the end of the file and the
 * start don't quite match, jumping from one to the other clicks, and on rain or the ocean that's heard
 * as a burst of static.
 */
function seamless(buffer: AudioBuffer): AudioBuffer {
  const [from, to] = audibleSpan(buffer);
  const rate = buffer.sampleRate;
  const a = Math.round(from * rate);
  const n = Math.round(to * rate) - a;
  const blend = Math.min(Math.round(BLEND_SEC * rate), Math.floor(n / 4));
  if (blend < 2) return buffer;
  const length = n - blend;
  const out = audioContext().createBuffer(buffer.numberOfChannels, length, rate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c).subarray(a, a + n);
    const dst = out.getChannelData(c);
    // The loop plays src[blend..n); its last `blend` samples fade into src[0..blend), which leads
    // straight back into src[blend], where the loop starts again.
    for (let j = 0; j < length; j++) {
      const tail = length - blend;
      if (j < tail) dst[j] = src[blend + j];
      else {
        const k = (j - tail) / blend;
        dst[j] = src[blend + j] * Math.cos((k * Math.PI) / 2) + src[j - tail] * Math.sin((k * Math.PI) / 2);
      }
    }
  }
  return out;
}

function resolve(source: Source) {
  if (source == null) return '';
  return typeof source === 'string' ? source : typeof source === 'number' ? Asset.fromModule(source).uri : source.uri;
}

/** A player for one layer of the mix: expo-audio on phones, an eased Web Audio layer on the web. */
export function useMixLayer(source: Source, updateInterval?: number, kind: 'stream' | 'loop' = 'stream'): MixLayer {
  const loop = kind === 'loop';
  // A phone loop starts empty: its seamless copy is made first (see NativeLoop).
  const native = useAudioPlayer(isWeb || loop ? null : source, updateInterval ? { updateInterval } : undefined);
  const [layer] = useState(() => {
    if (!isWeb) {
      if (!loop) return null;
      const nativeLoop = new NativeLoop(native);
      nativeLoop.replace(source);
      return nativeLoop;
    }
    const web = loop ? new WebLoop() : new WebLayer();
    web.replace(source);
    return web;
  });
  return (layer ?? native) as unknown as MixLayer;
}

/*
 * Phones: a background loop plays a seamless copy of the sound, blended end-into-start like the web's
 * (see blendLoop) and saved as a WAV, which the player loops without a gap. Each sound is made once and
 * kept on the phone; until it's ready the layer stays quiet, then starts if it was asked to play.
 */
const nativeLoops = new Map<string, Promise<string | null>>();
function seamlessFile(uri: string) {
  let got = nativeLoops.get(uri);
  if (!got) {
    got = (async () => {
      // Named after where the sound comes from (which changes if the sound itself is ever replaced).
      const key = `loop2-${hash(uri).toString(36)}-${uri.length}`;
      const kept = keptLoop(key);
      if (kept) return kept;
      const audio = await decode(uri);
      if (!audio) return null;
      const channels = blendLoop(audio.channels, audio.sampleRate);
      return keepLoop(wav(channels, audio.sampleRate), key);
    })().catch(() => null);
    nativeLoops.set(uri, got);
  }
  return got;
}

class NativeLoop {
  private uri = '';
  private want = false;
  private ready = false;
  loop = true;
  constructor(private player: AudioPlayer) {}

  get volume() {
    return this.player.volume;
  }
  set volume(v: number) {
    this.player.volume = v;
  }

  replace(source: Source) {
    const uri = resolve(source);
    if (!uri || uri === this.uri) return;
    this.uri = uri;
    this.ready = false;
    this.player.pause();
    (async () => {
      // Opening the app shouldn't compete with getting a sound ready that nobody has asked to hear yet.
      // (later(), not a plain timer: it mustn't be left waiting if the phone is locked meanwhile.)
      if (!this.want) await new Promise<void>((r) => later(1500, r));
      if (uri !== this.uri) return;
      // Bundled sounds have to be on the phone's disk before they can be decoded.
      const local = typeof source === 'number' ? ((await Asset.fromModule(source).downloadAsync()).localUri ?? uri) : uri;
      const file = (await seamlessFile(local)) ?? local;
      if (uri !== this.uri) return;
      this.player.replace({ uri: file });
      this.player.loop = true;
      this.ready = true;
      if (this.want) this.player.play();
    })().catch(() => {});
  }

  play() {
    this.want = true;
    if (this.ready) this.player.play();
  }

  pause() {
    this.want = false;
    this.player.pause();
  }

  seekTo(seconds: number) {
    return this.player.seekTo(seconds);
  }

  setPlaybackRate() {
    // Backgrounds always play at normal speed.
  }

  addListener(event: 'playbackStatusUpdate', listener: Listener) {
    return this.player.addListener(event, listener);
  }
}

/** The same blend as seamless() (above), on plain sample arrays, for phones. */
function blendLoop(channels: Float32Array[], rate: number): Float32Array[] {
  const data = channels[0];
  const quiet = 0.0005;
  let first = 0;
  while (first < data.length && Math.abs(data[first]) < quiet) first++;
  let last = data.length - 1;
  while (last > first && Math.abs(data[last]) < quiet) last--;
  const max = rate * 0.25;
  if (first > max) first = 0;
  if (data.length - 1 - last > max) last = data.length - 1;
  const n = last + 1 - first;
  const blend = Math.min(Math.round(BLEND_SEC * rate), Math.floor(n / 4));
  if (blend < 2) return channels;
  const length = n - blend;
  const tail = length - blend;
  return channels.map((channel) => {
    const src = channel.subarray(first, first + n);
    const dst = new Float32Array(length);
    dst.set(src.subarray(blend, blend + tail));
    for (let j = tail; j < length; j++) {
      const k = (j - tail) / blend;
      dst[j] = src[blend + j] * Math.cos((k * Math.PI) / 2) + src[j - tail] * Math.sin((k * Math.PI) / 2);
    }
    return dst;
  });
}
