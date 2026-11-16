import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { AccessibilityInfo, Animated, Easing, Modal, Platform, Pressable, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Art, paletteFor } from '@/components/art';
import { Creating, VOICING_MESSAGES } from '@/components/creating';
import { categoryIcon } from '@/components/goal-bits';
import { Slider } from '@/components/slider';
import { SoundList } from '@/components/sound-list';
import { SOUND_LIST } from '@/lib/sounds';
import { TrackShelf } from '@/components/track-shelf';
import { VOICE_LIST, VoicePicker } from '@/components/voice-picker';
import { Chip, ChipRow, Icon, Section, Txt, useTheme, type IconName } from '@/components/ui';
import { Why } from '@/components/why';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { WHY } from '@/lib/tips';
import { NATIVE } from '@/lib/motion';
import { TRACKS } from '@/lib/tracks';
import { FREQUENCY_LIST } from '@/lib/frequencies';
import { FREQUENCY_DEFAULT_VOLUME, MODES, SUBLIMINAL_LAYER_CHOICES } from '@/lib/use-tape';


export default function PlayerScreen() {
  const t = useTheme();
  const { goals, updateGoal } = useStore();
  const { goal, track, mix, list, voice, setVoice, tape, prep, making, voiceError, prefs, setPrefs, setMode, toggle, choose } =
    usePlayer();
  const [sheet, setSheet] = useState<'sound' | 'voice' | 'more' | null>(null);

  const recorded = goal ? goal.affirmations.filter((a) => a.recording).length : 0;
  const current = list[tape.index];
  const before = list.length > 1 ? list[(tape.index - 1 + list.length) % list.length] : undefined;
  const after = list.length > 1 ? list[(tape.index + 1) % list.length] : undefined;
  const title = track ? track.title : goal ? goal.title : '';
  const icon: IconName = track ? track.icon : goal ? categoryIcon(goal.category) : 'sparkles-outline';
  const tone = mix ? undefined : track ? track.id : goal && goal.category !== 'other' ? goal.category : undefined;
  const goalId = goal ? goal.id : '';
  const toneIndex = track ? Math.max(TRACKS.findIndex((x) => x.id === track.id), 0) : Math.max(goals.findIndex((g) => g.id === goalId), 0);
  const colors = paletteFor(tone, toneIndex, t);
  const subliminal = tape.mode === 'subliminal';
  const opening = useOpening();
  const session = useSession(tape.playing, subliminal ? (prefs.subLayers ?? 3) : (prefs.layers ?? 1), prefs.speed ?? 1);
  const now = useNow(tape.playing && !!tape.endsAt);

  const changeFavorite = (affId: string) =>
    updateGoal(goalId, (g) => ({
      ...g,
      affirmations: g.affirmations.map((a) => (a.id === affId ? { ...a, favorite: !a.favorite } : a)),
    }));
  const share = () => Share.share({ message: current ? current.text : title }).catch(() => {});
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: t.colors.bg }, opening]}>
      {/* The track's own colour glows down from the top and melts into the theme. */}
      <LinearGradient
        colors={[colors[1] + 'CC', colors[2] + '88', t.colors.bg]}
        locations={[0, 0.45, 0.95]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Aura colors={colors} playing={tape.playing} />
      {subliminal && <Whispers lines={list.map((a) => a.text)} playing={tape.playing} />}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, width: '100%', maxWidth: 680, alignSelf: 'center' }}>
          {/* What's playing: its card, its name, and a way out. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close player">
              <Icon name="chevron-down" size={26} color="#fff" />
            </Pressable>
            <Art icon={icon} index={toneIndex} tone={tone} size={44} />
            <View style={{ flex: 1 }}>
              <Txt variant="medium" numberOfLines={1} style={{ color: '#fff' }}>
                {title}
              </Txt>
              <Txt variant="muted" numberOfLines={1} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                {`${mix ? 'Your mix' : track ? 'Ready-made' : 'Manifestation'} · ${MODES[tape.mode].label}`}
              </Txt>
            </View>
            <Pressable onPress={share} hitSlop={12} accessibilityRole="button" accessibilityLabel="Share this affirmation">
              <Icon name="share-social-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* The affirmation is the star: the one playing, big, with its neighbours fading above and below. */}
          <View style={{ flex: 1, justifyContent: 'center', gap: 18, paddingVertical: 12 }}>
            {subliminal ? (
              <View style={{ alignItems: 'center', gap: 18 }}>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 260, height: 260 }}>
                  <Ripples playing={tape.playing} color={colors[0]} />
                  <Rising playing={tape.playing} />
                  <Breathing playing={tape.playing}>
                    <Art icon={icon} index={toneIndex} tone={tone} size={170} />
                  </Breathing>
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Txt variant="display" style={{ textAlign: 'center', fontSize: 24, lineHeight: 30, color: t.colors.text }}>
                    {tape.playing ? 'Sinking in…' : 'Ready to sink in'}
                  </Txt>
                  <Txt variant="muted" style={{ textAlign: 'center', color: t.colors.text, opacity: 0.75 }}>
                    {`${list.length} affirmations, just below the sound`}
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                  {[
                    `${prefs.subLayers ?? 3} voices layered`,
                    SOUND_LIST.find((x) => x.id === prefs.sound)?.label,
                    FREQUENCY_LIST.find((f) => f.id === prefs.frequency)?.label,
                    prefs.timer ? `${timerLabel(prefs.timer)} timer` : undefined,
                  ]
                    .filter((x): x is string => !!x)
                    .map((label) => (
                      <View key={label} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                        <Txt variant="muted" style={{ color: t.colors.text, fontSize: 12 }}>
                          {label}
                        </Txt>
                      </View>
                    ))}
                </View>
              </View>
            ) : (
              <>
                {before && (
                  <Txt variant="body" numberOfLines={2} style={{ textAlign: 'center', color: t.colors.text, opacity: 0.3, fontSize: 14, lineHeight: 20 }}>
                    {before.text}
                  </Txt>
                )}
                <Lyric key={current ? current.id : 'none'} text={current ? current.text : goal ? 'No affirmations here yet.' : ''} />
                {after && (
                  <Txt variant="body" numberOfLines={2} style={{ textAlign: 'center', color: t.colors.text, opacity: 0.3, fontSize: 14, lineHeight: 20 }}>
                    {after.text}
                  </Txt>
                )}
                {goal && current && (
                  <Pressable
                    onPress={() => changeFavorite(current.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={current.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    style={{ alignSelf: 'center' }}>
                    <Icon name={current.favorite ? 'heart' : 'heart-outline'} size={22} color={current.favorite ? t.colors.accent : t.colors.muted} />
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* Where you are in the tape: one segment per line. */}
          {!subliminal && list.length > 1 && <Segments count={list.length} at={tape.index} />}
          <Txt variant="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 8, minHeight: 16, color: t.colors.text, opacity: 0.8 }}>
            {[
              session.seconds ? `${session.clock} · about ${session.heard} affirmation${session.heard === 1 ? '' : 's'} heard` : '',
              tape.endsAt ? `fades out in ${Math.max(1, Math.round((tape.endsAt - now) / 60000))} min` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
          {voiceError ? <Txt variant="muted" style={{ textAlign: 'center', color: '#E26D5C' }}>{voiceError}</Txt> : null}
          {making ? (
            <Txt variant="muted" style={{ textAlign: 'center', fontSize: 12 }}>
              {`Making the rest of the voice while you listen · ${making.done} of ${making.total}`}
            </Txt>
          ) : null}
          {goal && !tape.ready && subliminal && (
            <Pressable onPress={() => router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id } })} style={{ alignSelf: 'center' }}>
              <Txt variant="muted" style={{ color: t.colors.accent, textAlign: 'center' }}>
                Subliminals need a recorded voice. Record yours, or pick a natural voice under Voice.
              </Txt>
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34, marginTop: 10, marginBottom: 18 }}>
            <Pressable onPress={() => tape.skip(-1)} hitSlop={12} disabled={subliminal} accessibilityRole="button" accessibilityLabel="Previous line" style={{ opacity: subliminal ? 0 : 1 }}>
              <Icon name="play-back" size={28} color={t.colors.text} />
            </Pressable>
            <Pressable
              onPress={toggle}
              disabled={!!prep}
              accessibilityRole="button"
              accessibilityLabel={tape.playing ? 'Pause' : 'Play'}
              style={({ pressed }) => ({
                width: 96,
                height: 66,
                borderRadius: 24,
                backgroundColor: t.colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}>
              <Icon name={tape.playing ? 'pause' : 'play'} size={30} color={t.colors.onAccent} />
            </Pressable>
            <Pressable onPress={() => tape.skip(1)} hitSlop={12} disabled={subliminal} accessibilityRole="button" accessibilityLabel="Next line" style={{ opacity: subliminal ? 0 : 1 }}>
              <Icon name="play-forward" size={28} color={t.colors.text} />
            </Pressable>
          </View>

          {/* Everything else, one tap away. */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: t.colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: t.colors.border,
              paddingVertical: 8,
              paddingHorizontal: 6,
            }}>
            <BarButton
              icon={subliminal ? 'water-outline' : 'chatbubble-ellipses-outline'}
              label={MODES[tape.mode].label}
              onPress={() => setMode(subliminal ? 'spoken' : 'subliminal')}
            />
            <BarButton icon="options-outline" label="Sound" onPress={() => setSheet('sound')} />
            <BarButton icon="person-circle-outline" label="Voice" onPress={() => setSheet('voice')} />
            <BarButton icon="hourglass-outline" label={prefs.timer ? timerLabel(prefs.timer) : 'Timer'} onPress={() => router.push('/timer')} active={!!prefs.timer} />
            <BarButton icon="ellipsis-horizontal" label="More" onPress={() => setSheet('more')} />
          </View>
        </View>
      </SafeAreaView>

      <Sheet title="Sound" open={sheet === 'sound'} onClose={() => setSheet(null)}>
        <PanelCard label="Levels">
          <MixRow
            icon="mic-outline"
            label={subliminal ? 'Voice (hidden)' : 'Voice'}
            value={prefs.voiceVolume / (subliminal ? SUBLIMINAL_MAX : 1)}
            onChange={(v) => setPrefs({ voiceVolume: v * (subliminal ? SUBLIMINAL_MAX : 1) })}
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
          {subliminal && <Txt variant="muted">In subliminal mode the voice stays far under the music, even at full.</Txt>}
        </PanelCard>
        <PanelCard label="Speed">
          <ChipRow>
            {SPEEDS.map((v) => (
              <Chip key={v} label={`${v}×`} selected={(prefs.speed ?? 1) === v} onPress={() => setPrefs({ speed: v })} />
            ))}
          </ChipRow>
          <Txt variant="muted">Faster tapes fit more repetitions in, without changing the pitch.</Txt>
        </PanelCard>
        {subliminal && Platform.OS === 'web' && (
          <PanelCard label="Layers">
            <ChipRow>
              {SUBLIMINAL_LAYER_CHOICES.map((n) => (
                <Chip
                  key={n}
                  label={`${n} layers`}
                  selected={(prefs.subLayers ?? 3) === n}
                  onPress={() => {
                    setPrefs({ subLayers: n });
                    tape.restart();
                  }}
                />
              ))}
            </ChipRow>
            <Txt variant="muted">How many copies of your affirmations play over each other, each starting at a different line, a little higher or lower, quieter or louder, and to the left or right. Stacking 15 to 20 is common. If you feel worn out after listening, use fewer.</Txt>
            <Txt variant="muted">What matters most is listening every day, not how many layers.</Txt>
          </PanelCard>
        )}
        {!subliminal && Platform.OS === 'web' && (
          <PanelCard label="Layers">
            <ChipRow>
              {[1, 2, 3].map((n) => (
                <Chip
                  key={n}
                  label={n === 1 ? 'One voice' : `${n} at once`}
                  selected={(prefs.layers ?? 1) === n}
                  onPress={() => {
                    setPrefs({ layers: n });
                    tape.restart();
                  }}
                />
              ))}
            </ChipRow>
            <Txt variant="muted">Extra voices read other lines at the same time, a little lower or higher, quieter and to each side.</Txt>
          </PanelCard>
        )}
        <PanelCard label="Background">
          <SoundList value={prefs.sound} onChange={(sound) => setPrefs({ sound })} allowNone={!subliminal} />
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
            return f ? <Txt variant="muted">{f.headphones ? `${f.about} Best with headphones.` : f.about}</Txt> : null;
          })()}
        </PanelCard>
      </Sheet>

      <Sheet title="Voice" open={sheet === 'voice'} onClose={() => setSheet(null)}>
        <PanelCard label="Who reads it" right={VOICE_LIST.find((v) => v.id === voice)?.label}>
          <VoicePicker value={voice} allowMine={!!goal} onChange={setVoice} />
          <Why text={WHY.voices} label="Why the voice matters" />
          {goal && goal.voice === 'my-voice' && (
            <Pressable onPress={() => router.push({ pathname: '/record/[goalId]', params: { goalId: goal.id } })}>
              <Txt variant="muted" style={{ color: t.colors.accent }}>
                {recorded === goal.affirmations.length
                  ? 'All recorded in your voice'
                  : subliminal
                    ? `${recorded} of ${goal.affirmations.length} recorded. Only recorded ones go in the subliminal. Record more`
                    : `${recorded} of ${goal.affirmations.length} recorded. The rest use the calm voice. Record more`}
              </Txt>
            </Pressable>
          )}
        </PanelCard>
        {goal && (
          <PanelCard label="Which lines">
            <ChipRow>
              <Chip label="All affirmations" selected={!prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: false })} />
              <Chip label="Only favorites" selected={prefs.favoritesOnly} onPress={() => setPrefs({ favoritesOnly: true })} />
            </ChipRow>
          </PanelCard>
        )}
      </Sheet>

      <Sheet title="More" open={sheet === 'more'} onClose={() => setSheet(null)}>
        <PanelCard label="About this tape">
          <Txt variant="body">
            {MODES[tape.mode].about}
            {` It has ${list.length} affirmations.`}
          </Txt>
          <Why text={subliminal ? WHY.subliminal : WHY.spoken} />
          {track && !mix && (
            <Pressable onPress={() => { setSheet(null); router.push({ pathname: '/track/[id]', params: { id: track.id } }); }} accessibilityRole="button">
              <Txt variant="medium" style={{ color: t.colors.accent }}>See every affirmation, or make it yours</Txt>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              setSheet(null);
              router.push({ pathname: '/mix', params: { from: mix && track ? track.id : track ? `track:${track.id}` : goal ? `goal:${goal.id}` : '' } });
            }}
            accessibilityRole="button">
            <Txt variant="medium" style={{ color: t.colors.accent }}>{mix ? 'Change this mix' : 'Mix this with other tracks'}</Txt>
          </Pressable>
        </PanelCard>
        {goals.length > 0 && (
          <Section label="Play something else">
            <ChipRow>
              {goals.map((g) => (
                <Chip key={g.id} label={g.title} selected={g.id === goalId} onPress={() => choose({ kind: 'goal', id: g.id })} />
              ))}
            </ChipRow>
          </Section>
        )}
        <Section label="Ready-made tracks">
          <TrackShelf selectedId={track ? track.id : undefined} onPick={(picked) => choose({ kind: 'track', id: picked.id })} />
        </Section>
      </Sheet>

      <Creating
        visible={!!prep}
        messages={VOICING_MESSAGES}
        detail={prep ? `${prep.done} of ${prep.total} lines${prep.waiting ? ' · pausing a moment so the voice server can catch up' : ''}` : undefined}
      />
    </Animated.View>
  );
}

/**
 * The player sliding up into place when it opens. The stack's own slide doesn't run on the web, so
 * the screen does it itself; still for people who turn on Reduce motion.
 */
function useOpening() {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((still) => {
        if (still) return v.setValue(1);
        Animated.spring(v, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 4 }).start(() => v.setValue(1));
      })
      .catch(() => v.setValue(1));
  }, [v]);
  return {
    opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
  };
}

/** The line being spoken, big, rising gently into place each time it changes. */
function Lyric({ text }: { text: string }) {
  const t = useTheme();
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fade]);
  return (
    <Animated.View style={{ transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      <Txt
        variant="display"
        style={{
          textAlign: 'center',
          fontSize: 30,
          lineHeight: 38,
          color: t.colors.text,
          textShadowColor: 'rgba(0,0,0,0.45)',
          textShadowRadius: 14,
          textShadowOffset: { width: 0, height: 1 },
        }}>
        {text}
      </Txt>
    </Animated.View>
  );
}

/**
 * The affirmations themselves, drifting slowly up behind a subliminal, faint as words underwater: you
 * see that they're there without reading them, which is the point. Still when Reduce motion is on.
 */
function Whispers({ lines, playing }: { lines: string[]; playing: boolean }) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const [still, setStill] = useState(false);
  // One clock for every line, each a fixed step apart, so they stay evenly spaced and never pile up.
  const [clock] = useState(() => new Animated.Value(0));
  const [places] = useState(() => WHISPER_PHASE.map((phase) => Animated.modulo(Animated.add(clock, phase), 1)));
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  const moving = playing && !still;
  // Only there while it plays: on pause they stop where they are and fade away from there.
  const [shown] = useState(() => new Animated.Value(playing ? 1 : 0));
  useEffect(() => {
    Animated.timing(shown, { toValue: playing ? 1 : 0, duration: 800, useNativeDriver: true }).start();
  }, [playing, shown]);
  // Where the clock had got to when paused, so playing again carries on from there.
  const paused = useRef(0);
  useEffect(() => {
    if (!moving) return;
    const at = paused.current;
    const rise = (from: number) =>
      Animated.timing(clock, { toValue: 1, duration: WHISPER_MS * (1 - from), easing: Easing.linear, useNativeDriver: true });
    const reset = Animated.timing(clock, { toValue: 0, duration: 0, useNativeDriver: true });
    const run = Animated.sequence([rise(at), reset, Animated.loop(Animated.sequence([rise(0), reset]))]);
    run.start();
    return () => {
      run.stop();
      clock.stopAnimation((value) => (paused.current = value));
    };
  }, [moving, clock]);
  if (!lines.length) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', opacity: shown }}>
      {places.map((v, i) => (
        <Animated.Text
          key={i}
          numberOfLines={2}
          style={{
            position: 'absolute',
            // Two columns that never overlap: even lines on the left, odd on the right.
            left: i % 2 ? '52%' : '4%',
            width: '44%',
            textAlign: i % 2 ? 'right' : 'left',
            // Laid out for drifting even while paused, so pausing never makes them jump.
            ...(!still ? { bottom: 200 } : { top: `${12 + i * 12}%` }),
            color: t.colors.text,
            fontFamily: t.fonts.quote,
            fontStyle: 'italic',
            fontSize: WHISPER_SIZE[i],
            opacity: !still ? v.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.08, 0.06, 0] }) : 0.05,
            transform: !still ? [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [40, -height + 160] }) }] : [],
          }}>
          {lines[(i * 7) % lines.length]}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}
// One full climb, and where each line starts on it: three per column, the columns half a step apart.
const WHISPER_MS = 30000;
const WHISPER_PHASE = [0, 1 / 6, 1 / 3, 1 / 2, 2 / 3, 5 / 6];
const WHISPER_SIZE = [15, 18, 14, 17, 16, 15];

/** Soft rings spreading out from the cover while a subliminal plays, like sound moving through water. */
function Ripples({ playing, color }: { playing: boolean; color: string }) {
  const [rings] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  useEffect(() => {
    if (!playing || still) {
      rings.forEach((r) => r.setValue(0));
      return;
    }
    const loops = rings.map((r, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 1400),
          Animated.timing(r, { toValue: 1, duration: 4200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, still, rings]);
  return (
    <>
      {rings.map((r, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 170,
            height: 170,
            borderRadius: 60,
            borderWidth: 2,
            borderColor: color,
            opacity: r.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.6, 0] }),
            transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
          }}
        />
      ))}
    </>
  );
}

/** Big soft blobs in the track's colours drifting slowly behind the player, like a living aura. */
function Aura({ colors, playing }: { colors: readonly string[]; playing: boolean }) {
  const { width, height } = useWindowDimensions();
  const [moves] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  const moving = playing && !still;
  useEffect(() => {
    if (!moving) return;
    const loops = moves.map((m, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(m, { toValue: 1, duration: 9000 + i * 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(m, { toValue: 0, duration: 9000 + i * 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [moving, moves]);
  const size = Math.max(width, 380) * 0.95;
  const spots = [
    { left: -size * 0.35, top: height * 0.05, dx: 60, dy: 40, color: colors[0] },
    { left: width - size * 0.6, top: height * 0.28, dx: -50, dy: 70, color: colors[1] },
    { left: width * 0.1 - size * 0.3, top: height * 0.55, dx: 70, dy: -50, color: colors[2] },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {spots.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: size,
            height: size,
            borderRadius: size,
            backgroundColor: s.color,
            opacity: 0.12,
            transform: [
              { translateX: moves[i].interpolate({ inputRange: [0, 1], outputRange: [0, s.dx] }) },
              { translateY: moves[i].interpolate({ inputRange: [0, 1], outputRange: [0, s.dy] }) },
              { scale: moves[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Tiny sparkles rising around the subliminal cover while it plays. */
function Rising({ playing }: { playing: boolean }) {
  const [dots] = useState(() => Array.from({ length: 7 }, () => new Animated.Value(0)));
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  useEffect(() => {
    if (!playing || still) {
      dots.forEach((d) => d.setValue(0));
      return;
    }
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(d, { toValue: 1, duration: 5200 + (i % 3) * 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, still, dots]);
  return (
    <>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: RISE_X[i],
            bottom: 30,
            width: RISE_SIZE[i],
            height: RISE_SIZE[i],
            borderRadius: 6,
            backgroundColor: '#fff',
            opacity: d.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.8, 0.5, 0] }),
            transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -220] }) }],
          }}
        />
      ))}
    </>
  );
}
const RISE_X = [24, 60, 205, 228, 40, 190, 120];
const RISE_SIZE = [4, 6, 5, 3, 3, 6, 4];

/**
 * How long this session has played and roughly how many affirmations went in: one line every few
 * seconds per voice, faster at higher speeds, three voices at once in a subliminal.
 */
function useSession(playing: boolean, layers: number, speed: number) {
  // The count itself lives in the player (src/lib/player.tsx); this just refreshes the display.
  const { sessionSeconds } = usePlayer();
  const [seconds, setSeconds] = useState(() => sessionSeconds());
  useEffect(() => {
    const tick = () => setSeconds(sessionSeconds());
    const timer = setInterval(tick, playing ? 1000 : 5000);
    return () => clearInterval(timer);
  }, [playing, sessionSeconds]);
  const heard = Math.floor((seconds / SECONDS_PER_LINE) * layers * speed);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return { seconds, heard, clock };
}
// A typical line plus the pause after it, at normal speed.
const SECONDS_PER_LINE = 4;

/** The time now, refreshed every half minute while `on`, for the timer countdown. */
function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [on]);
  return now;
}

/** A slow breath for the subliminal cover, still when Reduce motion is on. */
function Breathing({ playing, children }: { playing: boolean; children: ReactNode }) {
  const [scale] = useState(() => new Animated.Value(1));
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  useEffect(() => {
    if (!playing || still) {
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, still, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

/** One thin segment per line, lit up to the one playing. Long tapes become one smooth bar. */
function Segments({ count, at }: { count: number; at: number }) {
  const t = useTheme();
  if (count > 24) {
    return (
      <View style={{ height: 4, borderRadius: 2, backgroundColor: t.colors.border, overflow: 'hidden' }}>
        <View style={{ width: `${((at + 1) / count) * 100}%`, height: '100%', backgroundColor: t.colors.accent }} />
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= at ? t.colors.accent : t.colors.border }} />
      ))}
    </View>
  );
}

/** A button in the bar along the bottom of the player. */
function BarButton({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  const t = useTheme();
  const color = active ? t.colors.accent : t.colors.text;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4, opacity: pressed ? 0.6 : 1 })}>
      <Icon name={icon} size={21} color={color} />
      <Txt variant="muted" numberOfLines={1} style={{ fontSize: 11, color }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** A panel that slides up from the bottom over the player. */
function Sheet({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const t = useTheme();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ maxHeight: '82%', backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: t.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
          <Txt variant="title" style={{ flex: 1 }}>
            {title}
          </Txt>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Done">
            <Txt variant="medium" style={{ color: t.colors.accent }}>Done</Txt>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
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
const SUBLIMINAL_MAX = 0.072; // was 0.06; Chris and other listeners like to just hear the voices at the top
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
