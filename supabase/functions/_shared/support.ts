// Words of support on the server: check a giver's message once their gift is
// paid, and hand the public only what passed. The rules live in
// moderation-logic.ts: clean messages publish, anything flagged waits for a
// BURDEN reviewer (moderation-queue), and scams are never published.

import { ruleCheck } from './moderation-logic.ts';
import { db } from './server.ts';

export async function reviewSupportMessage(giftId: string) {
  const { data: row } = await db.from('support_messages').select('id, message')
    .eq('gift_id', giftId).eq('status', 'awaiting_payment').maybeSingle();
  if (!row) return;
  const result = ruleCheck(row.message);
  const status = result.decision === 'approve' ? 'approved' : result.decision === 'hold' ? 'held' : 'rejected';
  await db.from('support_messages').update({
    status, reasons: result.reasons, checked_by: 'rules', checked_at: new Date().toISOString(),
  }).eq('id', row.id);
}
