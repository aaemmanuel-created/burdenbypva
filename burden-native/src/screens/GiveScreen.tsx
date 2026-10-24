import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches } from '../data/mock';
import { Button, Label, Rule } from '../components/UI';
import { colors, font, formatMoney } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import type { RootStackParamList } from '../navigation/types';
import {
  MOMO_NETWORKS, type MomoNetworkId, PAYMENT_METHODS, type ProviderId, fetchGiftStatus, liveCheckout,
  normaliseGhanaPhone, startCheckout, startMomoCharge, submitMomoOtp,
} from '../lib/payments';
import type { Gift } from '../data/mock';
import { demoEvents, demoHoldUntil } from '../lib/giftTimeline';
import { MESSAGE_MAX, findFundraiser } from '../lib/community';
import { haptic } from '../lib/useHaptic';

const PRESETS = [5, 25, 100, 500];

type Props = NativeStackScreenProps<RootStackParamList, 'Give'>;

export default function GiveScreen({ route, navigation }: Props) {
  const campaign = campaigns.find((c) => c.id === route.params.campaignId);
  const church = campaign && churches.find((ch) => ch.id === campaign.churchId);
  const { recordGift, creditBalance: credit, fundraisers } = useGifts();
  const fundraiser = findFundraiser(route.params.fundraiserId, fundraisers);
  const [message, setMessage] = useState('');
  // Paystack: approve on your phone (mobile money) or Paystack's own page.
  const [momoDirect, setMomoDirect] = useState(true);
  const [network, setNetwork] = useState<MomoNetworkId>('mtn');
  const [phone, setPhone] = useState('');
  const [waiting, setWaiting] = useState<{ gift: Gift; state: string; message?: string; demo?: boolean } | null>(null);
  const [otp, setOtp] = useState('');

  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');
  const [recurring, setRecurring] = useState<boolean>(false);
  const [anonymous, setAnonymous] = useState<boolean>(false);
  // Gift Aid (UK taxpayers): the HMRC declaration needs a home address line and postcode.
  const [giftAid, setGiftAid] = useState(false);
  const [house, setHouse] = useState('');
  const [postcode, setPostcode] = useState('');
  const [coverFee, setCoverFee] = useState<boolean>(true);
  const [useCredit, setUseCredit] = useState<boolean>(false);
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
  const creditCovers = useCredit && credit >= value && value >= 1;
  const usingMomo = provider === 'paystack' && momoDirect;
  const momoPhone = normaliseGhanaPhone(phone);
  // Email is needed even for anonymous gifts (receipt).
  const canSubmit = !busy && value >= 1 && email.length > 0 && name.trim().length > 0 && !(useCredit && value > credit)
    && !(giftAid && (!house.trim() || !UK_POSTCODE.test(postcode.trim())))
    && !(usingMomo && !creditCovers && !momoPhone);

  // The HMRC declaration fields, from the full name and address given.
  function giftAidPayload() {
    if (!giftAid) return undefined;
    const parts = name.trim().split(/\s+/);
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') || parts[0], house: house.trim(), postcode: postcode.trim() };
  }

  async function submit() {
    if (!canSubmit || !campaign || !church) return;
    haptic(); // as the web's Give button: a short pulse before the gift is recorded
    setError('');
    const timestamp = new Date().toISOString();
    const details = {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      churchName: church.name,
      amount: value,
      coveredFee: creditCovers ? 0 : fee,
      total: creditCovers ? value : total,
      recurring,
      anonymous,
      timestamp,
      // shown on the burden page under Words of support, never with the amount
      message: message.trim() || undefined,
      donorName: anonymous ? undefined : name.trim(),
      giftAid: giftAid || undefined,
      fundraiserId: fundraiser?.id,
      fundraiserName: fundraiser?.name,
      payoutTo: church.payoutTo,
    };

    // Approve on your phone: the network sends a prompt; the donor enters
    // their PIN on the phone. We wait here and watch the gift's status.
    if (usingMomo && !creditCovers) {
      const networkLabel = MOMO_NETWORKS.find((n) => n.id === network)!.label;
      if (liveCheckout) {
        setBusy(true);
        try {
          const res = await startMomoCharge({
            ...details, churchId: church.id, coverFee, name, email, phone: momoPhone, network,
            giftAid: giftAidPayload(),
          });
          const gift: Gift = {
            ...details, id: res.giftId, token: res.token, live: true, testMode: res.testMode, provider: 'paystack',
            momo: networkLabel, planId: res.planId, planToken: res.planToken,
            status: res.state === 'failed' ? 'failed' : 'initiated', events: [{ step: 'gift_sent', occurred_at: timestamp }],
          };
          recordGift(gift);
          if (res.state === 'failed') setError(res.message ?? 'Your network declined this payment.');
          else if (res.state === 'paid') navigation.replace('Gift', { giftId: gift.id });
          else setWaiting({ gift, state: res.state, message: res.message });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
        return;
      }
      // Demo: the "prompt" is approved after a few seconds; no money moves.
      const gift: Gift = {
        ...details, id: 'gift_' + Date.now(), live: false, provider: 'paystack', momo: networkLabel,
        status: 'held', holdUntil: demoHoldUntil(timestamp),
        events: demoEvents(timestamp, `Approved on ${networkLabel} — demo, no money moved.`),
      };
      setWaiting({ gift, state: 'approve', demo: true });
      return;
    }

    // Live checkout: the provider's page opens in the browser and the
    // payment server sends the donor back to burden://gift?gift=…
    if (liveCheckout && !creditCovers) {
      setBusy(true);
      try {
        const res = await startCheckout({
          ...details, churchId: church.id, provider, coverFee, name, email, giftAid: giftAidPayload(),
        });
        recordGift({
          ...details, id: res.giftId, token: res.token, live: true, testMode: res.testMode, provider,
          planId: res.planId, planToken: res.planToken,
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

    // Account credit, or the demo checkout when no payment server is set up.
    const id = 'gift_' + Date.now();
    recordGift({
      ...details, id, live: false, fromCredit: creditCovers, provider: creditCovers ? 'credit' : provider,
      status: 'held', holdUntil: demoHoldUntil(timestamp),
      events: demoEvents(timestamp, creditCovers ? 'Paid from your account credit.' : 'Demo checkout — no payment processed.'),
    });
    navigation.replace('Gift', { giftId: id });
  }

  if (waiting) {
    return (
      <MomoWaiting
        waiting={waiting}
        phone={momoPhone}
        network={MOMO_NETWORKS.find((n) => n.id === network)!}
        otp={otp}
        setOtp={setOtp}
        error={error}
        onOtp={async () => {
          setError('');
          try {
            const r = await submitMomoOtp(waiting.gift.id, waiting.gift.token!, otp);
            if (r.state === 'failed') setError(r.message ?? 'That code did not work.');
            else setWaiting((w) => (w ? { ...w, state: r.state === 'paid' ? 'approve' : r.state, message: r.message } : w));
          } catch (e) { setError((e as Error).message); }
        }}
        onDone={(gift) => {
          if (waiting.demo) recordGift(gift);
          navigation.replace('Gift', { giftId: gift.id });
        }}
        onCancel={() => { setWaiting(null); setError(''); }}
      />
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
      <Label>Give</Label>
      <Text style={styles.h1}>Support {church.name}</Text>
      <Text style={styles.sub}>{church.location.toUpperCase()}</Text>
      <Text style={[styles.sub, { marginTop: 4 }]}>{campaign.title.toUpperCase()}</Text>
      {fundraiser && (
        <Text style={styles.through}>
          Through {fundraiser.own ? 'your fundraiser' : `${fundraiser.name}'s fundraiser`}. The gift still goes
          straight to {church.name}'s verified account.
        </Text>
      )}

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
        {credit > 0 && (
          <Toggle
            checked={useCredit}
            onChange={(v) => {
              setUseCredit(v);
              // covering a fee from a card while paying from credit is confusing
              if (v) setCoverFee(false);
            }}
            label={`Pay from account credit (${formatMoney(credit)} available)`}
            help={value > credit
              ? `Gift is ${formatMoney(value)} — only ${formatMoney(credit)} in credit. Reduce the amount or top up to use credit.`
              : 'Your account credit is held in BURDEN escrow. Switch off to pay by card instead.'}
          />
        )}
        <Toggle
          checked={recurring}
          onChange={setRecurring}
          label="Make this a monthly gift"
          help={monthlyHelp(provider, usingMomo)}
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

      {/* paying from credit needs no provider — the web hides this too */}
      {!creditCovers && (
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
        {provider === 'paystack' && (
          <View style={{ marginLeft: 32 }}>
            <Toggle
              checked={momoDirect}
              onChange={setMomoDirect}
              label="Approve on my phone (mobile money)"
              help="We send a prompt to your phone. You approve it with your PIN on the phone — you never type your PIN here."
            />
            {momoDirect && (
              <View style={{ paddingTop: 14 }}>
                <View style={styles.presetRow}>
                  {MOMO_NETWORKS.map((n) => {
                    const active = network === n.id;
                    return (
                      <Pressable key={n.id} onPress={() => setNetwork(n.id)} style={[styles.preset, active && styles.presetActive]}
                        accessibilityRole="radio" accessibilityState={{ selected: active }}>
                        <Text style={[styles.networkText, active && styles.presetTextActive]}>{n.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="Mobile money number, e.g. 024 123 4567"
                  placeholderTextColor={colors.inkMuted}
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                />
                {phone && !momoPhone ? (
                  <Text style={[styles.toggleHelp, { color: colors.fundLow }]}>Enter a Ghana mobile number, e.g. 024 123 4567.</Text>
                ) : null}
              </View>
            )}
          </View>
        )}
        <Text style={[styles.toggleHelp, { marginTop: 10 }]}>
          {usingMomo
            ? 'BURDEN never sees your mobile money PIN. Never share it with anyone.'
            : "You'll finish paying on the provider's secure page. BURDEN never sees your card or mobile-money PIN."}
        </Text>
      </View>
      )}

      <View style={{ marginTop: 24 }}>
        <Label style={{ marginBottom: 12 }}>Your details</Label>
        <TextInput
          placeholder="Full name"
          placeholderTextColor={colors.inkMuted}
          value={name}
          onChangeText={setName}
          style={[styles.input, { marginBottom: 8 }]}
        />
        <TextInput
          placeholder="Email for receipt"
          placeholderTextColor={colors.inkMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <Text style={[styles.toggleHelp, { marginTop: 8 }]}>
          Your name goes on your receipt and is checked against sanctions lists, as the law requires.
          {anonymous ? ' Because you give anonymously, the church and other givers will not see it.' : ''}
        </Text>
        <Toggle checked={giftAid} onChange={setGiftAid} label="Add Gift Aid (UK taxpayers only)" help={GIFT_AID_HELP} />
        {giftAid && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TextInput placeholder="House name or number" placeholderTextColor={colors.inkMuted} value={house}
              onChangeText={setHouse} style={[styles.input, { flex: 2 }]} />
            <TextInput placeholder="Postcode" placeholderTextColor={colors.inkMuted} autoCapitalize="characters"
              value={postcode} onChangeText={setPostcode} style={[styles.input, { flex: 1 }]} />
          </View>
        )}
      </View>

      {/* Words of support — optional, shown without the amount */}
      <View style={{ marginTop: 24 }}>
        <Label style={{ marginBottom: 12 }}>Words of support (optional)</Label>
        <TextInput
          multiline
          maxLength={MESSAGE_MAX}
          placeholder="A few words or a prayer for the church and the people this burden serves."
          placeholderTextColor={colors.inkMuted}
          value={message}
          onChangeText={setMessage}
          style={[styles.input, { minHeight: 84, textAlignVertical: 'top' }]}
        />
        <View style={styles.messageFoot}>
          <Text style={[styles.toggleHelp, { flex: 1 }]}>
            Shown on the burden page {anonymous ? 'as Anonymous' : 'with your name'}. Your amount is never shown.
          </Text>
          <Text style={styles.toggleHelp}>{message.length}/{MESSAGE_MAX}</Text>
        </View>
      </View>

      <Rule soft style={{ marginVertical: 24 }} />

      <View style={styles.totalRow}>
        <View>
          <Label>Total today</Label>
          <Text style={styles.totalSub}>{creditCovers ? 'paid from account credit' : recurring ? 'and monthly thereafter' : 'one-time gift'}</Text>
        </View>
        <Text style={styles.totalAmount}>{formatMoney(creditCovers ? value : total)}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button onPress={submit} disabled={!canSubmit}>
        {busy ? (usingMomo ? 'Sending the prompt…' : 'Opening secure checkout…')
          : creditCovers ? `Give ${formatMoney(value)} from credit`
          : usingMomo ? `Send prompt for ${formatMoney(total)}`
          : `Give ${formatMoney(total)}`}
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

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

// HMRC's declaration wording, said plainly (supabase duties-logic.ts GIFT_AID_WORDING).
const GIFT_AID_HELP = 'I want to Gift Aid this donation. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference. (BURDEN can claim the extra 25% once it is registered with HMRC.)';

// What "monthly" means for the chosen way of paying (see supabase plan-logic.ts).
function monthlyHelp(provider: ProviderId, usingMomo: boolean): string {
  if (provider === 'flutterwave') return 'Monthly repeats are not available with Flutterwave yet — only this first gift is charged.';
  if (usingMomo) return "Each month we send a new prompt to your phone and you approve it. Nothing is taken without you. Stop any time from the gift's page.";
  return "Your card is charged again each month. Stop any time from the gift's page.";
}

// "Check your phone" — shown while the mobile money prompt is out.
function MomoWaiting({
  waiting, phone, network, otp, setOtp, error, onOtp, onDone, onCancel,
}: {
  waiting: { gift: Gift; state: string; message?: string; demo?: boolean };
  phone: string | null; network: { id: string; label: string };
  otp: string; setOtp: (v: string) => void; error: string;
  onOtp: () => void; onDone: (gift: Gift) => void; onCancel: () => void;
}) {
  const { gift, state, message, demo } = waiting;
  useEffect(() => {
    if (state !== 'approve') return;
    if (demo) {
      const t = setTimeout(() => onDone(gift), 4000);
      return () => clearTimeout(t);
    }
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const { gift: server } = await fetchGiftStatus(gift.id, gift.token!);
        if (stop) return;
        if (server.status !== 'initiated') { onDone(gift); return; }
      } catch { /* keep waiting */ }
      if (!stop) timer = setTimeout(check, 4000);
    };
    timer = setTimeout(check, 4000);
    return () => { stop = true; clearTimeout(timer); };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const masked = phone ? `${phone.slice(0, 3)} ••• ${phone.slice(-4)}` : 'your phone';
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 48, paddingBottom: 96 }}>
      <Label>{network.label}</Label>
      <Text style={styles.h1}>{state === 'otp' ? 'Enter the code from your network' : 'Check your phone'}</Text>
      {state === 'otp' ? (
        <>
          <Text style={[styles.toggleHelp, { fontSize: 13, lineHeight: 21 }]}>{message}</Text>
          <TextInput keyboardType="number-pad" value={otp} onChangeText={setOtp} placeholder="Code"
            placeholderTextColor={colors.inkMuted} style={[styles.input, { marginTop: 20, letterSpacing: 4 }]} />
          <Button style={{ marginTop: 16 }} onPress={onOtp} disabled={otp.length < 4}>Continue</Button>
        </>
      ) : (
        <>
          <Text style={[styles.toggleHelp, { fontSize: 13, lineHeight: 21, color: colors.inkSoft }]}>
            We've sent a prompt to {masked} for {formatMoney(gift.total)}. Approve it with your mobile money PIN on your phone.
          </Text>
          <Text style={[styles.toggleHelp, { marginTop: 14, lineHeight: 18 }]}>
            No prompt after a minute? {network.id === 'mtn' ? 'Dial *170#, choose My Wallet, then My Approvals. ' : ''}
            BURDEN will never ask for your PIN.
          </Text>
          <Text style={[styles.sub, { marginTop: 32 }]} accessibilityLiveRegion="polite">
            {demo ? 'DEMO — APPROVING IN A MOMENT…' : 'WAITING FOR YOUR APPROVAL…'}
          </Text>
        </>
      )}
      {error ? <Text style={[styles.error, { marginTop: 16 }]}>{error}</Text> : null}
      <Button variant="ghost" style={{ marginTop: 32 }} onPress={demo || state === 'otp' ? onCancel : () => onDone(gift)}>
        {demo || state === 'otp' ? 'Back' : 'Follow this gift'}
      </Button>
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
  through: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: colors.ink, marginTop: 14 },
  messageFoot: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  presetRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  preset: {
    flex: 1, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.rule, backgroundColor: 'transparent',
  },
  presetActive: { backgroundColor: colors.ink },
  presetText: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  presetTextActive: { color: colors.accentInk },
  networkText: { fontFamily: font.bold, fontSize: 11, color: colors.ink, textAlign: 'center' },
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
