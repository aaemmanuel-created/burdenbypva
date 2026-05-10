// BURDEN-native — root entry.
// Loads JetBrains Mono, holds the splash until fonts are ready, then renders
// the navigator inside SafeAreaProvider + GestureHandlerRootView + GiftsProvider.
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { RootNavigator } from './src/navigation/RootNavigator';
import { GiftsProvider } from './src/context/GiftsContext';
import type { RootStackParamList } from './src/navigation/types';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash can already be hidden in dev fast-refresh — ignore.
});

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['burden://', 'https://burdenbypva.app'],
  config: {
    screens: {
      Tabs: {
        screens: {
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

export default function App() {
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
