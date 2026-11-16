import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { BottomTabBar } from 'expo-router/build/react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Animated, View, type ColorValue } from 'react-native';

import { MiniPlayer } from '@/components/mini-player';
import { useTheme, type IconName } from '@/components/ui';
import { tap } from '@/lib/haptics';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';

// Four tabs, each a one-word label with an outline icon that fills in when active.
const TABS: { name: string; title: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline', iconOn: 'sunny' },
  { name: 'create', title: 'Manifest', icon: 'sparkles-outline', iconOn: 'sparkles' },
  { name: 'board', title: 'Board', icon: 'images-outline', iconOn: 'images' },
  { name: 'you', title: 'Settings', icon: 'settings-outline', iconOn: 'settings' },
];

// Routes that live in the tab group but don't get a tab.
const HIDDEN = ['listen', 'explore'];

export default function TabLayout() {
  const { settings } = useStore();
  const t = useTheme();

  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      // The mini-player rides just above the tab bar on every tab.
      tabBar={(props) => (
        <View style={{ backgroundColor: t.colors.bg }}>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </View>
      )}
      screenListeners={{ tabPress: () => tap() }}
      screenOptions={{
        headerShown: false,
        // Tabs slide and fade a touch as you switch, rather than snapping.
        animation: 'shift',
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.tabInactive,
        tabBarStyle: { backgroundColor: t.colors.bg, borderTopColor: t.colors.border },
        tabBarLabelStyle: { fontFamily: t.fonts.body, fontSize: 11 },
        sceneStyle: { backgroundColor: t.colors.bg },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? tab.iconOn : tab.icon} color={color} focused={focused} />,
          }}
        />
      ))}
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

/** A tab's icon: it pops with a little bounce and a tilt when its tab becomes the one you're on. */
function TabIcon({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  const still = useReducedMotion();
  const [pop] = useState(() => new Animated.Value(focused ? 1 : 0));
  useEffect(() => {
    if (still || !focused) return pop.setValue(focused ? 1 : 0);
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 14 }).start();
  }, [focused, pop, still]);
  return (
    <Animated.View
      style={{
        transform: [
          { scale: pop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1.08] }) },
          { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
          { rotate: pop.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-10deg', '0deg'] }) },
        ],
      }}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}
