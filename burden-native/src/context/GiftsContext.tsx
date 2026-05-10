// In-memory gift store for the demo. Mirrors the web app — no persistence yet.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Gift } from '../data/mock';

type GiftsContextValue = {
  gifts: Gift[];
  recordGift: (gift: Gift) => void;
};

const GiftsContext = createContext<GiftsContextValue | null>(null);

export function GiftsProvider({ children }: { children: React.ReactNode }) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const recordGift = useCallback((gift: Gift) => {
    setGifts((prev) => [...prev, gift]);
  }, []);
  const value = useMemo(() => ({ gifts, recordGift }), [gifts, recordGift]);
  return <GiftsContext.Provider value={value}>{children}</GiftsContext.Provider>;
}

export function useGifts(): GiftsContextValue {
  const ctx = useContext(GiftsContext);
  if (!ctx) throw new Error('useGifts must be used inside GiftsProvider');
  return ctx;
}
