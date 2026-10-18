import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Share, View } from 'react-native';

import { Creating, VOICING_MESSAGES } from '@/components/creating';
import { Slider } from '@/components/slider';
import { SoundList } from '@/components/sound-list';
import { TrackShelf } from '@/components/track-shelf';
import { VOICE_LIST, VoicePicker } from '@/components/voice-picker';
import { Button, Card, Chip, ChipRow, Icon, ThemeOrb, Screen, Section, Txt, useTheme, type IconName } from '@/components/ui';
import { Why } from '@/components/why';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { WHY } from '@/lib/tips';
import type { TapeMode } from '@/lib/types';
import { FREQUENCY_LIST } from '@/lib/frequencies';
import { FREQUENCY_DEFAULT_VOLUME, MODES } from '@/lib/use-tape';


/** The orb at the heart of the player: it breathes while playing and swells softly as each line begins. */
function PulsingOrb({ playing, line }: { playing: boolean; line: number }) {
  const [scale] = useState(() => new Animated.Value(1));
  const [swell] = useState(() => new Animated.Value(1));
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
  useEffect(() => {
    if (!playing || still) return;
    swell.setValue(1.06);
    Animated.spring(swell, { toValue: 1, friction: 5, tension: 30, useNativeDriver: true }).start();
  }, [line, playing, still, swell]);
  return (
    <Animated.View style={{ transform: [{ scale }, { scale: swell }] }}>
      <ThemeOrb size={240} />
    </Animated.View>
  );
}

export default function PlayerScreen() {
  const t = useTheme();
  const { goals, updateGoal } = useStore();
  const { goal, track, list, voice, setVoice, tape, prep, voiceError, prefs, setPrefs, setMode, toggle, choose } =
    usePlayer();

  function pickGoal(id: string) {
    choose({ kind: 'goal', id });
  }

  const recorded = goal?.affirmations.filter((a) => a.recording).length ?? 0;
  const current = list[tape.index];
  const title = track?.title ?? goal?.title ?? '';



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
      {/* The hero: what's playing, the mode, the orb and the big controls, floating on the sky. */}
      <View style={{ gap: 18, paddingTop: 2 }}>
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
          <PulsingOrb playing={tape.playing} line={tape.index} />
        </View>

        <View style={{ minHeight: 64, justifyContent: 'center' }}>
          <Txt variant="quote" style={{ textAlign: 'center', fontSize: 19, lineHeight: 27 }}>
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
            label={prefs.timer ? timerLabel(prefs.timer) : 'Add timer'}
            onPress={() => router.push('/timer')}
            active={!!prefs.timer}
          />
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
      </View>

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

      <PanelCard label="Your mix">
        <MixRow
          icon="mic-outline"
          label={tape.mode === 'subliminal' ? 'Voice (hidden)' : 'Voice'}
          value={prefs.voiceVolume / (tape.mode === 'subliminal' ? SUBLIMINAL_MAX : 1)}
          onChange={(v) => setPrefs({ voiceVolume: v * (tape.mode === 'subliminal' ? SUBLIMINAL_MAX : 1) })}
        />
        <MixRow
          icon="musical-notes-outline"
          label="Background"
          value={prefs.sound === 'none' ? 0 : prefs.soundVolume}
          disabled={prefs.sound === 'none'}
          onChange={(soundVolume) => setPrefs({ soundVolume })}
        />
        <MixRow
          icon="pulse-outline"
          label="Frequency"
          value={(prefs.frequencyVolume ?? FREQUENCY_DEFAULT_VOLUME) / FREQUENCY_MAX}
          disabled={!prefs.frequency || prefs.frequency === 'none'}
          onChange={(v) => setPrefs({ frequencyVolume: v * FREQUENCY_MAX })}
        />
        {tape.mode === 'subliminal' && (
          <Txt variant="muted">In subliminal mode the voice stays far under the music, even at full.</Txt>
        )}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="speedometer-outline" size={18} color={t.colors.accent} />
            <Txt variant="medium">Speed</Txt>
          </View>
          <ChipRow>
            {SPEEDS.map((v) => (
              <Chip key={v} label={`${v}×`} selected={(prefs.speed ?? 1) === v} onPress={() => setPrefs({ speed: v })} />
            ))}
          </ChipRow>
          <Txt variant="muted">Takes effect from the next line. Faster tapes fit more repetitions in, without changing the pitch.</Txt>
        </View>
      </PanelCard>

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
        {goal && (
          <ChipRow>
            <Chip label="All affirmations" selected={!prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: false })} />
            <Chip label="Only favorites" selected={prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: true })} />
          </ChipRow>
        )}
      </PanelCard>

      <PanelCard label="Background">
        <SoundList value={prefs.sound} onChange={(sound) => setPrefs({ sound })} allowNone={tape.mode === 'spoken'} />
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
      <Creating
        visible={!!prep}
        messages={VOICING_MESSAGES}
        detail={prep ? `${prep.done} of ${prep.total} lines` : undefined}
      />
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

// The loudest each layer goes at the top of its slider. A subliminal voice stays far under the music
// even at full; frequencies are pure tones, which sound loud, so they top out low.
const SUBLIMINAL_MAX = 0.06;
// How fast the voice can read. Phones top out at double speed.
const SPEEDS = [1, 1.25, 1.5, 1.75, 2];
const FREQUENCY_MAX = 0.4;

/** One channel of the mix: icon, name, slider and its level. */
function MixRow({
  icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: IconName;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: disabled ? 0.45 : 1 }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
        <Txt variant="medium" style={{ flex: 1 }}>
          {label}
        </Txt>
        <Txt variant="muted">{disabled ? 'Off' : `${Math.round(Math.min(1, value) * 100)}`}</Txt>
      </View>
      {/* A layer that's off has nothing to turn up; pick one in its panel below first. */}
      {!disabled && <Slider value={Math.min(1, Math.max(0, value))} onChange={onChange} label={`${label} volume`} />}
    </View>
  );
}

function timerLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m} min`;
}
