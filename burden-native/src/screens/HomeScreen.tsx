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
import { colors, font, formatMoney } from '../constants/theme';
import { Badge, Button, Label, Progress, Rule } from '../components/UI';
import type { RootStackParamList, TabParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const highlight = campaigns.find((c) => c.id === 'cmp_redeemer_clinic')!;
  const highlightChurch = churches.find((c) => c.id === highlight.churchId)!;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      <SectionTitle label="Highlight of the week" />
      <HighlightCard
        campaign={highlight}
        church={highlightChurch}
        onPress={() => navigation.navigate('Campaign', { campaignId: highlight.id })}
      />

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
    <Pressable onPress={onPress} style={styles.highlight}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Label>{campaign.category}</Label>
        {church.verified && <Badge tone="trust">{church.tier}</Badge>}
      </View>

      <Text style={styles.highlightTitle}>{campaign.title}</Text>
      <Text style={styles.highlightChurch}>
        {church.name.toUpperCase()} — {church.location.toUpperCase()}
      </Text>
      <Text style={styles.highlightSummary}>{campaign.summary}</Text>

      <View style={styles.highlightStatsRow}>
        <Stat label="Raised" value={formatMoney(campaign.raised)} />
        <Stat label="Goal" value={formatMoney(campaign.goal)} />
        <Stat label="Donors" value={String(campaign.donors)} />
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        <Progress value={campaign.raised} goal={campaign.goal} />
        <View style={styles.highlightMeta}>
          <Text style={styles.metaText}>{pct}% funded</Text>
          <Text style={styles.metaText}>{campaign.daysLeft} days left</Text>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <Button onPress={onPress}>View campaign</Button>
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Label>{label}</Label>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ProjectCard({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const church = churches.find((c) => c.id === campaign.churchId)!;
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  return (
    <Pressable onPress={onPress} style={styles.projectCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>{campaign.category}</Label>
        {church.verified && <Badge tone="trust">Verified</Badge>}
      </View>
      <Text style={styles.cardTitle}>{campaign.title}</Text>
      <Text style={styles.cardSubtitle}>
        {church.name.toUpperCase()} — {church.location.toUpperCase()}
      </Text>
      <Text style={styles.cardSummary}>{campaign.summary}</Text>
      <View style={{ marginTop: 12 }}>
        <Progress value={campaign.raised} goal={campaign.goal} />
        <View style={styles.projectMeta}>
          <Text style={styles.metaText}>
            {pct}% — {campaign.donors} donors
          </Text>
          <Text style={styles.metaText}>{campaign.daysLeft}d left</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ChurchCard({ church, onPress }: { church: Church; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.projectCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>{church.tradition}</Label>
        {church.verified && <Badge tone="trust">{church.tier}</Badge>}
      </View>
      <Text style={styles.cardTitle}>{church.name}</Text>
      <Text style={styles.cardSubtitle}>
        {church.location.toUpperCase()} · EST. {church.founded}
      </Text>
      <Text style={styles.cardSummary}>{church.summary}</Text>
      <Text style={[styles.metaText, { marginTop: 10 }]}>
        {church.members.toLocaleString()} MEMBERS
      </Text>
    </Pressable>
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
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardSubtitle}>
          {(church ? church.name : 'BURDEN').toUpperCase()} · {event.location.toUpperCase()}
        </Text>
        <Text style={styles.cardSummary}>{event.summary}</Text>
      </View>
      <Badge>{event.category}</Badge>
    </View>
  );
}

const styles = StyleSheet.create({
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
    padding: 24,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.bgAlt,
  },
  highlightTitle: {
    fontFamily: font.bold,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 28,
    marginBottom: 10,
  },
  highlightChurch: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMuted,
    marginBottom: 14,
  },
  highlightSummary: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkSoft,
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
    color: colors.ink,
    marginTop: 4,
  },
  projectCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.bg,
    gap: 10,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkMuted,
  },
  cardSummary: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkSoft,
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
