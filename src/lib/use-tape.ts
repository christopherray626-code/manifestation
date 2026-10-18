import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';

import { recordingUri } from '@/lib/recordings';
import { naturalVoices, voiceAudioUri } from '@/lib/voices';
import type { Affirmation, BackgroundSound, PlayerPrefs, TapeMode, Voice } from '@/lib/types';

export const SOUNDS: Record<Exclude<BackgroundSound, 'none'>, number> = {
  pad: require('@/assets/sounds/pad.wav'),
  bowls: require('@/assets/sounds/bowls.wav'),
  hum: require('@/assets/sounds/hum.wav'),
};

/** What each mode does by default. People can still change the levels and timer after. */
export const MODES: Record<TapeMode, { label: string; about: string; voiceVolume: number; soundVolume: number; gapMs: number }> = {
  spoken: {
    label: 'Spoken',
    about: 'Your affirmations read out clearly over a soft background.',
    voiceVolume: 1,
    soundVolume: 0.35,
    gapMs: 1500,
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

const FADE_MS = 20000;
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
  const layer0 = useAudioPlayer(null);
  const layer1 = useAudioPlayer(null);
  const layer2 = useAudioPlayer(null);
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
        if (status.didJustFinish && done) {
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
    player.replace({ uri });
    player.volume = volume;
    player.play();
  }

  /** Spoken: one affirmation at a time, a recording when there is one, else the phone's voice. */
  function speakAt(i: number, thisRun: number) {
    if (thisRun !== run.current) return;
    const { affirmations: list, voice: v, prefs: p } = latest.current;
    if (!list.length) return;
    const at = wrap(i, list.length);
    const item = list[at];
    setIndex(at);
    const next = () => {
      if (thisRun !== run.current) return;
      gapTimers.current[0] = setTimeout(() => speakAt(at + 1, thisRun), MODES.spoken.gapMs);
    };

    const uri = audioFor(item, v);
    if (uri) {
      playFile(0, layer0, uri, p.voiceVolume, next);
      return;
    }
    const kind = v === 'my-voice' ? 'calm-female' : v;
    const id = voiceIds.current[kind];
    Speech.speak(item.text, {
      voice: id,
      rate: 0.9,
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
    setEndsAt(prefs.timer ? Date.now() + prefs.timer * 60000 : null);
    startVoices(mode === 'spoken' ? index : Math.max(files.indexOf(affirmations[index]), 0));
  }

  function pause() {
    silence();
    background.pause();
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

  // Timer: stop the voices, fade the background out gently, then stop.
  useEffect(() => {
    if (!playing || !endsAt) return;
    const wait = setTimeout(() => {
      const start = background.volume;
      const steps = 40;
      let step = 0;
      stopVoices();
      fade.current = setInterval(() => {
        step++;
        background.volume = start * (1 - step / steps);
        if (step >= steps) pause();
      }, FADE_MS / steps);
    }, Math.max(endsAt - Date.now() - FADE_MS, 0));
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
