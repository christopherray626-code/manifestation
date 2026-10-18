import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Art } from '@/components/art';
import { Creating, VOICING_MESSAGES, WRITING_MESSAGES } from '@/components/creating';
import { ThemePicker } from '@/components/theme-picker';
import { Button, Chip, ChipRow, Field, Icon, Screen, Txt, useTheme } from '@/components/ui';
import { VOICE_LIST } from '@/components/voice-picker';
import { success, tap } from '@/lib/haptics';
import { usePlayer } from '@/lib/player';
import { askPermission, supported as remindersSupported } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { trackById, TRACKS } from '@/lib/tracks';
import { DEFAULT_VOICE, newId, type Voice } from '@/lib/types';

/*
 * Onboarding: a few one-tap questions that each change something, then a first listen built from the
 * answers before anything is asked of them, then (on phones) a reminder time, then the paywall.
 */

const INTENTIONS: { id: string; label: string }[] = [
  { id: 'money-magnet', label: 'Money' },
  { id: 'success', label: 'Success' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'love', label: 'Love' },
  { id: 'self-love', label: 'Self-love' },
  { id: 'glow-up', label: 'Glow up' },
  { id: 'luck', label: 'Luck' },
  { id: 'calm', label: 'Calm' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'health', label: 'Health' },
  { id: 'focus', label: 'Focus' },
  { id: 'career', label: 'Career' },
];

const REMINDER_TIMES = [
  { label: 'Morning · 8:00', hour: 8, minute: 0 },
  { label: 'Midday · 12:30', hour: 12, minute: 30 },
  { label: 'Night · 9:00', hour: 21, minute: 0 },
];

type Step = 'welcome' | 'name' | 'intentions' | 'voice' | 'vibe' | 'building' | 'listen' | 'reminder';
const STEPS: Step[] = ['welcome', 'name', 'intentions', 'voice', 'vibe', 'building', 'listen', 'reminder'];

export default function Onboarding() {
  const t = useTheme();
  const { settings, updateSettings } = useStore();
  const player = usePlayer();
  const [step, setStep] = useState<Step>('welcome');
  const [picked, setPicked] = useState<string[]>([]);
  const [voice, setVoice] = useState<Voice>(DEFAULT_VOICE);

  const first = trackById(picked[0]) ?? TRACKS[0];
  const at = STEPS.indexOf(step);
  const next = () => {
    tap();
    // Reminders are phone-only, so the web skips straight to the paywall.
    const following = STEPS[at + 1];
    if (!following || (following === 'reminder' && !remindersSupported)) finish();
    else setStep(following);
  };

  function finish() {
    player.tape.pause();
    router.replace({ pathname: '/paywall', params: { from: 'onboarding' } });
  }

  // "Building your plan": a short beat that visibly uses the answers, then the first listen loads.
  useEffect(() => {
    if (step !== 'building') return;
    updateSettings({ intentions: picked });
    player.choose({ kind: 'track', id: first.id });
    const timer = setTimeout(() => {
      player.setVoice(voice);
      setStep('listen');
    }, 1800);
    return () => clearTimeout(timer);
    // Runs once on entering the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function remindAt(hour: number, minute: number) {
    tap();
    if (await askPermission()) {
      updateSettings({ reminders: [{ id: newId(), hour, minute, opens: 'affirmation', enabled: true }] });
      success();
    }
    finish();
  }

  const voiceName = VOICE_LIST.find((v) => v.id === voice)?.label ?? 'Calm';

  return (
    <Screen>
      {step !== 'welcome' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <Pressable
            onPress={() => setStep(STEPS[Math.max(at - 1, 0)])}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <Icon name="chevron-back" size={24} color={t.colors.muted} />
          </Pressable>
          {/* Progress */}
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: t.colors.border }}>
            <View style={{ width: `${((at + 1) / STEPS.length) * 100}%`, height: 4, borderRadius: 2, backgroundColor: t.colors.accent }} />
          </View>
        </View>
      )}

      {step === 'welcome' && (
        <View style={{ gap: 18, marginTop: 40 }}>
          <Icon name="sparkles" size={36} color={t.colors.accent} />
          <Txt variant="display">Hear it as already yours</Txt>
          <Txt variant="body" style={{ color: t.colors.muted }}>
            Affirmations written around what you want, read to you by calm natural voices, spoken or as
            subliminals. Let&apos;s make your first one. It takes a minute.
          </Txt>
          <Button title="Let’s begin" onPress={next} />
        </View>
      )}

      {step === 'name' && (
        <View style={{ gap: 16 }}>
          <Txt variant="display">What should we call you?</Txt>
          <Txt variant="muted">Some affirmations will use it.</Txt>
          <Field
            value={settings.name}
            onChangeText={(name) => updateSettings({ name })}
            placeholder="Your first name"
            autoCapitalize="words"
            autoComplete="off"
            importantForAutofill="no"
          />
          <Button title={settings.name.trim() ? 'Continue' : 'Skip'} onPress={next} />
        </View>
      )}

      {step === 'intentions' && (
        <View style={{ gap: 16 }}>
          <Txt variant="display">What’s already yours?</Txt>
          <Txt variant="muted">Pick as many as you like.</Txt>
          <ChipRow>
            {INTENTIONS.map((i) => (
              <Chip
                key={i.id}
                label={i.label}
                selected={picked.includes(i.id)}
                onPress={() => setPicked((p) => (p.includes(i.id) ? p.filter((x) => x !== i.id) : [...p, i.id]))}
              />
            ))}
          </ChipRow>
          {picked.length > 0 && <Button title="Continue" onPress={next} />}
        </View>
      )}

      {step === 'voice' && (
        <View style={{ gap: 16 }}>
          <Txt variant="display">Whose voice feels right?</Txt>
          <Txt variant="muted">You can change it anytime.</Txt>
          {(['her', 'him'] as const).map((who) => (
            <View key={who} style={{ gap: 8 }}>
              <Txt variant="muted" style={{ fontSize: 12 }}>
                {who === 'her' ? 'Women' : 'Men'}
              </Txt>
              <ChipRow>
                {VOICE_LIST.filter((v) => v.who === who).map((v) => (
                  <Chip key={v.id} label={v.label} selected={voice === v.id} onPress={() => setVoice(v.id)} />
                ))}
              </ChipRow>
            </View>
          ))}
          <Button title="Continue" onPress={next} />
        </View>
      )}

      {step === 'vibe' && (
        <View style={{ gap: 16 }}>
          <Txt variant="display">Pick your vibe</Txt>
          <ThemePicker />
          <Button title="Make my first listen" onPress={next} />
        </View>
      )}

      {step === 'building' && (
        <View style={{ gap: 18, alignItems: 'center', marginTop: 80 }}>
          <ActivityIndicator color={t.colors.accent} size="large" />
          <Txt variant="title" style={{ textAlign: 'center' }}>
            {`Writing your ${first.title.toLowerCase()} affirmations in the ${voiceName} voice…`}
          </Txt>
        </View>
      )}

      {step === 'listen' && (
        <View style={{ gap: 18, alignItems: 'center' }}>
          <Txt variant="label">Your first listen</Txt>
          <Art icon={first.icon} index={TRACKS.indexOf(first)} size={200} />
          <Txt variant="display" style={{ textAlign: 'center' }}>
            {first.title}
          </Txt>
          <Txt variant="quote" style={{ textAlign: 'center', fontSize: 20, lineHeight: 28 }}>
            {`“${player.list[player.tape.index]?.text ?? first.lines[0]}”`}
          </Txt>
          <Pressable
            onPress={player.toggle}
            accessibilityRole="button"
            accessibilityLabel={player.tape.playing ? 'Pause' : 'Play'}
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            {player.prep ? (
              <ActivityIndicator color={t.colors.onAccent} />
            ) : (
              <Icon name={player.tape.playing ? 'pause' : 'play'} size={34} color={t.colors.onAccent} />
            )}
          </Pressable>
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            {player.prep ? `Getting the ${voiceName} voice ready…` : 'Close your eyes and let it land. Put headphones in if you have them.'}
          </Txt>
          {player.voiceError ? <Txt variant="muted" style={{ color: '#E26D5C', textAlign: 'center' }}>{player.voiceError}</Txt> : null}
          <View style={{ alignSelf: 'stretch' }}>
            <Button title="Continue" kind="ghost" onPress={next} />
          </View>
        </View>
      )}

      {step === 'reminder' && (
        <View style={{ gap: 16 }}>
          <Txt variant="display">When should your affirmation find you?</Txt>
          <Txt variant="muted">One a day, at a time you choose. The notification is the affirmation itself.</Txt>
          {REMINDER_TIMES.map((r) => (
            <Button key={r.label} title={r.label} kind="ghost" onPress={() => remindAt(r.hour, r.minute)} />
          ))}
          <Pressable onPress={finish} accessibilityRole="button" style={{ alignSelf: 'center', padding: 12 }}>
            <Txt variant="muted">Not now</Txt>
          </Pressable>
        </View>
      )}
      <Creating
        visible={step === 'building' || (step === 'listen' && !!player.prep)}
        messages={step === 'building' ? WRITING_MESSAGES : VOICING_MESSAGES}
        detail={player.prep ? `${player.prep.done} of ${player.prep.total} lines` : undefined}
      />
    </Screen>
  );
}
