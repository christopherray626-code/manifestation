import { Alert, Platform } from 'react-native';

/**
 * Asks before something that can't be undone. Phones get an alert; the website has no alerts of its own,
 * so it uses the browser's.
 */
export function confirm(title: string, message?: string, action = 'Remove'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: action, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
