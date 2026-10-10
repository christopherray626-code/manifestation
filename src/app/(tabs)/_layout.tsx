import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';

import { useTheme, type IconName } from '@/components/ui';
import { useStore } from '@/lib/store';

const TABS: { name: string; title: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconOn: 'home' },
  { name: 'board', title: 'Board', icon: 'images-outline', iconOn: 'images' },
  { name: 'listen', title: 'Listen', icon: 'headset-outline', iconOn: 'headset' },
  { name: 'you', title: 'You', icon: 'person-outline', iconOn: 'person' },
];

export default function TabLayout() {
  const { settings } = useStore();
  const t = useTheme();

  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
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
    </Tabs>
  );
}
