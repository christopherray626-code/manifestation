import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, TextInput, View } from 'react-native';

import { Why } from '@/components/why';
import { BackHeader, Button, Card, Chip, ChipRow, Icon, Screen, Txt, useTheme } from '@/components/ui';
import { success } from '@/lib/haptics';
import { useStore } from '@/lib/store';
import { localDay } from '@/lib/today';
import { newId, type JournalEntry } from '@/lib/types';

/*
 * The scripting journal. Scripts: write your day as if what you want is already here, in the past
 * tense, the way you'd write a diary the night after. Signs: note anything that showed up today that
 * tells you it's on its way. Both stay on this phone with everything else.
 */

const SCRIPT_PROMPTS = [
  'Dear diary, I still can’t believe today happened…',
  'Write tonight’s entry as the you who already has it.',
  'Describe an ordinary day in your life now that it’s here.',
  'Who did you tell first, and what did they say?',
  'What did you celebrate today?',
  'What’s different about your mornings now?',
  'Write a thank-you note for what you received this week.',
];

const SIGN_PROMPTS = [
  'What showed up today that tells you it’s coming?',
  'A number, a song, a conversation… what did you notice?',
  'What small win happened today?',
];

const WHY_SCRIPTING =
  'Scripting is writing your life as if it’s already happened. Writing it in the past tense, with feeling and small real details, trains your mind to treat it as done. Logging the signs keeps your attention on proof, and what you notice grows.';

export default function JournalScreen() {
  const t = useTheme();
  const { journal, addEntry, deleteEntry } = useStore();
  const [kind, setKind] = useState<JournalEntry['kind']>('script');
  const [text, setText] = useState('');
  const [day] = useState(() => localDay(Date.now()));
  const prompts = kind === 'script' ? SCRIPT_PROMPTS : SIGN_PROMPTS;
  const prompt = prompts[day % prompts.length];

  function save() {
    if (!text.trim()) return;
    addEntry({ id: newId(), kind, text: text.trim(), createdAt: Date.now() });
    setText('');
    success();
  }

  function remove(entry: JournalEntry) {
    const go = () => deleteEntry(entry.id);
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this entry?')) go();
      return;
    }
    Alert.alert('Remove this entry?', undefined, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: go },
    ]);
  }

  return (
    <Screen>
      <BackHeader title="" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <View style={{ gap: 6 }}>
        <Txt variant="display">Journal</Txt>
        <Txt variant="muted">Write it as if it already happened.</Txt>
        <Why text={WHY_SCRIPTING} label="What is scripting?" />
      </View>

      <ChipRow>
        <Chip label="Script my day" selected={kind === 'script'} onPress={() => setKind('script')} />
        <Chip label="A sign it’s here" selected={kind === 'sign'} onPress={() => setKind('sign')} />
      </ChipRow>

      <View style={{ gap: 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={prompt}
          placeholderTextColor={t.colors.muted}
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 160,
            borderRadius: t.radius,
            borderWidth: 1,
            borderColor: t.colors.border,
            backgroundColor: t.colors.field,
            color: t.colors.text,
            fontFamily: t.fonts.body,
            fontSize: 15,
            lineHeight: 22,
            padding: 16,
          }}
        />
        <Button title={kind === 'script' ? 'Save my script' : 'Save this sign'} icon="checkmark" onPress={save} />
      </View>

      {journal.length > 0 && (
        <View style={{ gap: 12 }}>
          <Txt variant="label">Your entries</Txt>
          {journal.map((e) => (
            <Card key={e.id}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name={e.kind === 'script' ? 'create-outline' : 'sparkles-outline'} size={16} color={t.colors.accent} />
                  <Txt variant="muted" style={{ flex: 1 }}>
                    {`${e.kind === 'script' ? 'Script' : 'Sign'} · ${new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                  </Txt>
                  <Pressable onPress={() => remove(e)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Remove entry">
                    <Icon name="close" size={16} color={t.colors.muted} />
                  </Pressable>
                </View>
                <Txt variant="body">{e.text}</Txt>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
