import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches, type TeamMember } from '../data/mock';
import { Badge, Button, FundingSquare, Label, Progress, Rule, Tile } from '../components/UI';
import { FundraisersSection, ShareSheet, SupportSection, UpdatesSection } from '../components/Community';
import { colors, font, formatMoney, tile } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import { findFundraiser, fundraisersFor, supportFor, updatesFor, type SupportWord, type Update } from '../lib/community';
import { fetchBurdenUpdates, fetchSupportWords, liveCheckout } from '../lib/payments';
import type { RootStackParamList } from '../navigation/types';
import { useT } from '../lib/i18n';

const ITEMS = [
  { label: 'Direct programme costs', share: 0.84 },
  { label: 'Local logistics & banking fees', share: 0.07 },
  { label: 'Payment processing', share: 0.045 },
  { label: 'BURDEN platform fee', share: 0.045 },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Campaign'>;

export default function CampaignScreen({ route, navigation }: Props) {
  const t = useT();
  const { gifts, fundraisers, joinedPrayer, togglePrayer } = useGifts();
  const [sharing, setSharing] = useState(false);
  // Live: only words the review queue approved (null until loaded / in demo).
  const [liveWords, setLiveWords] = useState<SupportWord[] | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<Update[] | null>(null); // posted from the church dashboard
  useEffect(() => {
    if (!liveCheckout) return;
    let stop = false;
    fetchSupportWords(route.params.campaignId)
      .then((r) => { if (!stop) setLiveWords(r.words); })
      .catch(() => { if (!stop) setLiveWords([]); });
    fetchBurdenUpdates(route.params.campaignId)
      .then((r) => { if (!stop) setLiveUpdates(r.updates); })
      .catch(() => { if (!stop) setLiveUpdates([]); });
    return () => { stop = true; };
  }, [route.params.campaignId]);
  const scroll = useRef<ScrollView>(null);
  const { fundraiserId } = route.params;
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
  const updates = liveUpdates ?? updatesFor(campaign.id);
  const words = supportFor(campaign.id, gifts, liveWords);
  const carrying = fundraisersFor(campaign.id, fundraisers, gifts);
  const sharedFundraiser = findFundraiser(fundraiserId, fundraisers);

  return (
    <ScrollView ref={scroll} style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 96 }}>
      <View style={{ padding: 20 }}>
        <View style={styles.badgeRow}>
          <Badge>{t(`cat.${campaign.category}`)}</Badge>
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
            <Label onNavy>{t('campaign.funding')}</Label>
            <FundingSquare raised={campaign.raised} goal={campaign.goal} size={18} />
          </View>
          <Progress value={campaign.raised} goal={campaign.goal} onNavy />
          <View style={styles.giveStats}>
            <View>
              <Text style={styles.giveAmount}>{formatMoney(campaign.raised)}</Text>
              <Text style={styles.giveSub}>{t('campaign.of', { goal: formatMoney(campaign.goal), pct })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.giveCount}>{campaign.donors}</Text>
              <Text style={styles.giveSub}>{t('campaign.donors')}</Text>
            </View>
          </View>
          <Button variant="onNavy" onPress={() => navigation.navigate('Give', { campaignId: campaign.id, fundraiserId: sharedFundraiser?.id })}>
            {sharedFundraiser
              ? `Give through ${sharedFundraiser.own ? 'your page' : sharedFundraiser.name.split(' ')[0]}`
              : t('campaign.give')}
          </Button>
          <Pressable
            onPress={() => setSharing(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.shareBtnText}>{t('campaign.share').toUpperCase()}</Text>
          </Pressable>
          <Text style={styles.giveNote}>
            {t('campaign.minimum')}
          </Text>
        </Tile>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>{t('campaign.about')}</Label>
        {/* Four lines at most — the detail lives in the sections below. */}
        <Text style={styles.body} numberOfLines={4}>
          {campaign.summary} Funds go straight to the church's verified payout account, with a
          public update every month.
        </Text>
      </View>

      <Rule soft />

      {/* Updates — dated posts from the team */}
      <View style={{ padding: 20 }}>
        <UpdatesSection updates={updates} />
      </View>

      {campaign.team && campaign.team.length > 0 && (
        <>
          <Rule soft />
          <View style={{ paddingTop: 20, paddingBottom: 8 }}>
            <Label style={{ paddingHorizontal: 20 }}>{t('campaign.profiles')}</Label>
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

      {/* The four sections every burden shows (web: Campaign.jsx) */}
      <View style={{ padding: 20 }}>
        <Label>{t('campaign.objective')}</Label>
        <Text style={[styles.body, { color: colors.ink }]}>{campaign.objective}</Text>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>{t('campaign.state')}</Label>
        <Text style={styles.body}>{campaign.currentState}</Text>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>{t('campaign.money')}</Label>
        <View style={{ marginTop: 14 }}>
          {campaign.moneyWorkflow.map((step, i) => (
            <View key={i} style={styles.flowRow}>
              <Text style={styles.flowNum}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.flowText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <PrayerGroup
          group={campaign.prayerGroup}
          joined={joinedPrayer.includes(campaign.id)}
          onToggle={() => togglePrayer(campaign.id)}
        />
      </View>

      <Rule soft />

      {/* Words of support — from givers, never with the amount */}
      <View style={{ padding: 20 }}>
        <SupportSection words={words} onGive={() => navigation.navigate('Give', { campaignId: campaign.id })} />
      </View>

      <Rule soft />

      {/* Fundraisers — people carrying it with their own circle. A shared
          fundraiser link lands here. */}
      <View
        style={{ padding: 20 }}
        onLayout={(e) => { if (fundraiserId) scroll.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 120), animated: false }); }}
      >
        <FundraisersSection
          fundraisers={carrying}
          highlightId={fundraiserId}
          onGiveThrough={(f) => navigation.navigate('Give', { campaignId: campaign.id, fundraiserId: f.id })}
          onStart={() => navigation.navigate('Fundraise', { campaignId: campaign.id })}
        />
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>{t('campaign.dollar')}</Label>
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
        <Text style={[styles.smallNote, { marginTop: 8 }]}>
          Paid to {church.name}'s verified {church.payoutTo} after a 3-day hold.
        </Text>
      </View>

      <Rule soft />

      <View style={{ padding: 20 }}>
        <Label>{t('campaign.aboutChurch', { church: church.name })}</Label>
        <Text style={styles.body}>
          {church.summary} Founded {church.founded}. {church.tradition}. Led by {church.leadership}.
        </Text>
      </View>

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        campaign={campaign}
        church={church}
        fundraiser={sharedFundraiser}
        onFundraise={() => navigation.navigate('Fundraise', { campaignId: campaign.id })}
        onPoster={() => navigation.navigate('Poster', { campaignId: campaign.id, fundraiserId: sharedFundraiser?.id })}
      />
    </ScrollView>
  );
}

// Prayer is specific: a focus line from the team, and a group to join.
// Mirrors PrayerGroup in burden-app/src/screens/Campaign.jsx.
function PrayerGroup({
  group, joined, onToggle,
}: { group: { members: number; recentPrayers: number; focusLine: string }; joined: boolean; onToggle: () => void }) {
  const t = useT();
  const members = group.members + (joined ? 1 : 0);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Label>{t('campaign.prayer')}</Label>
        <Text style={styles.prayerCount}>
          {members.toLocaleString()} praying · {group.recentPrayers} prayers this week
        </Text>
      </View>
      <Text style={[styles.body, { color: colors.ink }]}>{group.focusLine}</Text>
      <Text style={[styles.smallNote, { lineHeight: 18 }]}>
        Prayer on BURDEN is specific — when you join this group you'll see weekly updates from the team on what to
        pray for, and you can post prayers and short scriptures alongside other members of the group. Prayer is not a
        substitute for giving; it sits alongside it.
      </Text>
      <Button variant={joined ? 'ghost' : 'primary'} style={{ marginTop: 18, alignSelf: 'flex-start' }} onPress={onToggle}>
        {joined ? t('campaign.inPrayer') : t('campaign.joinPrayer')}
      </Button>
    </View>
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
  shareBtn: {
    marginTop: 10, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  shareBtnText: { fontFamily: font.bold, fontSize: 12, letterSpacing: 1, color: tile.ink },
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 22, color: colors.inkSoft, marginTop: 12 },
  flowRow: {
    flexDirection: 'row', gap: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.ruleSoft,
  },
  flowNum: { width: 22, fontFamily: font.regular, fontSize: 12, letterSpacing: 1, color: colors.inkMuted, lineHeight: 21 },
  flowText: { flex: 1, fontFamily: font.regular, fontSize: 13, lineHeight: 21, color: colors.ink },
  prayerCount: { fontFamily: font.regular, fontSize: 11, letterSpacing: 1, color: colors.inkMuted, flexShrink: 1, textAlign: 'right' },
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
