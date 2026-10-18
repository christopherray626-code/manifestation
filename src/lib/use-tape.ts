import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';

import { recordingUri } from '@/lib/recordings';
import { success } from '@/lib/haptics';
import { useToneLayer } from '@/lib/tone';
import { naturalVoices, voiceAudioUri } from '@/lib/voices';
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

// How much of each voice clip's tail to skip into the next line (it's silence).
const TAIL_SEC = 0.35;
const wrap = (i: number, n: number) => ((i % n) + n) % n;

export function useTape({
  affirmations,
  voice,
  prefs,
}: {
  affirmations: Affirmation[];
  voice: Voice;
  prefs: PlayerPrefs;
}) {
  const mode = modeOf(prefs);
  const background = useAudioPlayer(SOUNDS.pad);
  const tone = useToneLayer(FREQUENCY_FILES);
  const ending = useAudioPlayer(null);
  const frequency = prefs.frequency ?? 'none';
  const frequencyVolume = prefs.frequencyVolume ?? FREQUENCY_DEFAULT_VOLUME;
  // Frequent status updates on the voice players, so a line can hand over to the next on time.
  const layer0 = useAudioPlayer(null, { updateInterval: 100 });
  const layer1 = useAudioPlayer(null, { updateInterval: 100 });
  const layer2 = useAudioPlayer(null, { updateInterval: 100 });
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
  const gapTimers = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null]);
  const onDone = useRef<((() => void) | null)[]>([null, null, null]);
  // What each voice player has loaded but not yet played.
  const loaded = useRef<(string | undefined)[]>([undefined, undefined, undefined]);
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceIds = useRef<{ 'calm-female'?: string; 'deep-male'?: string }>({});
  const latest = useRef({ affirmations, voice, prefs, mode });
  latest.current = { affirmations, voice, prefs, mode };

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
    const subs = [layer0, layer1, layer2].map((player, k) =>
      player.addListener('playbackStatusUpdate', (status) => {
        const done = onDone.current[k];
        // Spoken tapes move on just before the clip ends: the voice recordings trail off with a
        // little silence, and waiting it out made the gaps between lines feel long.
        const nearlyDone =
          k < 2 &&
          latest.current.mode === 'spoken' &&
          status.duration > 1 &&
          status.currentTime >= status.duration - TAIL_SEC * (latest.current.prefs.speed ?? 1);
        if ((status.didJustFinish || nearlyDone) && done) {
          onDone.current[k] = null;
          done();
        }
      }),
    );
    return () => subs.forEach((s) => s.remove());
  }, [layer0, layer1, layer2]);

  // Background sound: swap it when changed, keep looping.
  useEffect(() => {
    if (prefs.sound === 'none') {
      background.pause();
      return;
    }
    background.replace(SOUNDS[prefs.sound] ?? SOUNDS.pad);
    background.loop = true;
    background.volume = prefs.soundVolume;
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

  useEffect(() => {
    if (!fade.current) background.volume = prefs.soundVolume;
    for (const player of [layer0, layer1, layer2]) player.volume = prefs.voiceVolume;
  }, [prefs.soundVolume, prefs.voiceVolume, background, layer0, layer1, layer2]);

  function stopVoices() {
    run.current++;
    gapTimers.current.forEach((t) => t && clearTimeout(t));
    onDone.current = [null, null, null];
    Speech.stop();
    for (const player of [layer0, layer1, layer2]) player.pause();
  }

  function silence() {
    stopVoices();
    if (fade.current) clearInterval(fade.current);
    fade.current = null;
  }

  function playFile(k: number, player: AudioPlayer, uri: string, volume: number, then: () => void) {
    onDone.current[k] = then;
    // Already loaded ahead of time (see preload), so it can start the instant the last line ends.
    if (loaded.current[k] !== uri) player.replace({ uri });
    loaded.current[k] = undefined;
    player.volume = volume;
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
    const next = () => {
      if (thisRun !== run.current) return;
      gapTimers.current[0] = setTimeout(() => speakAt(at + 1, thisRun), MODES.spoken.gapMs / (latest.current.prefs.speed ?? 1));
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
    playFile(k, [layer0, layer1, layer2][k], audioFor(files[at], v)!, p.voiceVolume, () => {
      if (thisRun !== run.current) return;
      gapTimers.current[k] = setTimeout(() => layerAt(k, at + 1, thisRun), MODES.subliminal.gapMs);
    });
  }

  function startVoices(from: number) {
    const thisRun = run.current;
    if (latest.current.mode === 'spoken') {
      speakAt(from, thisRun);
      return;
    }
    const { affirmations: list, voice: v } = latest.current;
    const count = list.filter((a) => audioFor(a, v)).length;
    const layers = Math.min(SUBLIMINAL_LAYERS, count);
    for (let k = 0; k < layers; k++) {
      // Spread the layers out so they say different affirmations at once, and stagger their starts.
      const startAt = from + Math.floor((count * k) / layers);
      gapTimers.current[k] = setTimeout(() => layerAt(k, startAt, thisRun), k * 700);
    }
  }

  function play() {
    // Check the files fresh: voice audio may have just been made before this call.
    const files = affirmations.filter((a) => audioFor(a, voice));
    if (mode === 'spoken' ? !affirmations.length : !files.length) return;
    silence();
    setPlaying(true);
    if (prefs.sound !== 'none') {
      background.loop = true;
      background.volume = prefs.soundVolume;
      background.play();
    }
    if (frequency !== 'none') {
      tone.setFrequency(frequency);
      tone.setVolume(frequencyVolume);
      tone.play();
    }
    setEndsAt(prefs.timer ? Date.now() + prefs.timer * 60000 : null);
    startVoices(mode === 'spoken' ? index : Math.max(files.indexOf(affirmations[index]), 0));
  }

  function pause() {
    silence();
    background.pause();
    tone.pause();
    setPlaying(false);
    setEndsAt(null);
  }

  function skip(by: number) {
    const count = affirmations.length;
    if (!count) return;
    const target = wrap(index + by, count);
    if (!playing || mode === 'subliminal') {
      setIndex(target);
      return;
    }
    stopVoices();
    speakAt(target, run.current);
  }

  /** Changing the timer mid-tape restarts it from now. */
  function retime(minutes: number) {
    if (playing) setEndsAt(minutes ? Date.now() + minutes * 60000 : null);
  }

  /** Switching mode mid-tape restarts the voices in the new style. */
  function restart() {
    if (!playing) return;
    stopVoices();
    // Let the new mode reach latest.current before starting again.
    setTimeout(() => startVoices(index), 0);
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
      setTimeout(() => ending.pause(), 7000);
    }
  }

  // Timer: stop the voices, fade the background out gently, then stop.
  useEffect(() => {
    if (!playing || !endsAt) return;
    const fadeMs = (prefs.fadeSec ?? 20) * 1000;
    const wait = setTimeout(() => {
      const start = background.volume;
      const steps = 40;
      let step = 0;
      stopVoices();
      fade.current = setInterval(() => {
        step++;
        background.volume = start * (1 - step / steps);
        tone.setVolume(frequencyVolume * (1 - step / steps));
        if (step >= steps) {
          pause();
          timerEnded();
        }
      }, fadeMs / steps);
    }, Math.max(endsAt - Date.now() - fadeMs, 0));
    return () => clearTimeout(wait);
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

  return { playing, index, endsAt, ready, mode, play, pause, skip, retime, restart };
}
