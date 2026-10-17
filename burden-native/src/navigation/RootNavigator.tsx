// BURDEN-native navigation: the floating Dock (Home / Discover / Giving /
// About) wrapped in a native stack so Campaign, Give and Gift push on top.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { RootStackParamList, TabParamList } from './types';
import { colors, font } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';

import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import GivingScreen from '../screens/GivingScreen';
import AboutScreen from '../screens/AboutScreen';
import CampaignScreen from '../screens/CampaignScreen';
import GiveScreen from '../screens/GiveScreen';
import GiftScreen from '../screens/GiftScreen';
import Dock from '../components/Dock';
import { DockToneProvider } from '../lib/dockSurface';
import { isGiven } from '../lib/giftTimeline';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const { gifts } = useGifts();
  const given = gifts.filter(isGiven).length;
  return (
    <DockToneProvider>
    <Tab.Navigator
      tabBar={(props) => <Dock {...props} badges={{ Giving: given }} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
        headerTitle: 'BURDEN',
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Giving" component={GivingScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
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

