'use no memo';
// ^ The widget library calls these components as plain functions, outside React (see affirmation-widget.tsx).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import { buildMix } from '@/lib/mix';
import { paletteFor } from '@/lib/palette';
import { STORE_KEY } from '@/lib/storage-key';
import { trackById, TRACKS } from '@/lib/tracks';
import type { Goal, Settings } from '@/lib/types';
import { getTheme } from '@/themes';
import type { PlayerWidgetData } from '@/widget/remote';

/*
 * The player on the home screen: what's loaded, with previous, play/pause and next. While the app is
 * running the buttons work the player directly; otherwise they open the app (and play asks it to start).
 * Android only.
 */

const hex = (c: string) => c.slice(0, 7) as `#${string}`;
const icon = (path: string, color = '#FFFFFF') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${path}"/></svg>`;
const PLAY = 'M8 5v14l11-7z';
const PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
const NEXT = 'M6 6l8.5 6L6 18V6zM16 6h2v12h-2z';
const PREVIOUS = 'M6 6h2v12H6zM9.5 12l8.5 6V6z';
const STAR = 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z';

const PLAYER_LINK = 'manifestation://player';

/** What the widget shows when the app isn't running: the last thing played, ready to start. */
export async function loadPlayerWidgetData(): Promise<PlayerWidgetData> {
  let goals: Goal[] = [];
  let settings: Partial<Settings> = {};
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) ({ goals = [], settings = {} } = JSON.parse(raw) as { goals?: Goal[]; settings?: Partial<Settings> });
  } catch {
    // Nothing saved yet, or unreadable: show the first track.
  }
  const theme = getTheme(settings.themeId ?? 'celestial');
  const last = settings.lastPlayed;
  const mix = last?.kind === 'mix' ? buildMix(last.id, goals) : undefined;
  const track = mix?.track ?? (last?.kind === 'track' ? trackById(last.id) : undefined);
  const goal = track ? undefined : (goals.find((g) => g.id === last?.id) ?? goals[0]);
  const shown = track ?? (goal ? undefined : TRACKS[0]);
  const title = shown?.title ?? goal?.title ?? 'Manifest';
  const tone = mix ? undefined : shown ? shown.id : goal && goal.category !== 'other' ? goal.category : undefined;
  const index = shown ? Math.max(TRACKS.findIndex((t) => t.id === shown.id), 0) : Math.max(goals.findIndex((g) => g.id === goal?.id), 0);
  return { title, subtitle: 'Tap play to listen', playing: false, live: false, colors: paletteFor(tone, index, theme) };
}

function Control({ path, action, label, size = 40, live }: { path: string; action: string; label: string; size?: number; live: boolean }) {
  // With the app running, the button works the player where it is. Otherwise it opens the app; play
  // also asks it to start.
  const click = live
    ? { clickAction: action }
    : { clickAction: 'OPEN_URI', clickActionData: { uri: action === 'TOGGLE' ? `${PLAYER_LINK}?play=1` : PLAYER_LINK } };
  return (
    <FlexWidget
      {...click}
      accessibilityLabel={label}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <SvgWidget svg={icon(path)} style={{ width: size * 0.6, height: size * 0.6 }} />
    </FlexWidget>
  );
}

export function PlayerWidget({ data }: { data: PlayerWidgetData }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: PLAYER_LINK }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundGradient: { from: hex(data.colors[1]), to: hex(data.colors[2]), orientation: 'TL_BR' },
      }}>
      {/* The cover: the track's own colours with the app's star. */}
      <FlexWidget
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundGradient: { from: hex(data.colors[0]), to: hex(data.colors[1]), orientation: 'TL_BR' },
        }}>
        <SvgWidget svg={icon(STAR)} style={{ width: 24, height: 24 }} />
      </FlexWidget>
      <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', paddingHorizontal: 10 }}>
        <TextWidget text={data.title} maxLines={1} truncate="END" style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '600' }} />
        <TextWidget
          text={data.subtitle}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' }}
        />
      </FlexWidget>
      <Control path={PREVIOUS} action="PREVIOUS" label="Previous line" size={36} live={data.live} />
      <Control path={data.playing ? PAUSE : PLAY} action="TOGGLE" label={data.playing ? 'Pause' : 'Play'} size={46} live={data.live} />
      <Control path={NEXT} action="NEXT" label="Next line" size={36} live={data.live} />
    </FlexWidget>
  );
}
