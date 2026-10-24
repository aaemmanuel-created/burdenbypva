// Who is asking: the signed-in Supabase user (givers, church staff and the
// BURDEN team all sign in with a one-time code by email), whether they are
// on the BURDEN team, and the audit log every human decision is written to.

import { auditEntry } from './admin-logic.ts';
import { timingSafeEqual } from './crypto.ts';
import { db } from './server.ts';

export type SignedIn = { id: string; email: string };

export async function signedInUser(req: Request): Promise<SignedIn | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  return { id: data.user.id, email: String(data.user.email).toLowerCase() };
}

// The CHURCH_ADMIN_KEY header — for scripts and for adding the first owner.
export const hasAdminKey = (req: Request) => {
  const key = Deno.env.get('CHURCH_ADMIN_KEY');
  return !!key && timingSafeEqual(req.headers.get('x-burden-admin-key') ?? '', key);
};

export type Admin = { email: string; name: string; role: 'reviewer' | 'owner' };

export async function adminOf(email: string): Promise<Admin | null> {
  const { data } = await db.from('burden_admins').select('email, name, role').eq('email', email).is('removed_at', null).maybeSingle();
  return (data as Admin | null) ?? null;
}

export async function audit(actor: string, action: string, subjectType: string, subjectId: string, detail: Record<string, unknown> = {}) {
  const { error } = await db.from('audit_log').insert(auditEntry(actor, action, subjectType, subjectId, detail));
  if (error) console.error('audit log write failed', action, subjectId, error);
}
