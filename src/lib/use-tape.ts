import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';

import { recordingUri } from '@/lib/recordings';
import type { Affirmation, BackgroundSound, PlayerPrefs, TapeMode, Voice } from '@/lib/types';

export const SOUNDS: Record<Exclude<BackgroundSound, 'none'>, number> = {
  pad: require('@/assets/sounds/pad.wav'),
  bowls: require('@/assets/sounds/bowls.wav'),
  hum: require('@/assets/sounds/hum.wav'),
};

/** What each mode does by default. People can still change the levels and timer after. */
export const MODES: Record<TapeMode, { label: string; about: string; voiceVolume: number; soundVolume: number; gapMs: number; rate: number; timer: number }> = {
  spoken: {
    label: 'Spoken',
    about: 'Your affirmations read out clearly over a soft background.',
    voiceVolume: 1,
    soundVolume: 0.35,
    gapMs: 1500,
    rate: 0.9,
    timer: 0,
  },
  subliminal: {
    label: 'Subliminal',
    about: 'The voice sits far below the background, so you hear the sound, not the words.',
    voiceVolume: 0.08,
    soundVolume: 0.9,
    gapMs: 300,
    rate: 1,
    timer: 0,
  },
  sleep: {
    label: 'Sleep',
    about: 'Slower and softer with long pauses, then fades out when the timer ends.',
    voiceVolume: 0.5,
    soundVolume: 0.45,
    gapMs: 4000,
    rate: 0.8,
    timer: 30,
  },
};

/*
 * The phone's built-in voices stand in until natural AI voices exist. Phones ship several,
 * so pick the most natural one of the right kind instead of bending the pitch, which is what
 * makes them sound robotic.
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

export function useTape({
  affirmations,
  voice,
  prefs,
}: {
  affirmations: Affirmation[];
  voice: Voice;
  prefs: PlayerPrefs;
}) {
  const background = useAudioPlayer(SOUNDS.pad);
  const voicePlayer = useAudioPlayer(null);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);

  // Each start/stop bumps the run number, so callbacks from an old run do nothing.
  const run = useRef(0);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRecordingDone = useRef<(() => void) | null>(null);
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = useRef({ affirmations, voice, prefs });
  latest.current = { affirmations, voice, prefs };

  const voiceIds = useRef<{ 'calm-female'?: string; 'deep-male'?: string }>({});

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        voiceIds.current = { 'calm-female': pickVoice(voices, 'calm-female'), 'deep-male': pickVoice(voices, 'deep-male') };
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sub = voicePlayer.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && onRecordingDone.current) {
        const done = onRecordingDone.current;
        onRecordingDone.current = null;
        done();
      }
    });
    return () => sub.remove();
  }, [voicePlayer]);

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
    voicePlayer.volume = prefs.voiceVolume;
  }, [prefs.soundVolume, prefs.voiceVolume, background, voicePlayer]);

  function silence() {
    run.current++;
    if (gapTimer.current) clearTimeout(gapTimer.current);
    if (fade.current) clearInterval(fade.current);
    fade.current = null;
    onRecordingDone.current = null;
    Speech.stop();
    voicePlayer.pause();
  }

  function speakAt(i: number, thisRun: number) {
    if (thisRun !== run.current) return;
    const { affirmations: list, voice: v, prefs: p } = latest.current;
    if (!list.length) return;
    const at = ((i % list.length) + list.length) % list.length;
    const item = list[at];
    setIndex(at);
    const mode = MODES[p.mode];
    const next = () => {
      if (thisRun !== run.current) return;
      gapTimer.current = setTimeout(() => speakAt(at + 1, thisRun), mode.gapMs);
    };

    if (v === 'my-voice' && item.recording) {
      onRecordingDone.current = next;
      voicePlayer.replace({ uri: recordingUri(item.recording) });
      voicePlayer.volume = p.voiceVolume;
      voicePlayer.play();
    } else {
      const kind = v === 'my-voice' ? 'calm-female' : v;
      const id = voiceIds.current[kind];
      Speech.speak(item.text, {
        voice: id,
        rate: mode.rate,
        // Only nudge the pitch when the phone has no male voice to use.
        pitch: kind === 'deep-male' && !id ? 0.9 : 1,
        volume: p.voiceVolume,
        onDone: next,
        onError: next,
      });
    }
  }

  function play() {
    if (!latest.current.affirmations.length) return;
    silence();
    setPlaying(true);
    if (prefs.sound !== 'none') {
      background.loop = true;
      background.volume = prefs.soundVolume;
      background.play();
    }
    setEndsAt(prefs.timer ? Date.now() + prefs.timer * 60000 : null);
    speakAt(index, run.current);
  }

  function pause() {
    silence();
    background.pause();
    setPlaying(false);
    setEndsAt(null);
  }

  function skip(by: number) {
    const count = latest.current.affirmations.length;
    if (!count) return;
    const target = (((index + by) % count) + count) % count;
    if (!playing) {
      setIndex(target);
      return;
    }
    silence();
    speakAt(target, run.current);
  }

  /** Changing the timer mid-tape restarts it from now. */
  function retime(minutes: number) {
    if (playing) setEndsAt(minutes ? Date.now() + minutes * 60000 : null);
  }

  // Sleep timer: fade the background (and stop the voice) gently, then stop.
  useEffect(() => {
    if (!playing || !endsAt) return;
    const wait = setTimeout(() => {
      const start = background.volume;
      const steps = 40;
      let step = 0;
      run.current++;
      Speech.stop();
      voicePlayer.pause();
      fade.current = setInterval(() => {
        step++;
        background.volume = start * (1 - step / steps);
        if (step >= steps) pause();
      }, FADE_MS / steps);
    }, Math.max(endsAt - Date.now() - FADE_MS, 0));
    return () => clearTimeout(wait);
    // pause() is recreated each render; the timer only depends on when it ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, endsAt]);

  useEffect(
    () => () => {
      run.current++;
      Speech.stop();
    },
    [],
  );

  return { playing, index, endsAt, play, pause, skip, retime };
}
