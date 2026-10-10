import { Card, Screen, Txt } from '@/components/ui';

export default function BoardScreen() {
  return (
    <Screen>
      <Txt variant="display">Vision board</Txt>
      <Card>
        <Txt variant="title">Coming soon</Txt>
        <Txt variant="muted">Your own photos or stock photos, played as a slideshow. No AI images.</Txt>
      </Card>
    </Screen>
  );
}
