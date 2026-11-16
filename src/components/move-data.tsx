import { useState } from 'react';
import { Alert, Platform, Share, View } from 'react-native';

import { Button, Field, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';

const isWeb = Platform.OS === 'web';

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

/**
 * Moves manifestations, mixes, the journal, settings and the streak between the website and the phone
 * app (each keeps its own storage): copy here, paste there. Photos and own-voice recordings stay behind.
 */
export function MoveData() {
  const { exportData, importData } = useStore();
  const [pasted, setPasted] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  async function copy() {
    setError('');
    const text = exportData();
    try {
      if (isWeb) {
        await navigator.clipboard.writeText(text);
        setNote('Copied. Now open the other app, go to Settings, paste it into the box and tap Add.');
      } else {
        await Share.share({ message: text });
      }
    } catch {
      setError('Couldn’t copy it. Try again.');
    }
  }

  async function add() {
    setError('');
    setNote('');
    if (!pasted.trim()) return setError('Paste the copied data into the box first.');
    if (!(await confirm('Your manifestations, mixes, journal and settings from the other app will be added to this one. Nothing here is deleted.'))) return;
    try {
      const { goals, mixes } = importData(pasted);
      setPasted('');
      setNote(`Added ${goals} manifestation${goals === 1 ? '' : 's'} and ${mixes} mix${mixes === 1 ? '' : 'es'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t read that.');
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <Button title={isWeb ? 'Copy my data' : 'Share my data'} icon="copy-outline" kind="ghost" onPress={copy} />
      <Field value={pasted} onChangeText={setPasted} placeholder="Paste copied data here" multiline numberOfLines={3} style={{ maxHeight: 120 }} />
      <Button title="Add it to this app" icon="download-outline" kind="ghost" onPress={add} />
      {note ? <Txt variant="muted">{note}</Txt> : null}
      {error ? <Txt variant="muted" style={{ color: '#E26D5C' }}>{error}</Txt> : null}
    </View>
  );
}
