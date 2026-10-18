import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { usePlayer } from '@/lib/player';

/**
 * Old links (reminders, "Make my tape") still say /listen?goal=… or ?track=…. Load that into the player
 * and open it. Hidden from the tab bar.
 */
export default function ListenLink() {
  const { goal, track } = useLocalSearchParams<{ goal?: string; track?: string }>();
  const { choose } = usePlayer();
  useEffect(() => {
    if (track) choose({ kind: 'track', id: track });
    else if (goal) choose({ kind: 'goal', id: goal });
    // Only when the link changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, track]);
  return <Redirect href="/player" />;
}
