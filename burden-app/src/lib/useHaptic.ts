// Shared haptic utility — overhaul §7.
// Web: navigator.vibrate works on Android Chrome; silently no-ops on iOS
// Safari (acceptable — the native app handles haptics via expo-haptics).

export function haptic(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const ms = intensity === 'light' ? 8 : intensity === 'heavy' ? 30 : 16;
  navigator.vibrate?.(ms);
}
