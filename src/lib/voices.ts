import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { hash } from '@/lib/today';
import type { Voice } from '@/lib/types';

/*
 * Natural voices come from our small voice server (server/api/voice.ts), which asks ElevenLabs.
 * Each affirmation is made once per voice and saved on the phone, named after its text, so an
 * edited affirmation gets fresh audio and an unchanged one is never paid for twice.
 */

const SERVER = process.env.EXPO_PUBLIC_VOICE_SERVER?.replace(/\/$/, '');
const isWeb = Platform.OS === 'web';

/** Whether natural voices are set up for this build. */
export const naturalVoices = Boolean(SERVER);

// Web (used for testing) has no file system, so audio is kept for the session only.
const webAudio = new Map<string, string>();

function folder() {
  const dir = new Directory(Paths.document, 'voices');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

function fileName(text: string, voice: Voice) {
  const t = text.trim();
  return `${voice}-${hash(t).toString(36)}-${t.length}.mp3`;
}

/** The saved natural-voice audio for this text, if it's been made already. */
export function voiceAudioUri(text: string, voice: Voice): string | undefined {
  if (voice === 'my-voice' || !naturalVoices) return undefined;
  const name = fileName(text, voice);
  if (isWeb) return webAudio.get(name);
  const file = new File(folder(), name);
  return file.exists ? file.uri : undefined;
}

async function makeOne(text: string, voice: Voice) {
  const res = await fetch(`${SERVER}/api/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.trim(), voice }),
  });
  if (!res.ok) {
    let message = `The voice server answered ${res.status}.`;
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch {
      // Not JSON; keep the status message.
    }
    throw new Error(message);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const name = fileName(text, voice);
  if (isWeb) {
    webAudio.set(name, URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })));
    return;
  }
  const file = new File(folder(), name);
  file.create({ overwrite: true });
  file.write(bytes);
}

/** Makes any missing audio, a few at a time, reporting how many are done. */
export async function prepareVoice(texts: string[], voice: Voice, onProgress: (done: number, total: number) => void) {
  const missing = texts.filter((t) => !voiceAudioUri(t, voice));
  let done = 0;
  onProgress(0, missing.length);
  for (let i = 0; i < missing.length; i += 3) {
    await Promise.all(
      missing.slice(i, i + 3).map(async (t) => {
        await makeOne(t, voice);
        done++;
        onProgress(done, missing.length);
      }),
    );
  }
}
