// One gift and where it has got to — native twin of
// burden-app/src/screens/GiftDetail.jsx. Also the landing screen for the
// burden://gift?gift=<id>&t=<token> link the payment server opens after checkout.
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Label } from '../components/UI';
import Timeline from '../components/Timeline';
import { colors, font, formatMoney } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import { PAYMENT_METHODS, cancelMonthlyGift, fetchGiftStatus, liveCheckout } from '../lib/payments';
import { settleDemoGift } from '../lib/giftTimeline';
import { campaigns, churches, type Gift, type GiftStatus } from '../data/mock';
import { ShareSheet } from '../components/Community';
import { findFundraiser } from '../lib/community';
import type { RootStackParamList } from '../navigation/types';

const POLL_MS = 4000;
const POLL_FOR_MS = 3 * 60_000;

type Props = NativeStackScreenProps<RootStackParamList, 'Gift'>;

export default function GiftScreen({ route, navigation }: Props) {
  const { gifts, recordGift, updateGift, fundraisers } = useGifts();
  const id = route.params.giftId ?? route.params.gift ?? '';
  const returnToken = route.params.t;
  const stored = gifts.find((g) => g.id === id);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  // Arrived from checkout for a gift this session hasn't seen: keep a stub
  // so the server can fill in the rest.
  useEffect(() => {
    if (!stored && id && returnToken) {
      recordGift({
        id, token: returnToken, live: true, status: 'initiated', events: [],
        campaignId: '', campaignTitle: '', churchName: '', amount: 0, coveredFee: 0, total: 0,
        recurring: false, anonymous: false, timestamp: new Date().toISOString(),
      });
    }
  }, [id, returnToken, stored, recordGift]);

  const token = stored?.token ?? returnToken;
  const live = Boolean(stored?.live && liveCheckout && token);

  useEffect(() => {
    if (!live || !token) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    async function refresh() {
      try {
        const { gift: server, events, plan } = await fetchGiftStatus(id, token!);
        if (stopped) return;
        setError('');
        updateGift(id, { ...server, status: server.status as GiftStatus, events, ...(plan ? { plan } : {}) });
        if (server.status === 'initiated' && Date.now() - started < POLL_FOR_MS) {
          timer = setTimeout(refresh, POLL_MS);
        }
      } catch (e) {
        if (!stopped) setError((e as Error).message);
      }
    }
    refresh();
    return () => { stopped = true; clearTimeout(timer); };
  }, [id, live, token, updateGift]);

  if (!stored) {
    return (
      <View style={{ padding: 24, backgroundColor: colors.bg, flex: 1 }}>
        <Text style={styles.sub}>Loading your gift…</Text>
      </View>
    );
  }

  const gift = settleDemoGift(stored);
  const method = PAYMENT_METHODS.find((m) => m.id === gift.provider);
  const declined = gift.status === 'failed' || gift.status === 'cancelled';
  const campaign = campaigns.find((c) => c.id === gift.campaignId);
  const church = campaign && churches.find((ch) => ch.id === campaign.churchId);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
      <Label>Your gift</Label>
      <Text style={styles.h1}>
        {gift.amount ? `${formatMoney(gift.amount)} to ${gift.churchName}` : 'Your gift'}
      </Text>
      {gift.campaignTitle ? (
        <Text style={styles.sub}>
          {gift.campaignTitle.toUpperCase()}
          {gift.coveredFee > 0 ? ` · ${formatMoney(gift.coveredFee)} FEE COVERED` : ''}
          {gift.recurring ? ' · MONTHLY' : ''}
          {gift.anonymous ? ' · ANONYMOUS' : ''}
        </Text>
      ) : null}
      <Text style={[styles.sub, { marginTop: 4 }]}>
        {gift.fromCredit ? 'Paid from account credit'
          : gift.momo ? `${gift.momo} — approved on your phone`
          : gift.live && method ? method.detail.split('.')[0] : 'Demo checkout'}
        {gift.testMode || !gift.live ? ' · Test only — no real money moved' : ''}
      </Text>

      <Label style={{ marginTop: 32, marginBottom: 20 }}>Progress</Label>
      <Timeline gift={gift} />
      {gift.status === 'initiated' && live ? (
        <Text style={[styles.sub, { marginTop: 20 }]}>Checking with the payment provider…</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {gift.recurring && !declined && <MonthlyGift gift={gift} live={live} />}

      <View style={{ gap: 8, marginTop: 32 }}>
        {declined ? (
          <Button onPress={() => navigation.replace('Give', { campaignId: gift.campaignId })}>Try again</Button>
        ) : gift.campaignId ? (
          <Button onPress={() => navigation.navigate('Campaign', { campaignId: gift.campaignId })}>
            View the burden
          </Button>
        ) : null}
        {!declined && campaign && (
          <Button variant="ghost" onPress={() => setSharing(true)}>Share this burden</Button>
        )}
        <Button variant="ghost" onPress={() => navigation.navigate('Tabs', { screen: 'Giving' })}>
          Giving history
        </Button>
      </View>
      {campaign && church && (
        <ShareSheet
          open={sharing}
          onClose={() => setSharing(false)}
          campaign={campaign}
          church={church}
          fundraiser={findFundraiser(gift.fundraiserId, fundraisers)}
          onFundraise={() => navigation.navigate('Fundraise', { campaignId: campaign.id })}
        />
      )}
    </ScrollView>
  );
}

// A monthly gift: whether it is running, how each month is paid, and a way to stop it.
function MonthlyGift({ gift, live }: { gift: Gift; live: boolean }) {
  const { updateGift } = useGifts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const plan = gift.plan ?? { status: gift.live ? 'pending' : 'active', method: gift.momo ? 'momo' : 'card' };
  const running = plan.status === 'active' || plan.status === 'pending';
  const next = plan.nextChargeAt
    ? new Date(plan.nextChargeAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null;
  const how = plan.method === 'momo'
    ? 'Each month we send a prompt to your phone and you approve it with your PIN.'
    : plan.method === 'subscription' ? 'Your card is charged each month by Stripe.'
    : 'Your card is charged again each month.';
  async function stop() {
    setBusy(true); setError('');
    try {
      if (live && gift.planId && gift.planToken) await cancelMonthlyGift(gift.planId, gift.planToken);
      updateGift(gift.id, { plan: { ...plan, status: 'cancelled', note: 'You stopped this monthly gift.' } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ marginTop: 32 }}>
      <Label style={{ marginBottom: 12 }}>Monthly gift</Label>
      <Text style={styles.body}>
        {running
          ? `${how} ${plan.status === 'pending' ? 'It starts once this first gift is confirmed.' : next ? `Next: ${next}.` : ''}`
          : plan.note || 'This monthly gift has stopped.'}
        {!gift.live ? ' Demo — no money moves.' : ''}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {running && (live ? Boolean(gift.planToken) : true) && (
        <Button variant="ghost" style={{ marginTop: 14 }} onPress={stop} disabled={busy}>
          {busy ? 'Stopping…' : 'Stop monthly gift'}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 21, color: colors.inkSoft },
  h1: { fontFamily: font.bold, fontSize: 22, color: colors.ink, marginTop: 12, lineHeight: 28 },
  sub: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted, marginTop: 8, lineHeight: 15 },
  error: { fontFamily: font.regular, fontSize: 12, color: colors.fundLow, marginTop: 20 },
});
