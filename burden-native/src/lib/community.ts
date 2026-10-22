// Updates, words of support, fundraisers and sharing for a burden — the
// three community pieces studied from GoFundMe's campaign page (REA,
// 2026-10-22) and reshaped to BURDEN's rules:
//   • Updates are dated posts from the named people on the burden's team.
//   • Words of support come only from givers and never show the amount —
//     no leaderboard, no "top donor".
//   • A fundraiser is someone carrying the burden with their own circle;
//     every gift through it still goes to the church's verified account.
// Demo content lives in data/community.json (mirrored in burden-app).
// Mirrors burden-app/src/lib/community.js.
import community from '../data/community.json';
import type { Campaign, Church, Gift } from '../data/mock';
import { isGiven } from './giftTimeline';

export const SITE_URL = 'https://aaemmanuel-created.github.io/burdenbypva/';
export const MESSAGE_MAX = 280;

export type Update = { date: string; author: string; role: string; title: string; body: string };
export type SupportWord = { name: string; date: string; message: string; own?: boolean };
export type Fundraiser = {
  id: string; campaignId?: string; name: string; note: string;
  goal: number; raised: number; started: string; own?: boolean;
};

const updates = community.updates as Record<string, Update[]>;
const support = community.support as Record<string, SupportWord[]>;
const seededFundraisers = community.fundraisers as Record<string, Fundraiser[]>;

// "14 OCT 2026" — dates read as a ledger would.
export function formatDay(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function updatesFor(campaignId: string): Update[] {
  return [...(updates[campaignId] || [])].sort((a, b) => b.date.localeCompare(a.date));
}

// Seeded words plus any the donor wrote with their own gifts, newest first.
export function supportFor(campaignId: string, gifts: Gift[] = []): SupportWord[] {
  const own = gifts
    .filter((g) => g.campaignId === campaignId && g.message && isGiven(g))
    .map((g) => ({ name: g.anonymous ? 'Anonymous' : g.donorName || 'You', date: g.timestamp, message: g.message!, own: true }));
  return [...own, ...(support[campaignId] || [])].sort((a, b) => b.date.localeCompare(a.date));
}

// Seeded fundraisers plus the donor's own; each one's total adds the gifts
// given through it on this device.
export function fundraisersFor(campaignId: string, own: Fundraiser[] = [], gifts: Gift[] = []): Fundraiser[] {
  const all = [...own.filter((f) => f.campaignId === campaignId), ...(seededFundraisers[campaignId] || [])];
  return all.map((f) => ({
    ...f,
    raised: f.raised + gifts.filter((g) => g.fundraiserId === f.id && isGiven(g)).reduce((sum, g) => sum + g.amount, 0),
  }));
}

export function findFundraiser(id: string | undefined, own: Fundraiser[] = []): Fundraiser | null {
  if (!id) return null;
  return own.find((f) => f.id === id) || Object.values(seededFundraisers).flat().find((f) => f.id === id) || null;
}

export function shareUrl(campaignId: string, fundraiserId?: string): string {
  return SITE_URL + '?burden=' + campaignId + (fundraiserId ? '&f=' + fundraiserId : '');
}

// Plain words, no urgency — the link carries the rest.
export function shareText(campaign: Campaign, church: Church, fundraiser?: Fundraiser | null): string {
  const lead = fundraiser
    ? `I'm helping carry a burden for ${church.name}: ${campaign.title}.`
    : `${church.name} is carrying a burden: ${campaign.title}.`;
  return `${lead} BURDEN shows where every dollar goes.`;
}
