import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { useEnhance } from '@/components/enhance';
import { RotationPicker } from '@/components/goal-bits';
import { BackHeader, Button, Card, Field, Icon, QuoteBlock, Screen, Section, Txt, useTheme } from '@/components/ui';
import { writeAffirmationsSmart } from '@/lib/affirmations';
import { deleteRecording } from '@/lib/recordings';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { todaysAffirmation } from '@/lib/today';
import { makeAffirmation, type Affirmation, type Goal } from '@/lib/types';

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, updateGoal, deleteGoal, settings } = useStore();
  const { open, goal: playingGoal, tape } = usePlayer();
  const t = useTheme();
  const goal = goals.find((g) => g.id === id);

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showRotation, setShowRotation] = useState(false);
  const [note, setNote] = useState('');
  const [writing, setWriting] = useState(false);
  // A long list (a 250-line tape) is slow to open and to scroll past: show the first few until asked.
  const [showAll, setShowAll] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  // The line just removed, kept for a few seconds so it can be put back.
  const [removed, setRemoved] = useState<{ aff: Affirmation; at: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRemoved = useRef<Affirmation | null>(null);
  // Leaving the screen: the removal stands, so its recording can go.
  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      if (lastRemoved.current) deleteRecording(lastRemoved.current.recording);
    },
    [],
  );
  // Lines recorded in their own voice are left alone, so the recording still matches the words.
  const canEnhance = (a: Affirmation) => !a.recording && !/^It[’']s done\b/.test(a.text);
  const enhanceable = goal ? goal.affirmations.filter(canEnhance) : [];
  // Which lines the current Enhance is for: all of them, or the one whose sparkle was tapped.
  const [enhancing, setEnhancing] = useState<string[]>([]);
  const enhance = useEnhance(
    goal ? { title: goal.title, details: goal.details, feeling: goal.feeling, name: settings.name } : {},
    (lines) => {
      const byId = new Map(enhancing.map((affId, i) => [affId, lines[i]]));
      updateGoal(id, (g) => ({
        ...g,
        affirmations: g.affirmations.map((a) => (byId.has(a.id) && byId.get(a.id) !== a.text ? { ...a, text: byId.get(a.id)! } : a)),
      }));
    },
  );

  if (!goal) {
    return (
      <Screen>
        <BackHeader title="Goal not found" onBack={() => router.back()} />
      </Screen>
    );
  }

  const today = todaysAffirmation(goal);
  const change = (fn: (g: Goal) => Goal) => updateGoal(goal.id, fn);
  const changeAffirmation = (affId: string, patch: Partial<Affirmation>) =>
    change((g) => ({ ...g, affirmations: g.affirmations.map((a) => (a.id === affId ? { ...a, ...patch } : a)) }));

  function addOwn() {
    const text = draft.trim();
    if (!text) return;
    change((g) => ({ ...g, affirmations: [...g.affirmations, makeAffirmation(text, true)] }));
    setDraft('');
    if (!showAll && goal!.affirmations.length >= FOLD) setNote('Added. It’s at the end of your list.');
  }

  function saveTitle() {
    const text = titleDraft.trim();
    if (text && text !== goal!.title) change((g) => ({ ...g, title: text }));
    setRenaming(false);
  }

  async function writeMore() {
    if (writing) return;
    setWriting(true);
    setNote('');
    const more = await writeAffirmationsSmart(
      { title: goal!.title, category: goal!.category, feeling: goal!.feeling, details: goal!.details, name: settings.name },
      goal!.affirmations.map((a) => a.text),
      4,
    );
    setWriting(false);
    if (!more.length) {
      setNote("That's every one I can write for now. Add your own below.");
      return;
    }
    setNote('');
    change((g) => ({ ...g, affirmations: [...g.affirmations, ...more] }));
  }

  /** The removal is final: its recording (if any) is deleted. */
  function settle() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    if (lastRemoved.current) deleteRecording(lastRemoved.current.recording);
    lastRemoved.current = null;
  }

  function undoRemove() {
    if (!removed) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    lastRemoved.current = null;
    const { aff, at } = removed;
    change((g) => {
      const list = [...g.affirmations];
      list.splice(Math.min(at, list.length), 0, aff);
      return { ...g, affirmations: list };
    });
    setRemoved(null);
  }

  function remove(aff: Affirmation) {
    // One tap removes, with a few seconds to take it back (it used to be gone for good, recording and all).
    settle();
    lastRemoved.current = aff;
    setRemoved({ aff, at: goal!.affirmations.findIndex((a) => a.id === aff.id) });
    undoTimer.current = setTimeout(() => {
      settle();
      setRemoved(null);
    }, 8000);
    change((g) => ({
      ...g,
      affirmations: g.affirmations.filter((a) => a.id !== aff.id),
      rotation: g.rotation.pinnedId === aff.id ? { ...g.rotation, pinnedId: undefined } : g.rotation,
    }));
  }

  function pin(aff: Affirmation) {
    // Make this today's affirmation; the schedule counts on from today.
    change((g) => ({ ...g, rotation: { ...g.rotation, pinnedId: aff.id, anchor: Date.now() } }));
  }

  function saveEdit() {
    if (editingId && editText.trim()) changeAffirmation(editingId, { text: editText.trim() });
    setEditingId(null);
  }

  function confirmDelete() {
    const go = () => {
      if (playingGoal?.id === goal!.id) tape.pause();
      goal!.affirmations.forEach((a) => deleteRecording(a.recording));
      deleteGoal(goal!.id);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    };
    // The website has no alert boxes of its own: this button did nothing there.
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this? Its affirmations will be removed too.')) go();
      return;
    }
    Alert.alert('Remove this?', 'Its affirmations will be removed too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: go },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        {renaming ? (
          <Field
            value={titleDraft}
            onChangeText={setTitleDraft}
            autoFocus
            onBlur={saveTitle}
            onSubmitEditing={saveTitle}
            returnKeyType="done"
            placeholder="Name it"
          />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <BackHeader title={goal.title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            </View>
            <Pressable
              onPress={() => {
                setTitleDraft(goal.title);
                setRenaming(true);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Rename">
              <Icon name="create-outline" size={20} color={t.colors.muted} />
            </Pressable>
          </View>
        )}

        {today ? (
          <QuoteBlock label="Today's affirmation" text={today.text} />
        ) : (
          <Txt variant="muted">{"Add an affirmation below and it becomes today's affirmation."}</Txt>
        )}

        {goal.affirmations.length > 0 && <Button title="Play my tape" icon="play" onPress={() => open({ kind: 'goal', id: goal.id })} />}

        <Pressable
          onPress={() => setShowRotation((s) => !s)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          accessibilityRole="button">
          <Icon name="repeat-outline" size={16} color={t.colors.accent} />
          <Txt variant="muted" style={{ color: t.colors.accent }}>
            {rotationSummary(goal)}
          </Txt>
          <Icon name={showRotation ? 'chevron-up' : 'chevron-down'} size={14} color={t.colors.accent} />
        </Pressable>
        {showRotation && (
          <Card>
            <RotationPicker
              value={goal.rotation}
              onChange={(patch) => change((g) => ({ ...g, rotation: { ...g.rotation, ...patch, anchor: Date.now() } }))}
            />
            <Txt variant="muted" style={{ marginTop: 12 }}>
              {"Tap the pin on any affirmation to make it today's."}
            </Txt>
          </Card>
        )}

        <Section label="Your affirmations">
          <Txt variant="muted">Edit, remove, or keep. Tap the heart on your favorites.</Txt>
          {enhanceable.length > 0 && (
            <Button
              title={enhance.busy && enhancing.length > 1 ? 'Enhancing…' : 'Enhance my affirmations'}
              icon="sparkles-outline"
              kind="ghost"
              onPress={() => {
                setEnhancing(enhanceable.map((a) => a.id));
                enhance.start(enhanceable.map((a) => a.text));
              }}
            />
          )}
          {!!enhance.error && <Txt variant="muted">{enhance.error}</Txt>}
        </Section>
        {enhance.sheet}

        {removed && (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Txt variant="muted" style={{ flex: 1 }} numberOfLines={1}>
                {`Removed “${removed.aff.text}”`}
              </Txt>
              <Pressable onPress={undoRemove} hitSlop={12} accessibilityRole="button">
                <Txt variant="medium" style={{ color: t.colors.accent }}>
                  Undo
                </Txt>
              </Pressable>
            </View>
          </Card>
        )}

        {(showAll ? goal.affirmations : goal.affirmations.slice(0, FOLD)).map((a, i) => {
          const isToday = today?.id === a.id;
          return (
            <Card key={a.id} highlight={a.mine}>
              {editingId === a.id ? (
                <View style={{ gap: 8 }}>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    autoFocus
                    multiline
                    onBlur={saveEdit}
                    style={{ color: t.colors.text, fontFamily: t.fonts.quote, fontSize: 17, lineHeight: 24 }}
                  />
                  <Pressable onPress={saveEdit} accessibilityRole="button">
                    <Txt variant="muted" style={{ color: t.colors.accent }}>
                      Done
                    </Txt>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setEditingId(a.id);
                      setEditText(a.text);
                    }}>
                    <Txt variant="quote" style={{ fontSize: 17, lineHeight: 24 }}>
                      {a.text}
                    </Txt>
                    {(a.mine || isToday) && (
                      <Txt variant="label" style={{ marginTop: 6, color: t.colors.accent }}>
                        {[a.mine && 'Yours', isToday && 'Today'].filter(Boolean).join(' · ')}
                      </Txt>
                    )}
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 14, paddingTop: 2 }}>
                    {canEnhance(a) && (
                      <Pressable
                        onPress={() => {
                          setEnhancing([a.id]);
                          enhance.start([a.text]);
                        }}
                        hitSlop={8}
                        accessibilityLabel="Enhance this affirmation">
                        <Icon
                          name={enhance.busy && enhancing[0] === a.id && enhancing.length === 1 ? 'hourglass-outline' : 'sparkles-outline'}
                          size={19}
                          color={t.colors.muted}
                        />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id, start: String(i) } })}
                      hitSlop={8}
                      accessibilityLabel={a.recording ? 'Re-record in your voice' : 'Record in your voice'}>
                      <Icon name={a.recording ? 'mic' : 'mic-outline'} size={19} color={a.recording ? t.colors.accent : t.colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => pin(a)} hitSlop={8} accessibilityLabel="Make this today's affirmation">
                      <Icon name={isToday ? 'pin' : 'pin-outline'} size={19} color={isToday ? t.colors.accent : t.colors.muted} />
                    </Pressable>
                    <Pressable
                      onPress={() => changeAffirmation(a.id, { favorite: !a.favorite })}
                      hitSlop={8}
                      accessibilityLabel={a.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                      <Icon name={a.favorite ? 'heart' : 'heart-outline'} size={19} color={a.favorite ? t.colors.accent : t.colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => remove(a)} hitSlop={8} accessibilityLabel="Delete affirmation">
                      <Icon name="close" size={19} color={t.colors.muted} />
                    </Pressable>
                  </View>
                </View>
              )}
            </Card>
          );
        })}
        {!showAll && goal.affirmations.length > FOLD && (
          <Button title={`Show all ${goal.affirmations.length} affirmations`} icon="chevron-down" kind="ghost" onPress={() => setShowAll(true)} />
        )}

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Field
              value={draft}
              onChangeText={setDraft}
              placeholder="Write your own affirmation"
              onSubmitEditing={addOwn}
              returnKeyType="done"
            />
          </View>
          <Pressable
            onPress={addOwn}
            accessibilityRole="button"
            accessibilityLabel="Add affirmation"
            style={{ width: 46, height: 46, borderRadius: t.radius, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="add" size={22} color={t.colors.onAccent} />
          </Pressable>
        </View>

        <Pressable onPress={writeMore} style={{ flexDirection: 'row', gap: 6, alignSelf: 'center', padding: 6 }} accessibilityRole="button">
          <Icon name="refresh" size={15} color={t.colors.muted} />
          <Txt variant="muted">{writing ? 'Writing…' : 'Write more for me'}</Txt>
        </Pressable>
        {note ? <Txt variant="muted" style={{ textAlign: 'center' }}>{note}</Txt> : null}

        {goal.affirmations.length > 0 && (
          <Button
            title={recordedLabel(goal)}
            kind="ghost"
            icon="mic-outline"
            onPress={() => {
              const next = goal.affirmations.findIndex((a) => !a.recording);
              router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id, start: String(Math.max(next, 0)) } });
            }}
          />
        )}
        <Button title="Play my tape" icon="play" onPress={() => open({ kind: 'goal', id: goal.id })} />
        <Pressable onPress={confirmDelete} style={{ alignSelf: 'center', padding: 8 }} accessibilityRole="button">
          <Txt variant="muted">Remove</Txt>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

// How many affirmations show before "Show all".
const FOLD = 20;

function recordedLabel(goal: Goal) {
  const done = goal.affirmations.filter((a) => a.recording).length;
  if (!done) return 'Record my voice';
  if (done === goal.affirmations.length) return 'All recorded in your voice';
  return `Record my voice (${done} of ${goal.affirmations.length} done)`;
}

function rotationSummary(goal: Goal) {
  const { every, order, favoritesOnly } = goal.rotation;
  if (every === 0) return 'Keeping the same affirmation every day';
  const when = every === 1 ? 'every day' : every === 7 ? 'every week' : every === 30 ? 'every month' : `every ${every} days`;
  const how = order === 'shuffle' ? 'Shuffles' : 'Changes';
  return `${how} ${when}${favoritesOnly ? ', favorites only' : ''}`;
}
