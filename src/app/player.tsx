import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Share, View } from 'react-native';

import { SoundList } from '@/components/sound-list';
import { TrackShelf } from '@/components/track-shelf';
import { VOICE_LIST, VoicePicker } from '@/components/voice-picker';
import { categoryIcon } from '@/components/goal-bits';
import { Button, Card, Chip, ChipRow, Icon, Orb, Screen, Section, Txt, useTheme, type IconName } from '@/components/ui';
import { Why } from '@/components/why';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { WHY } from '@/lib/tips';
import { TRACKS } from '@/lib/tracks';
import type { TapeMode } from '@/lib/types';
import { FREQUENCY_LEVELS, FREQUENCY_LIST } from '@/lib/frequencies';
import { FREQUENCY_DEFAULT_VOLUME, MODES, SUBLIMINAL_LEVELS } from '@/lib/use-tape';


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
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
];


function nearest(levels: { value: number }[], value: number) {
  return levels.reduce((best, l) => (Math.abs(l.value - value) < Math.abs(best.value - value) ? l : best)).value;
}

function PulsingOrb({ playing }: { playing: boolean }) {
  const [scale] = useState(() => new Animated.Value(1));
  const [still, setStill] = useState(false);
  // People who turn on Reduce motion get a still orb.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!playing || still) {
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
  }, [playing, still, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Orb size={190} />
    </Animated.View>
  );
}

export default function PlayerScreen() {
  const t = useTheme();
  const { goals, updateGoal } = useStore();
  const { goal, track, list, voice, setVoice, tape, prep, voiceError, prefs, setPrefs, setMode, toggle, choose } =
    usePlayer();

  const [timerOpen, setTimerOpen] = useState(false);

  function pickGoal(id: string) {
    choose({ kind: 'goal', id });
  }

  const recorded = goal?.affirmations.filter((a) => a.recording).length ?? 0;
  const current = list[tape.index];
  const voiceLevels = tape.mode === 'subliminal' ? SUBLIMINAL_LEVELS : SPOKEN_LEVELS;
  const title = track?.title ?? goal?.title ?? '';
  const icon = track ? track.icon : goal ? categoryIcon(goal.category) : 'sparkles-outline';
  const tintIndex = track ? TRACKS.indexOf(track) : Math.max(goals.findIndex((g) => g.id === goal?.id), 0);
  const tint = t.colors.tints[tintIndex % t.colors.tints.length];
  const timerAt = TIMERS.findIndex((l) => l.value === prefs.timer);

  function setTimer(minutes: number) {
    setPrefs({ timer: minutes });
    tape.retime(minutes);
    setTimerOpen(false);
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
        {/* A wash of the background over the colour, so light text stays readable on bright tints. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.bg, opacity: t.dark ? 0.4 : 0.2 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close player">
            <Icon name="chevron-down" size={26} color={t.colors.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="title" style={{ textAlign: 'center' }} numberOfLines={1}>
              {title}
            </Txt>
            <Txt variant="muted" style={{ color: t.colors.text, opacity: 0.75 }}>{track ? 'Ready-made track' : `Already yours · ${list.length} affirmations`}</Txt>
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
            {tape.mode === 'subliminal' ? (tape.playing ? 'Playing below the sound…' : '') : current ? `"${current.text}"` : goal ? 'No affirmations here yet.' : ''}
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
            onPress={toggle}
            disabled={!!prep}
            accessibilityRole="button"
            accessibilityLabel={tape.playing ? 'Pause' : 'Play'}
            style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={tape.playing ? 'pause' : 'play'} size={32} color={t.colors.onAccent} />
          </Pressable>
          <HeroButton
            icon="hourglass-outline"
            label={prefs.timer ? (TIMERS[timerAt]?.label ?? 'Timer') : 'Add timer'}
            onPress={() => setTimerOpen((o) => !o)}
            active={!!prefs.timer}
          />
        </View>

        {timerOpen && (
          <View style={{ gap: 8, alignItems: 'center' }}>
            <Txt variant="muted" style={{ color: t.colors.text }}>
              Fades out gently, then stops
            </Txt>
            <ChipRow>
              {TIMERS.map((l) => (
                <Chip key={l.label} label={l.label} selected={prefs.timer === l.value} onPress={() => setTimer(l.value)} />
              ))}
            </ChipRow>
          </View>
        )}

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
        <VoicePicker value={voice} allowMine={!!goal} onChange={setVoice} />
        <Why text={WHY.voices} label="Why the voice matters" />
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

      <PanelCard label="Frequency" right={FREQUENCY_LIST.find((f) => f.id === prefs.frequency)?.label ?? 'None'}>
        <Why text={WHY.frequencies} label="What these do" />
        <ChipRow>
          <Chip label="None" selected={!prefs.frequency || prefs.frequency === 'none'} onPress={() => setPrefs({ frequency: 'none' })} />
          {FREQUENCY_LIST.map((f) => (
            <Chip key={f.id} label={f.label} selected={prefs.frequency === f.id} onPress={() => setPrefs({ frequency: f.id })} />
          ))}
        </ChipRow>
        {(() => {
          const f = FREQUENCY_LIST.find((x) => x.id === prefs.frequency);
          return f ? (
            <>
              <Txt variant="muted">{f.headphones ? `${f.about} Best with headphones.` : f.about}</Txt>
              <Levels
                label="Volume"
                levels={FREQUENCY_LEVELS}
                value={prefs.frequencyVolume ?? FREQUENCY_DEFAULT_VOLUME}
                onChange={(frequencyVolume) => setPrefs({ frequencyVolume })}
              />
            </>
          ) : null;
        })()}
      </PanelCard>

      <PanelCard label="About" tinted>
        <Txt variant="body" style={{ color: t.colors.text }}>
          {MODES[tape.mode].about}
          {track ? ` This track has ${track.lines.length} affirmations.` : ''}
        </Txt>
        <Why text={tape.mode === 'subliminal' ? WHY.subliminal : WHY.spoken} />
        {track && (
          <Pressable onPress={() => router.push({ pathname: '/track/[id]', params: { id: track.id } })} accessibilityRole="button">
            <Txt variant="medium" style={{ color: t.colors.accent }}>
              See every affirmation, or make it yours
            </Txt>
          </Pressable>
        )}
      </PanelCard>

      {goals.length > 0 && (
        <Section label="Already yours">
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
          onPick={(picked) => choose({ kind: 'track', id: picked.id })}
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
