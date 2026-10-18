export type Category = 'car' | 'money' | 'love' | 'home' | 'health' | 'career' | 'other';

export type Voice =
  | 'calm-female'
  | 'soft-female'
  | 'warm-female'
  | 'velvet-female'
  | 'deep-male'
  | 'narrator-male'
  | 'gentle-male'
  | 'steady-male'
  | 'my-voice';

export type Affirmation = {
  id: string;
  text: string;
  /** Written by the user rather than by the app. */
  mine: boolean;
  favorite: boolean;
  createdAt: number;
  /** File name of the user's own recording, if they've recorded it. */
  recording?: string;
};

export type TapeMode = 'spoken' | 'subliminal';
export type BackgroundSound = 'pad' | 'bowls' | 'hum' | 'space' | 'chimes' | 'ocean' | 'rain' | 'brown' | 'none';

export type Frequency =
  | 'hz-396'
  | 'hz-432'
  | 'hz-528'
  | 'hz-639'
  | 'hz-741'
  | 'hz-963'
  | 'beat-delta'
  | 'beat-theta'
  | 'beat-alpha';

export type PlayerPrefs = {
  mode: TapeMode;
  sound: BackgroundSound;
  /** A steady tone or binaural beat under everything. Missing in older saves, which means none. */
  frequency?: Frequency | 'none';
  frequencyVolume?: number;
  /** 0-1 levels. */
  voiceVolume: number;
  soundVolume: number;
  /** Minutes until the tape fades out; 0 means play until stopped. */
  timer: number;
  favoritesOnly: boolean;
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

/** A daily notification at a set time that opens today's affirmation or the tape. */
export type Reminder = {
  id: string;
  hour: number;
  minute: number;
  opens: 'affirmation' | 'tape';
  enabled: boolean;
};

export type Settings = {
  themeId: string;
  name: string;
  onboarded: boolean;
  defaultRotation: Pick<Rotation, 'every' | 'order' | 'favoritesOnly'>;
  player: PlayerPrefs;
  reminders: Reminder[];
  /** Local day numbers with at least one listen, for the streak. */
  listenDays?: number[];
  /** The last streak milestone shown, so each is celebrated once. */
  celebrated?: number;
  /** What they picked in onboarding (track ids), for "Picked for you". */
  intentions?: string[];
  /** Small vibrations on taps and milestones. Missing means on. */
  haptics?: boolean;
  /** How many times the app has been opened, for affirmations that change on every open. */
  opens?: number;
  /** What the Listen tab last played, for "Continue listening" on Home. */
  lastPlayed?: { kind: 'goal' | 'track'; id: string };
};

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function makeAffirmation(text: string, mine: boolean): Affirmation {
  return { id: newId(), text, mine, favorite: false, createdAt: Date.now() };
}
