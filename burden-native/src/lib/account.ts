// A giver's account on the phone: gifts and fundraisers that belong to a
// person, not a device. Live: the `account`, `fundraisers` and `report`
// functions. Demo: accounts are kept on this phone under each email.
// Mirrors burden-app/src/lib/account.js.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Gift } from '../data/mock';
import type { Fundraiser } from './community';
import { authLive, callFunction } from './auth';

const DEMO_ACCOUNTS_KEY = 'burden-demo-accounts-v1';
type DemoStore = Record<string, { gifts: Gift[]; fundraisers: Fundraiser[] }>;

async function demoStore(): Promise<DemoStore> {
  try { return JSON.parse((await AsyncStorage.getItem(DEMO_ACCOUNTS_KEY)) || '{}'); } catch { return {}; }
}
const saveDemoStore = (s: DemoStore) => AsyncStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(s)).catch(() => {});

// What is on the phone is added to the account; the account's comes back.
export async function syncAccount(email: string, deviceGifts: Gift[], deviceFundraisers: Fundraiser[]) {
  if (!authLive) {
    const store = await demoStore();
    const acc = store[email] ?? { gifts: [], fundraisers: [] };
    const merge = <T extends { id: string }>(a: T[], b: T[]) => [...a.filter((x) => !b.some((y) => y.id === x.id)), ...b];
    acc.gifts = merge(acc.gifts, deviceGifts);
    acc.fundraisers = merge(acc.fundraisers, deviceFundraisers.map((f) => ({ ...f, own: true })));
    store[email] = acc;
    await saveDemoStore(store);
    return acc;
  }
  // Gifts made here before signing in carry their checkout token — proof to claim them.
  const unclaimed = deviceGifts.filter((g) => g.live && g.token && !g.account).map((g) => ({ id: g.id, token: g.token }));
  if (unclaimed.length) await callFunction('account', 'POST', { action: 'claim', gifts: unclaimed });
  const res = await callFunction<{ gifts: Gift[]; fundraisers: Fundraiser[] }>('account');
  const gifts = res.gifts.map((s) => {
    const local = deviceGifts.find((g) => g.id === s.id);
    return local ? { ...local, ...s, token: local.token } : s;
  });
  return { gifts, fundraisers: res.fundraisers };
}

export async function saveDemoAccount(email: string, gifts: Gift[], fundraisers: Fundraiser[]) {
  if (authLive) return;
  const store = await demoStore();
  store[email] = { gifts, fundraisers };
  await saveDemoStore(store);
}

export async function claimGifts(gifts: Gift[]) {
  await callFunction('account', 'POST', { action: 'claim', gifts: gifts.map((g) => ({ id: g.id, token: g.token })) });
}

export async function startFundraiserOnServer(fields: { campaignId: string; name: string; note: string; goal: number }) {
  const { fundraiser } = await callFunction<{ fundraiser: Fundraiser }>('account', 'POST', { action: 'fundraise', ...fields });
  return fundraiser;
}

export async function closeFundraiser(id: string) {
  if (authLive) await callFunction('account', 'POST', { action: 'close', fundraiser: id });
}

export async function deleteAccount(email: string) {
  if (!authLive) {
    const store = await demoStore();
    delete store[email];
    await saveDemoStore(store);
    return;
  }
  await callFunction('account', 'POST', { action: 'delete' });
}

// Everyone's open fundraisers on a burden, and one by id (shared links).
export async function fetchFundraisers(campaignId: string): Promise<Fundraiser[]> {
  if (!authLive) {
    return Object.values(await demoStore()).flatMap((a) => a.fundraisers ?? [])
      .filter((f) => f.campaignId === campaignId && !f.closed).map(({ own, ...f }) => f);
  }
  return (await callFunction<{ fundraisers: Fundraiser[] }>(`fundraisers?campaign=${encodeURIComponent(campaignId)}`, 'GET', undefined, false)).fundraisers;
}

export async function fetchFundraiser(id: string): Promise<Fundraiser | null> {
  if (!authLive) return Object.values(await demoStore()).flatMap((a) => a.fundraisers ?? []).find((f) => f.id === id) ?? null;
  return (await callFunction<{ fundraisers: Fundraiser[] }>(`fundraisers?id=${encodeURIComponent(id)}`, 'GET', undefined, false)).fundraisers[0] ?? null;
}

// Anyone can report an update, a word of support or a fundraiser; a person
// on the BURDEN team decides (demo: kept on the phone — the team console is
// on the website).
export async function reportContent(fields: { kind: string; ref: string; campaignId: string; reason: string; detail?: string }) {
  if (authLive) {
    await callFunction('report', 'POST', fields, false);
    return;
  }
  const raw = (await AsyncStorage.getItem('burden-demo-reports-v1').catch(() => null)) || '[]';
  await AsyncStorage.setItem('burden-demo-reports-v1', JSON.stringify([...JSON.parse(raw), { ...fields, at: new Date().toISOString() }])).catch(() => {});
}
