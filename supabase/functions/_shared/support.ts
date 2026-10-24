// Words of support on the server: check a giver's message once their gift is
// paid, and hand the public only what passed. Rules and the AI check live in
// moderation-logic.ts / moderation.ts.

import { moderate } from './moderation.ts';
import { db } from './server.ts';

export async function reviewSupportMessage(giftId: string) {
  const { data: row } = await db.from('support_messages').select('id, message')
    .eq('gift_id', giftId).eq('status', 'awaiting_payment').maybeSingle();
  if (!row) return;
  try {
    const result = await moderate(row.message);
    const status = result.decision === 'approve' ? 'approved' : result.decision === 'hold' ? 'held' : 'rejected';
    await db.from('support_messages').update({
      status, reasons: result.reasons, checked_by: result.source, checked_at: new Date().toISOString(),
    }).eq('id', row.id);
  } catch (e) {
    // Never block the payment step on moderation; leave it for a reviewer.
    console.error('support message review failed', e);
    await db.from('support_messages').update({ status: 'held', reasons: ['review failed'], checked_by: 'fallback' })
      .eq('id', row.id);
  }
}
