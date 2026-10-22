// USSD giving for phones without data — as expressPay's USSD channel and
// MoMo's USSD checkout (REA, 2026-10-22). Pure menu rules, unit-tested in Node;
// the endpoint is functions/ussd.
//
// Gateways in the Africa's Talking style send the whole path typed so far,
// joined with "*" ("1*2*50*1"), and expect a reply starting "CON " (keep the
// session open) or "END " (close it). The last step starts an
// approve-on-your-phone MoMo prompt, so the donor confirms with their PIN.
//
// Plain words, no urgency, and the fee is said out loud before confirming.

import type { BurdenRef } from './burdens.ts';
import type { MomoNetwork } from './momo.ts';

export type UssdReply =
  | { kind: 'con' | 'end'; text: string }
  | { kind: 'charge'; text: string; burden: BurdenRef; ghs: number };

const MAX_GHS = 5000; // USSD gifts are small; larger gifts use the app or website

export function minGhs(usdRate: number): number {
  return Math.ceil(usdRate); // $1 minimum
}

export function ussdStep(path: string, burdens: BurdenRef[], usdRate: number): UssdReply {
  const parts = path === '' ? [] : path.split('*');
  const [first, pick, amount, confirm] = parts;

  if (parts.length === 0) {
    return { kind: 'con', text: 'BURDEN - carry a burden with a church\n1. Give to a burden\n2. About BURDEN' };
  }
  if (first === '2') {
    return {
      kind: 'end',
      text: 'BURDEN by HOUSEPVA: gifts to verified churches. Every gift shows where the money goes. ' +
        'See aaemmanuel-created.github.io/burdenbypva',
    };
  }
  if (first !== '1') return { kind: 'end', text: 'Please dial again and choose 1 or 2.' };

  if (pick === undefined) {
    const list = burdens.map((b, i) => `${i + 1}. ${b.short} (${b.city})`).join('\n');
    return { kind: 'con', text: `Choose a burden:\n${list}` };
  }
  const burden = burdens[Number(pick) - 1];
  if (!burden || !/^\d+$/.test(pick)) return { kind: 'end', text: 'That burden was not found. Please dial again.' };

  const min = minGhs(usdRate);
  if (amount === undefined) {
    return { kind: 'con', text: `${burden.short}, ${burden.churchName}\nEnter amount in GHS (min ${min}):` };
  }
  const ghs = Number(amount);
  if (!/^\d+$/.test(amount) || ghs < min || ghs > MAX_GHS) {
    return { kind: 'end', text: `Please dial again and enter a whole amount from GHS ${min} to ${MAX_GHS}.` };
  }

  if (confirm === undefined) {
    return {
      kind: 'con',
      text: `Give GHS ${ghs} to ${burden.short}, ${burden.churchName}?\n` +
        'A small fee is added so the church receives the full amount.\n1. Confirm\n2. Cancel',
    };
  }
  if (confirm !== '1') return { kind: 'end', text: 'Cancelled. Nothing was charged.' };
  return {
    kind: 'charge',
    burden,
    ghs,
    text: 'Thank you. Approve the mobile money prompt on your phone with your PIN. ' +
      'Never share your PIN with anyone.',
  };
}

// MCC-MNC network codes for Ghana → BURDEN's MoMo networks.
export function networkFromCode(code: string | null | undefined): MomoNetwork | null {
  switch ((code ?? '').replace(/\D/g, '')) {
    case '62001': return 'mtn';
    case '62002': return 'telecel';
    case '62003': case '62006': return 'airteltigo';
    default: return null;
  }
}
