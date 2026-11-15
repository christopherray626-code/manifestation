import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackHeader, Button, Field, Screen, Section, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';
import { originalTrack, TRACKS } from '@/lib/tracks';

/** Developer mode: one ready-made track's name and lines, one affirmation per line. */
export default function DevTrack() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings, updateSettings } = useStore();
  const track = TRACKS.find((tr) => tr.id === id);
  const [title, setTitle] = useState(track ? track.title : '');
  const [text, setText] = useState(track ? track.lines.join('\n') : '');
  const [saved, setSaved] = useState('');
  if (!track) return <Redirect href="/dev" />;
  const base = originalTrack(track.id)!;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/dev'));

  function save() {
    const same = title.trim() === base.title && lines.join('\n') === base.lines.join('\n');
    const edits = { ...settings.trackEdits };
    if (same) delete edits[track!.id];
    else edits[track!.id] = { title: title.trim(), lines };
    updateSettings({ trackEdits: edits });
    setSaved(same ? 'Same as the original.' : 'Saved.');
  }

  function reset() {
    const edits = { ...settings.trackEdits };
    delete edits[track!.id];
    updateSettings({ trackEdits: edits });
    setTitle(base.title);
    setText(base.lines.join('\n'));
    setSaved('Back to the original.');
  }

  return (
    <Screen>
      <BackHeader title="Edit track" onBack={back} />
      <Section label="Name">
        <Field value={title} onChangeText={setTitle} />
      </Section>
      <Section label={`Affirmations · ${lines.length}`}>
        <Txt variant="muted">One per line. Blank lines are skipped.</Txt>
        <Field
          value={text}
          onChangeText={(v) => {
            setText(v);
            setSaved('');
          }}
          multiline
          textAlignVertical="top"
          style={{ minHeight: 360 }}
        />
      </Section>
      <Button title="Save" icon="checkmark" onPress={save} />
      {!!saved && <Txt variant="muted">{saved}</Txt>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="Open track" icon="play" kind="ghost" onPress={() => router.push(`/track/${track.id}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Original" icon="refresh" kind="ghost" onPress={reset} />
        </View>
      </View>
    </Screen>
  );
}
