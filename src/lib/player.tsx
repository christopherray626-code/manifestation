import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { success, tap } from '@/lib/haptics';
import { MILESTONES, streakOf, withToday } from '@/lib/streak';
import { useStore } from '@/lib/store';
import { trackAffirmations, trackById, TRACKS, type Track } from '@/lib/tracks';
import type { Affirmation, Goal, PlayerPrefs, TapeMode, Voice } from '@/lib/types';
import { audioFor, MODES, useTape } from '@/lib/use-tape';
import { naturalVoices, prepareVoice } from '@/lib/voices';

/*
 * The one player for the whole app. It lives at the root, so a tape keeps playing while you move
 * between tabs; the mini-player above the tab bar and the full player screen both read from it.
 */

export type Source = { kind: 'goal' | 'track'; id: string };

type Player = {
  source?: Source;
  goal?: Goal;
  track?: Track;
  list: Affirmation[];
  voice: Voice;
  setVoice: (v: Voice) => void;
  tape: ReturnType<typeof useTape>;
  prep: { done: number; total: number } | null;
  voiceError: string;
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
};

const PlayerContext = createContext<Player | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { goals, settings, updateSettings, updateGoal } = useStore();
  const [chosen, setChosen] = useState<Source | undefined>();
  const [trackVoice, setTrackVoice] = useState<Voice>('calm-female');
  const [prep, setPrep] = useState<{ done: number; total: number } | null>(null);
  const [voiceError, setVoiceError] = useState('');

  // What's loaded: what you picked, else what you last played, else your first goal, else the first track.
  const fallback: Source = goals[0] ? { kind: 'goal', id: goals[0].id } : { kind: 'track', id: TRACKS[0].id };
  const wanted = chosen ?? settings.lastPlayed ?? fallback;
  const track = wanted.kind === 'track' ? trackById(wanted.id) : undefined;
  const goal = wanted.kind === 'goal' ? (goals.find((g) => g.id === wanted.id) ?? goals[0]) : undefined;
  const source: Source | undefined = track ? { kind: 'track', id: track.id } : goal ? { kind: 'goal', id: goal.id } : undefined;

  const prefs = settings.player;
  const trackList = useMemo(() => (track ? trackAffirmations(track) : []), [track]);
  const favorites = goal?.affirmations.filter((a) => a.favorite) ?? [];
  const list = track ? trackList : prefs.favoritesOnly && favorites.length ? favorites : (goal?.affirmations ?? []);
  const voice: Voice = track ? trackVoice : (goal?.voice ?? 'calm-female');
  const tape = useTape({ affirmations: list, voice, prefs });

  const setPrefs = (patch: Partial<PlayerPrefs>) => updateSettings({ player: { ...prefs, ...patch } });

  async function start() {
    if (!list.length || prep) return;
    tap();
    const missing = voice === 'my-voice' || !naturalVoices ? [] : list.filter((a) => !audioFor(a, voice));
    if (missing.length) {
      setVoiceError('');
      setPrep({ done: 0, total: missing.length });
      try {
        await prepareVoice(
          missing.map((a) => a.text),
          voice,
          (done, total) => setPrep({ done, total }),
        );
      } catch (e) {
        setVoiceError(e instanceof Error ? e.message : "Couldn't make the voice. Try again.");
        return;
      } finally {
        setPrep(null);
      }
    }
    tape.play();
    const listenDays = withToday(settings.listenDays);
    if (listenDays.length !== (settings.listenDays ?? []).length) {
      const streak = streakOf(listenDays);
      if (MILESTONES.includes(streak)) success();
    }
    updateSettings({ ...(source ? { lastPlayed: source } : {}), listenDays });
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
    if (goal) updateGoal(goal.id, (g) => ({ ...g, voice: v }));
    else setTrackVoice(v);
  }

  function choose(next: Source) {
    if (source && next.kind === source.kind && next.id === source.id) return;
    tape.pause();
    setChosen(next);
  }

  function open(next?: Source) {
    if (next) choose(next);
    router.push('/player');
  }

  // Web: the phone's lock screen and headphone buttons control the tape (Media Session).
  const title = track?.title ?? goal?.title ?? '';
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
    list,
    voice,
    setVoice,
    tape,
    prep,
    voiceError,
    prefs,
    setPrefs,
    setMode,
    start,
    toggle,
    choose,
    open,
  };
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer needs PlayerProvider');
  return player;
}
