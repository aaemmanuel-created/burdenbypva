// Lets the floating Dock know when a dark surface (a blue Tile or a photo)
// is scrolling underneath it, so it can switch to white labels — the way the
// iOS system tab bar adapts its glyphs to what's behind the glass.
//
//   <DockToneProvider>            around the tab navigator (Dock reads it)
//   useDockSurface()              in each tab screen with a scroll view:
//     <DockSurfaceCtx.Provider value={surface.ctx}>
//       <ScrollView onScroll={surface.onScroll} scrollEventThrottle={16}>
//   useDockSurfaceRegion()        inside Tile — registers the tile's area
import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Where the dock sits: its bottom offset above the safe area, and its height.
export const DOCK_BOTTOM_GAP = 6;
export const DOCK_HEIGHT = 50;

// Kept per tab, so a tab with nothing dark (About) never inherits white
// labels from the tab you just left.
type Tone = { dark: Record<string, boolean>; setDark: (routeKey: string, dark: boolean) => void };
const DockToneCtx = createContext<Tone>({ dark: {}, setDark: () => {} });

export function DockToneProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkMap] = useState<Record<string, boolean>>({});
  const setDark = useCallback((routeKey: string, value: boolean) => {
    setDarkMap((m) => (m[routeKey] === value ? m : { ...m, [routeKey]: value }));
  }, []);
  const value = useMemo(() => ({ dark, setDark }), [dark, setDark]);
  return <DockToneCtx.Provider value={value}>{children}</DockToneCtx.Provider>;
}

export const useDockTone = (routeKey: string) => useContext(DockToneCtx).dark[routeKey] ?? false;

// Region positions are stored as "window y when scrolled to the top", so the
// current window position is simply `top - scrollY`.
type Region = { top: number; bottom: number };
type Surface = {
  register: (id: string, region: Region | null) => void;
  // Each region also leaves a way to re-measure itself, used when the tab
  // comes back into view (a hidden screen can't be measured reliably).
  track: (id: string, measure: (() => void) | null) => void;
  scrollY: { current: number };
};
export const DockSurfaceCtx = createContext<Surface | null>(null);

export function useDockSurface() {
  const { setDark } = useContext(DockToneCtx);
  const routeKey = useRoute().key;
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const regions = useRef(new Map<string, Region>());
  const measurers = useRef(new Map<string, () => void>());
  const scrollY = useRef(0);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bandBottom = height - insets.bottom - DOCK_BOTTOM_GAP;
  const bandTop = bandBottom - DOCK_HEIGHT;

  const evaluate = useCallback(() => {
    if (!focusedRef.current) return; // only the visible tab drives the dock
    const y = scrollY.current;
    let dark = false;
    for (const r of regions.current.values()) {
      if (r.top - y < bandBottom && r.bottom - y > bandTop) { dark = true; break; }
    }
    setDark(routeKey, dark);
  }, [bandTop, bandBottom, setDark, routeKey]);

  // Coming back to a tab: re-measure every surface, then re-read what's
  // under the dock.
  useEffect(() => {
    if (!focused) return;
    measurers.current.forEach((measure) => measure());
    evaluate();
  }, [focused, evaluate]);

  const ctx = useMemo<Surface>(() => ({
    register(id, region) {
      if (region) regions.current.set(id, region); else regions.current.delete(id);
      evaluate();
    },
    track(id, measure) {
      if (measure) measurers.current.set(id, measure); else measurers.current.delete(id);
    },
    scrollY,
  }), [evaluate]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    evaluate();
  }, [evaluate]);

  return { ctx, onScroll };
}

// For a dark surface: returns a ref + onLayout to put on its outer View.
export function useDockSurfaceRegion() {
  const surface = useContext(DockSurfaceCtx);
  const id = useId();
  const ref = useRef<View>(null);
  const onLayout = useCallback(() => {
    if (!surface) return;
    ref.current?.measureInWindow((_x, y, _w, h) => {
      if (h <= 0) return; // not on screen yet — the focus re-measure will catch it
      const offset = surface.scrollY.current;
      surface.register(id, { top: y + offset, bottom: y + h + offset });
    });
  }, [surface, id]);
  useEffect(() => {
    surface?.track(id, onLayout);
    return () => { surface?.track(id, null); surface?.register(id, null); };
  }, [surface, id, onLayout]);
  return { ref, onLayout };
}
