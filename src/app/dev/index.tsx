import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { BackHeader, Button, Card, Icon, Screen, Txt, useTheme } from '@/components/ui';
import { useStore } from '@/lib/store';
import { TRACKS } from '@/lib/tracks';

/** Developer mode: every ready-made track, to rewrite in your own words. */
export default function DevTracks() {
  const t = useTheme();
  const { settings } = useStore();
  const edits = settings.trackEdits ?? {};
  const [copied, setCopied] = useState('');

  // Every rewritten track as plain text, to send to Claude so the wording goes into the app for everyone.
  async function copyAll() {
    const text = TRACKS.filter((tr) => edits[tr.id])
      .map((tr) => `## ${tr.title} (${tr.id})\n${tr.lines.join('\n')}`)
      .join('\n\n');
    if (!text) return setCopied('Nothing rewritten yet.');
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
        setCopied('Copied. Paste it to Claude to put it in the app for everyone.');
      } else {
        await Share.share({ message: text });
      }
    } catch {
      setCopied("Couldn't copy.");
    }
  }

  return (
    <Screen>
      <BackHeader title="Ready-made tracks" onBack={() => (router.canGoBack() ? router.back() : router.replace('/you'))} />
      <Txt variant="muted">
        Rewrite any track. Your wording plays on this phone straight away. New lines get their voice made the first time they play.
      </Txt>
      {TRACKS.map((tr) => (
        <Card key={tr.id} onPress={() => router.push(`/dev/${tr.id}`)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Icon name={tr.icon} size={22} color={t.colors.accent} />
            <View style={{ flex: 1 }}>
              <Txt variant="medium">{tr.title}</Txt>
              <Txt variant="muted">{`${tr.lines.length} lines${edits[tr.id] ? ' · rewritten' : ''}`}</Txt>
            </View>
            <Icon name="chevron-forward" size={18} color={t.colors.muted} />
          </View>
        </Card>
      ))}
      <Button title="Copy my rewrites" icon="copy-outline" kind="ghost" onPress={copyAll} />
      {!!copied && <Txt variant="muted">{copied}</Txt>}
    </Screen>
  );
}
