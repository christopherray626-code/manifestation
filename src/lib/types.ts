export type Category = 'car' | 'money' | 'love' | 'home' | 'health' | 'career' | 'other';

export type Voice = 'calm-female' | 'deep-male' | 'my-voice';

export type Affirmation = {
  id: string;
  text: string;
  /** Written by the user rather than by the app. */
  mine: boolean;
  favorite: boolean;
  createdAt: number;
};

/**
 * How "today's affirmation" is picked for a goal.
 * every: how many days each affirmation stays before switching (0 = never switch).
 * pinnedId: the affirmation to start from (or keep, when every is 0).
 * anchor: the moment the current schedule started, so "for a month" counts from then.
 */
export type Rotation = {
  every: number;
  order: 'inOrder' | 'shuffle';
  favoritesOnly: boolean;
  pinnedId?: string;
  anchor: number;
};

export type Goal = {
  id: string;
  title: string;
  category: Category;
  details: string;
  feeling: string;
  voice: Voice;
  createdAt: number;
  affirmations: Affirmation[];
  rotation: Rotation;
};

export type Settings = {
  themeId: string;
  name: string;
  onboarded: boolean;
  defaultRotation: Pick<Rotation, 'every' | 'order' | 'favoritesOnly'>;
};

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function makeAffirmation(text: string, mine: boolean): Affirmation {
  return { id: newId(), text, mine, favorite: false, createdAt: Date.now() };
}
