import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

import { SoundList } from '@/components/sound-list';
import { TrackShelf } from '@/components/track-shelf';
import { VoicePicker } from '@/components/voice-picker';
import { Button, Card, Chip, ChipRow, Icon, Orb, Screen, Section, Txt, useTheme } from '@/components/ui';
import { useStore } from '@/lib/store';
import { trackAffirmations, trackById, TRACKS } from '@/lib/tracks';
import type { PlayerPrefs, TapeMode, Voice } from '@/lib/types';
import { audioFor, MODES, SUBLIMINAL_LEVELS, useTape } from '@/lib/use-tape';
import { naturalVoices, prepareVoice } from '@/lib/voices';


const SPOKEN_LEVELS = [
  { value: 0.3, label: 'Soft' },
  { value: 0.65, label: 'Medium' },
  { value: 1, label: 'Full' },
];

const SOUND_LEVELS = [
  { value: 0.15, label: 'Low' },
  { value: 0.4, label: 'Medium' },
  { value: 0.7, label: 'High' },
  { value: 1, label: 'Full' },
];

const TIMERS = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];


function nearest(levels: { value: number }[], value: number) {
  return levels.reduce((best, l) => (Math.abs(l.value - value) < Math.abs(best.value - value) ? l : best)).value;
}

function PulsingOrb({ playing }: { playing: boolean }) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!playing) {
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Orb size={190} />
    </Animated.View>
  );
}

export default function ListenScreen() {
  const t = useTheme();
  const { goals, settings, updateSettings, updateGoal } = useStore();
  const params = useLocalSearchParams<{ goal?: string; track?: string }>();
  const [goalId, setGoalId] = useState(params.goal ?? goals[0]?.id);
  // A ready-made track playing instead of a goal. With no goals yet, start on the first one.
  const [trackId, setTrackId] = useState(params.track ?? (goals.length || params.goal ? undefined : TRACKS[0].id));
  const [trackVoice, setTrackVoice] = useState<Voice>('calm-female');
  const [seenParams, setSeenParams] = useState(`${params.goal}|${params.track}`);
  const [showSettings, setShowSettings] = useState(false);

  // Opening from a goal's "Make my tape" or a track on Home switches to it.
  if (`${params.goal}|${params.track}` !== seenParams) {
    setSeenParams(`${params.goal}|${params.track}`);
    if (params.track) setTrackId(params.track);
    else if (params.goal) {
      setGoalId(params.goal);
      setTrackId(undefined);
    }
  }

  const track = trackById(trackId);
  const goal = track ? undefined : (goals.find((g) => g.id === goalId) ?? goals[0]);
  const prefs = settings.player;
  const trackList = useMemo(() => (track ? trackAffirmations(track) : []), [track]);
  const favorites = goal?.affirmations.filter((a) => a.favorite) ?? [];
  const list = track ? trackList : prefs.favoritesOnly && favorites.length ? favorites : (goal?.affirmations ?? []);
  const voice: Voice = track ? trackVoice : (goal?.voice ?? 'calm-female');
  const tape = useTape({ affirmations: list, voice, prefs });
  const [prep, setPrep] = useState<{ done: number; total: number } | null>(null);
  const [voiceError, setVoiceError] = useState('');

  /** Makes any missing natural-voice audio first, then plays. */
  async function start() {
    if (!list.length || prep) return;
    const missing = voice === 'my-voice' || !naturalVoices ? [] : list.filter((a) => !audioFor(a, voice));
    if (missing.length) {
      setVoiceError('');
      try {
        await prepareVoice(
          missing.map((a) => a.text),
          voice,
          (done, total) => setPrep({ done, total }),
        );
      } catch (e) {
        setVoiceError(e instanceof Error ? e.message : "Couldn't make the voice. Try again.");
        return;
      } finally {
        setPrep(null);
      }
    }
    tape.play();
    updateSettings({ lastPlayed: track ? { kind: 'track', id: track.id } : { kind: 'goal', id: goal!.id } });
  }

  const setPrefs = (patch: Partial<PlayerPrefs>) => updateSettings({ player: { ...prefs, ...patch } });

  function setMode(mode: TapeMode) {
    const m = MODES[mode];
    setPrefs({
      mode,
      voiceVolume: m.voiceVolume,
      soundVolume: m.soundVolume,
      // Subliminals need something to sit under.
      sound: mode === 'subliminal' && prefs.sound === 'none' ? 'pad' : prefs.sound,
    });
    tape.restart();
  }

  function pickGoal(id: string) {
    tape.pause();
    setTrackId(undefined);
    setGoalId(id);
  }

  const recorded = goal?.affirmations.filter((a) => a.recording).length ?? 0;
  const current = list[tape.index];
  const showOrb = t.group === 'mystical';
  const voiceLevels = tape.mode === 'subliminal' ? SUBLIMINAL_LEVELS : SPOKEN_LEVELS;

  return (
    <Screen>
      {goals.length > 0 && (
        <Section label="Your goals">
          <ChipRow>
            {goals.map((g) => (
              <Chip key={g.id} label={g.title} selected={g.id === goal?.id} onPress={() => pickGoal(g.id)} />
            ))}
          </ChipRow>
        </Section>
      )}

      <Section label="Ready-made tracks">
        <TrackShelf
          selectedId={track?.id}
          onPick={(picked) => {
            tape.pause();
            setTrackId(picked.id);
          }}
        />
      </Section>

      <ChipRow>
        {(Object.keys(MODES) as TapeMode[]).map((m) => (
          <Chip key={m} label={MODES[m].label} selected={tape.mode === m} onPress={() => setMode(m)} />
        ))}
      </ChipRow>
      <Txt variant="muted">{MODES[tape.mode].about}</Txt>

      {goal && !tape.ready && tape.mode === 'subliminal' && (
        <Card highlight>
          <View style={{ gap: 10 }}>
            <Txt variant="title">Subliminals need a recorded voice</Txt>
            <Txt variant="muted">
              {goal.voice === 'my-voice'
                ? 'Record at least one affirmation in your voice and it gets mixed in properly, far below the sound.'
                : 'The phone’s built-in voice can’t be mixed quietly enough. Switch the voice to My voice and record a few affirmations. Natural voices are coming.'}
            </Txt>
            <Button
              title="Record my voice"
              icon="mic-outline"
              onPress={() => {
                if (goal.voice !== 'my-voice') updateGoal(goal.id, (g) => ({ ...g, voice: 'my-voice' }));
                router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id } });
              }}
            />
          </View>
        </Card>
      )}

      {showOrb ? (
        <PulsingOrb playing={tape.playing} />
      ) : (
        <Txt variant="display" style={{ marginTop: 8 }}>
          {track?.title ?? goal?.title}
        </Txt>
      )}

      <View style={{ minHeight: 90, justifyContent: 'center' }}>
        <Txt variant="quote" style={{ textAlign: 'center', fontSize: 22, lineHeight: 30 }}>
          {current ? `"${current.text}"` : goal ? 'This goal has no affirmations yet.' : ''}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 36 }}>
        <Pressable onPress={() => tape.skip(-1)} hitSlop={12} accessibilityLabel="Previous affirmation" disabled={tape.mode === 'subliminal'} style={{ opacity: tape.mode === 'subliminal' ? 0 : 1 }}>
          <Icon name="play-skip-back-outline" size={24} color={t.colors.muted} />
        </Pressable>
        <Pressable
          onPress={tape.playing ? tape.pause : start}
          disabled={!!prep}
          accessibilityRole="button"
          accessibilityLabel={tape.playing ? 'Pause' : 'Play'}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: t.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={tape.playing ? 'pause' : 'play'} size={30} color={t.colors.onAccent} />
        </Pressable>
        <Pressable onPress={() => tape.skip(1)} hitSlop={12} accessibilityLabel="Next affirmation" disabled={tape.mode === 'subliminal'} style={{ opacity: tape.mode === 'subliminal' ? 0 : 1 }}>
          <Icon name="play-skip-forward-outline" size={24} color={t.colors.muted} />
        </Pressable>
      </View>

      <Txt variant="muted" style={{ textAlign: 'center' }}>
        {list.length ? `${tape.index + 1} of ${list.length}` : ''}
        {tape.endsAt ? ` · stops at ${new Date(tape.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
      </Txt>
      {prep && (
        <Txt variant="muted" style={{ textAlign: 'center', color: t.colors.accent }}>
          Getting your voice ready… {prep.done} of {prep.total}
        </Txt>
      )}
      {voiceError ? <Txt variant="muted" style={{ textAlign: 'center', color: '#E26D5C' }}>{voiceError}</Txt> : null}

      <Section label="Voice">
        <VoicePicker
          value={voice}
          allowMine={!!goal}
          onChange={(v) => {
            tape.pause();
            if (goal) updateGoal(goal.id, (g) => ({ ...g, voice: v }));
            else setTrackVoice(v);
          }}
        />
        {goal && goal.voice === 'my-voice' && (
          <Pressable onPress={() => router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id } })}>
            <Txt variant="muted" style={{ color: t.colors.accent }}>
              {recorded === goal.affirmations.length
                ? 'All recorded in your voice'
                : tape.mode === 'subliminal'
                  ? `${recorded} of ${goal.affirmations.length} recorded. Only recorded ones go in the subliminal. Record more`
                  : `${recorded} of ${goal.affirmations.length} recorded. The rest use the calm voice. Record more`}
            </Txt>
          </Pressable>
        )}
      </Section>

      <Section label="Background">
        <SoundList value={prefs.sound} onChange={(sound) => setPrefs({ sound })} allowNone={tape.mode === 'spoken'} />
      </Section>

      <Pressable
        onPress={() => setShowSettings((s) => !s)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        accessibilityRole="button">
        <Icon name="options-outline" size={16} color={t.colors.accent} />
        <Txt variant="muted" style={{ color: t.colors.accent }}>
          Volume, timer and more
        </Txt>
        <Icon name={showSettings ? 'chevron-up' : 'chevron-down'} size={14} color={t.colors.accent} />
      </Pressable>

      {showSettings && (
        <Card>
          <View style={{ gap: 14 }}>
            <Section label={tape.mode === 'subliminal' ? 'How faint' : 'Voice volume'}>
              <ChipRow>
                {voiceLevels.map((l) => (
                  <Chip key={l.label} label={l.label} selected={nearest(voiceLevels, prefs.voiceVolume) === l.value} onPress={() => setPrefs({ voiceVolume: l.value })} />
                ))}
              </ChipRow>
            </Section>
            <Section label="Background volume">
              <ChipRow>
                {SOUND_LEVELS.map((l) => (
                  <Chip key={l.label} label={l.label} selected={nearest(SOUND_LEVELS, prefs.soundVolume) === l.value} onPress={() => setPrefs({ soundVolume: l.value })} />
                ))}
              </ChipRow>
            </Section>
            <Section label="Timer">
              <ChipRow>
                {TIMERS.map((l) => (
                  <Chip key={l.label} label={l.label} selected={prefs.timer === l.value} onPress={() => {
                      setPrefs({ timer: l.value });
                      tape.retime(l.value);
                    }} />
                ))}
              </ChipRow>
            </Section>
            {goal && <Section label="Play">
              <ChipRow>
                <Chip label="All affirmations" selected={!prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: false })} />
                <Chip label="Only favorites" selected={prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: true })} />
              </ChipRow>
            </Section>}
          </View>
        </Card>
      )}
    </Screen>
  );
}
