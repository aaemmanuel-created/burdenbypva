// BURDEN-native navigation: Apple's own tab bar (Home / Discover / Giving / Wallet / About —
// src/navigation/AppleTabs.tsx, 2026-10-22) wrapped in a native stack so Campaign, Give and
// Gift push on top. The old hand-built floating Dock (src/components/Dock.tsx) is no longer used.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList, TabParamList } from './types';
import { colors, font } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';

import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import GivingScreen from '../screens/GivingScreen';
import AboutScreen from '../screens/AboutScreen';
import WalletScreen from '../screens/WalletScreen';
import CampaignScreen from '../screens/CampaignScreen';
import GiveScreen from '../screens/GiveScreen';
import GiftScreen from '../screens/GiftScreen';
import { createAppleTabNavigator } from './AppleTabs';
import { DockToneProvider } from '../lib/dockSurface';
import { isGiven } from '../lib/giftTimeline';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createAppleTabNavigator();

// Apple's SF Symbols for each tab: outline when resting, filled when selected.
const TABS: { name: keyof TabParamList; component: React.ComponentType<any>; icon: string; on: string }[] = [
  { name: 'Home', component: HomeScreen, icon: 'house', on: 'house.fill' },
  { name: 'Discover', component: DiscoverScreen, icon: 'safari', on: 'safari.fill' },
  { name: 'Giving', component: GivingScreen, icon: 'gift', on: 'gift.fill' },
  // the BURDEN wallet — account credit, before About (Emmanuel, 2026-10-22)
  { name: 'Wallet', component: WalletScreen, icon: 'wallet.bifold', on: 'wallet.bifold.fill' },
  { name: 'About', component: AboutScreen, icon: 'info.circle', on: 'info.circle.fill' },
];

function Tabs() {
  const { gifts } = useGifts();
  const given = gifts.filter(isGiven).length;
  return (
    <DockToneProvider>
    <Tab.Navigator tintColor={colors.ink} minimizeOnScroll
      // the old dock's names: HOME · DISCOVER · GIVING · ABOUT, regular, bold when selected
      labelFont={{ regular: font.regular, bold: font.bold, size: 10.5 }}>
      {TABS.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component}
          options={{ title: t.name.toUpperCase(), sfSymbol: t.icon, sfSymbolSelected: t.on, headerTitle: 'BURDEN',
            // the Giving tab counts the gifts you have given, as the old dock's badge did
            badge: t.name === 'Giving' && given > 0 ? String(given) : undefined }} />
      ))}
    </Tab.Navigator>
    </DockToneProvider>
  );
}

// Our own slim header for pushed screens: a small back arrow and the title.
// (The iOS 26 native bar wraps any back button in a large glass circle.)
function SlimHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.bar, { paddingTop: insets.top }]}>
      <View style={headerStyles.side}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={14} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={headerStyles.arrow}>←</Text>
          </Pressable>
        )}
      </View>
      <Text style={headerStyles.title} numberOfLines={1}>{title}</Text>
      <View style={headerStyles.side} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, paddingHorizontal: 16, paddingBottom: 10 },
  side: { width: 40 },
  arrow: { fontSize: 18, color: colors.ink, fontFamily: font.regular },
  title: { flex: 1, textAlign: 'center', fontFamily: font.bold, fontSize: 13, color: colors.ink },
});

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        header: ({ navigation, options, back }) => (
          <SlimHeader title={options.title ?? ''} onBack={back ? navigation.goBack : undefined} />
        ),
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Campaign" component={CampaignScreen} options={{ title: 'BURDEN' }} />
      <Stack.Screen name="Give" component={GiveScreen} options={{ title: 'GIVE' }} />
      <Stack.Screen name="Gift" component={GiftScreen} options={{ title: 'YOUR GIFT' }} />
    </Stack.Navigator>
  );
}

