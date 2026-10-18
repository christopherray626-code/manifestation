import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { BackHeader, Button, Card, Screen, Txt } from '@/components/ui';
import { VOICE_LIST } from '@/components/voice-picker';
import { TRACKS } from '@/lib/tracks';

/*
 * Hidden page (open /warm on the web): makes every ready-made line in every voice once, so the
 * voice server's shared storage has them all and nobody waits or pays for them again. Lines
 * already saved come straight back and cost nothing, so it's safe to run again after adding tracks.
 */

const VOICES = VOICE_LIST.filter((v) => v.id !== 'my-voice');
const JOBS = VOICES.flatMap((v) =>
  TRACKS.flatMap((track) =>
    track.lines.map((text, i) => ({ voice: v.id, text, previous: track.lines[i - 1], next: track.lines[i + 1] })),
  ),
);
const CHARS = JOBS.reduce((sum, j) => sum + j.text.length, 0);

type Status = { done: number; made: number; saved: number; failed: number; running: boolean; error?: string };

export default function Warm() {
  const [shared, setShared] = useState<boolean | null>(null);
  const [s, setS] = useState<Status>({ done: 0, made: 0, saved: 0, failed: 0, running: false });
  const stop = useRef(false);

  useEffect(() => {
    fetch('/api/voice')
      .then((r) => r.json())
      .then((j: { sharedStorage?: boolean }) => setShared(Boolean(j.sharedStorage)))
      .catch(() => setShared(false));
  }, []);

  async function make(job: (typeof JOBS)[number]) {
    let kind: 'made' | 'saved' | 'failed' = 'failed';
    let error: string | undefined;
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (res.ok) kind = res.headers.get('x-voice-cache') === 'hit' ? 'saved' : 'made';
      else error = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? `Status ${res.status}`;
      await res.arrayBuffer().catch(() => {});
    } catch (e) {
      error = String(e);
    }
    return { kind, error };
  }

  async function run() {
    stop.current = false;
    setS({ done: 0, made: 0, saved: 0, failed: 0, running: true });
    // Check storage really keeps clips before spending on the rest: ask for the first one twice.
    await make(JOBS[0]);
    await new Promise((r) => setTimeout(r, 1500));
    const check = await make(JOBS[0]);
    if (check.kind !== 'saved') {
      setS((now) => ({ ...now, running: false, error: check.error ?? 'Storage isn’t keeping clips, so I stopped before spending more.' }));
      return;
    }
    for (let i = 0; i < JOBS.length && !stop.current; i += 3) {
      await Promise.all(
        JOBS.slice(i, i + 3).map(async (job) => {
          const { kind, error } = await make(job);
          setS((now) => ({ ...now, done: now.done + 1, [kind]: now[kind] + 1, error: error ?? now.error }));
        }),
      );
    }
    setS((now) => ({ ...now, running: false }));
  }

  return (
    <Screen>
      <BackHeader title="Make all voices" onBack={() => router.back()} />
      <Txt variant="body">
        {`Every ready-made line in every voice: ${TRACKS.length} tracks, ${VOICES.length} voices, ${JOBS.length} clips, about ${Math.round(CHARS / 1000)}k characters the first time. Clips that are already saved cost nothing.`}
      </Txt>
      {shared === false && (
        <Txt variant="body">Shared storage isn’t connected yet, so nothing would be kept. Connect a Blob store in Vercel first.</Txt>
      )}
      <Card>
        <View style={{ gap: 6 }}>
          <Txt variant="title">{`${s.done} of ${JOBS.length}`}</Txt>
          <Txt variant="muted">{`Made now: ${s.made} · Already saved: ${s.saved} · Failed: ${s.failed}`}</Txt>
          {s.error ? <Txt variant="muted">{`Last error: ${s.error}`}</Txt> : null}
        </View>
      </Card>
      {s.running ? (
        <Button title="Stop" kind="ghost" onPress={() => (stop.current = true)} />
      ) : shared ? (
        <Button title={s.done ? 'Run again' : 'Make them all'} icon="play" onPress={run} />
      ) : null}
    </Screen>
  );
}
