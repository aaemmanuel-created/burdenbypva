// Apple's own tab bar (Emmanuel, 2026-10-22: "use the real Apple tab bar in burden too").
// A small React Navigation navigator around react-native-screens' BottomTabs — a real
// UITabBarController, so on iOS 26 it is the system's Liquid Glass bar, as WhatsApp's is:
// icons over small labels, the selected tab in a glass capsule that stretches as you slide
// across, the bar shrinking as you scroll. Same component as HOUSEPVA's
// (Thecreated/housepva-native/src/navigation/AppleTabs.tsx), plus the two things BURDEN's tabs
// need: the slim "BURDEN" title row each tab wore, and a badge (the Giving count).
// (React Navigation's own native tabs need react-native-screens 4.30; Expo SDK 54 / Expo Go
// carry 4.16, whose BottomTabs this uses directly.)
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  createNavigatorFactory,
  TabRouter,
  useNavigationBuilder,
  type DefaultNavigatorOptions,
  type ParamListBase,
  type TabActionHelpers,
  type TabNavigationState,
  type TabRouterOptions,
} from '@react-navigation/native';
import { BottomTabs, BottomTabsScreen } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font } from '../constants/theme';

export type AppleTabOptions = {
  title?: string;
  sfSymbol?: string;          // an SF Symbols name, e.g. 'house'
  sfSymbolSelected?: string;  // the filled variant, e.g. 'house.fill'
  badge?: string;             // shown on the tab when set
  headerTitle?: string;       // the slim title row above the screen
};
type EventMap = { tabPress: { data: undefined; canPreventDefault: false } };

type Props = DefaultNavigatorOptions<ParamListBase, string | undefined, TabNavigationState<ParamListBase>, AppleTabOptions, EventMap, any>
  & TabRouterOptions
  & { tintColor?: string; minimizeOnScroll?: boolean;
      // the tab names' type: the old dock's labels (regular, bold when selected, one size)
      labelFont?: { regular: string; bold: string; size: number } };

// the header the tabs wore before: the word centred, bold, on the paper
function TabHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
}

function AppleTabNavigator({ id, initialRouteName, backBehavior, children, screenListeners, screenOptions, tintColor, minimizeOnScroll, labelFont }: Props) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>, TabRouterOptions, TabActionHelpers<ParamListBase>, AppleTabOptions, EventMap
  >(TabRouter, { id, initialRouteName, backBehavior, children, screenListeners, screenOptions });

  // one look for every layout the bar can take (stacked on a phone, inline when wide)
  const item = labelFont ? {
    normal: { tabBarItemTitleFontFamily: labelFont.regular, tabBarItemTitleFontSize: labelFont.size },
    selected: { tabBarItemTitleFontFamily: labelFont.bold, tabBarItemTitleFontSize: labelFont.size },
  } : undefined;
  const appearance = item ? { stacked: item, inline: item, compactInline: item } : undefined;

  return (
    <NavigationContent>
      <BottomTabs
        tabBarTintColor={tintColor}
        tabBarMinimizeBehavior={minimizeOnScroll ? 'onScrollDown' : 'never'}
        onNativeFocusChange={(e) => {
          // the bar changed tab itself; keep React Navigation in step
          const route = state.routes.find((r) => r.key === e.nativeEvent.tabKey);
          if (!route) return;
          navigation.emit({ type: 'tabPress', target: route.key });
          if (state.routes[state.index]?.key !== route.key) navigation.navigate(route.name, route.params);
        }}
      >
        {state.routes.map((route, i) => {
          const { options, render } = descriptors[route.key];
          return (
            <BottomTabsScreen
              key={route.key}
              tabKey={route.key}
              isFocused={i === state.index}
              title={options.title ?? route.name}
              badgeValue={options.badge}
              standardAppearance={appearance}
              scrollEdgeAppearance={appearance}
              icon={options.sfSymbol ? { sfSymbolName: options.sfSymbol } : undefined}
              selectedIcon={options.sfSymbolSelected ? { sfSymbolName: options.sfSymbolSelected } : undefined}
            >
              <View style={styles.screen}>
                {options.headerTitle ? <TabHeader title={options.headerTitle} /> : null}
                <View style={styles.screen}>{render()}</View>
              </View>
            </BottomTabsScreen>
          );
        })}
      </BottomTabs>
    </NavigationContent>
  );
}

export const createAppleTabNavigator = createNavigatorFactory(AppleTabNavigator) as any;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.bold, fontSize: 14, color: colors.ink, lineHeight: 44 },
});
