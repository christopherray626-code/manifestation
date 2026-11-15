import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { AffirmationWidget, loadWidgetData } from '@/widget/affirmation-widget';

/** Android calls this when the widget is added, resized, or due its half-hourly refresh. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(<AffirmationWidget data={await loadWidgetData()} />);
      break;
    default:
      break;
  }
}
