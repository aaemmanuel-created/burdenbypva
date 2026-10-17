import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches, type TeamMember } from '../data/mock';
import { Badge, Button, FundingSquare, Label, Progress, Rule, Tile } from '../components/UI';
import { colors, font, formatMoney, tile } from '../constants/theme';
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
        <View style={styles.badgeRow}>
          <Badge>{campaign.category}</Badge>
          {church.verified && <Badge tone="trust">{church.tier}</Badge>}
        </View>
        <Text style={styles.title}>{campaign.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaChurch}>{church.name}</Text>
          <Text style={styles.metaLocation}>{church.location}</Text>
        </View>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Tile>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Label onNavy>Funding</Label>
            <FundingSquare raised={campaign.raised} goal={campaign.goal} size={18} />
          </View>
          <Progress value={campaign.raised} goal={campaign.goal} onNavy />
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
          <Button variant="onNavy" onPress={() => navigation.navigate('Give', { campaignId: campaign.id })}>
            Carry this burden — give
          </Button>
          <Text style={styles.giveNote}>
            Minimum gift: $1 USD or local equivalent. Receipt issued automatically.
            Anonymous and recurring options available at checkout.
          </Text>
        </Tile>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>About this burden</Label>
        {/* Four lines at most — the detail lives in the sections below. */}
        <Text style={styles.body} numberOfLines={4}>
          {campaign.summary} Funds go straight to the church's verified payout account, with a
          public update every month.
        </Text>
      </View>

      {campaign.team && campaign.team.length > 0 && (
        <>
          <Rule soft />
          <View style={{ paddingTop: 20, paddingBottom: 8 }}>
            <Label style={{ paddingHorizontal: 20 }}>Profiles</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}
            >
              {campaign.team.map((m) => <ProfileTile key={m.name} member={m} />)}
            </ScrollView>
          </View>
        </>
      )}

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

// One person on the burden's team. Their face photo fills the top; until the
// church sends one, their initials stand in.
function ProfileTile({ member }: { member: TeamMember }) {
  const initials = member.name
    .replace(/\(.*?\)|,.*$/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w) && !/^(Rev|Dr|Mr|Mrs|Ms|Pastor|Engr|Teacher|Auntie)\.?$/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <Tile padding={0} style={styles.profile} accessibilityLabel={`${member.name}, ${member.role}`}>
      <View style={styles.face}>
        {member.photo
          ? <Image source={member.photo} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          : <Text style={styles.initials}>{initials || '·'}</Text>}
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        <Text style={styles.profileName} numberOfLines={2}>{member.name}</Text>
        <Text style={styles.profileRole} numberOfLines={2}>{member.role.toUpperCase()}</Text>
      </View>
    </Tile>
  );
}

const styles = StyleSheet.create({
  profile: { width: 150 },
  face: {
    height: 150, borderTopLeftRadius: 13, borderTopRightRadius: 13, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontFamily: font.bold, fontSize: 36, color: tile.ink, letterSpacing: 2 },
  profileName: { fontFamily: font.bold, fontSize: 13, lineHeight: 17, color: tile.ink },
  profileRole: { fontFamily: font.regular, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: tile.muted },
  title: {
    fontFamily: font.regular,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
    marginTop: 12,
    marginBottom: 14,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaRow: { gap: 4 },
  metaChurch: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  metaLocation: { fontFamily: font.regular, fontSize: 12, color: colors.inkSoft },
  giveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 16,
  },
  giveAmount: { fontFamily: font.bold, fontSize: 22, color: tile.ink },
  giveSub: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: tile.muted, marginTop: 2 },
  giveCount: { fontFamily: font.bold, fontSize: 16, color: tile.ink },
  giveNote: { fontFamily: font.regular, fontSize: 10, lineHeight: 16, color: tile.muted, marginTop: 16 },
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
