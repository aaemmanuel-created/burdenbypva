// BURDEN-native navigation: a bottom tab bar (Discover / Giving / About)
// wrapped in a native stack so Campaign and Give push on top of the tabs.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import type { RootStackParamList, TabParamList } from './types';
import { colors, font } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';

import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import GivingScreen from '../screens/GivingScreen';
import AboutScreen from '../screens/AboutScreen';
import CampaignScreen from '../screens/CampaignScreen';
import GiveScreen from '../screens/GiveScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabBarLabel({ label, focused, badge }: { label: string; focused: boolean; badge?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label.toUpperCase()}</Text>
      {badge != null && badge > 0 && (
        <Text style={styles.tabBadge}>({badge})</Text>
      )}
    </View>
  );
}

function Tabs() {
  const { gifts } = useGifts();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
        headerTitle: 'BURDEN',
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.rule,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
        },
        tabBarShowLabel: true,
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabBarLabel label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabBarLabel label="Discover" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Giving"
        component={GivingScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label="Giving" focused={focused} badge={gifts.length} />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabBarLabel label="About" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Campaign" component={CampaignScreen} options={{ title: 'CAMPAIGN' }} />
      <Stack.Screen name="Give" component={GiveScreen} options={{ title: 'GIVE' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.inkSoft,
  },
  tabLabelActive: {
    color: colors.ink,
    fontFamily: font.bold,
  },
  tabBadge: {
    fontFamily: font.regular,
    fontSize: 9,
    color: colors.inkMuted,
  },
});
