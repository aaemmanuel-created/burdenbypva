// Shared UI primitives for BURDEN-native.
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors, font } from '../constants/theme';

export function Label({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
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
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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

export function Progress({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'trust' | 'warn';
}) {
  const palette =
    tone === 'trust'
      ? { fg: colors.trust, border: colors.trust }
      : tone === 'warn'
      ? { fg: colors.warn, border: colors.warn }
      : { fg: colors.ink, border: colors.rule };

  return (
    <View style={[styles.badge, { borderColor: palette.border }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
