// The BURDEN wallet — the donor's account credit, as the web app's Profile keeps it
// (burden-app/src/screens/Profile.jsx, "Account credit"): top up once, give to as many burdens
// as you like without re-entering a card. The balance comes off when a gift is paid from it
// (Give → "Pay from account credit"). Like the web, the top-up is a demo — nothing is charged.
// Its own tab, before About (Emmanuel, 2026-10-22).
import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge, Button, Label, Rule, Tile } from '../components/UI';
import { DOCK_SPACE } from '../components/Dock';
import { colors, font, formatMoney, tile } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import type { RootStackParamList } from '../navigation/types';

const CREDIT_PRESETS = [25, 50, 100, 250];

type Nav = CompositeNavigationProp<any, NativeStackNavigationProp<RootStackParamList>>;

export default function WalletScreen({ navigation }: { navigation: Nav }) {
  const { creditBalance: credit, addCredit, gifts } = useGifts();
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState('');
  const value = custom !== '' ? Number(custom) || 0 : amount;
  const canAdd = value >= 1;
  const fromCredit = [...gifts].filter((g) => g.fromCredit).reverse();

  const topUp = () => {
    if (!canAdd) return;
    addCredit(value);
    setCustom('');
    setAmount(50);
    Keyboard.dismiss();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: DOCK_SPACE + 64 }}
      keyboardShouldPersistTaps="handled">
      <Label>Wallet</Label>
      <Text style={styles.h1}>Your BURDEN wallet.</Text>

      <Tile padding={24} style={{ gap: 16 }}>
        <View style={styles.headRow}>
          <Label onNavy>Account credit</Label>
          <Badge tone="trust" onNavy>Held in escrow</Badge>
        </View>
        <Text style={styles.balance}>{formatMoney(credit)}</Text>
        <Text style={styles.copy}>
          Top up once, give to as many burdens as you like without re-entering a card. Balance stays
          in BURDEN escrow until you direct it to a burden — withdraw any unused balance any time.
        </Text>

        <View style={styles.presets}>
          {CREDIT_PRESETS.map((p) => {
            const active = custom === '' && amount === p;
            return (
              <Pressable key={p} onPress={() => { setAmount(p); setCustom(''); }}
                accessibilityRole="button" accessibilityState={{ selected: active }}
                style={[styles.preset, active && styles.presetOn]}>
                <Text style={[styles.presetText, active && styles.presetTextOn]}>${p}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          keyboardType="numeric"
          placeholder="Custom amount (min $1)"
          placeholderTextColor={tile.muted}
          value={custom}
          onChangeText={setCustom}
          style={styles.input}
        />
        <Button variant="onNavy" onPress={topUp} disabled={!canAdd}>{`Add ${formatMoney(value)} credit`}</Button>
        <Text style={styles.demo}>Demo top-up — no payment is processed.</Text>
      </Tile>

      <Rule style={{ marginVertical: 28 }} />

      <Label>Paid from credit</Label>
      {fromCredit.length === 0 ? (
        <Text style={styles.empty}>
          Gifts you pay from your wallet appear here. When giving, choose "Pay from account credit".
        </Text>
      ) : (
        fromCredit.map((g) => (
          <Pressable key={g.id} onPress={() => navigation.navigate('Gift', { giftId: g.id })} style={styles.row} accessibilityRole="button">
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{g.campaignTitle || 'Gift'}</Text>
              <Text style={styles.rowMeta}>
                {g.churchName.toUpperCase()} · {new Date(g.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.rowAmount}>−{formatMoney(g.amount)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: font.regular, fontSize: 28, color: colors.ink, marginTop: 12, marginBottom: 24 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontFamily: font.regular, fontSize: 28, color: tile.ink },
  copy: { fontFamily: font.regular, fontSize: 12, lineHeight: 19, color: tile.soft },
  presets: { flexDirection: 'row', gap: 6, marginTop: 4 },
  preset: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.06)' },
  presetOn: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  presetText: { fontFamily: font.bold, fontSize: 14, color: tile.ink },
  presetTextOn: { color: colors.navyDeep },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.regular, fontSize: 14, color: tile.ink },
  demo: { fontFamily: font.regular, fontSize: 12, lineHeight: 19, color: tile.muted, letterSpacing: 0.3 },
  empty: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: colors.inkSoft, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.ruleSoft, gap: 16 },
  rowTitle: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  rowMeta: { fontFamily: font.regular, fontSize: 10, color: colors.inkMuted, marginTop: 4, letterSpacing: 1 },
  rowAmount: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
});
