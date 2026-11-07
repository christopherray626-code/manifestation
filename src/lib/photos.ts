import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/*
 * Vision board photos. Each picked photo is shrunk to a sensible size (a phone photo can be 5MB; the
 * board only needs a screen's worth) and saved under its own name. On phones that's a file in the app's
 * folder; on the web it's the browser's Cache Storage, like the voice clips, turned into a URL to show.
 */

const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1400;
const CACHE = 'manifest-board-v1';
const cacheKey = (name: string) => `/board/${name}`;
const webUrls = new Map<string, string>();

function folder() {
  const dir = new Directory(Paths.document, 'board');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

async function webCache() {
  try {
    return typeof caches !== 'undefined' ? await caches.open(CACHE) : null;
  } catch {
    return null;
  }
}

/** Shrinks and keeps a picked photo; returns the name to store on the board. */
export async function savePhoto(uri: string, width: number, id: string) {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  const name = `${id}.jpg`;
  if (isWeb) {
    const blob = await (await fetch(result.uri)).blob();
    webUrls.set(name, URL.createObjectURL(blob));
    try {
      await (await webCache())?.put(cacheKey(name), new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }));
    } catch {
      // Storage full or blocked: it still shows this visit.
    }
  } else {
    new File(result.uri).copy(new File(folder(), name));
  }
  return name;
}

export async function deletePhoto(name: string) {
  if (isWeb) {
    const url = webUrls.get(name);
    if (url) URL.revokeObjectURL(url);
    webUrls.delete(name);
    await (await webCache())?.delete(cacheKey(name)).catch(() => false);
    return;
  }
  const file = new File(folder(), name);
  if (file.exists) file.delete();
}

function uriNow(name: string) {
  if (isWeb) return webUrls.get(name);
  const file = new File(folder(), name);
  return file.exists ? file.uri : undefined;
}

/** Where each photo can be shown from. On the web, saved photos load in the background first. */
export function usePhotoUris(names: string[]) {
  const key = names.join('|');
  const [, setLoaded] = useState(0);
  useEffect(() => {
    if (!isWeb) return;
    const missing = names.filter((n) => !webUrls.has(n));
    if (!missing.length) return;
    let live = true;
    (async () => {
      const cache = await webCache();
      if (!cache) return;
      for (const name of missing) {
        const hit = await cache.match(cacheKey(name));
        if (hit) webUrls.set(name, URL.createObjectURL(await hit.blob()));
      }
      if (live) setLoaded((n) => n + 1);
    })();
    return () => {
      live = false;
    };
    // names is rebuilt each render; key holds its contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return Object.fromEntries(names.map((n) => [n, uriNow(n)])) as Record<string, string | undefined>;
}
