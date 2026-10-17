// Shared haptic utility — parallel of burden-app/src/lib/useHaptic.ts.
// Created by the web design-overhaul pass (2026-07-02); the native Give
// button wiring is intentionally NOT changed in that pass — adopt this
// independently.

import * as Haptics from 'expo-haptics';

export function haptic(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
  const style =
    intensity === 'light' ? Haptics.ImpactFeedbackStyle.Light :
    intensity === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy :
    Haptics.ImpactFeedbackStyle.Medium;
  Haptics.impactAsync(style);
}
