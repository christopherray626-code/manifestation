import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { Button, Field, Txt, useTheme } from '@/components/ui';
import { useStore } from '@/lib/store';

const isWeb = Platform.OS === 'web';
// The same server as the voices and the writer: the app's own site on the web, its address in the phone app.
const SERVER = process.env.EXPO_PUBLIC_VOICE_SERVER?.replace(/\/$/, '') ?? (isWeb ? '' : undefined);

/** Ask before adding, on the web with the browser's dialog and on phones with an alert. */
function confirm(message: string): Promise<boolean> {
  if (isWeb) return Promise.resolve(window.confirm(message));
  return new Promise((resolve) =>
    Alert.alert('Add this data?', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Add it', onPress: () => resolve(true) },
    ]),
  );
}

const offline = (e: unknown) =>
  /network|fetch|resolve|host|internet|offline|timed? ?out/i.test(e instanceof Error ? e.message : String(e));

/**
 * Moves manifestations, mixes, the journal, settings and the streak between the website and the phone
 * app (each keeps its own storage). One side makes a short code, the other types it in. (Pasting the
 * whole thing used to get cut short on phones once there was a lot of it.) Photos and own-voice
 * recordings stay behind.
 */
export function MoveData() {
  const t = useTheme();
  const { exportData, importData } = useStore();
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  async function makeCode() {
    if (busy) return;
    setError('');
    setNote('');
    if (SERVER === undefined) return setError('Moving data needs the app to be online.');
    setBusy(true);
    try {
      const res = await fetch(`${SERVER}/api/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: exportData() });
      const body = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
      if (!res.ok || !body.code) throw new Error(body.error ?? 'Couldn’t make a code just now. Try again.');
      setCode(body.code);
    } catch (e) {
      setError(offline(e) ? 'You’re offline. Connect and try again.' : e instanceof Error ? e.message : 'Couldn’t make a code.');
    } finally {
      setBusy(false);
    }
  }

  async function useCode() {
    if (busy) return;
    setError('');
    setNote('');
    const clean = typed.toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (!clean) return setError('Type the code from the other device first.');
    if (SERVER === undefined) return setError('Moving data needs the app to be online.');
    if (!(await confirm('Your manifestations, mixes, journal and settings from the other device will be added to this one. Nothing here is deleted.'))) return;
    setBusy(true);
    try {
      const res = await fetch(`${SERVER}/api/move?code=${encodeURIComponent(clean)}`);
      const text = await res.text();
      if (!res.ok) throw new Error(((JSON.parse(text) as { error?: string }).error) ?? 'That code didn’t work.');
      const { goals, mixes } = importData(text);
      setTyped('');
      setNote(`Added ${goals} manifestation${goals === 1 ? '' : 's'} and ${mixes} mix${mixes === 1 ? '' : 'es'}.`);
    } catch (e) {
      setError(offline(e) ? 'You’re offline. Connect and try again.' : e instanceof Error ? e.message : 'That code didn’t work.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <Txt variant="medium">From this device</Txt>
      {code ? (
        <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
          <Txt variant="display" style={{ letterSpacing: 4, color: t.colors.accent }}>
            {`${code.slice(0, 4)} ${code.slice(4)}`}
          </Txt>
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            Type this on the other device. It works once.
          </Txt>
        </View>
      ) : null}
      <Button title={busy && !typed ? 'Making a code…' : code ? 'Make a new code' : 'Make a code'} icon="key-outline" kind="ghost" onPress={makeCode} />

      <Txt variant="medium" style={{ marginTop: 6 }}>
        On this device
      </Txt>
      <Field value={typed} onChangeText={setTyped} placeholder="Code from the other device" autoCapitalize="characters" autoCorrect={false} />
      <Button title={busy && typed ? 'Adding…' : 'Add it to this device'} icon="download-outline" kind="ghost" onPress={useCode} />
      {note ? <Txt variant="muted">{note}</Txt> : null}
      {error ? <Txt variant="muted" style={{ color: '#E26D5C' }}>{error}</Txt> : null}
    </View>
  );
}
