// Shared UI primitives for BURDEN-native.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors, font, fundingTier, tile } from '../constants/theme';
import { useDockSurfaceRegion } from '../lib/dockSurface';

export function Label({ children, style, onNavy }: { children: React.ReactNode; style?: TextStyle; onNavy?: boolean }) {
  return <Text style={[styles.label, onNavy && { color: tile.muted }, style]}>{children}</Text>;
}

export function Rule({ soft, style }: { soft?: boolean; style?: ViewStyle }) {
  return <View style={[soft ? styles.ruleSoft : styles.rule, style]} />;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  // 'onNavy' is the white pill used inside a Tile (web: "Carry this burden — give").
  variant?: 'primary' | 'ghost' | 'onNavy';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary';
  if (variant === 'onNavy') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [styles.btnOnNavy, disabled && { opacity: 0.4 }, pressed && { opacity: 0.8 }, style]}
      >
        <Text style={[styles.btnText, styles.btnTextOnNavy]}>
          {typeof children === 'string' ? children.toUpperCase() : children}
        </Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.btnText, isPrimary ? styles.btnTextPrimary : styles.btnTextGhost]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </Pressable>
  );
}

export function Progress({ value, goal, onNavy }: { value: number; goal: number; onNavy?: boolean }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <View style={[styles.progressTrack, onNavy && styles.progressTrackOnNavy]}>
      <View style={[styles.progressFill, onNavy && styles.progressFillOnNavy, { width: `${pct}%` }]} />
    </View>
  );
}

export function Badge({
  children,
  tone = 'default',
  onNavy,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'trust' | 'warn';
  onNavy?: boolean;
}) {
  const palette = onNavy
    ? tone === 'trust'
      ? { fg: '#ffffff', border: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.12)' }
      : tone === 'warn'
      ? { fg: colors.warnOnNavy, border: 'rgba(224,168,107,0.55)', bg: 'rgba(224,168,107,0.10)' }
      : { fg: tile.ink, border: 'rgba(255,255,255,0.55)', bg: 'transparent' }
    : tone === 'trust'
      ? { fg: colors.trust, border: colors.trust }
      : tone === 'warn'
      ? { fg: colors.warn, border: colors.warn }
      : { fg: colors.ink, border: colors.rule };

  return (
    <View style={[styles.badge, { borderColor: palette.border, backgroundColor: 'bg' in palette ? palette.bg : 'transparent' }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
}

// ─── Tile — the glassy navy card from the web app (burden-app UI.jsx) ───────
// Light-to-deep blue gradient (tile.gradient), a 1px light streak along the
// top edge, and tile.shadow for the 3D lift.

// With `image`, the photo fills the whole tile at its own shape (nothing
// cropped) and the content sits over it, darkened towards the bottom so the
// text stays readable. Put a <View style={{ flex: 1 }} /> in the children to
// push the lower content down onto the dark part.
export function Tile({
  children, onPress, style, padding = 24, accessibilityLabel, image, imageColour, funded = 0,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  accessibilityLabel?: string;
  image?: ImageSourcePropType;
  imageColour?: ImageSourcePropType;
  funded?: number; // 0–1, how much colour the photo shows
}) {
  const photo = image ? Image.resolveAssetSource(image) : null;
  const region = useDockSurfaceRegion(); // tells the Dock a dark surface is under it
  const inner = (
    <>
      {image && (
        <View pointerEvents="none" style={styles.tilePhoto}>
          <FundingPhoto mono={image} colour={imageColour} funded={funded} style={styles.tilePhotoImg} />
          <View style={styles.tilePhotoShade} />
        </View>
      )}
      <View pointerEvents="none" style={styles.tileStreak} />
      {children}
    </>
  );
  const photoStyle: ViewStyle | null = photo ? { aspectRatio: photo.width / photo.height } : null;
  if (!onPress) {
    return <View ref={region.ref} onLayout={region.onLayout} style={[styles.tile, { padding }, photoStyle, style]}>{inner}</View>;
  }
  return (
    <Pressable
      ref={region.ref}
      onLayout={region.onLayout}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.tile, { padding }, photoStyle, pressed && styles.tilePressed, style]}
    >
      {inner}
    </Pressable>
  );
}

// Funding square — top-right of a tile, shaped like the HOUSEPVA app icon.
// Green = almost/fully funded, amber = halfway, red = just getting started.
// Colour is never the only signal: screen readers hear the label, and the
// tile also shows "NN% funded".
const GRAIN = require('../../assets/grain.png');

// A burden's photo that "loads its colour" as it is funded: the black-and-
// white version sits underneath and the colour version fades in on top, up
// to the funded share (57% funded → 57% colour). It plays in each time the
// photo appears, like colour loading into it. With no colour version yet,
// it simply shows the black-and-white photo.
export function FundingPhoto({
  mono, colour, funded, style,
}: { mono: ImageSourcePropType; colour?: ImageSourcePropType; funded: number; style?: ViewStyle }) {
  const amount = useRef(new Animated.Value(0)).current;
  const target = Math.max(0, Math.min(1, funded));
  useEffect(() => {
    if (!colour) return;
    Animated.timing(amount, {
      toValue: target, duration: 1800, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [colour, target, amount]);
  return (
    <View style={style}>
      {/* Explicit 100% size: otherwise RN sizes an Image to the file's pixels. */}
      <Image source={mono} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.photoFill} />
      {colour && (
        <Animated.Image
          source={colour}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={[styles.photoFill, { opacity: amount }]}
        />
      )}
    </View>
  );
}


export function FundingSquare({ raised, goal, size = 16 }: { raised: number; goal: number; size?: number }) {
  const t = fundingTier(raised, goal);
  return (
    <View
      accessible
      accessibilityLabel={t.label}
      style={[styles.square, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.color }]}
    >
      {/* Grainy finish, like the textured HOUSEPVA app icon. */}
      <Image source={GRAIN} resizeMode="cover" style={styles.squareGrain} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: tile.background, // fallback if the gradient isn't supported
    experimental_backgroundImage: tile.gradient,
    borderWidth: 1,
    borderColor: tile.border,
    borderRadius: 14,
    overflow: 'visible',
    ...tile.shadow,
  },
  tilePhoto: { ...StyleSheet.absoluteFillObject, borderRadius: 13, overflow: 'hidden' },
  tilePhotoImg: { width: '100%', height: '100%' },
  photoFill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  tilePhotoShade: {
    ...StyleSheet.absoluteFillObject,
    experimental_backgroundImage:
      'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.85) 100%)',
  },
  tilePressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  tileStreak: {
    position: 'absolute', top: 0, left: 24, right: 24, height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  square: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  squareGrain: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined, opacity: 0.9 },
  btnOnNavy: {
    paddingVertical: 14, paddingHorizontal: 22, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  btnTextOnNavy: { color: colors.navyDeep, fontFamily: font.bold },
  progressTrackOnNavy: { backgroundColor: 'rgba(255,255,255,0.10)', height: 3, borderRadius: 2 },
  progressFillOnNavy: { backgroundColor: '#fff' },
  label: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  rule: { height: 1, backgroundColor: colors.rule, width: '100%' },
  ruleSoft: { height: 1, backgroundColor: colors.ruleSoft, width: '100%' },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.ink },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { fontFamily: font.regular, fontSize: 11, letterSpacing: 2 },
  btnTextPrimary: { color: colors.accentInk },
  btnTextGhost: { color: colors.ink },
  progressTrack: { height: 2, backgroundColor: colors.ruleSoft, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.ink },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontFamily: font.regular, fontSize: 9, letterSpacing: 2 },
});
