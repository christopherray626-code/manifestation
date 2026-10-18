import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { BottomTabBar } from 'expo-router/build/react-navigation/bottom-tabs';
import { View } from 'react-native';

import { MiniPlayer } from '@/components/mini-player';
import { useTheme, type IconName } from '@/components/ui';
import { tap } from '@/lib/haptics';
import { useStore } from '@/lib/store';

// Four tabs, each a one-word label with an outline icon that fills in when active.
const TABS: { name: string; title: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline', iconOn: 'sunny' },
  { name: 'explore', title: 'Explore', icon: 'compass-outline', iconOn: 'compass' },
  { name: 'create', title: 'Claim', icon: 'sparkles-outline', iconOn: 'sparkles' },
  { name: 'you', title: 'Me', icon: 'person-outline', iconOn: 'person' },
];

// Routes that live in the tab group but don't get a tab.
const HIDDEN = ['listen', 'board'];

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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? tab.iconOn : tab.icon} size={22} color={color} />
            ),
          }}
        />
      ))}
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
