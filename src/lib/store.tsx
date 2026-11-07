import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { BoardPhoto, Goal, JournalEntry, Settings } from '@/lib/types';

const KEY = 'manifest-state-v1';

type State = { settings: Settings; goals: Goal[]; journal: JournalEntry[]; board: BoardPhoto[] };

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
};

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
        setState({
          settings: { ...defaultState.settings, ...saved.settings },
          goals: saved.goals ?? [],
          journal: saved.journal ?? [],
          board: saved.board ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const store: Store = {
    ...state,
    loaded,
    updateSettings: (patch) =>
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    addGoal: (goal) => setState((s) => ({ ...s, goals: [goal, ...s.goals] })),
    updateGoal: (id, change) =>
      setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? change(g) : g)) })),
    deleteGoal: (id) => setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    addEntry: (entry) => setState((s) => ({ ...s, journal: [entry, ...s.journal] })),
    deleteEntry: (id) => setState((s) => ({ ...s, journal: s.journal.filter((e) => e.id !== id) })),
    addPhotos: (photos) => setState((s) => ({ ...s, board: [...s.board, ...photos] })),
    updatePhoto: (id, patch) =>
      setState((s) => ({ ...s, board: s.board.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    deletePhoto: (id) => setState((s) => ({ ...s, board: s.board.filter((p) => p.id !== id) })),
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
