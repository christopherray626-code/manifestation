import type { Goal, Settings } from '@/lib/types';
import type { PlayerWidgetData } from '@/widget/remote';

/** Home-screen widgets are Android only (see use-widget.android.tsx). */
export function useWidget(_goals: Goal[], _settings: Settings, _ready: boolean) {}

export function usePlayerWidget(
  _now: Omit<PlayerWidgetData, 'live'>,
  _controls: { toggle: () => void; skip: (by: number) => void },
  _ready: boolean,
) {}
