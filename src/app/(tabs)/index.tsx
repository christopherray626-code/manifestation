import { router } from 'expo-router';
import { Pressable, Share, View } from 'react-native';

import { Art, Shelf, ShelfCard } from '@/components/art';
import { categoryIcon, dayLabel } from '@/components/goal-bits';
import { TrackShelf } from '@/components/track-shelf';
import { Button, Card, Icon, QuoteBlock, Screen, Section, Txt, useTheme } from '@/components/ui';
import { moonPhase } from '@/lib/moon';
import { useStore } from '@/lib/store';
import { dayOfGoal, todaysAffirmation } from '@/lib/today';
import { quoteOfThisVisit } from '@/lib/quotes';
import { trackById, TRACKS } from '@/lib/tracks';

function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const who = name.trim();
  return who ? `${part}, ${who}` : part;
}

function Tagline() {
  const t = useTheme();
  const { goals } = useStore();
  if (t.tagline === 'moon') {
    const moon = moonPhase();
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="moon-outline" size={13} color={t.colors.accent} />
        <Txt variant="muted" style={{ color: t.colors.accent, fontSize: 12 }}>
          {moon.name}
        </Txt>
      </View>
    );
  }
  if (t.tagline === 'streak' && goals.length) {
    const days = Math.max(...goals.map((g) => dayOfGoal(g)));
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="flame-outline" size={14} color={t.colors.accent} />
        <Txt variant="muted" style={{ color: t.colors.accent, fontSize: 12 }}>
          Day {days}
        </Txt>
      </View>
    );
  }
  return null;
}

/** A quote from a manifestation or spiritual teacher, new each time the app opens. Quiet, not a card. */
function QuoteLine() {
  const t = useTheme();
  const q = quoteOfThisVisit;
  return (
    <View style={{ gap: 4 }}>
      <Txt variant="quote" style={{ fontSize: 17, lineHeight: 24, color: t.colors.muted }}>
        {`“${q.text}”`}
      </Txt>
      <Txt variant="muted" style={{ fontSize: 12 }}>
        {`— ${q.who}`}
      </Txt>
    </View>
  );
}

/** Today's affirmation from the first goal, with a heart to favorite it and a share button. */
function TodayCard() {
  const t = useTheme();
  const { goals, updateGoal } = useStore();
  const goal = goals[0];
  const today = goal ? todaysAffirmation(goal) : undefined;
  if (!goal || !today) return null;
  const toggle = () =>
    updateGoal(goal.id, (g) => ({
      ...g,
      affirmations: g.affirmations.map((a) => (a.id === today.id ? { ...a, favorite: !a.favorite } : a)),
    }));
  const share = () => Share.share({ message: today.text }).catch(() => {});
  return (
    <QuoteBlock
      label="Today's affirmation"
      text={today.text}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 4 }}>
          <Pressable onPress={share} hitSlop={10} accessibilityRole="button" accessibilityLabel="Share">
            <Icon name="share-social-outline" size={20} color={t.colors.muted} />
          </Pressable>
          <Pressable onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={today.favorite ? 'Unfavorite' : 'Favorite'}>
            <Icon name={today.favorite ? 'heart' : 'heart-outline'} size={21} color={today.favorite ? t.colors.accent : t.colors.muted} />
          </Pressable>
        </View>
      }
    />
  );
}

/** Whatever Listen last played, one tap to carry on. */
function ContinueListening() {
  const t = useTheme();
  const { goals, settings } = useStore();
  const last = settings.lastPlayed;
  if (!last) return null;
  const goalIndex = goals.findIndex((g) => g.id === last.id);
  const goal = last.kind === 'goal' ? goals[goalIndex] : undefined;
  const track = last.kind === 'track' ? trackById(last.id) : undefined;
  if (!goal && !track) return null;
  const open = () => router.push({ pathname: '/listen', params: goal ? { goal: goal.id } : { track: track!.id } });
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`Continue listening to ${goal ? goal.title : track!.title}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.7 : 1 })}>
      <Art icon={goal ? categoryIcon(goal.category) : track!.icon} index={goal ? goalIndex : TRACKS.indexOf(track!)} size={44} />
      <View style={{ flex: 1 }}>
        <Txt variant="muted" style={{ fontSize: 12 }}>
          Continue listening
        </Txt>
        <Txt variant="medium" numberOfLines={1}>
          {goal ? goal.title : track!.title}
        </Txt>
      </View>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="play" size={17} color={t.colors.onAccent} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const { goals, settings } = useStore();
  const moon = t.tagline === 'moon' ? moonPhase() : undefined;

  return (
    <Screen>
      <View style={{ gap: 6, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Tagline />
        </View>
        <Txt variant="display">{greeting(settings.name)}</Txt>
        <QuoteLine />
        {moon && (
          <Txt variant="quote" style={{ fontSize: 15, lineHeight: 20, color: t.colors.muted }}>
            {moon.hint}
          </Txt>
        )}
      </View>

      <TodayCard />

      <ContinueListening />

      <Section label="Your goals">
        {goals.length === 0 ? (
          <View style={{ gap: 14 }}>
            <Card>
              <View style={{ gap: 6 }}>
                <Txt variant="title">Start your first goal</Txt>
                <Txt variant="muted">
                  {"Describe exactly what you want, and you'll get affirmations written around it. Or write your own."}
                </Txt>
              </View>
            </Card>
            <Button title="New goal" icon="add" onPress={() => router.push('/goal/new')} />
          </View>
        ) : (
          <Shelf>
            {goals.map((g, i) => (
              <ShelfCard
                key={g.id}
                icon={categoryIcon(g.category)}
                index={i}
                title={g.title}
                subtitle={dayLabel(g, t.romanDays)}
                size={128}
                onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })}
              />
            ))}
            <NewGoalCard />
          </Shelf>
        )}
      </Section>

      <Section label="Ready-made tracks">
        <TrackShelf onPick={(track) => router.push({ pathname: '/track/[id]', params: { id: track.id } })} />
      </Section>
    </Screen>
  );
}

/** The last card on the goals shelf: start another one. */
function NewGoalCard() {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/goal/new')}
      accessibilityRole="button"
      accessibilityLabel="New goal"
      style={({ pressed }) => ({ width: 128, gap: 8, opacity: pressed ? 0.75 : 1 })}>
      <View
        style={{
          width: 128,
          height: 128,
          borderRadius: Math.max(t.radius, 14),
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: t.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="add" size={34} color={t.colors.accent} />
      </View>
      <Txt variant="medium">New goal</Txt>
    </Pressable>
  );
}
