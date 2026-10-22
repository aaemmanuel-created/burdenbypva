// Home — curated feed in four sections (parity with web Home.jsx):
//   1. Highlight of the week   — one prominently featured project
//   2. Projects                — verified campaigns currently raising
//   3. Churches                — verified congregations
//   4. Events                  — upcoming services, outreach, town halls
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { campaigns, churches, events, type Campaign, type Church, type Event } from '../data/mock';
import { colors, font, formatMoney, tile } from '../constants/theme';
import { Badge, Button, FundingSquare, Label, Progress, Rule, Tile } from '../components/UI';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { DOCK_SPACE } from '../components/Dock';
import { DockSurfaceCtx, useDockSurface } from '../lib/dockSurface';
import { useGifts } from '../context/GiftsContext';
import { isGiven, statusLabel } from '../lib/giftTimeline';

// This week's highlighted burden.
const HIGHLIGHT_ID = 'cmp_andrew_bursary';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  // The highlight is always a photo tile: this week's pick if it has a photo,
  // otherwise the first burden that does.
  const highlight = campaigns.find((c) => c.id === HIGHLIGHT_ID && c.image)
    ?? campaigns.find((c) => c.image)
    ?? campaigns[0];
  const highlightChurch = churches.find((c) => c.id === highlight.churchId)!;
  const surface = useDockSurface();

  // Shared Burdens: every burden this donor has given to, newest gift first,
  // with their total and where their latest gift has got to.
  const { gifts } = useGifts();
  const shared = [...gifts].filter(isGiven).reverse().reduce<
    { campaign: Campaign; total: number; latestGiftId: string; status: string }[]
  >((list, g) => {
    const existing = list.find((s) => s.campaign.id === g.campaignId);
    if (existing) { existing.total += g.amount; return list; }
    const campaign = campaigns.find((c) => c.id === g.campaignId);
    if (campaign) list.push({ campaign, total: g.amount, latestGiftId: g.id, status: statusLabel(g) });
    return list;
  }, []);

  return (
    <DockSurfaceCtx.Provider value={surface.ctx}>
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: DOCK_SPACE + 48 }}
      onScroll={surface.onScroll}
      scrollEventThrottle={16}
    >
      <SectionTitle label="Highlight of the week" />
      <HighlightCard
        campaign={highlight}
        church={highlightChurch}
        onPress={() => navigation.navigate('Campaign', { campaignId: highlight.id })}
      />

      <Rule style={{ marginTop: 32 }} />

      <SectionTitle label="Shared Burdens" />
      {shared.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.emptyShared}>
            Burdens you give to will appear here, so you can follow each one.
          </Text>
        </View>
      ) : (
        // a row of small squares you swipe through (Emmanuel, 2026-10-22): the burden on the
        // square opens it; the line beneath says what you shared and opens the latest gift
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SHARED_SQ + 12}
          decelerationRate="fast"
          // room above and below so the squares' shadows aren't cut off by the row
          style={{ marginVertical: -16 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}
        >
          {shared.map((s) => (
            <SharedSquare
              key={s.campaign.id}
              campaign={s.campaign}
              total={s.total}
              status={s.status}
              onOpen={() => navigation.navigate('Campaign', { campaignId: s.campaign.id })}
              onGift={() => navigation.navigate('Gift', { giftId: s.latestGiftId })}
            />
          ))}
        </ScrollView>
      )}

      <Rule style={{ marginTop: 32 }} />

      <SectionTitle
        label="Projects"
        cta="See all"
        onCta={() => navigation.navigate('Tabs', { screen: 'Discover' })}
      />
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {campaigns.map((c) => (
          <ProjectCard
            key={c.id}
            campaign={c}
            onPress={() => navigation.navigate('Campaign', { campaignId: c.id })}
          />
        ))}
      </View>

      <Rule style={{ marginTop: 32 }} />

      <SectionTitle
        label="Churches"
        cta="See all"
        onCta={() => navigation.navigate('Tabs', { screen: 'Discover' })}
      />
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {churches.map((ch) => (
          <ChurchCard
            key={ch.id}
            church={ch}
            onPress={() => navigation.navigate('Tabs', { screen: 'Discover' })}
          />
        ))}
      </View>

      <Rule style={{ marginTop: 32 }} />

      <SectionTitle label="Events" />
      <View style={{ paddingHorizontal: 20 }}>
        {[...events]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
      </View>
    </ScrollView>
    </DockSurfaceCtx.Provider>
  );
}

function SectionTitle({ label, cta, onCta }: { label: string; cta?: string; onCta?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Label>{label}</Label>
      {cta && (
        <Pressable onPress={onCta}>
          <Text style={styles.ctaText}>{cta.toUpperCase()} →</Text>
        </Pressable>
      )}
    </View>
  );
}

function HighlightCard({
  campaign, church, onPress,
}: { campaign: Campaign; church: Church; onPress: () => void }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  return (
    <Tile
      onPress={onPress}
      image={campaign.image}
      imageColour={campaign.imageColour}
      funded={campaign.raised / campaign.goal}
      style={styles.highlight}
    >
      <View style={styles.tileTop}>
        <View style={styles.tileTopLeft}>
          <Badge onNavy>{campaign.category}</Badge>
          {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
        </View>
        <FundingSquare raised={campaign.raised} goal={campaign.goal} size={18} />
      </View>
      {campaign.image && <View style={{ flex: 1 }} />}

      <Text style={styles.highlightTitle}>{campaign.title}</Text>
      <Text style={styles.highlightChurch}>
        {church.name.toUpperCase()}
        {'\n'}<Text style={styles.locationLine}>{church.location.toUpperCase()}</Text>
      </Text>
      <View style={styles.highlightStatsRow}>
        <Stat label="Raised" value={formatMoney(campaign.raised)} />
        <Stat label="Goal" value={formatMoney(campaign.goal)} />
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        <Progress value={campaign.raised} goal={campaign.goal} onNavy />
        <View style={styles.highlightMeta}>
          <Text style={styles.metaText}>{pct}% funded</Text>
          <Text style={styles.metaText}>{campaign.daysLeft} days left</Text>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <Button variant="onNavy" onPress={onPress}>View burden</Button>
      </View>
    </Tile>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Label onNavy>{label}</Label>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// One shared burden as a small square: its photo, the funding square, the title and church;
// beneath it, what you shared and where your latest gift has got to.
const SHARED_SQ = 152;
function SharedSquare({ campaign, total, status, onOpen, onGift }: {
  campaign: Campaign; total: number; status: string; onOpen: () => void; onGift: () => void;
}) {
  const church = churches.find((c) => c.id === campaign.churchId)!;
  return (
    <View style={{ width: SHARED_SQ, gap: 8 }}>
      <Tile
        onPress={onOpen}
        padding={12}
        image={campaign.image}
        imageColour={campaign.imageColour}
        funded={campaign.raised / campaign.goal}
        accessibilityLabel={`${campaign.title}, ${church.name}`}
        // square: aspectRatio 1 overrides the photo's own shape, which Tile otherwise keeps
        style={{ width: SHARED_SQ, height: SHARED_SQ, aspectRatio: 1 }}
      >
        <View style={{ alignItems: 'flex-end' }}>
          <FundingSquare raised={campaign.raised} goal={campaign.goal} size={14} />
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.sqTitle} numberOfLines={2}>{campaign.title}</Text>
        <Text style={styles.sqChurch} numberOfLines={1}>{church.name.toUpperCase()}</Text>
      </Tile>
      <Pressable onPress={onGift} accessibilityRole="button" hitSlop={6}>
        <Text style={styles.sharedLine} numberOfLines={2}>
          YOU SHARED {formatMoney(total)} · {status.toUpperCase()} →
        </Text>
      </Pressable>
    </View>
  );
}
function ProjectCard({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const church = churches.find((c) => c.id === campaign.churchId)!;
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  return (
    <Tile
      onPress={onPress}
      padding={20}
      image={campaign.image}
      imageColour={campaign.imageColour}
      funded={campaign.raised / campaign.goal}
      style={styles.projectCard}
    >
      <View style={[styles.tileTop, { marginBottom: 0 }]}>
        <View style={styles.tileTopLeft}>
          <Badge onNavy>{campaign.category}</Badge>
          {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
        </View>
        <FundingSquare raised={campaign.raised} goal={campaign.goal} />
      </View>
      {campaign.image && <View style={{ flex: 1 }} />}
      <Text style={styles.cardTitle}>{campaign.title}</Text>
      <Text style={styles.cardSubtitle}>
        {church.name.toUpperCase()}
        {'\n'}<Text style={styles.locationLine}>{church.location.toUpperCase()}</Text>
      </Text>
      <View style={{ marginTop: 4 }}>
        <Progress value={campaign.raised} goal={campaign.goal} onNavy />
        <View style={styles.projectMeta}>
          <Text style={styles.metaText}>{pct}% funded</Text>
          <Text style={styles.metaText}>{campaign.daysLeft}d left</Text>
        </View>
      </View>
    </Tile>
  );
}

function ChurchCard({ church, onPress }: { church: Church; onPress: () => void }) {
  return (
    <Tile onPress={onPress} padding={20} style={styles.projectCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge onNavy>{church.tradition}</Badge>
        {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
      </View>
      <Text style={styles.cardTitle}>{church.name}</Text>
      <Text style={styles.cardSubtitle}>
        {church.location.toUpperCase()}
      </Text>
    </Tile>
  );
}

function EventRow({ event }: { event: Event }) {
  const church = event.churchId ? churches.find((c) => c.id === event.churchId) : null;
  const d = new Date(event.date);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return (
    <View style={styles.eventRow}>
      <View style={{ width: 56 }}>
        <Text style={styles.eventDay}>{day}</Text>
        <Text style={styles.eventMonth}>{month}</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventSubtitle}>
          {(church ? church.name : 'BURDEN').toUpperCase()} · {event.location.toUpperCase()}
        </Text>
        <Text style={styles.eventSummary}>{event.summary}</Text>
      </View>
      <Badge>{event.category}</Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  tileTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  emptyShared: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: colors.inkSoft },
  sharedLine: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.5, color: colors.inkSoft },
  sqTitle: { fontFamily: font.bold, fontSize: 13, lineHeight: 16, color: tile.ink },
  sqChurch: { fontFamily: font.regular, fontSize: 8.5, letterSpacing: 1, color: tile.soft, marginTop: 4 },
  tileTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap' },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.inkSoft,
  },
  highlight: {
    marginHorizontal: 20,
  },
  highlightTitle: {
    fontFamily: font.bold,
    fontSize: 22,
    color: tile.ink,
    lineHeight: 28,
    marginBottom: 10,
  },
  // City and country sit on their own line under the church's name, a step quieter.
  locationLine: { opacity: 0.75 },
  highlightChurch: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15,
    color: tile.muted,
    marginBottom: 14,
  },
  highlightStatsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 18,
  },
  highlightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: 16,
    color: tile.ink,
    marginTop: 4,
  },
  projectCard: {
    gap: 10,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: tile.ink,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15,
    color: tile.muted,
  },
  eventTitle: { fontFamily: font.bold, fontSize: 15, color: colors.ink, lineHeight: 20 },
  eventSubtitle: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted },
  eventSummary: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 1,
    color: tile.soft,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft,
  },
  eventDay: {
    fontFamily: font.bold,
    fontSize: 24,
    color: colors.ink,
    lineHeight: 26,
  },
  eventMonth: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
