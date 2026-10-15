import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Goal, Settings } from '@/lib/types';

const KEY = 'manifest-state-v1';

type State = { settings: Settings; goals: Goal[] };

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
};

type Store = State & {
  loaded: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, change: (goal: Goal) => Goal) => void;
  deleteGoal: (id: string) => void;
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
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
