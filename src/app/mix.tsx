import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BackHeader, Button, Card, Chip, ChipRow, Icon, Screen, Section, Txt, useTheme } from '@/components/ui';
import { mixId, parseMix, type MixPart } from '@/lib/mix';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { TRACKS } from '@/lib/tracks';

/** Pick ready-made tracks and your own manifestations, in order, to play one after another as one loop. */
export default function MixScreen() {
  const t = useTheme();
  const { goals } = useStore();
  const { open } = usePlayer();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [parts, setParts] = useState<MixPart[]>(() => (from ? parseMix(from) : []));

  const has = (p: MixPart) => parts.some((q) => q.kind === p.kind && q.id === p.id);
  const toggle = (p: MixPart) => setParts((now) => (has(p) ? now.filter((q) => !(q.kind === p.kind && q.id === p.id)) : [...now, p]));
  const move = (i: number, by: -1 | 1) =>
    setParts((now) => {
      const to = i + by;
      if (to < 0 || to >= now.length) return now;
      const next = [...now];
      [next[i], next[to]] = [next[to], next[i]];
      return next;
    });
  const titleOf = (p: MixPart) =>
    p.kind === 'track' ? TRACKS.find((x) => x.id === p.id)?.title : goals.find((g) => g.id === p.id)?.title;
  const live = parts.filter((p) => titleOf(p));

  return (
    <Screen>
      <BackHeader title="Make a mix" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Txt variant="muted">Pick as many as you like. They play one after another, then start over.</Txt>

      {live.length > 0 && (
        <Card>
          <View style={{ gap: 10 }}>
            <Txt variant="label">In this mix</Txt>
            {live.map((p, i) => (
              <View key={`${p.kind}:${p.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Txt variant="muted" style={{ width: 18 }}>
                  {i + 1}
                </Txt>
                <Txt variant="medium" style={{ flex: 1 }} numberOfLines={1}>
                  {titleOf(p)}
                </Txt>
                <Pressable onPress={() => move(i, -1)} hitSlop={8} accessibilityLabel="Move up" disabled={i === 0}>
                  <Icon name="chevron-up" size={20} color={i === 0 ? t.colors.border : t.colors.muted} />
                </Pressable>
                <Pressable onPress={() => move(i, 1)} hitSlop={8} accessibilityLabel="Move down" disabled={i === live.length - 1}>
                  <Icon name="chevron-down" size={20} color={i === live.length - 1 ? t.colors.border : t.colors.muted} />
                </Pressable>
                <Pressable onPress={() => toggle(p)} hitSlop={8} accessibilityLabel={`Take ${titleOf(p)} out`}>
                  <Icon name="close" size={20} color={t.colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        </Card>
      )}

      {goals.length > 0 && (
        <Section label="My manifestations">
          <ChipRow>
            {goals.map((g) => (
              <Chip key={g.id} label={g.title} selected={has({ kind: 'goal', id: g.id })} onPress={() => toggle({ kind: 'goal', id: g.id })} />
            ))}
          </ChipRow>
        </Section>
      )}

      <Section label="Ready-made tracks">
        <ChipRow>
          {TRACKS.map((tr) => (
            <Chip key={tr.id} label={tr.title} selected={has({ kind: 'track', id: tr.id })} onPress={() => toggle({ kind: 'track', id: tr.id })} />
          ))}
        </ChipRow>
      </Section>

      {live.length > 0 ? (
        <Button
          title={live.length === 1 ? 'Play' : `Play mix of ${live.length}`}
          icon="play"
          onPress={() =>
            live.length === 1 && live[0].kind === 'track'
              ? open({ kind: 'track', id: live[0].id })
              : live.length === 1
                ? open({ kind: 'goal', id: live[0].id })
                : open({ kind: 'mix', id: mixId(live) })
          }
        />
      ) : (
        <Txt variant="muted" style={{ textAlign: 'center' }}>
          Pick at least one to start.
        </Txt>
      )}
    </Screen>
  );
}
