// The floating glass dock — BURDEN's version of the HOUSEPVA dock
// (Thecreated/housepva.html `.dock`): a liquid-glass cylinder floating over
// the page (content scrolls underneath it, like WhatsApp), hairline rim,
// spaced capitals, and a quiet grey shade that glides to the section you're in.
//
// Glass: Apple's native Liquid Glass on iOS 26+ (expo-glass-effect); a
// frosted blur everywhere else (expo-blur).
//
// Tuned after WhatsApp's iOS 26 tab bar, which is Apple's own system bar:
// the thin "clear" glass (not "regular"), no drop shadow, and the current
// tab marked by a lighter glass lens that springs across and stretches to
// fit the label, rather than a grey fill.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

import { colors, font } from '../constants/theme';
import { DOCK_BOTTOM_GAP, useDockTone } from '../lib/dockSurface';

type Box = { x: number; width: number };

const LIQUID_GLASS = isLiquidGlassAvailable();

// Space each tab screen leaves at the bottom so its last item can scroll
// clear of the floating dock (dock height + gap; the safe area is added on top).
export const DOCK_SPACE = 96;

export default function Dock({ state, descriptors, navigation, badges = {} }: BottomTabBarProps & {
  badges?: Record<string, number>;
}) {
  const insets = useSafeAreaInsets();
  const dark = useDockTone(state.routes[state.index].key); // a blue tile or photo is under the glass
  const [boxes, setBoxes] = useState<Record<number, Box>>({});
  const shadeX = useRef(new Animated.Value(0)).current;
  const shadeW = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  const active = boxes[state.index];
  useEffect(() => {
    if (!active) return;
    if (!placed.current) {
      // First layout: put the shade straight under the current tab.
      shadeX.setValue(active.x);
      shadeW.setValue(active.width);
      placed.current = true;
      return;
    }
    // A little overshoot so the lens stretches as it lands, like the system bar.
    const spring = { useNativeDriver: false, speed: 14, bounciness: 9 };
    Animated.parallel([
      Animated.spring(shadeX, { toValue: active.x, ...spring }),
      Animated.spring(shadeW, { toValue: active.width, ...spring }),
    ]).start();
  }, [active?.x, active?.width]);

  const onItemLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setBoxes((b) => (b[i]?.x === x && b[i]?.width === width ? b : { ...b, [i]: { x, width } }));
  };

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + DOCK_BOTTOM_GAP }]} pointerEvents="box-none">
      <View style={styles.dock} accessibilityRole="tablist">
        {LIQUID_GLASS ? (
          <GlassView glassEffectStyle="clear" isInteractive colorScheme="light" style={styles.glass} />
        ) : (
          <BlurView intensity={24} tint="light" style={[styles.glass, styles.blurFallback]} />
        )}
        <Animated.View pointerEvents="none" style={[styles.lens, { left: shadeX, width: shadeW, opacity: active ? 1 : 0 }]}>
          {LIQUID_GLASS ? (
            <GlassView glassEffectStyle="regular" colorScheme="light" tintColor="rgba(255,255,255,0.18)" style={styles.glass} />
          ) : (
            <View style={[styles.glass, styles.lensFallback]} />
          )}
        </Animated.View>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const label = (descriptors[route.key].options.title ?? route.name).toUpperCase();
          const badge = badges[route.name];
          return (
            <Pressable
              key={route.key}
              onLayout={onItemLayout(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${label}, ${badge}` : label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.btn, pressed && { transform: [{ scale: 1.06 }] }]}
            >
              <Text style={[styles.btnText, focused && styles.btnTextActive, dark && !focused && styles.btnTextOnDark]}>
                {label}
                {badge ? <Text style={[styles.badge, dark && !focused && styles.badgeOnDark]}>{` ${badge}`}</Text> : null}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Floats over the screen: nothing is reserved behind it.
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  // No drop shadow: the glass itself carries the edge, as on the system bar.
  dock: { flexDirection: 'row', gap: 4, padding: 5, borderRadius: 999 },
  glass: { ...StyleSheet.absoluteFillObject, borderRadius: 999, overflow: 'hidden' },
  blurFallback: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.55)',
  },
  lens: { position: 'absolute', top: 5, bottom: 5, borderRadius: 999 },
  lensFallback: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.7)',
  },
  btn: { paddingVertical: 11, paddingHorizontal: 15, borderRadius: 999 },
  // A faint light halo keeps the labels readable over photos and dark tiles,
  // the way iOS vibrancy lifts glyphs off the glass.
  btnText: {
    fontFamily: font.regular, fontSize: 10.5, letterSpacing: 1.5, color: colors.inkSoft,
    textShadowColor: 'rgba(255,255,255,0.7)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 },
  },
  btnTextActive: { fontFamily: font.bold, color: colors.ink },
  // Over blue tiles / photos: white labels lifted by a soft dark glow. The
  // current tab keeps dark ink, because it sits on the light glass lens.
  btnTextOnDark: { color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 4 },
  badgeOnDark: { color: 'rgba(255,255,255,0.8)' },
  badge: { fontFamily: font.regular, fontSize: 9, color: colors.inkMuted },
});
