import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useMixLayer } from '@/lib/mix-layer';
import { recordingUri } from '@/lib/recordings';
import { success } from '@/lib/haptics';
import { playable, release } from '@/lib/audio-io';
import { cancel, later, pulse } from '@/lib/clock';
import { stitch, type Stitched } from '@/lib/stitch';
import { useToneLayer } from '@/lib/tone';
import { naturalVoices, voiceAudioUri } from '@/lib/voices';
import { wav } from '@/lib/wav';
import type { Affirmation, BackgroundSound, Frequency, PlayerPrefs, TapeMode, Voice } from '@/lib/types';

export const SOUNDS: Record<Exclude<BackgroundSound, 'none'>, number> = {
  pad: require('@/assets/sounds/pad.wav'),
  bowls: require('@/assets/sounds/bowls.wav'),
  hum: require('@/assets/sounds/hum.wav'),
  space: require('@/assets/sounds/space.wav'),
  chimes: require('@/assets/sounds/chimes.wav'),
  ocean: require('@/assets/sounds/ocean.mp3'),
  rain: require('@/assets/sounds/rain.mp3'),
  birds: require('@/assets/sounds/birds.mp3'),
  brown: require('@/assets/sounds/brown.wav'),
};

export const FREQUENCY_FILES: Record<Frequency, number> = {
  'hz-396': require('@/assets/sounds/hz-396.wav'),
  'hz-432': require('@/assets/sounds/hz-432.wav'),
  'hz-528': require('@/assets/sounds/hz-528.wav'),
  'hz-639': require('@/assets/sounds/hz-639.wav'),
  'hz-741': require('@/assets/sounds/hz-741.wav'),
  'hz-963': require('@/assets/sounds/hz-963.wav'),
  'beat-delta': require('@/assets/sounds/beat-delta.wav'),
  'beat-theta': require('@/assets/sounds/beat-theta.wav'),
  'beat-alpha': require('@/assets/sounds/beat-alpha.wav'),
};

/** Frequencies sit quietly under the rest by default. */
export const FREQUENCY_DEFAULT_VOLUME = 0.15;

/** What each mode does by default. People can still change the levels and timer after. */
export const MODES: Record<TapeMode, { label: string; about: string; voiceVolume: number; soundVolume: number; gapMs: number }> = {
  spoken: {
    label: 'Spoken',
    about: 'Your affirmations read out clearly over a soft background.',
    voiceVolume: 1,
    soundVolume: 0.35,
    gapMs: 250,
  },
  subliminal: {
    label: 'Subliminal',
    about: 'Your affirmations layered far below the background. You hear the sound, not the words. Set a timer to fall asleep to it.',
    // About 30 dB under a full-volume background: present, but too quiet to make out.
    voiceVolume: 0.03,
    soundVolume: 1,
    gapMs: 150,
  },
};

/** Subliminal voice levels. Both sit well below the background. */
export const SUBLIMINAL_LEVELS = [
  { value: 0.015, label: 'Silent' },
  { value: 0.03, label: 'Faint' },
];

/** Overlapping voice tracks in a subliminal, each starting at a different affirmation. */
const SUBLIMINAL_LAYERS = 3;
// Long tapes are joined in chunks of this many lines (phones are far slower at it than browsers), the
// first one short so playing starts quickly.
const PHONE_CHUNK_LINES = 30;
const WEB_CHUNK_LINES = 120;
const FIRST_CHUNK_LINES = 8;
/** The layer counts offered for subliminals. */
// r/Subliminal: stacking 15-20 at once is common and there's no agreed limit; consistency matters more.
export const SUBLIMINAL_LAYER_CHOICES = [3, 5, 10, 15, 20];

export function modeOf(prefs: PlayerPrefs): TapeMode {
  // Older saves may say "sleep", which became subliminal with a timer.
  return prefs.mode in MODES ? prefs.mode : 'subliminal';
}

/** The audio file for an affirmation in this voice, if there is one. */
export function audioFor(item: Affirmation, voice: Voice) {
  if (voice === 'my-voice') return item.recording ? recordingUri(item.recording) : undefined;
  return voiceAudioUri(item.text, voice);
}

/*
 * The phone's built-in voices are the fallback for spoken tapes until natural voices exist.
 * Pick the most natural one of the right kind rather than bending the pitch.
 */
const FEMALE_NAMES = /samantha|ava|allison|zoe|susan|karen|moira|tessa|serena|victoria|nicky|joelle|jenny|aria|zira|female/i;
const MALE_NAMES = /daniel|alex\b|tom\b|aaron|evan|nathan|fred|arthur|oliver|guy\b|david|mark\b|rishi|\bmale\b/i;

function pickVoice(voices: Speech.Voice[], kind: 'calm-female' | 'deep-male') {
  const names = kind === 'calm-female' ? FEMALE_NAMES : MALE_NAMES;
  const english = voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
  const score = (v: Speech.Voice) =>
    (names.test(v.name) || names.test(v.identifier) ? 20 : 0) +
    (v.quality === Speech.VoiceQuality.Enhanced ? 10 : 0) +
    (/premium|enhanced|neural|natural|network/i.test(`${v.name} ${v.identifier}`) ? 6 : 0) +
    (v.language === 'en-US' || v.language === 'en_US' ? 2 : 0);
  const best = english.sort((a, b) => score(b) - score(a))[0];
  return best && names.test(`${best.name} ${best.identifier}`) ? best.identifier : undefined;
}

const wrap = (i: number, n: number) => ((i % n) + n) % n;

type HasVolume = { volume: number };
const glides = new WeakMap<HasVolume, ReturnType<typeof setInterval>>();
// Each player's level as we last set it. Asking the player itself makes JavaScript wait for the
// phone's main thread every time, which is exactly what stutters while a finger is on a slider.
const levels = new WeakMap<HasVolume, number>();
/** Sets a player's volume at once (stopping any glide). */
function setVolume(player: HasVolume, to: number) {
  const running = glides.get(player);
  if (running) clearInterval(running);
  glides.delete(player);
  levels.set(player, to);
  player.volume = to;
}
/**
 * Moves a player's volume to `to` in small steps over about a sixth of a second. With the app closed,
 * Android pauses JavaScript timers, so a glide would stall half-way: there it jumps straight to the level.
 */
function glideVolume(player: HasVolume, to: number) {
  const running = glides.get(player);
  if (running) clearInterval(running);
  glides.delete(player);
  const from = levels.get(player) ?? to;
  if (Math.abs(to - from) < 0.002 || AppState.currentState !== 'active') {
    levels.set(player, to);
    player.volume = to;
    return;
  }
  const steps = 10;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const now = from + ((to - from) * step) / steps;
    levels.set(player, now);
    player.volume = now;
    if (step >= steps) {
      clearInterval(timer);
      glides.delete(player);
    }
  }, 16);
  glides.set(player, timer);
}

const isWeb = Platform.OS === 'web';

// Two seconds of silence, looped by the "keeper" player (see useTape).
let quiet: Promise<string | null> | null = null;
function quietFile() {
  quiet ??= playable(wav([new Float32Array(16000)], 8000), 'quiet').catch(() => null);
  return quiet;
}

export function useTape({
  affirmations,
  voice,
  prefs,
  growing = false,
  title = '',
  onRemotePlay,
}: {
  affirmations: Affirmation[];
  voice: Voice;
  prefs: PlayerPrefs;
  /** What's playing, for the lock screen and the notification. */
  title?: string;
  /** Play pressed on the lock screen, the notification or headphones (defaults to play()). */
  onRemotePlay?: () => void;
  /** True while more lines' voices are still being made: the tape picks them up at the end of each pass. */
  growing?: boolean;
}) {
  const mode = modeOf(prefs);
  const background = useMixLayer(SOUNDS.pad, undefined, 'loop');
  const tone = useToneLayer(FREQUENCY_FILES);
  const ending = useAudioPlayer(null);
  /*
   * The keeper (phones): a silent loop that plays for as long as the tape does. It is the player the
   * phone shows on the lock screen and in the notification, which is also what lets Android keep the
   * sound going with the app closed (without it, Android stops everything after about three minutes).
   * Pause or play pressed out there pauses or plays it, and the tape follows. Its steady reports also
   * drive the timers that have to work with the app closed (see clock.ts).
   */
  const keeper = useAudioPlayer(null, { updateInterval: 500 });
  const keep = useRef({ want: false, seen: false, changedAt: 0, loaded: false, active: false, asked: false, title: '' });
  const frequency = prefs.frequency ?? 'none';
  const frequencyVolume = prefs.frequencyVolume ?? FREQUENCY_DEFAULT_VOLUME;
  // Frequent status updates on the voice players, so a line can hand over to the next on time.
  const layer0 = useAudioPlayer(null, { updateInterval: 100 });
  const layer1 = useAudioPlayer(null, { updateInterval: 100 });
  const layer2 = useAudioPlayer(null, { updateInterval: 100 });
  // The whole tape plays as one stitched recording (see stitch.ts).
  const track = useMixLayer(null, 200);
  const stitched = useRef<Stitched | null>(null);
  /*
   * How many affirmations have actually been played, counted as each one starts: one for a single
   * voice, and one per layer when several read at once (every layer says its own line).
   */
  const heard = useRef(0);
  // In the joined recording: which line was last counted, where it had got to, and its layers.
  const counted = useRef({ line: -1, time: 0, layers: 1 });
  // Which mode the joined recording that's playing was made for.
  const stitchedMode = useRef<TapeMode | null>(null);
  // Called when a chunk of a long tape finishes, to start the next one.
  const trackEnded = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  // A different goal or track starts from its first line.
  const firstId = affirmations[0]?.id;
  const [seenFirst, setSeenFirst] = useState(firstId);
  if (firstId !== seenFirst) {
    setSeenFirst(firstId);
    setIndex(0);
  }

  // Each start/stop bumps the run number, so callbacks from an old run do nothing.
  const run = useRef(0);
  const gapTimers = useRef<(number | null)[]>([null, null, null]);
  // The next chunk of a long tape, being joined while the current one plays.
  const upcomingChunk = useRef<Promise<Stitched | null> | null>(null);
  const onDone = useRef<((() => void) | null)[]>([null, null, null]);
  // What each voice player has loaded but not yet played.
  const loaded = useRef<(string | undefined)[]>([undefined, undefined, undefined]);
  // The timer's fade-out, while it runs (the id of its next step).
  const fade = useRef<number | null>(null);
  const voiceIds = useRef<{ 'calm-female'?: string; 'deep-male'?: string }>({});
  const latest = useRef({ affirmations, voice, prefs, mode, growing, title });
  latest.current = { affirmations, voice, prefs, mode, growing, title };
  const remote = useRef({ play: () => {}, pause: () => {} });

  /** Subliminals need real audio files: live phone speech can't be mixed quietly enough. */
  const ready =
    mode === 'spoken' ? affirmations.length > 0 : affirmations.some((a) => audioFor(a, voice)) || (voice !== 'my-voice' && naturalVoices);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        voiceIds.current = { 'calm-female': pickVoice(voices, 'calm-female'), 'deep-male': pickVoice(voices, 'deep-male') };
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const subs: { remove: () => void }[] = [layer0, layer1, layer2].map((player, k) =>
      player.addListener('playbackStatusUpdate', (status) => {
        pulse();
        const done = onDone.current[k];
        if (status.didJustFinish && done) {
          onDone.current[k] = null;
          done();
        }
      }),
    );
    // The stitched track: show whichever line it's on.
    subs.push(
      track.addListener('playbackStatusUpdate', (status) => {
        pulse();
        if (status.didJustFinish) trackEnded.current?.();
        const t = stitched.current;
        if (!t || !status.playing) return;
        let p = 0;
        while (p + 1 < t.starts.length && t.starts[p + 1] <= status.currentTime) p++;
        const c = counted.current;
        // Time going backwards means the recording looped (or was replayed): its first line is new again.
        if (status.currentTime < c.time - 0.5) c.line = -1;
        c.time = status.currentTime;
        if (p !== c.line) {
          c.line = p;
          heard.current += c.layers;
        }
        setIndex(t.order[p]);
      }),
    );
    // The timer's ending sound keeps the clock going for its own few seconds.
    subs.push(ending.addListener('playbackStatusUpdate', () => pulse()));
    // Back on screen: catch up on anything that came due meanwhile.
    subs.push(AppState.addEventListener('change', (state) => void (state === 'active' && pulse())));
    return () => subs.forEach((s) => s.remove());
  }, [layer0, layer1, layer2, track, ending]);

  // The keeper: pause or play from the lock screen, the notification, headphones, or the phone itself
  // (a call, another app taking over the sound) shows up here as the keeper stopping or starting.
  useEffect(() => {
    if (isWeb) return;
    const sub = keeper.addListener('playbackStatusUpdate', (status) => {
      pulse();
      const k = keep.current;
      // Just after we start or stop it ourselves, its reports can still be on their way.
      const now = Date.now();
      if (now - k.changedAt < 1200) {
        if (status.playing) k.seen = true;
        return;
      }
      if (status.playing) {
        k.seen = true;
        if (k.want) return;
        if (k.asked) {
          // Asked a moment ago and the tape didn't start (still making voices, or nothing to play).
          k.asked = false;
          k.changedAt = now;
          keeper.pause();
          return;
        }
        k.asked = true;
        k.changedAt = now;
        remote.current.play();
      } else if (k.want && k.seen && !status.isBuffering) {
        remote.current.pause();
      }
    });
    return () => sub.remove();
  }, [keeper]);

  useEffect(() => {
    const k = keep.current;
    if (isWeb || !k.active || k.title === title) return;
    k.title = title;
    try {
      keeper.updateLockScreenMetadata({ title: title || 'Manifest', artist: 'Your affirmations' });
    } catch {
      // The lock screen just keeps the old name.
    }
  }, [title, keeper]);

  function keeperStart() {
    if (isWeb) return;
    const k = keep.current;
    k.want = true;
    k.seen = false;
    k.asked = false;
    k.changedAt = Date.now();
    const go = () => {
      if (!k.want) return;
      if (!k.active) {
        k.active = true;
        k.title = latest.current.title;
        try {
          // "Live" hides the progress bar and seek buttons: the keeper is only a two-second loop.
          keeper.setActiveForLockScreen(true, { title: k.title || 'Manifest', artist: 'Your affirmations' }, { isLiveStream: true });
        } catch {
          k.active = false;
        }
      }
      keeper.play();
    };
    if (k.loaded) return go();
    quietFile().then((uri) => {
      if (!uri) return;
      if (!k.loaded) {
        keeper.replace({ uri });
        keeper.loop = true;
        k.loaded = true;
      }
      go();
    });
  }

  /** `clear` also takes the controls off the lock screen and lets Android stop keeping the app awake. */
  function keeperStop(clear: boolean) {
    if (isWeb) return;
    const k = keep.current;
    k.want = false;
    k.asked = false;
    k.changedAt = Date.now();
    keeper.pause();
    if (clear && k.active) {
      k.active = false;
      try {
        keeper.clearLockScreenControls();
      } catch {
        // Already gone.
      }
    }
  }

  // Background sound: swap it when changed, keep looping.
  useEffect(() => {
    if (prefs.sound === 'none') {
      background.pause();
      return;
    }
    background.replace(SOUNDS[prefs.sound] ?? SOUNDS.pad);
    background.loop = true;
    setVolume(background, prefs.soundVolume);
    if (playing) background.play();
    // Only react to a new sound choice here; volume and play state have their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.sound]);

  // The frequency layer works like the background: swap it when changed, keep looping.
  useEffect(() => {
    tone.setFrequency(frequency);
    if (frequency === 'none') return;
    tone.setVolume(frequencyVolume);
    if (playing) tone.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequency]);

  useEffect(() => {
    if (!fade.current) tone.setVolume(frequencyVolume);
    // tone is a fresh object each render; only the level matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequencyVolume]);

  // Glide to a new level rather than jumping: a sudden volume step on a playing sound is heard as a
  // crackle, and dragging a slider makes dozens of them.
  useEffect(() => {
    setLevels({ voiceVolume: prefs.voiceVolume, soundVolume: prefs.soundVolume });
    // setLevels is recreated each render; only the levels matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.soundVolume, prefs.voiceVolume, background, layer0, layer1, layer2, track]);

  /**
   * Moves the sound to new levels straight away, without saving anything: a slider calls this while it's
   * dragged, so the mix follows your finger without re-drawing the app, and saves once on release.
   */
  function setLevels(l: { voiceVolume?: number; soundVolume?: number; frequencyVolume?: number }, live = false) {
    // Under a finger the steps are already tiny, so they go straight to the sound: one call per move,
    // and only to the players that are in use. Otherwise glide.
    const set = live ? setVolume : glideVolume;
    if (l.voiceVolume !== undefined) {
      for (const player of live && stitched.current ? [track] : [track, layer0, layer1, layer2]) set(player, l.voiceVolume);
    }
    if (fade.current) return; // the timer's fade-out owns the other levels
    if (l.soundVolume !== undefined) set(background, l.soundVolume);
    if (l.frequencyVolume !== undefined) tone.setVolume(l.frequencyVolume);
  }

  useEffect(() => {
    if (stitched.current) track.setPlaybackRate(prefs.speed ?? 1, 'high');
  }, [prefs.speed, track]);

  function stopVoices() {
    run.current++;
    gapTimers.current.forEach(cancel);
    onDone.current = [null, null, null];
    Speech.stop();
    for (const player of [layer0, layer1, layer2, track]) player.pause();
    // The joined recordings are big files: free the one that was playing and the one being got ready.
    if (stitched.current) release(stitched.current.uri);
    upcomingChunk.current?.then((u) => u && release(u.uri));
    upcomingChunk.current = null;
    stitched.current = null;
    trackEnded.current = null;
  }

  function silence() {
    stopVoices();
    cancel(fade.current);
    fade.current = null;
  }

  function playFile(k: number, player: AudioPlayer, uri: string, volume: number, then: () => void) {
    onDone.current[k] = then;
    // Already loaded ahead of time (see preload), so it can start the instant the last line ends.
    if (loaded.current[k] !== uri) player.replace({ uri });
    loaded.current[k] = undefined;
    setVolume(player, volume);
    // Faster without going squeaky: the pitch stays the same.
    player.setPlaybackRate(latest.current.prefs.speed ?? 1, 'high');
    player.play();
  }

  /** Loads a file into a player without playing it, so it's ready when its turn comes. */
  function preload(k: number, player: AudioPlayer, uri: string | undefined) {
    if (!uri || loaded.current[k] === uri) return;
    player.replace({ uri });
    loaded.current[k] = uri;
  }

  /**
   * Spoken: one affirmation at a time, a recording when there is one, else the phone's voice. Two
   * players take turns: while one speaks, the next line loads on the other, so there's no gap to load.
   */
  function speakAt(i: number, thisRun: number) {
    if (thisRun !== run.current) return;
    const { affirmations: list, voice: v, prefs: p } = latest.current;
    if (!list.length) return;
    const at = wrap(i, list.length);
    const item = list[at];
    setIndex(at);
    heard.current += 1;
    const next = () => {
      if (thisRun !== run.current) return;
      gapTimers.current[0] = later(MODES.spoken.gapMs / (latest.current.prefs.speed ?? 1), () => speakAt(at + 1, thisRun));
    };

    const uri = audioFor(item, v);
    if (uri) {
      const k = at % 2;
      const players = [layer0, layer1];
      playFile(k, players[k], uri, p.voiceVolume, next);
      const after = list[wrap(at + 1, list.length)];
      if (list.length > 1) preload(1 - k, players[1 - k], audioFor(after, v));
      return;
    }
    // The phone's own voices only come in two kinds; pick the closer one.
    const kind = v.endsWith('-male') ? 'deep-male' : 'calm-female';
    const id = voiceIds.current[kind];
    Speech.speak(item.text, {
      voice: id,
      rate: 0.9 * (p.speed ?? 1),
      // Only nudge the pitch when the phone has no male voice to use.
      pitch: kind === 'deep-male' && !id ? 0.9 : 1,
      volume: p.voiceVolume,
      onDone: next,
      onError: next,
    });
  }

  /** Subliminal: each layer loops through the recordings on its own, overlapping the others. */
  function layerAt(k: number, i: number, thisRun: number) {
    if (thisRun !== run.current) return;
    const { affirmations: list, voice: v, prefs: p } = latest.current;
    const files = list.filter((a) => audioFor(a, v));
    if (!files.length) return;
    const at = wrap(i, files.length);
    if (k === 0) setIndex(list.indexOf(files[at]));
    heard.current += 1;
    playFile(k, [layer0, layer1, layer2][k], audioFor(files[at], v)!, p.voiceVolume, () => {
      if (thisRun !== run.current) return;
      gapTimers.current[k] = later(MODES.subliminal.gapMs, () => layerAt(k, at + 1, thisRun));
    });
  }

  /**
   * Join the lines into one recording and loop it from `from`. Returns false when it can't (some
   * lines have no audio yet and need the phone's voice), so the line-by-line players take over.
   *
   * A long tape is joined in chunks instead: the first is short so it starts quickly, and while one
   * plays the next is built, then takes over at the gap between two lines. That keeps the work and
   * memory small enough for a phone, whatever the length and however many layers.
   */
  function startTrack(from: number, thisRun: number, lead = false) {
    const { affirmations: list, voice: v, mode: m } = latest.current;
    const uris = list.map((a) => audioFor(a, v));
    const files = list.flatMap((a, i) => (uris[i] ? [i] : []));
    if (!files.length || (m === 'spoken' && files.length < list.length)) return false;
    const start = Math.max(files.indexOf(from), 0);
    const spokenLayers = Math.min(Math.max(latest.current.prefs.layers ?? 1, 1), 3, files.length);
    const layers = m === 'spoken' ? spokenLayers : Math.min(Math.max(latest.current.prefs.subLayers ?? SUBLIMINAL_LAYERS, 1), 20);

    /*
     * Pressing play should be heard at once, and joining even a short piece takes a moment. So with
     * `lead`, the first line plays straight from its own file, right now, and the joined recording is
     * made meanwhile, starting from the line after it. It takes over in the pause after that first line.
     */
    const leading = lead && files.length > 1;
    let afterLead: Promise<void> = Promise.resolve();
    if (leading) {
      const at = files[start];
      setIndex(at);
      heard.current += 1;
      afterLead = new Promise<void>((open) => {
        playFile(0, layer0, uris[at]!, latest.current.prefs.voiceVolume, () => {
          gapTimers.current[0] = later(MODES[m].gapMs / (latest.current.prefs.speed ?? 1), open);
        });
        // If that file never reports finishing, don't wait on it for ever.
        gapTimers.current[1] = later(30000, () => {
          layer0.pause();
          open();
        });
      });
    }

    // The lines in playing order, from where it starts, then cut into chunks.
    const first = leading ? start + 1 : start;
    const ordered = files.map((_, k) => files[(first + k) % files.length]);
    const size = Platform.OS === 'web' ? WEB_CHUNK_LINES : PHONE_CHUNK_LINES;
    // While more lines are still being made, even a short tape plays one pass at a time, so the lines
    // made meanwhile join at the end of each pass (rather than the first few looping forever).
    const growing = latest.current.growing;
    /*
     * Mixing layers is slow on a phone, and its cost is lines times layers: thirty lines in ten layers
     * took about ten seconds, all of it silence after pressing play. So a layered tape opens with a
     * short piece (the more layers, the fewer lines) that's ready in a moment, and the rest is mixed
     * while that plays.
     */
    const quick = layers > 1 ? Math.min(FIRST_CHUNK_LINES, Math.max(2, Math.round(24 / layers))) : FIRST_CHUNK_LINES;
    const chunks: number[][] = [];
    // The chunk that loops by itself once it's playing (no more work, and nothing to wait for), if any.
    let loopAt = -1;
    if (ordered.length <= size) {
      if (layers > 1 && ordered.length > quick && !growing) {
        // The short piece, then the whole tape carrying on from where the piece ends, looping.
        chunks.push(ordered.slice(0, quick));
        chunks.push([...ordered.slice(quick), ...ordered.slice(0, quick)]);
        loopAt = 1;
      } else {
        chunks.push(ordered);
        if (!growing) loopAt = 0;
      }
    } else {
      chunks.push(ordered.slice(0, quick));
      for (let k = quick; k < ordered.length; k += size) chunks.push(ordered.slice(k, k + size));
    }
    const passStartId = list[ordered[0]]?.id;
    const grew = () => {
      const now = latest.current;
      return now.affirmations.filter((a) => audioFor(a, now.voice)).length !== files.length;
    };

    const build = (c: number) =>
      stitch(
        chunks[c].map((i) => uris[i]!),
        0,
        MODES[m].gapMs,
        layers,
        m === 'spoken',
        () => thisRun !== run.current,
      ).then((t) => (t ? { ...t, order: t.order.map((p) => chunks[c][p]) } : null));

    const playChunk = (c: number, ready: Promise<Stitched | null>, wait: Promise<void> = Promise.resolve()) => {
      Promise.all([ready, wait]).then(([t]) => {
        if (!t) {
          // Joining failed (not just called off): play on the plain way, line by line, not silence.
          if (thisRun === run.current) {
            track.pause();
            lineByLine(chunks[c][0], thisRun);
          }
          return;
        }
        if (thisRun !== run.current) return release(t.uri);
        if (upcomingChunk.current === ready) upcomingChunk.current = null;
        gapTimers.current.forEach(cancel);
        const old = stitched.current;
        stitched.current = t;
        stitchedMode.current = m;
        counted.current = { line: -1, time: 0, layers };
        const looping = c === loopAt;
        track.replace({ uri: t.uri });
        track.loop = looping;
        setVolume(track, latest.current.prefs.voiceVolume);
        track.setPlaybackRate(latest.current.prefs.speed ?? 1, 'high');
        track.play();
        if (old) release(old.uri);
        if (looping) return;
        // Build the next chunk now, and hand over to it when this one finishes.
        const next = (c + 1) % chunks.length;
        const upcoming = chunks.length > 1 ? build(next) : null;
        upcomingChunk.current = upcoming;
        let upcomingReady = false;
        void upcoming?.then(() => (upcomingReady = true));
        const drop = () => {
          if (upcomingChunk.current === upcoming) upcomingChunk.current = null;
          void upcoming?.then((u) => u && release(u.uri));
        };
        const ended = () => {
          trackEnded.current = null;
          if (thisRun !== run.current) return drop();
          // End of a pass and new lines are ready: join the tape again with them in.
          if (next === 0 && grew()) {
            drop();
            const now = latest.current.affirmations;
            if (!startTrack(Math.max(now.findIndex((a) => a.id === passStartId), 0), thisRun)) startVoices(0);
            return;
          }
          if (upcoming && upcomingReady) {
            if (upcomingChunk.current === upcoming) upcomingChunk.current = null;
            return playChunk(next, upcoming);
          }
          // The next part is still being mixed (or a short tape is waiting on its next lines): play
          // this one again meanwhile, rather than going quiet.
          trackEnded.current = ended;
          void Promise.resolve(track.seekTo(0)).then(() => thisRun === run.current && track.play());
        };
        trackEnded.current = ended;
      });
    };
    trackEnded.current = null;
    const opening = build(0);
    // Kept where a stop can find it, in case it's stopped before the first line has finished.
    if (leading) upcomingChunk.current = opening;
    playChunk(0, opening, afterLead);
    return true;
  }

  function startVoices(from: number) {
    const thisRun = run.current;
    if (startTrack(from, thisRun, true)) return;
    lineByLine(from, thisRun);
  }

  /** The older way, one file after another on separate players: for when a tape can't be joined. */
  function lineByLine(from: number, thisRun: number) {
    if (latest.current.mode === 'spoken') {
      speakAt(from, thisRun);
      return;
    }
    const { affirmations: list, voice: v } = latest.current;
    const files = list.filter((a) => audioFor(a, v));
    const first = Math.max(files.indexOf(list[from]), 0);
    const count = files.length;
    const layers = Math.min(SUBLIMINAL_LAYERS, count);
    for (let k = 0; k < layers; k++) {
      // Spread the layers out so they say different affirmations at once, and stagger their starts.
      const startAt = first + Math.floor((count * k) / layers);
      gapTimers.current[k] = later(k * 700, () => layerAt(k, startAt, thisRun));
    }
  }

  function play() {
    // Check the files fresh: voice audio may have just been made before this call.
    const files = affirmations.filter((a) => audioFor(a, voice));
    if (mode === 'spoken' ? !affirmations.length : !files.length) return;
    silence();
    setPlaying(true);
    keeperStart();
    if (prefs.sound !== 'none') {
      background.loop = true;
      setVolume(background, prefs.soundVolume);
      background.play();
    }
    if (frequency !== 'none') {
      tone.setFrequency(frequency);
      tone.setVolume(frequencyVolume);
      tone.play();
    }
    setEndsAt(prefs.timer ? Date.now() + prefs.timer * 60000 : null);
    startVoices(index);
  }

  function stop(clearLockScreen: boolean) {
    silence();
    background.pause();
    tone.pause();
    keeperStop(clearLockScreen);
    setPlaying(false);
    setEndsAt(null);
  }
  const pause = () => stop(false);
  remote.current = { play: onRemotePlay ?? play, pause };

  function skip(by: number) {
    const count = affirmations.length;
    if (!count) return;
    const target = wrap(index + by, count);
    if (!playing || mode === 'subliminal') {
      setIndex(target);
      return;
    }
    const t = stitched.current;
    const p = t ? t.order.indexOf(target) : -1;
    if (t && p >= 0) {
      track.seekTo(t.starts[p]);
      setIndex(target);
      return;
    }
    stopVoices();
    setIndex(target);
    // A long tape skipping past its current chunk: join again from there.
    if (t) startVoices(target);
    else speakAt(target, run.current);
  }

  /** Changing the timer mid-tape restarts it from now. */
  function retime(minutes: number) {
    if (playing) setEndsAt(minutes ? Date.now() + minutes * 60000 : null);
  }

  /**
   * A change mid-tape that needs the voices joined again (mode, layers, which lines). Joining takes a
   * few seconds, more with many layers. When only the layers or lines changed, what's playing carries
   * on (looping) until the new recording is ready and then hands over, so the voice never drops out.
   * A change of mode stops it first: a subliminal's stack of voices at spoken volume would be a roar.
   */
  function restart() {
    if (!playing) return;
    // Let the new settings reach latest.current before starting again.
    setTimeout(() => {
      if (stitched.current && stitchedMode.current === latest.current.mode) {
        const thisRun = ++run.current;
        gapTimers.current.forEach(cancel);
        upcomingChunk.current?.then((u) => u && release(u.uri));
        upcomingChunk.current = null;
        trackEnded.current = null;
        track.loop = true;
        if (startTrack(index, thisRun)) return;
      }
      stopVoices();
      startVoices(index);
    }, 0);
  }

  /** The timer's ending: a soft sound and, on phones, a buzz, if they asked for them. */
  function timerEnded() {
    const p = latest.current.prefs;
    if (p.timerVibrate !== false) success();
    if (p.endSound && p.endSound !== 'none') {
      ending.replace(SOUNDS[p.endSound]);
      ending.volume = 0.6;
      ending.play();
      // The sounds are loops; let one ring out, then stop.
      later(7000, () => ending.pause());
    }
  }

  // Timer: stop the voices, fade the background out gently, then stop.
  useEffect(() => {
    if (!playing || !endsAt) return;
    const fadeMs = (prefs.fadeSec ?? 20) * 1000;
    // Timed by the clock, not by counting steps, so it ends on time with the app closed too.
    const wait = later(Math.max(endsAt - Date.now() - fadeMs, 0), () => {
      const start = levels.get(background) ?? latest.current.prefs.soundVolume;
      const began = Date.now();
      stopVoices();
      const step = () => {
        const done = Math.min(1, (Date.now() - began) / fadeMs);
        setVolume(background, start * (1 - done));
        tone.setVolume(frequencyVolume * (1 - done));
        if (done >= 1) {
          fade.current = null;
          // The night is over: take the controls off the lock screen too.
          stop(true);
          timerEnded();
          return;
        }
        fade.current = later(fadeMs / 40, step);
      };
      step();
    });
    return () => cancel(wait);
    // pause() and stopVoices() are recreated each render; the timer only depends on when it ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, endsAt]);

  useEffect(
    () => () => {
      run.current++;
      Speech.stop();
    },
    [],
  );

  // The list can get shorter under a tape (favorites only, a line removed): never point past its end.
  const at = Math.min(index, Math.max(affirmations.length - 1, 0));
  return { playing, index: at, endsAt, ready, mode, play, pause, skip, retime, restart, setLevels, heard: () => heard.current };
}
