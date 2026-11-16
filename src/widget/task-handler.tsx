'use no memo';
// ^ The widget library calls these components as plain functions, outside React. The React Compiler
// (on for this app) rewrites components to use a hook, which throws there, and the widget stayed blank.

import { FlexWidget, TextWidget, type WidgetTaskHandlerProps } from 'react-native-android-widget';

/*
 * Android calls this when the widget is added, resized, or due its half-hourly refresh. Everything is
 * loaded inside the try, so if anything goes wrong the widget says what instead of staying blank.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction !== 'WIDGET_ADDED' && props.widgetAction !== 'WIDGET_UPDATE' && props.widgetAction !== 'WIDGET_RESIZED') return;
  try {
    const { AffirmationWidget, loadWidgetData } = await import('@/widget/affirmation-widget');
    props.renderWidget(<AffirmationWidget data={await loadWidgetData()} />);
  } catch (e) {
    props.renderWidget(<ProblemWidget message={e instanceof Error ? e.message : String(e)} />);
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
