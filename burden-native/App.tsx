// BURDEN-native — root entry.
// Loads JetBrains Mono, holds the splash until fonts are ready, then renders
// the navigator inside SafeAreaProvider + GestureHandlerRootView + GiftsProvider.
import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { GiftsProvider } from './src/context/GiftsContext';
import type { RootStackParamList } from './src/navigation/types';

// Init Sentry before any rendering so module-load errors are captured.
// DSN comes from EXPO_PUBLIC_SENTRY_DSN at build time. Source-map / dSYM
// upload is deferred until SENTRY_AUTH_TOKEN is provisioned.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: __DEV__,
});

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash can already be hidden in dev fast-refresh — ignore.
});

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['burden://', 'https://burdenbypva.app'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'home',
          Discover: 'discover',
          Giving: 'giving',
          About: 'about',
        },
      },
      Campaign: 'campaign/:campaignId',
      Give: 'give/:campaignId',
    },
  },
};

function App() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          JetBrainsMono: require('./assets/fonts/JetBrainsMono-Regular.ttf'),
          'JetBrainsMono-Bold': require('./assets/fonts/JetBrainsMono-Bold.ttf'),
        });
      } finally {
        setFontsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  // Dev-only Sentry smoke path: open the app with ?sentryTest=1 in the
  // deep-link URL (e.g. `burden://?sentryTest=1`) and we capture a known
  // exception 5s after mount. Confirms wiring once the EAS dev-client
  // preview channel is up — no-op in production builds.
  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    Linking.getInitialURL().then((url) => {
      if (cancelled || !url || !url.includes('sentryTest=1')) return;
      setTimeout(() => {
        Sentry.captureException(new Error('BURDEN Sentry smoke test from ?sentryTest=1 — wiring check, ignore.'));
      }, 5000);
    });
    return () => { cancelled = true; };
  }, []);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GiftsProvider>
          <NavigationContainer linking={linking}>
            <RootNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </GiftsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
