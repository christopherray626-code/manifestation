import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { Cinzel_400Regular, Cinzel_500Medium } from '@expo-google-fonts/cinzel';
import {
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '@/components/ui';
import { useReminders } from '@/lib/reminders';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    Cinzel_400Regular,
    Cinzel_500Medium,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
  });

  return (
    <StoreProvider>
      <Root fontsReady={fontsLoaded || !!fontError} />
    </StoreProvider>
  );
}

function Root({ fontsReady }: { fontsReady: boolean }) {
  const { loaded, settings, goals } = useStore();
  const t = useTheme();
  const ready = fontsReady && loaded;
  useReminders(settings.reminders, goals, ready && settings.onboarded);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // On the web, paint the page itself in the theme colour too, so the strip the phone keeps for its
  // gesture bar (and any overscroll) matches the app instead of showing white.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.style.backgroundColor = t.colors.bg;
    // Light or dark decides the colour of Android's gesture bar in the installed app.
    document.documentElement.style.colorScheme = t.dark ? 'dark' : 'light';
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t.dark ? 'dark' : 'light');
    document.body.style.backgroundColor = t.colors.bg;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = t.colors.bg;
  }, [t.colors.bg, t.dark]);

  if (!ready) return null;

  const base = t.dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: t.colors.bg,
          card: t.colors.bg,
          text: t.colors.text,
          border: t.colors.border,
          primary: t.colors.accent,
        },
      }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="goal/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goal/[id]" />
        <Stack.Screen name="track/[id]" />
        <Stack.Screen name="record/[goalId]" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}
