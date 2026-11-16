import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { withToday } from '@/lib/streak';
import { applyTrackEdits } from '@/lib/tracks';
import type { BoardPhoto, Goal, JournalEntry, SavedMix, Settings } from '@/lib/types';

import { STORE_KEY } from '@/lib/storage-key';

export { STORE_KEY };
const KEY = STORE_KEY;

type State = { settings: Settings; goals: Goal[]; journal: JournalEntry[]; board: BoardPhoto[]; mixes: SavedMix[] };

const defaultState: State = {
  settings: {
    themeId: 'celestial',
    name: '',
    onboarded: false,
    defaultRotation: { every: 1, order: 'inOrder', favoritesOnly: false },
    player: { mode: 'spoken', sound: 'pad', voiceVolume: 1, soundVolume: 0.35, timer: 0, favoritesOnly: false },
    reminders: [],
  },
  goals: [],
  journal: [],
  board: [],
  mixes: [],
};

type Store = State & {
  loaded: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, change: (goal: Goal) => Goal) => void;
  deleteGoal: (id: string) => void;
  addEntry: (entry: JournalEntry) => void;
  deleteEntry: (id: string) => void;
  addPhotos: (photos: BoardPhoto[]) => void;
  updatePhoto: (id: string, patch: Partial<BoardPhoto>) => void;
  deletePhoto: (id: string) => void;
  /** Moves a photo one place earlier (-1) or later (1) on the board. */
  movePhoto: (id: string, by: -1 | 1) => void;
  /** Adds the mix, or replaces the saved one with the same id. */
  saveMix: (mix: SavedMix) => void;
  deleteMix: (id: string) => void;
  /** Everything worth moving to another device, as text (see importData). */
  exportData: () => string;
  /** Adds what's in text from exportData to what's here. Returns how many manifestations and mixes came in. */
  importData: (text: string) => { goals: number; mixes: number };
};

/*
 * Moving data between devices (the website and the phone app keep separate storage). Photos and
 * own-voice recordings are files on the device they were made on, so they stay behind.
 */
const EXPORT_TAG = 'manifest-data';

function forExport(state: State) {
  const goals = state.goals.map((g) => ({ ...g, affirmations: g.affirmations.map(({ recording: _, ...a }) => a) }));
  return JSON.stringify({ app: EXPORT_TAG, v: 1, settings: state.settings, goals, journal: state.journal, mixes: state.mixes });
}

/** Merges by id: anything already here stays, anything new is added. */
function mergeIn(state: State, text: string): { state: State; goals: number; mixes: number } {
  let data: Partial<State> & { app?: string };
  try {
    data = JSON.parse(text.trim());
  } catch {
    throw new Error('That doesn’t look like copied data. Copy it again and paste the whole thing.');
  }
  if (data?.app !== EXPORT_TAG) throw new Error('That doesn’t look like data copied from this app.');
  const add = <T extends { id: string }>(here: T[], incoming: T[] | undefined) => {
    const ids = new Set(here.map((x) => x.id));
    const fresh = (incoming ?? []).filter((x) => !ids.has(x.id));
    return { list: [...fresh, ...here], count: fresh.length };
  };
  const goals = add(state.goals, data.goals);
  const mixes = add(state.mixes, data.mixes);
  const journal = add(state.journal, data.journal);
  const incoming = data.settings ?? ({} as Partial<Settings>);
  return {
    goals: goals.count,
    mixes: mixes.count,
    state: {
      ...state,
      goals: goals.list,
      mixes: mixes.list,
      journal: journal.list,
      settings: {
        ...state.settings,
        ...incoming,
        // Keep this device's reminders (they're scheduled here) unless it has none.
        reminders: state.settings.reminders.length ? state.settings.reminders : (incoming.reminders ?? []),
        listenDays: [...new Set([...(state.settings.listenDays ?? []), ...(incoming.listenDays ?? [])])].sort((a, b) => a - b),
        onboarded: true,
      },
    },
  };
}

const StoreContext = createContext<Store | null>(null);

/** Everything lives on the phone for now; no accounts or server. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<State>;
        applyTrackEdits(saved.settings?.trackEdits);
        setState({
          settings: { ...defaultState.settings, ...saved.settings },
          goals: saved.goals ?? [],
          journal: saved.journal ?? [],
          board: saved.board ?? [],
          mixes: saved.mixes ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Saved a moment after the last change, so a burst of changes (dragging a slider) is one write.
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}), 400);
    return () => clearTimeout(timer);
  }, [state, loaded]);

  const store: Store = {
    ...state,
    loaded,
    updateSettings: (patch) => {
      if ('trackEdits' in patch) applyTrackEdits(patch.trackEdits);
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },
    addGoal: (goal) => setState((s) => ({ ...s, goals: [goal, ...s.goals] })),
    updateGoal: (id, change) =>
      setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? change(g) : g)) })),
    deleteGoal: (id) => setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    // Writing in the journal counts as practising today.
    addEntry: (entry) =>
      setState((s) => ({
        ...s,
        journal: [entry, ...s.journal],
        settings: { ...s.settings, listenDays: withToday(s.settings.listenDays) },
      })),
    deleteEntry: (id) => setState((s) => ({ ...s, journal: s.journal.filter((e) => e.id !== id) })),
    addPhotos: (photos) => setState((s) => ({ ...s, board: [...s.board, ...photos] })),
    updatePhoto: (id, patch) =>
      setState((s) => ({ ...s, board: s.board.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    deletePhoto: (id) => setState((s) => ({ ...s, board: s.board.filter((p) => p.id !== id) })),
    saveMix: (mix) =>
      setState((s) => ({
        ...s,
        mixes: s.mixes.some((m) => m.id === mix.id) ? s.mixes.map((m) => (m.id === mix.id ? mix : m)) : [mix, ...s.mixes],
      })),
    deleteMix: (id) => setState((s) => ({ ...s, mixes: s.mixes.filter((m) => m.id !== id) })),
    exportData: () => forExport(state),
    importData: (text) => {
      const result = mergeIn(state, text);
      applyTrackEdits(result.state.settings.trackEdits);
      setState(result.state);
      return { goals: result.goals, mixes: result.mixes };
    },
    movePhoto: (id, by) =>
      setState((s) => {
        const at = s.board.findIndex((p) => p.id === id);
        const to = at + by;
        if (at < 0 || to < 0 || to >= s.board.length) return s;
        const board = [...s.board];
        [board[at], board[to]] = [board[to], board[at]];
        return { ...s, board };
      }),
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
