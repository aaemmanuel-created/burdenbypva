// Sign-in on the phone, with a one-time code sent by email (Supabase Auth's
// own endpoints — no extra package). The session is kept on the phone and
// refreshed when it expires. Mirrors burden-app/src/lib/auth.js.
//
// Demo (no server): any email works and the code is 123456.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const authLive = Boolean(SUPABASE_URL && ANON_KEY);
export const DEMO_CODE = '123456';
const SESSION_KEY = 'burden-session-v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Session = { email: string; accessToken?: string; refreshToken?: string; expiresAt?: number; demo?: boolean };

async function authFetch(path: string, body: unknown, token?: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${token ?? ANON_KEY}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.msg || json.error_description || 'auth failed');
  return json;
}

function toSession(j: { access_token: string; refresh_token: string; expires_in: number; user: { email: string } }): Session {
  return {
    email: j.user.email.toLowerCase(), accessToken: j.access_token, refreshToken: j.refresh_token,
    expiresAt: Date.now() + (j.expires_in - 60) * 1000,
  };
}

const save = (s: Session | null) =>
  (s ? AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s)) : AsyncStorage.removeItem(SESSION_KEY)).catch(() => {});

export async function sendCode(email: string) {
  if (!EMAIL_RE.test(email)) throw new Error('Enter your email address.');
  if (!authLive) return;
  try {
    await authFetch('otp', { email, create_user: true });
  } catch {
    throw new Error('We could not send a code to that email. Please check it and try again.');
  }
}

export async function verifyCode(email: string, code: string): Promise<Session> {
  if (!authLive) {
    if (code !== DEMO_CODE) throw new Error(`That code did not work. In the demo the code is ${DEMO_CODE}.`);
    const s = { email: email.toLowerCase(), demo: true };
    await save(s);
    return s;
  }
  try {
    const s = toSession(await authFetch('verify', { type: 'email', email, token: code }));
    await save(s);
    return s;
  } catch {
    throw new Error('That code did not work. Codes last a few minutes — ask for a new one if needed.');
  }
}

export async function currentSession(): Promise<Session | null> {
  let s: Session | null = null;
  try { s = JSON.parse((await AsyncStorage.getItem(SESSION_KEY)) || 'null'); } catch { return null; }
  if (!s || s.demo || !authLive) return s;
  if (s.expiresAt && Date.now() < s.expiresAt) return s;
  try {
    const fresh = toSession(await authFetch('token?grant_type=refresh_token', { refresh_token: s.refreshToken }));
    await save(fresh);
    return fresh;
  } catch {
    await save(null); // signed out elsewhere, or the refresh token expired
    return null;
  }
}

export async function signOut() {
  const s = await currentSession();
  if (authLive && s?.accessToken) await authFetch('logout', {}, s.accessToken).catch(() => {});
  await save(null);
}

// Call one of BURDEN's functions — as the signed-in person when `signedIn`.
export async function callFunction<T = any>(path: string, method = 'GET', body?: unknown, signedIn = true): Promise<T> {
  const s = signedIn ? await currentSession() : null;
  if (signedIn && !s?.accessToken) throw new Error('Please sign in.');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${s?.accessToken ?? ANON_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
  return json as T;
}
