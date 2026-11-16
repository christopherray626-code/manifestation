/*
 * How the home-screen player widget reaches the player. The widget's buttons arrive in the widget task
 * handler, which runs outside the app's screens; while the app is alive, the player (src/lib/player.tsx)
 * leaves its controls and what it's playing here for the handler to use. When the app isn't running
 * there's nothing here, and the widget opens the app instead.
 */

export type PlayerWidgetData = {
  title: string;
  subtitle: string;
  playing: boolean;
  /** The app is running, so the buttons can work the player directly. */
  live: boolean;
  colors: readonly string[];
};

export const widgetRemote: {
  toggle?: () => void;
  skip?: (by: number) => void;
  state?: () => PlayerWidgetData;
} = {};
