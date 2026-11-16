import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { cancel, later } from '@/lib/clock';
import { success, tap } from '@/lib/haptics';
import { buildMix } from '@/lib/mix';
import { DEFAULT_GOAL_MIN, streakOf, withToday } from '@/lib/streak';
import { localDay } from '@/lib/today';
import { useStore } from '@/lib/store';
import { trackAffirmations, trackById, TRACKS, type Track } from '@/lib/tracks';
import { DEFAULT_VOICE, type Affirmation, type Goal, type PlayerPrefs, type TapeMode, type Voice } from '@/lib/types';
import { audioFor, MODES, useTape } from '@/lib/use-tape';
import { naturalVoices, prepareVoice } from '@/lib/voices';

/*
 * The one player for the whole app. It lives at the root, so a tape keeps playing while you move
 * between tabs; the mini-player above the tab bar and the full player screen both read from it.
 */

export type Source = { kind: 'goal' | 'track' | 'mix'; id: string };

type Player = {
  source?: Source;
  goal?: Goal;
  track?: Track;
  /** Set when a mix is loaded; `track` then describes the whole mix. */
  mix?: boolean;
  list: Affirmation[];
  voice: Voice;
  setVoice: (v: Voice) => void;
  tape: ReturnType<typeof useTape>;
  /**
   * The first few lines' voices being made before anything can play: how many are done, and while
   * Vercel asks us to slow down, the seconds of pause.
   */
  prep: { done: number; total: number; waiting?: number } | null;
  /** The rest of the voices, made in the background while the first lines play. */
  making: { done: number; total: number; waiting?: number } | null;
  voiceError: string;
  /** Stops waiting for the first voices (the tape doesn't start). */
  cancelPrep: () => void;
  prefs: PlayerPrefs;
  setPrefs: (patch: Partial<PlayerPrefs>) => void;
  setMode: (mode: TapeMode) => void;
  /** Makes any missing natural-voice audio, then plays. */
  start: () => Promise<void>;
  toggle: () => void;
  /** Switches to a goal or track (pausing the old one) without opening anything. */
  choose: (source: Source) => void;
  /** Switches to it if given, then opens the full player. */
  open: (source?: Source) => void;
  /** Set when today's goal was just reached: the streak to celebrate. */
  celebrate: number | null;
  /** Seconds played of what's loaded, kept through pauses and closing the player. */
  sessionSeconds: () => number;
  dismissCelebration: () => void;
};

const PlayerContext = createContext<Player | null>(null);

/** Why the voice couldn't be made, in words a person can act on. */
function voiceProblem(e: unknown) {
  const message = e instanceof Error ? e.message : '';
  // No connection shows up as the phone's own technical error (unknown host, network request failed…).
  if (/network request failed|failed to fetch|fetch failed|unknownhost|unable to resolve|no address|timed? ?out|econn|enotfound|internet|offline/i.test(message)) {
    return 'You’re offline, so the rest of the voice can’t be made right now. What’s already made still plays. Press play again when you’re back online.';
  }
  return message || 'Couldn’t make the voice. Try again.';
}

// How many lines' voices to make before a tape starts; the rest are made while it plays.
const FIRST_LINES = 3;
// On the web, when to rebuild the joined recording so newly made lines are heard (and at the end).
const REFRESH_AT = [8, 25, 60, 120];

// After this long paused, pressing play starts a fresh session.
const SESSION_BREAK_MS = 30 * 60 * 1000;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { goals, settings, updateSettings, updateGoal, mixes } = useStore();
  const [chosen, setChosen] = useState<Source | undefined>();
  const [trackVoice, setTrackVoice] = useState<Voice>(DEFAULT_VOICE);
  const [prep, setPrep] = useState<{ done: number; total: number; waiting?: number } | null>(null);
  const [making, setMaking] = useState<{ done: number; total: number; waiting?: number } | null>(null);
  const [voiceError, setVoiceError] = useState('');
  // Each round of voice-making gets a number; switching track or voice moves it on, which stops the old round.
  const job = useRef(0);
  // Ask the tape to play (or to pick up newly made lines) after the next render, once it can see them.
  const [playAsk, setPlayAsk] = useState(0);
  const [refreshAsk, setRefreshAsk] = useState(0);

  // What's loaded: what you picked, else what you last played, else your first goal, else the first track.
  const fallback: Source = goals[0] ? { kind: 'goal', id: goals[0].id } : { kind: 'track', id: TRACKS[0].id };
  const wanted = chosen ?? settings.lastPlayed ?? fallback;
  const mixed = useMemo(() => {
    if (wanted.kind !== 'mix') return undefined;
    const built = buildMix(wanted.id, goals);
    // A saved mix plays under its own name.
    const name = mixes.find((m) => m.parts === wanted.id)?.name.trim();
    return built && name ? { ...built, track: { ...built.track, title: name } } : built;
  }, [wanted.kind, wanted.id, goals, mixes]);
  const wantedTrack = mixed?.track ?? (wanted.kind === 'track' ? trackById(wanted.id) : undefined);
  const goal = wantedTrack ? undefined : (goals.find((g) => g.id === wanted.id) ?? goals[0]);
  // Whatever was asked for is gone (a removed manifestation, an old track): fall back to the first track.
  const track = wantedTrack ?? (goal ? undefined : TRACKS[0]);
  const source: Source | undefined = mixed
    ? { kind: 'mix', id: mixed.track.id }
    : track
      ? { kind: 'track', id: track.id }
      : goal
        ? { kind: 'goal', id: goal.id }
        : undefined;

  const prefs = settings.player;
  const trackList = useMemo(() => mixed?.affirmations ?? (track ? trackAffirmations(track) : []), [mixed, track]);
  const favorites = goal?.affirmations.filter((a) => a.favorite) ?? [];
  const fullList = track ? trackList : prefs.favoritesOnly && favorites.length ? favorites : (goal?.affirmations ?? []);
  const voice: Voice = track ? trackVoice : (goal?.voice ?? DEFAULT_VOICE);
  // While the rest of the voice is still being made, the tape plays only the lines that are ready, and
  // more join as they're made (each one re-renders, since making.done changes).
  const list = making ? fullList.filter((a) => audioFor(a, voice)) : fullList;
  const title = track?.title ?? goal?.title ?? '';
  const tape = useTape({ affirmations: list, voice, prefs, growing: !!making, title, onRemotePlay: () => void start() });

  // The daily goal: listening time adds up while a tape plays; reaching the goal counts the day.
  const [celebrate, setCelebrate] = useState<number | null>(null);

  // This listening session: counted here, not on the player screen, so pausing or closing the player
  // doesn't start it over. A different track, or coming back after a long break, starts a new one.
  const session = useRef({ key: '', seconds: 0, since: null as number | null, pausedAt: null as number | null });
  const sessionKey = source ? `${source.kind}:${source.id}` : '';
  useEffect(() => {
    const s = session.current;
    const now = Date.now();
    if (s.key !== sessionKey) {
      session.current = { key: sessionKey, seconds: 0, since: tape.playing ? now : null, pausedAt: null };
      return;
    }
    if (tape.playing && s.since === null) {
      if (s.pausedAt && now - s.pausedAt > SESSION_BREAK_MS) s.seconds = 0;
      s.since = now;
    } else if (!tape.playing && s.since !== null) {
      s.seconds += (now - s.since) / 1000;
      s.since = null;
      s.pausedAt = now;
    }
  }, [tape.playing, sessionKey]);
  const sessionSeconds = () => {
    const s = session.current;
    return Math.floor(s.seconds + (s.since !== null ? (Date.now() - s.since) / 1000 : 0));
  };
  const latestSettings = useRef(settings);
  useEffect(() => {
    latestSettings.current = settings;
  });
  useEffect(() => {
    if (!tape.playing) return;
    // Counted by the clock, not by ticks: with the app closed the ticks come late or not at all, and
    // the time listened with the screen off has to count too.
    let last = Date.now();
    let timer: number | null = null;
    const count = () => {
      const add = Math.floor((Date.now() - last) / 1000);
      if (add <= 0) return;
      last += add * 1000;
      const s = latestSettings.current;
      const day = localDay(Date.now());
      const before = s.listenToday?.day === day ? s.listenToday.seconds : 0;
      const seconds = before + add;
      const goal = (s.dailyGoalMin ?? DEFAULT_GOAL_MIN) * 60;
      const listenDays = s.listenDays ?? [];
      // Two counts can land before the settings catch up; keep the newest total for the next one.
      latestSettings.current = { ...s, listenToday: { day, seconds } };
      if (before < goal && seconds >= goal && !listenDays.includes(day)) {
        const next = withToday(listenDays);
        latestSettings.current = { ...latestSettings.current, listenDays: next };
        updateSettings({ listenToday: { day, seconds }, listenDays: next });
        success();
        setCelebrate(streakOf(next));
      } else {
        updateSettings({ listenToday: { day, seconds } });
      }
    };
    const tick = () => {
      count();
      timer = later(10000, tick);
    };
    timer = later(10000, tick);
    return () => {
      cancel(timer);
      // The last few seconds before the pause count too.
      count();
    };
  }, [tape.playing, updateSettings]);

  const setPrefs = (patch: Partial<PlayerPrefs>) => updateSettings({ player: { ...prefs, ...patch } });

  useEffect(() => {
    if (!playAsk) return;
    tape.play();
    if (source) updateSettings({ lastPlayed: source });
    // Runs once per ask; the tape and source are read as they are now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAsk]);
  useEffect(() => {
    // The web rejoins straight away so new lines are heard sooner. Phones (and the web too) also pick
    // up new lines at the end of each pass (see `growing` in use-tape), without stopping the sound.
    if (refreshAsk && Platform.OS === 'web') tape.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshAsk]);

  /** Stops making voices for what was loaded before (a different track or voice is coming). */
  function stopMaking() {
    job.current++;
    setVoiceError('');
    setPrep(null);
    setMaking(null);
  }

  async function start() {
    if (!fullList.length || prep) return;
    tap();
    // Still making the rest in the background: play what's ready.
    if (making) return setPlayAsk((n) => n + 1);
    const missing = voice === 'my-voice' || !naturalVoices ? [] : fullList.filter((a) => !audioFor(a, voice));
    if (!missing.length) return setPlayAsk((n) => n + 1);

    // Make the first few lines, start playing, and make the rest while it plays. When enough lines are
    // ready already (coming back to a tape you were listening to), it plays straight away.
    const id = ++job.current;
    const ready = fullList.length - missing.length;
    const first = Math.max(0, Math.min(FIRST_LINES - ready, missing.length));
    let started = first === 0;
    let failed = false;
    setVoiceError('');
    if (started) {
      setMaking({ done: 0, total: missing.length });
      setPlayAsk((n) => n + 1);
    } else setPrep({ done: 0, total: first });
    try {
      await prepareVoice(
        missing.map((a) => a.text),
        voice,
        (done, total) => {
          if (job.current !== id) return;
          if (!started) {
            setPrep({ done: Math.min(done, first), total: first });
            if (done < first) return;
            started = true;
            setPrep(null);
            setMaking({ done, total });
            setPlayAsk((n) => n + 1);
            return;
          }
          setMaking({ done, total });
          if (REFRESH_AT.includes(done)) setRefreshAsk((n) => n + 1);
        },
        (seconds) => {
          if (job.current !== id) return;
          if (!started) setPrep((p) => (p ? { ...p, waiting: seconds } : p));
          else setMaking((m) => (m ? { ...m, waiting: seconds } : m));
        },
        () => job.current !== id,
      );
    } catch (e) {
      if (job.current !== id) return;
      failed = !started;
      setVoiceError(voiceProblem(e));
      // Whatever was made still plays.
      if (!started) setPrep(null);
    } finally {
      if (job.current === id) {
        setMaking(null);
        setPrep(null);
        // Started early: pick up the last lines. Never started (fewer lines were missing than it looked, or
        // they were already saved on this device): play now, unless it failed.
        if (started) setRefreshAsk((n) => n + 1);
        else if (!failed) setPlayAsk((n) => n + 1);
      }
    }
  }

  function toggle() {
    if (tape.playing) {
      tap();
      tape.pause();
    } else start();
  }

  function setMode(mode: TapeMode) {
    const m = MODES[mode];
    setPrefs({
      mode,
      voiceVolume: m.voiceVolume,
      soundVolume: m.soundVolume,
      // Subliminals need something to sit under.
      sound: mode === 'subliminal' && prefs.sound === 'none' ? 'pad' : prefs.sound,
    });
    tape.restart();
  }

  function setVoice(v: Voice) {
    tape.pause();
    stopMaking();
    if (goal) updateGoal(goal.id, (g) => ({ ...g, voice: v }));
    else setTrackVoice(v);
  }

  function choose(next: Source) {
    if (source && next.kind === source.kind && next.id === source.id) return;
    tape.pause();
    stopMaking();
    setChosen(next);
  }

  function open(next?: Source) {
    if (next) choose(next);
    router.push('/player');
  }

  // Web: the phone's lock screen and headphone buttons control the tape (Media Session).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'Your affirmations' });
    navigator.mediaSession.playbackState = tape.playing ? 'playing' : 'paused';
  }, [title, tape.playing]);
  const latestToggle = { start, pause: tape.pause };
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => latestToggle.start());
    navigator.mediaSession.setActionHandler('pause', () => latestToggle.pause());
  });

  const value: Player = {
    source,
    goal,
    track,
    mix: !!mixed,
    list,
    voice,
    setVoice,
    tape,
    prep,
    making,
    voiceError,
    cancelPrep: stopMaking,
    prefs,
    setPrefs,
    setMode,
    start,
    toggle,
    choose,
    open,
    celebrate,
    dismissCelebration: () => setCelebrate(null),
    sessionSeconds,
  };
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer needs PlayerProvider');
  return player;
}
