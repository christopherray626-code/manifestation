import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Icon, Screen, Txt, useTheme, type IconName } from '@/components/ui';
import { BILLING_LIVE, PRICES } from '@/lib/premium';
import { useStore } from '@/lib/store';

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: 'mic-outline', text: 'Affirmations in your own voice' },
  { icon: 'people-outline', text: 'All 10 natural voices' },
  { icon: 'sparkles-outline', text: 'Unlimited manifestations, written around you' },
  { icon: 'pulse-outline', text: 'Frequencies and binaural beats' },
];

/**
 * The paywall: shown at the end of onboarding and when you tap something locked. Honest by design:
 * the close button is always visible, the price sits next to the button, and the trial timeline says
 * exactly when you'd be charged. Until payments are switched on, it can't charge anything.
 */
export default function Paywall() {
  const t = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { updateSettings } = useStore();
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');
  const [note, setNote] = useState('');

  function close() {
    if (from === 'onboarding') {
      updateSettings({ onboarded: true });
      router.replace('/');
    } else if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function subscribe() {
    if (!BILLING_LIVE) {
      setNote('Payments aren’t switched on yet, so everything is free for now. Enjoy it.');
      return;
    }
    // Store purchase goes here once RevenueCat is set up in the app-store build.
  }

  const trial = PRICES.annual.trialDays;
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Icon name="close" size={26} color={t.colors.muted} />
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="display">Speak it into your life, every day</Txt>
        <Txt variant="muted">Everything you need to hear it as already yours.</Txt>
      </View>

      <View style={{ gap: 14 }}>
        {BENEFITS.map((b) => (
          <View key={b.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Icon name={b.icon} size={22} color={t.colors.accent} />
            <Txt variant="body">{b.text}</Txt>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <PlanCard
          on={plan === 'annual'}
          onPress={() => setPlan('annual')}
          title="Yearly"
          price={`${PRICES.annual.price} a year`}
          sub={`Just ${PRICES.annual.perWeek} a week · ${trial} days free`}
          badge="Save 67%"
        />
        <PlanCard
          on={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
          title="Monthly"
          price={`${PRICES.monthly.price} a month`}
          sub="No free trial"
        />
      </View>

      {plan === 'annual' && (
        <View style={{ gap: 10 }}>
          <Step icon="lock-open-outline" title="Today" text="Everything unlocks. Nothing to pay." />
          <Step icon="notifications-outline" title={`Day ${trial - 2}`} text="We remind you your trial is ending." />
          <Step icon="star-outline" title={`Day ${trial}`} text={`You’re charged ${PRICES.annual.price}, unless you cancel before.`} />
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Button title={plan === 'annual' ? `Try free for ${trial} days` : 'Subscribe'} onPress={subscribe} />
        <Txt variant="muted" style={{ textAlign: 'center' }}>
          {plan === 'annual'
            ? `${trial} days free, then ${PRICES.annual.price} a year. Cancel anytime.`
            : `${PRICES.monthly.price} a month. Cancel anytime.`}
        </Txt>
        {note ? <Txt variant="muted" style={{ textAlign: 'center', color: t.colors.accent }}>{note}</Txt> : null}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
        {['Restore purchases', 'Terms', 'Privacy'].map((l) => (
          <Txt key={l} variant="muted" style={{ fontSize: 12 }}>
            {l}
          </Txt>
        ))}
      </View>

      <Pressable onPress={close} accessibilityRole="button" style={{ alignSelf: 'center', padding: 12 }}>
        <Txt variant="muted">Not now</Txt>
      </Pressable>
    </Screen>
  );
}

function PlanCard({
  on,
  onPress,
  title,
  price,
  sub,
  badge,
}: {
  on: boolean;
  onPress: () => void;
  title: string;
  price: string;
  sub: string;
  badge?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={{
        borderRadius: Math.max(t.radius, 16),
        borderWidth: on ? 2 : 1,
        borderColor: on ? t.colors.accent : t.colors.border,
        backgroundColor: t.colors.card,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? t.colors.accent : t.colors.muted} />
      <View style={{ flex: 1 }}>
        <Txt variant="medium">{`${title} · ${price}`}</Txt>
        <Txt variant="muted">{sub}</Txt>
      </View>
      {badge && (
        <View style={{ backgroundColor: t.colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Txt variant="muted" style={{ color: t.colors.onAccent, fontSize: 12 }}>
            {badge}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

function Step({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="medium">{title}</Txt>
        <Txt variant="muted">{text}</Txt>
      </View>
    </View>
  );
}
