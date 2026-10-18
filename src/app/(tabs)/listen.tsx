import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, Share, View } from 'react-native';

import { SoundList } from '@/components/sound-list';
import { TrackShelf } from '@/components/track-shelf';
import { VOICE_LIST, VoicePicker } from '@/components/voice-picker';
import { categoryIcon } from '@/components/goal-bits';
import { Button, Card, Chip, ChipRow, Icon, Orb, Screen, Section, Txt, useTheme, type IconName } from '@/components/ui';
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
  const voiceLevels = tape.mode === 'subliminal' ? SUBLIMINAL_LEVELS : SPOKEN_LEVELS;
  const title = track?.title ?? goal?.title ?? '';
  const icon = track ? track.icon : goal ? categoryIcon(goal.category) : 'sparkles-outline';
  const tintIndex = track ? TRACKS.indexOf(track) : Math.max(goals.findIndex((g) => g.id === goal?.id), 0);
  const tint = t.colors.tints[tintIndex % t.colors.tints.length];
  const timerAt = TIMERS.findIndex((l) => l.value === prefs.timer);

  function nextTimer() {
    const next = TIMERS[(timerAt + 1) % TIMERS.length].value;
    setPrefs({ timer: next });
    tape.retime(next);
  }

  function favoriteCurrent() {
    if (!goal || !current) return;
    changeFavorite(current.id);
  }
  const changeFavorite = (affId: string) =>
    updateGoal(goal!.id, (g) => ({
      ...g,
      affirmations: g.affirmations.map((a) => (a.id === affId ? { ...a, favorite: !a.favorite } : a)),
    }));

  const share = () => Share.share({ message: current ? current.text : title }).catch(() => {});

  return (
    <Screen>
      {/* The hero: what's playing, the mode, and the big controls, over the goal's or track's colours. */}
      <LinearGradient
        colors={[tint, t.colors.bg]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ marginHorizontal: -20, marginTop: -20, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 24 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="title" style={{ textAlign: 'center' }} numberOfLines={1}>
              {title}
            </Txt>
            <Txt variant="muted" style={{ color: t.colors.text, opacity: 0.75 }}>{track ? 'Ready-made track' : `Your goal · ${list.length} affirmations`}</Txt>
          </View>
          <Pressable onPress={share} hitSlop={12} accessibilityRole="button" accessibilityLabel="Share">
            <Icon name="share-social-outline" size={22} color={t.colors.text} />
          </Pressable>
        </View>

        <View style={{ alignSelf: 'center', flexDirection: 'row', backgroundColor: t.colors.bg, borderRadius: 12, padding: 4 }}>
          {(Object.keys(MODES) as TapeMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: tape.mode === m }}
              style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 9, backgroundColor: tape.mode === m ? t.colors.card : 'transparent' }}>
              <Txt variant="medium" style={{ color: tape.mode === m ? t.colors.text : t.colors.muted }}>
                {MODES[m].label}
              </Txt>
            </Pressable>
          ))}
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {t.group === 'mystical' ? (
            <PulsingOrb playing={tape.playing} />
          ) : (
            <View style={{ width: 170, height: 170, borderRadius: 85, backgroundColor: t.colors.card, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={64} color={t.colors.accent} />
            </View>
          )}
        </View>

        <View style={{ minHeight: 64, justifyContent: 'center' }}>
          <Txt variant="quote" style={{ textAlign: 'center', fontSize: 21, lineHeight: 29 }}>
            {tape.mode === 'subliminal' ? (tape.playing ? 'Playing below the sound…' : '') : current ? `"${current.text}"` : goal ? 'This goal has no affirmations yet.' : ''}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
          <HeroButton
            icon={goal ? (current?.favorite ? 'heart' : 'heart-outline') : 'play-skip-forward-outline'}
            label={goal ? 'Favorite' : 'Next line'}
            onPress={goal ? favoriteCurrent : () => tape.skip(1)}
            active={!!goal && !!current?.favorite}
          />
          <Pressable
            onPress={tape.playing ? tape.pause : start}
            disabled={!!prep}
            accessibilityRole="button"
            accessibilityLabel={tape.playing ? 'Pause' : 'Play'}
            style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={tape.playing ? 'pause' : 'play'} size={32} color={t.colors.onAccent} />
          </Pressable>
          <HeroButton icon="hourglass-outline" label={prefs.timer ? TIMERS[timerAt]?.label ?? 'Timer' : 'Add timer'} onPress={nextTimer} active={!!prefs.timer} />
        </View>

        <Txt variant="muted" style={{ textAlign: 'center' }}>
          {tape.mode === 'spoken' && list.length ? `${tape.index + 1} of ${list.length}` : ''}
          {tape.endsAt ? ` · stops at ${new Date(tape.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
        </Txt>
        {prep && (
          <Txt variant="muted" style={{ textAlign: 'center', color: t.colors.accent }}>
            Getting the voice ready… {prep.done} of {prep.total}
          </Txt>
        )}
        {voiceError ? <Txt variant="muted" style={{ textAlign: 'center', color: '#E26D5C' }}>{voiceError}</Txt> : null}
      </LinearGradient>

      {goal && !tape.ready && tape.mode === 'subliminal' && (
        <Card highlight>
          <View style={{ gap: 10 }}>
            <Txt variant="title">Subliminals need a recorded voice</Txt>
            <Txt variant="muted">Record at least one affirmation in your voice, or pick one of the natural voices below.</Txt>
            <Button
              title="Record my voice"
              icon="mic-outline"
              onPress={() => router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id } })}
            />
          </View>
        </Card>
      )}

      <PanelCard label="Voice" right={VOICE_LIST.find((v) => v.id === voice)?.label}>
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
        <Levels
          label={tape.mode === 'subliminal' ? 'How faint' : 'Volume'}
          levels={voiceLevels}
          value={prefs.voiceVolume}
          onChange={(voiceVolume) => setPrefs({ voiceVolume })}
        />
        {goal && (
          <ChipRow>
            <Chip label="All affirmations" selected={!prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: false })} />
            <Chip label="Only favorites" selected={prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: true })} />
          </ChipRow>
        )}
      </PanelCard>

      <PanelCard label="Background">
        <SoundList value={prefs.sound} onChange={(sound) => setPrefs({ sound })} allowNone={tape.mode === 'spoken'} />
        <Levels label="Volume" levels={SOUND_LEVELS} value={prefs.soundVolume} onChange={(soundVolume) => setPrefs({ soundVolume })} />
      </PanelCard>

      <PanelCard label="About" tinted>
        <Txt variant="body" style={{ color: t.colors.text }}>
          {MODES[tape.mode].about}
          {track ? ` ${track.lines.length} affirmations for ${track.about.toLowerCase()}.` : ''}
        </Txt>
      </PanelCard>

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
    </Screen>
  );
}

/** One of the two buttons either side of play: an icon with a word under it. */
function HeroButton({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={{ alignItems: 'center', gap: 6, width: 90 }}>
      <Icon name={icon} size={24} color={active ? t.colors.accent : t.colors.text} />
      <Txt variant="muted" style={{ color: active ? t.colors.accent : t.colors.text }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** A rounded panel with a small heading, like a mixer channel. */
function PanelCard({ label, right, tinted, children }: { label: string; right?: string; tinted?: boolean; children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: tinted ? t.colors.tints[1 % t.colors.tints.length] + '33' : t.colors.card,
        borderRadius: Math.max(t.radius, 18),
        padding: 18,
        gap: 14,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="label">{label}</Txt>
        {right ? <Txt variant="muted">{right}</Txt> : null}
      </View>
      {children}
    </View>
  );
}

function Levels({
  label,
  levels,
  value,
  onChange,
}: {
  label: string;
  levels: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="muted" style={{ fontSize: 12 }}>
        {label}
      </Txt>
      <ChipRow>
        {levels.map((l) => (
          <Chip key={l.label} label={l.label} selected={nearest(levels, value) === l.value} onPress={() => onChange(l.value)} />
        ))}
      </ChipRow>
    </View>
  );
}
