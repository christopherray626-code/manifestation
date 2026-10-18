import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { CATEGORIES } from '@/components/goal-bits';
import { VoicePicker } from '@/components/voice-picker';
import { Why } from '@/components/why';
import { BackHeader, Button, Chip, ChipRow, Field, Screen, Section, Txt } from '@/components/ui';
import { writeAffirmationsSmart } from '@/lib/affirmations';
import { useStore } from '@/lib/store';
import { WHY } from '@/lib/tips';
import { DEFAULT_VOICE, newId, type Category, type Goal, type Voice } from '@/lib/types';


export default function NewGoalScreen() {
  const { addGoal, settings } = useStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [details, setDetails] = useState('');
  const [feeling, setFeeling] = useState('');
  const [writeForMe, setWriteForMe] = useState(true);
  const [voice, setVoice] = useState<Voice>(DEFAULT_VOICE);
  const [error, setError] = useState('');
  const [writing, setWriting] = useState(false);

  async function create() {
    if (writing) return;
    if (!title.trim()) {
      setError('Give it a name first.');
      return;
    }
    let affirmations: Goal['affirmations'] = [];
    if (writeForMe) {
      setWriting(true);
      affirmations = await writeAffirmationsSmart(
        { title: title.trim(), category, feeling, details: details.trim(), name: settings.name },
        [],
        12,
      );
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
      affirmations,
      rotation: { ...settings.defaultRotation, anchor: now },
    };
    addGoal(goal);
    router.replace({ pathname: '/goal/[id]', params: { id: goal.id } });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader title="" onBack={() => router.back()} />
        <Txt variant="display">What’s already yours?</Txt>
        <Txt variant="muted">Describe it as it is now that it’s here. The more detail, the more personal your affirmations.</Txt>
        <Why text={WHY.presentTense} label="Why it’s written as already yours" />

        <Section label="Name it">
          <Field
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setError('');
            }}
            placeholder="Walk into every room confident"
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
            placeholder="I speak up without overthinking. People notice how calm and sure I am."
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
          <VoicePicker value={voice} onChange={setVoice} />
        </Section>

        <View style={{ marginTop: 8 }}>
          <Button
            title={writing ? 'Writing your affirmations…' : writeForMe ? 'Write my affirmations' : 'Continue'}
            onPress={create}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
