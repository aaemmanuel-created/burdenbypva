import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches } from '../data/mock';
import { Button, Label, Rule } from '../components/UI';
import { colors, font, formatMoney } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import type { RootStackParamList } from '../navigation/types';
import { PAYMENT_METHODS, type ProviderId, liveCheckout, startCheckout } from '../lib/payments';
import { demoEvents, demoHoldUntil } from '../lib/giftTimeline';

const PRESETS = [5, 25, 100, 500];

type Props = NativeStackScreenProps<RootStackParamList, 'Give'>;

export default function GiveScreen({ route, navigation }: Props) {
  const campaign = campaigns.find((c) => c.id === route.params.campaignId);
  const church = campaign && churches.find((ch) => ch.id === campaign.churchId);
  const { recordGift } = useGifts();

  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');
  const [recurring, setRecurring] = useState<boolean>(false);
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [coverFee, setCoverFee] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [provider, setProvider] = useState<ProviderId>('stripe');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!campaign || !church) {
    return (
      <View style={{ padding: 24, backgroundColor: colors.bg, flex: 1 }}>
        <Text style={{ fontFamily: font.regular, color: colors.ink }}>Campaign not found.</Text>
      </View>
    );
  }

  const value = custom !== '' ? Number(custom) || 0 : amount;
  const fee = coverFee ? Math.round((value * 0.045 + 0.3) * 100) / 100 : 0;
  const total = Math.round((value + fee) * 100) / 100;
  // Email is needed even for anonymous gifts (receipt).
  const canSubmit = !busy && value >= 1 && email.length > 0 && (anonymous || name.length > 0);

  async function submit() {
    if (!canSubmit || !campaign || !church) return;
    setError('');
    const timestamp = new Date().toISOString();
    const details = {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      churchName: church.name,
      amount: value,
      coveredFee: fee,
      total,
      recurring,
      anonymous,
      timestamp,
    };

    // Live checkout: the provider's page opens in the browser and the
    // payment server sends the donor back to burden://gift?gift=…
    if (liveCheckout) {
      setBusy(true);
      try {
        const res = await startCheckout({
          ...details, churchId: church.id, provider, coverFee, name, email,
        });
        recordGift({
          ...details, id: res.giftId, token: res.token, live: true, testMode: res.testMode, provider,
          status: 'initiated', events: [{ step: 'gift_sent', occurred_at: timestamp }],
        });
        navigation.replace('Gift', { giftId: res.giftId });
        await Linking.openURL(res.checkoutUrl);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }

    // Demo checkout when no payment server is set up.
    const id = 'gift_' + Date.now();
    recordGift({
      ...details, id, live: false, provider, status: 'held', holdUntil: demoHoldUntil(timestamp),
      events: demoEvents(timestamp, 'Demo checkout — no payment processed.'),
    });
    navigation.replace('Gift', { giftId: id });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
      <Label>Give</Label>
      <Text style={styles.h1}>Support {church.name}</Text>
      <Text style={styles.sub}>{church.location.toUpperCase()}</Text>
      <Text style={[styles.sub, { marginTop: 4 }]}>{campaign.title.toUpperCase()}</Text>

      <Rule soft style={{ marginVertical: 24 }} />

      <Label style={{ marginBottom: 12 }}>Amount (USD)</Label>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => {
          const active = custom === '' && amount === p;
          return (
            <Pressable
              key={p}
              onPress={() => { setAmount(p); setCustom(''); }}
              style={[styles.preset, active && styles.presetActive]}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>${p}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        keyboardType="numeric"
        placeholder="Custom amount (min $1)"
        placeholderTextColor={colors.inkMuted}
        value={custom}
        onChangeText={setCustom}
        style={styles.input}
      />

      <View style={{ marginTop: 24 }}>
        <Toggle
          checked={recurring}
          onChange={setRecurring}
          label="Make this a monthly gift"
          help={liveCheckout
            ? 'Only this first gift is charged for now — automatic monthly repeats are not switched on yet.'
            : 'Cancel any time from your giving history.'}
        />
        <Toggle
          checked={anonymous}
          onChange={setAnonymous}
          label="Give anonymously"
          help="Your name will not be visible to the church or other donors. We still hold a tax-receipt record."
        />
        <Toggle
          checked={coverFee}
          onChange={setCoverFee}
          label={`Cover platform & processing fee (${formatMoney(fee)})`}
          help="When covered, 100% of your gift reaches the church."
        />
      </View>

      <View style={{ marginTop: 24 }}>
        <Label style={{ marginBottom: 4 }}>Pay with</Label>
        {PAYMENT_METHODS.map((m) => {
          const selected = provider === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setProvider(m.id)}
              style={styles.toggleRow}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.radio, selected && { borderColor: colors.ink }]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>{m.label}</Text>
                <Text style={styles.toggleHelp}>{m.detail}</Text>
              </View>
            </Pressable>
          );
        })}
        <Text style={[styles.toggleHelp, { marginTop: 10 }]}>
          You'll finish paying on the provider's secure page. BURDEN never sees your card or mobile-money PIN.
        </Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <Label style={{ marginBottom: 12 }}>Your details</Label>
        {!anonymous && (
          <TextInput
            placeholder="Full name"
            placeholderTextColor={colors.inkMuted}
            value={name}
            onChangeText={setName}
            style={[styles.input, { marginBottom: 8 }]}
          />
        )}
        <TextInput
          placeholder="Email for receipt"
          placeholderTextColor={colors.inkMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
      </View>

      <Rule soft style={{ marginVertical: 24 }} />

      <View style={styles.totalRow}>
        <View>
          <Label>Total today</Label>
          <Text style={styles.totalSub}>{recurring ? 'and monthly thereafter' : 'one-time gift'}</Text>
        </View>
        <Text style={styles.totalAmount}>{formatMoney(total)}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button onPress={submit} disabled={!canSubmit}>
        {busy ? 'Opening secure checkout…' : `Give ${formatMoney(total)}`}
      </Button>

      <Text style={styles.disclaimer}>
        By giving you confirm you have read BURDEN's eligibility & refund policy.{' '}
        {liveCheckout
          ? "Payments run in test mode — use the provider's test card or test mobile-money number. No real money is taken."
          : 'This is a demo checkout — no payment is processed.'}
      </Text>
    </ScrollView>
  );
}

function Toggle({
  checked, onChange, label, help,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; help: string }) {
  return (
    <Pressable onPress={() => onChange(!checked)} style={styles.toggleRow}>
      <View style={[styles.toggleBox, checked && { backgroundColor: colors.ink }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHelp}>{help}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: font.bold, fontSize: 22, color: colors.ink, marginTop: 12, lineHeight: 28 },
  sub: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted, marginTop: 8 },
  presetRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  preset: {
    flex: 1, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.rule, backgroundColor: 'transparent',
  },
  presetActive: { backgroundColor: colors.ink },
  presetText: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  presetTextActive: { color: colors.accentInk },
  input: {
    borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: font.regular, fontSize: 13, color: colors.ink,
  },
  toggleRow: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.ruleSoft, alignItems: 'flex-start',
  },
  toggleBox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.rule, marginTop: 2 },
  toggleLabel: { fontFamily: font.regular, fontSize: 13, color: colors.ink },
  toggleHelp: { fontFamily: font.regular, fontSize: 11, color: colors.inkMuted, marginTop: 4, lineHeight: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  totalSub: { fontFamily: font.regular, fontSize: 11, color: colors.inkMuted, marginTop: 6 },
  totalAmount: { fontFamily: font.bold, fontSize: 26, color: colors.ink },
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.rule, marginTop: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  error: { fontFamily: font.regular, fontSize: 12, color: colors.fundLow, marginBottom: 16 },
  disclaimer: { fontFamily: font.regular, fontSize: 10, lineHeight: 16, color: colors.inkMuted, marginTop: 18 },
});
