import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches } from '../data/mock';
import { Badge, Button, Label, Progress, Rule } from '../components/UI';
import { colors, font, formatMoney } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';

const ITEMS = [
  { label: 'Direct programme costs', share: 0.84 },
  { label: 'Local logistics & banking fees', share: 0.07 },
  { label: 'Payment processing', share: 0.045 },
  { label: 'BURDEN platform fee', share: 0.045 },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Campaign'>;

export default function CampaignScreen({ route, navigation }: Props) {
  const campaign = campaigns.find((c) => c.id === route.params.campaignId);
  if (!campaign) {
    return (
      <View style={{ padding: 24, backgroundColor: colors.bg, flex: 1 }}>
        <Text style={{ fontFamily: font.regular, color: colors.ink }}>Campaign not found.</Text>
      </View>
    );
  }
  const church = churches.find((ch) => ch.id === campaign.churchId)!;
  const pct = Math.round((campaign.raised / campaign.goal) * 100);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 96 }}>
      <View style={{ padding: 20 }}>
        <Label>{campaign.category}</Label>
        <Text style={styles.title}>{campaign.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaChurch}>{church.name}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaLocation}>{church.location}</Text>
        </View>

        {church.verified && <Badge tone="trust">{church.tier}</Badge>}
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <View style={styles.giveCard}>
          <Progress value={campaign.raised} goal={campaign.goal} />
          <View style={styles.giveStats}>
            <View>
              <Text style={styles.giveAmount}>{formatMoney(campaign.raised)}</Text>
              <Text style={styles.giveSub}>of {formatMoney(campaign.goal)} ({pct}%)</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.giveCount}>{campaign.donors}</Text>
              <Text style={styles.giveSub}>donors</Text>
            </View>
          </View>
          <Button onPress={() => navigation.navigate('Give', { campaignId: campaign.id })}>
            Give to this campaign
          </Button>
          <Text style={styles.giveNote}>
            Minimum gift: $1 USD or local equivalent. Receipt issued automatically.
            Anonymous and recurring options available at checkout.
          </Text>
        </View>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>About this campaign</Label>
        <Text style={styles.body}>
          {campaign.summary} Funds raised here go directly to {church.name} via a verified local
          payout account. {church.name} files a public update at the close of every month showing
          what was spent and what remains.
        </Text>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>Where every dollar goes</Label>
        <View style={{ marginTop: 14 }}>
          {ITEMS.map((it) => (
            <View key={it.label} style={styles.itemRow}>
              <Text style={styles.itemLabel}>{it.label}</Text>
              <Text style={styles.itemShare}>{(it.share * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </View>
        <Text style={styles.smallNote}>
          Donors may also cover BURDEN's platform fee at checkout, in which case 100% of the gift
          reaches the church net of payment processing.
        </Text>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>About {church.name}</Label>
        <Text style={styles.body}>
          {church.summary} Founded {church.founded}. {church.tradition}. Led by {church.leadership}.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: font.regular,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
    marginTop: 12,
    marginBottom: 14,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  metaChurch: { fontFamily: font.bold, fontSize: 12, color: colors.ink },
  metaDot: { color: colors.inkMuted },
  metaLocation: { fontFamily: font.regular, fontSize: 12, color: colors.inkSoft },
  giveCard: { borderWidth: 1, borderColor: colors.rule, padding: 20, backgroundColor: colors.bgAlt },
  giveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 16,
  },
  giveAmount: { fontFamily: font.bold, fontSize: 22, color: colors.ink },
  giveSub: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted, marginTop: 2 },
  giveCount: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  giveNote: { fontFamily: font.regular, fontSize: 10, lineHeight: 16, color: colors.inkMuted, marginTop: 16 },
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 22, color: colors.inkSoft, marginTop: 12 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft,
  },
  itemLabel: { fontFamily: font.regular, fontSize: 13, color: colors.ink },
  itemShare: { fontFamily: font.regular, fontSize: 12, color: colors.inkSoft, letterSpacing: 1 },
  smallNote: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: colors.inkMuted, marginTop: 14 },
});
