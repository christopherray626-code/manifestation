import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { CATEGORIES } from '@/components/goal-bits';
import { BackHeader, Button, Chip, ChipRow, Field, Screen, Section, Txt } from '@/components/ui';
import { writeAffirmations } from '@/lib/affirmations';
import { useStore } from '@/lib/store';
import { newId, type Category, type Goal, type Voice } from '@/lib/types';

const VOICES: { id: Voice; label: string }[] = [
  { id: 'calm-female', label: 'Calm female' },
  { id: 'deep-male', label: 'Deep male' },
  { id: 'my-voice', label: 'My voice' },
];

export default function NewGoalScreen() {
  const { addGoal, settings } = useStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [details, setDetails] = useState('');
  const [feeling, setFeeling] = useState('');
  const [writeForMe, setWriteForMe] = useState(true);
  const [voice, setVoice] = useState<Voice>('calm-female');
  const [error, setError] = useState('');

  function create() {
    if (!title.trim()) {
      setError('Give your goal a name first.');
      return;
    }
    const now = Date.now();
    const goal: Goal = {
      id: newId(),
      title: title.trim(),
      category,
      details: details.trim(),
      feeling: feeling.trim(),
      voice,
      createdAt: now,
      affirmations: writeForMe ? writeAffirmations({ title, category, feeling }, [], 12) : [],
      rotation: { ...settings.defaultRotation, anchor: now },
    };
    addGoal(goal);
    router.replace({ pathname: '/goal/[id]', params: { id: goal.id } });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader title="" onBack={() => router.back()} />
        <Txt variant="display">What do you want?</Txt>
        <Txt variant="muted">Be specific. The more detail, the more personal your affirmations.</Txt>

        <Section label="Name your goal">
          <Field
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setError('');
            }}
            placeholder="Black Tesla Model 3"
            error={error}
            returnKeyType="next"
          />
        </Section>

        <Section label="Category">
          <ChipRow>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </ChipRow>
        </Section>

        <Section label="The details">
          <Field
            value={details}
            onChangeText={setDetails}
            placeholder="White seats. Paid off. Parked in my own driveway by next summer."
            multiline
          />
        </Section>

        <Section label="How it will feel">
          <Field value={feeling} onChangeText={setFeeling} placeholder="Proud, free, calm" />
        </Section>

        <Section label="Affirmations">
          <ChipRow>
            <Chip label="Write them for me" selected={writeForMe} onPress={() => setWriteForMe(true)} />
            <Chip label="I'll write my own" selected={!writeForMe} onPress={() => setWriteForMe(false)} />
          </ChipRow>
        </Section>

        <Section label="Voice">
          <ChipRow>
            {VOICES.map((v) => (
              <Chip key={v.id} label={v.label} selected={voice === v.id} onPress={() => setVoice(v.id)} />
            ))}
          </ChipRow>
        </Section>

        <View style={{ marginTop: 8 }}>
          <Button title={writeForMe ? 'Write my affirmations' : 'Continue'} onPress={create} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
