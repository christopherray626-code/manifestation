import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button, Icon, Txt, useTheme } from '@/components/ui';
import { enhanceLines } from '@/lib/affirmations';

type About = { title?: string; details?: string; feeling?: string; name?: string };

/**
 * The Enhance button: sends lines to the Claude writer, then shows each old line beside its rewrite so
 * you keep only the ones you like. `onApply` gets the new wording for every line, in order (lines you
 * didn't pick come back as they were).
 */
export function useEnhance(about: About, onApply: (lines: string[]) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState<{ from: string[]; to: string[]; keep: boolean[] } | null>(null);

  async function start(lines: string[]) {
    if (busy || !lines.length) return;
    setBusy(true);
    setError('');
    const to = await enhanceLines(lines, about);
    setBusy(false);
    if (!to) return setError("Couldn't reach the writer. Check your connection and try again.");
    const keep = to.map((l, i) => l !== lines[i]);
    if (!keep.some(Boolean)) return setError('They already read well. Nothing to change.');
    setReview({ from: lines, to, keep });
  }

  const sheet = review && (
    <EnhanceReview
      {...review}
      onToggle={(i) => setReview((r) => r && { ...r, keep: r.keep.map((k, j) => (j === i ? !k : k)) })}
      onCancel={() => setReview(null)}
      onApply={() => {
        onApply(review.from.map((l, i) => (review.keep[i] ? review.to[i] : l)));
        setReview(null);
      }}
    />
  );
  return { start, busy, error, sheet };
}

function EnhanceReview({
  from,
  to,
  keep,
  onToggle,
  onCancel,
  onApply,
}: {
  from: string[];
  to: string[];
  keep: boolean[];
  onToggle: (i: number) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const t = useTheme();
  const picked = keep.filter(Boolean).length;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onCancel} />
      <View
        style={{
          backgroundColor: t.colors.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
          borderTopWidth: 1,
          borderColor: t.colors.border,
        }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
          <Txt variant="title">Enhanced</Txt>
          <Txt variant="muted">Tap any you&apos;d rather keep as you wrote it.</Txt>
          {from.map((old, i) =>
            old === to[i] ? null : (
              <Pressable
                key={i}
                onPress={() => onToggle(i)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: keep[i] }}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: 14,
                  borderRadius: t.radius,
                  borderWidth: 1,
                  borderColor: keep[i] ? t.colors.accent : t.colors.border,
                  backgroundColor: t.colors.card,
                }}>
                <Icon name={keep[i] ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={keep[i] ? t.colors.accent : t.colors.muted} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt variant="quote" style={{ fontSize: 17, lineHeight: 24, opacity: keep[i] ? 1 : 0.5 }}>
                    {to[i]}
                  </Txt>
                  <Txt variant="muted" style={{ textDecorationLine: keep[i] ? 'line-through' : 'none' }}>
                    {old}
                  </Txt>
                </View>
              </Pressable>
            ),
          )}
          <Button title={picked ? `Use ${picked}` : 'Keep mine'} icon="sparkles" onPress={onApply} />
          <Button title="Cancel" kind="ghost" onPress={onCancel} />
        </ScrollView>
      </View>
    </Modal>
  );
}
