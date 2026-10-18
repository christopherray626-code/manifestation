import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';

import { Button, Chip, ChipRow, Icon, Screen, Txt, useTheme, type IconName } from '@/components/ui';
import { Wheel } from '@/components/wheel';
import { usePlayer } from '@/lib/player';
import type { PlayerPrefs } from '@/lib/types';

const ENDINGS: { id: NonNullable<PlayerPrefs['endSound']>; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'bowls', label: 'Singing bowl' },
  { id: 'chimes', label: 'Chimes' },
];

/** The sleep timer: hours and minutes on wheels, how long the fade is, and what happens at the end. */
export default function TimerScreen() {
  const t = useTheme();
  const { prefs, setPrefs, tape } = usePlayer();
  const current = prefs.timer || 30;
  const [hours, setHours] = useState(Math.floor(current / 60));
  const [minutes, setMinutes] = useState(current % 60);
  const [fade, setFade] = useState(prefs.fadeSec ?? 20);
  const [ending, setEnding] = useState<NonNullable<PlayerPrefs['endSound']>>(prefs.endSound ?? 'none');
  const [vibrate, setVibrate] = useState(prefs.timerVibrate !== false);
  const total = hours * 60 + minutes;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/player'));

  function start() {
    setPrefs({ timer: total, fadeSec: fade, endSound: ending, timerVibrate: vibrate });
    tape.retime(total);
    close();
  }

  function turnOff() {
    setPrefs({ timer: 0 });
    tape.retime(0);
    close();
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 26 }} />
        <Txt variant="title" style={{ flex: 1, textAlign: 'center' }}>
          Timer
        </Txt>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Icon name="close" size={26} color={t.colors.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Wheel count={24} value={hours} onChange={setHours} label="Hours" />
        <Text style={{ color: t.colors.text, fontSize: 44, fontFamily: t.fonts.display, marginTop: 22 }}>:</Text>
        <Wheel count={60} value={minutes} onChange={setMinutes} label="Minutes" />
      </View>

      <View style={{ backgroundColor: t.colors.card, borderRadius: Math.max(t.radius, 18), paddingHorizontal: 18 }}>
        <Row icon="musical-note-outline" label="Ending sound">
          <ChipRow>
            {ENDINGS.map((e) => (
              <Chip key={e.id} label={e.label} selected={ending === e.id} onPress={() => setEnding(e.id)} />
            ))}
          </ChipRow>
        </Row>
        <Divider />
        <Row icon="volume-low-outline" label="Fade out" inline>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Round icon="remove" label="Shorter fade" onPress={() => setFade((f) => Math.max(5, f - 5))} />
            <Txt variant="medium" style={{ minWidth: 52, textAlign: 'center' }}>
              {`${fade} sec`}
            </Txt>
            <Round icon="add" label="Longer fade" onPress={() => setFade((f) => Math.min(120, f + 5))} />
          </View>
        </Row>
        {Platform.OS !== 'web' && (
          <>
            <Divider />
            <Row icon="phone-portrait-outline" label="Vibrate at the end" inline>
              <Switch value={vibrate} onValueChange={setVibrate} trackColor={{ true: t.colors.accent, false: t.colors.border }} />
            </Row>
          </>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <Button title={total ? `Start · ${label(total)}` : 'Pick a time'} onPress={total ? start : () => {}} />
        {!tape.playing && total > 0 && (
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            The timer starts when you press play.
          </Txt>
        )}
        {prefs.timer > 0 && (
          <Pressable onPress={turnOff} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10 }}>
            <Txt variant="muted">Turn the timer off</Txt>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

function label(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

function Row({ icon, label, inline, children }: { icon: IconName; label: string; inline?: boolean; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 16, gap: 12, flexDirection: inline ? 'row' : 'column', alignItems: inline ? 'center' : 'stretch' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: inline ? 1 : undefined }}>
        <Icon name={icon} size={20} color={t.colors.text} />
        <Txt variant="medium">{label}</Txt>
      </View>
      {children}
    </View>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.colors.border }} />;
}

function Round({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={18} color={t.colors.text} />
    </Pressable>
  );
}
