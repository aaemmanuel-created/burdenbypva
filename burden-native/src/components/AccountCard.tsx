// The giver's account at the top of the Giving tab: sign in, or who is
// signed in, their open fundraisers, sign out and delete.
// Mirrors AccountPanel in burden-app/src/screens/Profile.jsx.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Label } from './UI';
import SignIn from './SignIn';
import { colors, font, formatMoney } from '../constants/theme';
import { campaigns } from '../data/mock';
import { useGifts } from '../context/GiftsContext';
import { closeFundraiser } from '../lib/account';

export default function AccountCard({ onOpenFundraiser }: { onOpenFundraiser: (campaignId: string, id: string) => void }) {
  const { account, signOut, fundraisers, closeOwnFundraiser } = useGifts();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const open = fundraisers.filter((f) => !f.closed);

  async function run(fn: () => Promise<void>) {
    setBusy(true); setProblem('');
    try { await fn(); } catch (e) { setProblem((e as Error).message); } finally { setBusy(false); }
  }

  if (!account) {
    return (
      <View style={styles.box}>
        <Label>Your account</Label>
        <Text style={styles.h2}>Keep your gifts on every device.</Text>
        <SignIn intro="Sign in with your email to keep your gifts, their timelines and any fundraiser you start on any phone or computer. Gifts already given with this email are added for you. No password." />
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Label>Your account</Label>
        <Link disabled={busy} onPress={() => run(() => signOut())}>Sign out</Link>
      </View>
      <Text style={styles.h2}>{account.email}</Text>
      <Text style={styles.body}>Your gifts and fundraisers are kept with this email, on every device you sign in on.</Text>

      <Label style={{ marginTop: 20 }}>Your fundraisers</Label>
      {open.length === 0 ? (
        <Text style={[styles.body, { marginTop: 8 }]}>None open. You can start one from any burden's Share button.</Text>
      ) : open.map((f) => (
        <View key={f.id} style={styles.fr}>
          <Text style={styles.frTitle}>{campaigns.find((c) => c.id === f.campaignId)?.title ?? f.campaignId}</Text>
          <Text style={styles.meta}>{formatMoney(f.raised)} of {formatMoney(f.goal)} with your circle</Text>
          <View style={[styles.row, { justifyContent: 'flex-start', gap: 20, marginTop: 8 }]}>
            <Link onPress={() => onOpenFundraiser(f.campaignId!, f.id)}>See it</Link>
            <Link disabled={busy} onPress={() => run(async () => { await closeFundraiser(f.id); closeOwnFundraiser(f.id); })}>Close</Link>
          </View>
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        {!confirmDelete ? (
          <Link muted onPress={() => setConfirmDelete(true)}>Delete my account</Link>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={styles.body}>
              Your account and sign-in are deleted, and any open fundraiser closes. Your gifts stay on BURDEN's
              records — the law needs them for receipts, refunds and Gift Aid — but are no longer linked to you.
            </Text>
            <View style={[styles.row, { justifyContent: 'flex-start', gap: 20 }]}>
              <Link danger disabled={busy} onPress={() => run(() => signOut({ remove: true }))}>Yes, delete it</Link>
              <Link onPress={() => setConfirmDelete(false)}>Keep my account</Link>
            </View>
          </View>
        )}
      </View>
      {!!problem && <Text accessibilityRole="alert" style={[styles.body, { color: colors.fundLow, marginTop: 12 }]}>{problem}</Text>}
    </View>
  );
}

function Link({ children, onPress, disabled, muted, danger }: { children: string; onPress: () => void; disabled?: boolean; muted?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={10} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}>
      <Text style={[styles.link, muted && { color: colors.inkMuted }, danger && { color: colors.fundLow }]}>{children.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.rule, padding: 20, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontFamily: font.regular, fontSize: 19, color: colors.ink, marginTop: 10, marginBottom: 12 },
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: colors.inkSoft },
  meta: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  fr: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.ruleSoft },
  frTitle: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  link: { fontFamily: font.regular, fontSize: 12, letterSpacing: 1, color: colors.ink, textDecorationLine: 'underline' },
});
