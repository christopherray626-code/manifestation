import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/*
 * Recordings live in the app's documents folder, which the system doesn't clear.
 * We store only the file name: the folder's full path can change between app updates.
 * On web (used for testing) there's no file system, so the recording's own URL is kept.
 */

const isWeb = Platform.OS === 'web';

function folder() {
  const dir = new Directory(Paths.document, 'recordings');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Moves a fresh recording out of the cache and returns the name to store. */
export function keepRecording(tempUri: string): string {
  if (isWeb) return tempUri;
  const file = new File(tempUri);
  file.move(folder());
  return file.name;
}

export function recordingUri(name: string) {
  if (isWeb || name.includes('://')) return name;
  return new File(folder(), name).uri;
}

export function deleteRecording(name?: string) {
  if (!name || isWeb || name.includes('://')) return;
  try {
    const file = new File(folder(), name);
    if (file.exists) file.delete();
  } catch {
    // Already gone; nothing to clean up.
  }
}
