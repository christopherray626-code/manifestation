import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BackHeader, Button, Icon, Screen, Txt, useTheme } from '@/components/ui';
import { deleteRecording, keepRecording, recordingUri } from '@/lib/recordings';
import { useStore } from '@/lib/store';

function seconds(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Walks through a goal's affirmations so you can record each one in your own voice. */
export default function RecordScreen() {
  const t = useTheme();
  const { goalId, start } = useLocalSearchParams<{ goalId: string; start?: string }>();
  const { goals, updateGoal } = useStore();
  const goal = goals.find((g) => g.id === goalId);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const preview = useAudioPlayer(null);

  const [index, setIndex] = useState(Number(start) || 0);
  const [take, setTake] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!goal || !goal.affirmations.length) {
    return (
      <Screen>
        <BackHeader title="Nothing to record" onBack={() => router.back()} />
        <Txt variant="muted">Add some affirmations here first.</Txt>
      </Screen>
    );
  }

  const total = goal.affirmations.length;
  const aff = goal.affirmations[Math.min(index, total - 1)];
  const recording = recorderState.isRecording;

  async function startRecording() {
    setError('');
    preview.pause();
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      setError('Allow microphone access in your phone settings to record your voice.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stopRecording() {
    await recorder.stop();
    // Switch recording mode off again, or iPhones play everything through the earpiece.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setTake(recorder.uri);
  }

  function listen(uri: string) {
    preview.replace({ uri });
    preview.play();
  }

  function go(to: number) {
    preview.pause();
    setTake(null);
    if (to >= total || to < 0) router.back();
    else setIndex(to);
  }

  function save() {
    if (!take) return;
    const name = keepRecording(take);
    const old = aff.recording;
    updateGoal(goal!.id, (g) => ({
      ...g,
      affirmations: g.affirmations.map((a) => (a.id === aff.id ? { ...a, recording: name } : a)),
    }));
    deleteRecording(old);
    go(index + 1);
  }

  return (
    <Screen>
      <BackHeader title="Record your voice" onBack={() => router.back()} />
      <Txt variant="label">
        {index + 1} of {total}
      </Txt>

      <View style={{ minHeight: 160, justifyContent: 'center', paddingVertical: 12 }}>
        <Txt variant="quote" style={{ textAlign: 'center', fontSize: 26, lineHeight: 36 }}>
          {aff.text}
        </Txt>
      </View>
      <Txt variant="muted" style={{ textAlign: 'center' }}>
        {recording ? 'Recording. Read it slowly, like you mean it.' : take ? 'How did that sound?' : 'Read it out loud, slowly and with feeling.'}
      </Txt>

      <View style={{ alignItems: 'center', gap: 10, marginVertical: 10 }}>
        <Pressable
          onPress={recording ? stopRecording : startRecording}
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: recording ? '#E26D5C' : t.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={recording ? 'stop' : 'mic'} size={34} color={recording ? '#FFFFFF' : t.colors.onAccent} />
        </Pressable>
        <Txt variant="muted">{recording ? seconds(recorderState.durationMillis) : take ? 'Tap to redo' : 'Tap to record'}</Txt>
      </View>

      {error ? <Txt variant="muted" style={{ color: '#E26D5C', textAlign: 'center' }}>{error}</Txt> : null}

      {take && !recording && (
        <View style={{ gap: 10 }}>
          <Button title="Listen back" kind="ghost" icon="play" onPress={() => listen(take)} />
          <Button title={index + 1 < total ? 'Save and next' : 'Save and finish'} onPress={save} />
        </View>
      )}

      {!take && !recording && aff.recording && (
        <Button title="Hear your saved recording" kind="ghost" icon="play" onPress={() => listen(recordingUri(aff.recording!))} />
      )}

      {!recording && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Pressable onPress={() => go(index - 1)} disabled={index === 0} hitSlop={10} style={{ opacity: index === 0 ? 0.3 : 1 }}>
            <Txt variant="muted">Back</Txt>
          </Pressable>
          <Pressable onPress={() => go(index + 1)} hitSlop={10}>
            <Txt variant="muted">{index + 1 < total ? 'Skip' : 'Done'}</Txt>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
