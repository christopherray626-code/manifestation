import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { Button, Card, Icon, Txt, useTheme } from '@/components/ui';
import { usePlayer } from '@/lib/player';

/*
 * Updates arrive over the air: the phone downloads a new version quietly while the app is open, and
 * uses it the next time the app starts. These two pieces make that visible: Settings says which version
 * is running and can fetch the newest one on the spot, and Today says when one is ready to switch to.
 * The website always loads the newest version, so there it only shows the number.
 */

const VERSION = Constants.expoConfig?.version ?? Updates.runtimeVersion ?? '';

function when(date: Date | null) {
  if (!date) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Stops the tape and gives the last change a moment to be saved, then starts the app again on the new version. */
function useRestart() {
  const { tape } = usePlayer();
  return async () => {
    tape.pause();
    await new Promise((r) => setTimeout(r, 700));
    await Updates.reloadAsync();
  };
}

function NativeVersion() {
  const restart = useRestart();
  const { isUpdatePending } = Updates.useUpdates();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function check() {
    if (busy) return;
    if (!Updates.isEnabled) return setNote('Updates only arrive in the installed app.');
    setBusy(true);
    setNote('');
    try {
      if (!isUpdatePending) {
        const found = await Updates.checkForUpdateAsync();
        if (!found.isAvailable) {
          setNote('You’re on the newest version.');
          return;
        }
        setNote('Downloading the new version…');
        await Updates.fetchUpdateAsync();
      }
      setNote('Restarting…');
      await restart();
    } catch {
      setNote('Couldn’t check just now. Make sure you’re online and try again.');
    } finally {
      setBusy(false);
    }
  }

  const made = when(Updates.createdAt);
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="muted" style={{ textAlign: 'center' }}>
        {`Version ${VERSION}${made ? ` · updated ${made}` : ''}`}
      </Txt>
      <Button
        title={busy ? 'Checking…' : isUpdatePending ? 'Restart to update' : 'Check for updates'}
        icon="refresh"
        kind="ghost"
        onPress={check}
      />
      {note ? (
        <Txt variant="muted" style={{ textAlign: 'center' }}>
          {note}
        </Txt>
      ) : null}
    </View>
  );
}

function WebVersion() {
  return (
    <Txt variant="muted" style={{ textAlign: 'center' }}>
      {`Version ${VERSION}`}
    </Txt>
  );
}

/** Settings: the version that's running, and a way to get the newest one now. */
export const AppVersion = Platform.OS === 'web' ? WebVersion : NativeVersion;

function NativeUpdateReady() {
  const t = useTheme();
  const restart = useRestart();
  const { isUpdatePending } = Updates.useUpdates();
  if (!isUpdatePending) return null;
  return (
    <Card onPress={() => void restart().catch(() => {})} highlight>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="sparkles-outline" size={20} color={t.colors.accent} />
        <View style={{ flex: 1 }}>
          <Txt variant="medium">A new version is ready</Txt>
          <Txt variant="muted">Tap to restart and use it. It takes a second.</Txt>
        </View>
        <Icon name="chevron-forward" size={18} color={t.colors.muted} />
      </View>
    </Card>
  );
}

/** Today: shown only when a new version has been downloaded and is waiting for a restart. */
export const UpdateReady = Platform.OS === 'web' ? () => null : NativeUpdateReady;
