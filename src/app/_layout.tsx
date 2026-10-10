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

import { useTheme } from '@/components/ui';
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
  const { loaded } = useStore();
  const t = useTheme();
  const ready = fontsReady && loaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

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
        <Stack.Screen name="record/[goalId]" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}
