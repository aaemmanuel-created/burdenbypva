// Gift store, account credit (the BURDEN wallet), the donor's own fundraisers
// and joined prayer groups, mirroring the web app's App state. Saved on the
// phone with AsyncStorage (web: localStorage) so gifts and their timelines
// survive closing the app.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Gift } from '../data/mock';
import type { Fundraiser } from '../lib/community';
import { settleDemoGift } from '../lib/giftTimeline';

const STORE_KEY = 'burden-native-state-v1';

type Saved = { gifts: Gift[]; creditBalance: number; fundraisers: Fundraiser[]; joinedPrayer: string[] };

type GiftsContextValue = {
  gifts: Gift[];
  recordGift: (gift: Gift) => void;
  updateGift: (id: string, patch: Partial<Gift>) => void;
  creditBalance: number;
  addCredit: (amount: number) => void;
  fundraisers: Fundraiser[];
  addFundraiser: (f: Fundraiser) => void;
  // Burdens whose prayer group the donor has joined (web: App.jsx joinedPrayerGroups).
  joinedPrayer: string[];
  togglePrayer: (campaignId: string) => void;
};

const GiftsContext = createContext<GiftsContextValue | null>(null);

export function GiftsProvider({ children }: { children: React.ReactNode }) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [joinedPrayer, setJoinedPrayer] = useState<string[]>([]);
  const togglePrayer = useCallback((id: string) => {
    setJoinedPrayer((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // Load what was saved, then save every change. Anything recorded before
  // the load finishes (e.g. a checkout return) is kept alongside it.
  const loaded = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Saved>;
        if (Array.isArray(saved.gifts)) {
          const restored = saved.gifts.map((g) => settleDemoGift(g));
          setGifts((now) => [...restored.filter((g) => !now.some((n) => n.id === g.id)), ...now]);
        }
        if (typeof saved.creditBalance === 'number') setCreditBalance(saved.creditBalance);
        if (Array.isArray(saved.fundraisers)) setFundraisers(saved.fundraisers);
        if (Array.isArray(saved.joinedPrayer)) setJoinedPrayer(saved.joinedPrayer);
      })
      .catch(() => { /* unreadable store — start fresh */ })
      .finally(() => { loaded.current = true; });
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const saved: Saved = { gifts, creditBalance, fundraisers, joinedPrayer };
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(saved)).catch(() => { /* keep in memory */ });
  }, [gifts, creditBalance, fundraisers, joinedPrayer]);
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
  const addFundraiser = useCallback((f: Fundraiser) => {
    setFundraisers((prev) => [f, ...prev]);
  }, []);
  const value = useMemo(
    () => ({ gifts, recordGift, updateGift, creditBalance, addCredit, fundraisers, addFundraiser, joinedPrayer, togglePrayer }),
    [gifts, recordGift, updateGift, creditBalance, addCredit, fundraisers, addFundraiser, joinedPrayer, togglePrayer],
  );
  return <GiftsContext.Provider value={value}>{children}</GiftsContext.Provider>;
}

export function useGifts(): GiftsContextValue {
  const ctx = useContext(GiftsContext);
  if (!ctx) throw new Error('useGifts must be used inside GiftsProvider');
  return ctx;
}
