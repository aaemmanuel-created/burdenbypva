// In-memory gift store, mirroring the web app's App state. Not persisted
// yet: the native app has no storage dependency (adding
// @react-native-async-storage/async-storage is the follow-up), so a gift's
// timeline lasts until the app is closed.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Gift } from '../data/mock';

type GiftsContextValue = {
  gifts: Gift[];
  recordGift: (gift: Gift) => void;
  updateGift: (id: string, patch: Partial<Gift>) => void;
};

const GiftsContext = createContext<GiftsContextValue | null>(null);

export function GiftsProvider({ children }: { children: React.ReactNode }) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const recordGift = useCallback((gift: Gift) => {
    setGifts((prev) => (prev.some((g) => g.id === gift.id) ? prev : [...prev, gift]));
  }, []);
  const updateGift = useCallback((id: string, patch: Partial<Gift>) => {
    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);
  const value = useMemo(() => ({ gifts, recordGift, updateGift }), [gifts, recordGift, updateGift]);
  return <GiftsContext.Provider value={value}>{children}</GiftsContext.Provider>;
}

export function useGifts(): GiftsContextValue {
  const ctx = useContext(GiftsContext);
  if (!ctx) throw new Error('useGifts must be used inside GiftsProvider');
  return ctx;
}
