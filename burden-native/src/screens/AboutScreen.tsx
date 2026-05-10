import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Label, Rule } from '../components/UI';
import { colors, font } from '../constants/theme';
import { principles } from '../data/mock';

const TIERS = [
  { tier: 'Basic', desc: 'Identity-verified leadership, registered legal entity, capped at $5,000 monthly.' },
  { tier: 'Verified', desc: 'Bank-verified payout, two-person leadership reference, board attestation, no cap.' },
  { tier: 'Premium Trust', desc: 'Audited financials, public transparency report, eligible for featuring.' },
];

export default function AboutScreen() {
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 64 }}>
      <Label>About</Label>
      <Text style={styles.h1}>A trustworthy way to give to the global church.</Text>

      <Text style={styles.body}>
        BURDEN by PVA is a global Christian fundraising platform. It exists so that local churches
        and Christian institutions can raise funds transparently from regular people, anywhere in
        the world. Donors can give as little as one dollar. Every church is verified before it can
        receive funds.
      </Text>
      <Text style={styles.body}>
        BURDEN is ecumenical — Catholic, Orthodox, and Protestant traditions are eligible if they
        affirm the historic creeds and operate under accountable Christian leadership. The platform
        does not rank or favour any tradition. It does not host political endorsements, and it does
        not tie giving to material reward.
      </Text>

      <Rule style={{ marginVertical: 32 }} />

      <Label>Operating principles</Label>
      <View style={{ marginTop: 14 }}>
        {principles.map((p, i) => (
          <View key={i} style={styles.principleRow}>
            <Text style={styles.principleNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.principleText}>{p}</Text>
          </View>
        ))}
      </View>

      <Rule style={{ marginVertical: 32 }} />

      <Label>Verification tiers</Label>
      <View style={{ marginTop: 14 }}>
        {TIERS.map((t) => (
          <View key={t.tier} style={styles.tierRow}>
            <Text style={styles.tierLabel}>{t.tier.toUpperCase()}</Text>
            <Text style={styles.tierDesc}>{t.desc}</Text>
          </View>
        ))}
      </View>

      <Rule style={{ marginVertical: 32 }} />

      <Label>Where BURDEN is launching</Label>
      <Text style={styles.body}>
        Pilot market: <Text style={{ fontFamily: font.bold, color: colors.ink }}>United Kingdom</Text>,
        with diaspora giving corridors to Nigeria, Ghana, Kenya, and the Philippines in the first
        year. Expansion to United States and Canada targeted at month 12.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: font.regular, fontSize: 26, color: colors.ink, marginTop: 12, marginBottom: 24, lineHeight: 32 },
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 22, color: colors.inkSoft, marginBottom: 16 },
  principleRow: {
    flexDirection: 'row', gap: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.ruleSoft,
  },
  principleNum: { fontFamily: font.regular, fontSize: 11, color: colors.inkMuted, letterSpacing: 1, width: 28 },
  principleText: { flex: 1, fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: colors.ink },
  tierRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.ruleSoft },
  tierLabel: { fontFamily: font.bold, fontSize: 11, letterSpacing: 2, color: colors.ink, marginBottom: 6 },
  tierDesc: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: colors.inkSoft },
});
