import { Card, Orb, Screen, Txt, useTheme } from '@/components/ui';

export default function ListenScreen() {
  const t = useTheme();
  return (
    <Screen>
      <Txt variant="display">Listen</Txt>
      {(t.group === 'mystical' || t.decor === 'orb') && <Orb size={170} />}
      <Card>
        <Txt variant="title">Tapes are next</Txt>
        <Txt variant="muted">
          Spoken, subliminal and sleep tapes made from your affirmations, in your own voice or ours.
        </Txt>
      </Card>
    </Screen>
  );
}
