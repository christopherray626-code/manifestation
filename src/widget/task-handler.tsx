'use no memo';
// ^ The widget library calls these components as plain functions, outside React. The React Compiler
// (on for this app) rewrites components to use a hook, which throws there, and the widget stayed blank.

import { Linking } from 'react-native';
import { FlexWidget, TextWidget, type WidgetTaskHandlerProps } from 'react-native-android-widget';

import { widgetRemote } from '@/widget/remote';

/*
 * Android calls this when a widget is added, resized, due its half-hourly refresh, or one of the player
 * widget's buttons is pressed. Everything is loaded inside the try, so if anything goes wrong the widget
 * says what instead of staying blank.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction } = props;
  const name = props.widgetInfo.widgetName;
  const draws = widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED';
  try {
    if (name === 'Player') {
      const { PlayerWidget, loadPlayerWidgetData } = await import('@/widget/player-widget');
      if (widgetAction === 'WIDGET_CLICK') {
        const live = widgetRemote.state?.();
        if (live && widgetRemote.toggle) {
          // The app is running: work the player where it is, and show the change straight away.
          if (props.clickAction === 'TOGGLE') {
            widgetRemote.toggle();
            props.renderWidget(<PlayerWidget data={{ ...live, playing: !live.playing }} />);
          } else if (props.clickAction === 'NEXT') widgetRemote.skip?.(1);
          else if (props.clickAction === 'PREVIOUS') widgetRemote.skip?.(-1);
          return;
        }
        // The app was closed since the widget was last drawn: its buttons can't reach a player. Draw
        // the version that opens the app, and open it now.
        props.renderWidget(<PlayerWidget data={await loadPlayerWidgetData()} />);
        Linking.openURL(props.clickAction === 'TOGGLE' ? 'manifestation://player?play=1' : 'manifestation://player').catch(() => {});
        return;
      }
      if (draws) props.renderWidget(<PlayerWidget data={widgetRemote.state?.() ?? (await loadPlayerWidgetData())} />);
      return;
    }
    if (!draws) return;
    if (name === 'Streak') {
      const { StreakWidget, loadStreakWidgetData } = await import('@/widget/streak-widget');
      props.renderWidget(<StreakWidget data={await loadStreakWidgetData()} />);
      return;
    }
    const { AffirmationWidget, loadWidgetData } = await import('@/widget/affirmation-widget');
    props.renderWidget(<AffirmationWidget data={await loadWidgetData()} />);
  } catch (e) {
    if (widgetAction !== 'WIDGET_DELETED') props.renderWidget(<ProblemWidget message={e instanceof Error ? e.message : String(e)} />);
  }
}

function ProblemWidget({ message }: { message: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ height: 'match_parent', width: 'match_parent', padding: 16, borderRadius: 24, backgroundColor: '#1E1A5A' }}>
      <TextWidget text="Tap to open the app" style={{ fontSize: 15, color: '#FFFFFF' }} />
      <TextWidget text={message} maxLines={4} truncate="END" style={{ fontSize: 11, color: '#C9B0FF' }} />
    </FlexWidget>
  );
}
