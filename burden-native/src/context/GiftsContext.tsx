// In-memory gift store and account credit (the BURDEN wallet), mirroring the web app's App
// state — burden-app/src/App.jsx keeps creditBalance in memory too. Not persisted
// yet: the native app has no storage dependency (adding
// @react-native-async-storage/async-storage is the follow-up), so a gift's
// timeline lasts until the app is closed.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Gift } from '../data/mock';

type GiftsContextValue = {
  gifts: Gift[];
  recordGift: (gift: Gift) => void;
  updateGift: (id: string, patch: Partial<Gift>) => void;
  creditBalance: number;
  addCredit: (amount: number) => void;
};

const GiftsContext = createContext<GiftsContextValue | null>(null);

export function GiftsProvider({ children }: { children: React.ReactNode }) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const recordGift = useCallback((gift: Gift) => {
    setGifts((prev) => (prev.some((g) => g.id === gift.id) ? prev : [...prev, gift]));
    // a gift paid from the wallet comes off the balance (web: recordGift)
    if (gift.fromCredit) setCreditBalance((b) => Math.max(0, Math.round((b - gift.amount) * 100) / 100));
  }, []);
  const addCredit = useCallback((amount: number) => {
    setCreditBalance((b) => Math.round((b + Number(amount)) * 100) / 100);
  }, []);
  const updateGift = useCallback((id: string, patch: Partial<Gift>) => {
    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);
  const value = useMemo(() => ({ gifts, recordGift, updateGift, creditBalance, addCredit }), [gifts, recordGift, updateGift, creditBalance, addCredit]);
  return <GiftsContext.Provider value={value}>{children}</GiftsContext.Provider>;
}

export function useGifts(): GiftsContextValue {
  const ctx = useContext(GiftsContext);
  if (!ctx) throw new Error('useGifts must be used inside GiftsProvider');
  return ctx;
}
