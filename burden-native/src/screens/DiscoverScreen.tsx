import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { campaigns, churches, type Campaign } from '../data/mock';
import { colors, font, formatMoney } from '../constants/theme';
import { Badge, Label, Progress } from '../components/UI';
import type { RootStackParamList, TabParamList } from '../navigation/types';

const CATEGORIES: ('All' | Campaign['category'])[] = ['All', 'Education', 'Health', 'Community', 'Building'];

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Discover'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen({ navigation }: { navigation: Nav }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (cat !== 'All' && c.category !== cat) return false;
      if (query) {
        const ch = churches.find((ch) => ch.id === c.churchId);
        const hay = (c.title + ' ' + c.summary + ' ' + ch?.name + ' ' + ch?.location).toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [cat, query]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Label>Discover</Label>
          <Text style={styles.h1}>Verified churches{'\n'}and campaigns.</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 4, paddingVertical: 4 }}
            style={{ marginBottom: 12 }}
          >
            {CATEGORIES.map((c) => {
              const active = cat === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCat(c)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {c.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search churches and campaigns…"
            placeholderTextColor={colors.inkMuted}
            style={styles.search}
          />
        </View>
      }
      renderItem={({ item }) => {
        const church = churches.find((ch) => ch.id === item.churchId)!;
        const pct = Math.round((item.raised / item.goal) * 100);
        return (
          <Pressable
            onPress={() => navigation.navigate('Campaign', { campaignId: item.id })}
            style={styles.card}
          >
            <View style={styles.cardTopRow}>
              <Label>{item.category}</Label>
              {church.verified && <Badge tone="trust">{church.tier}</Badge>}
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardChurch}>
              {church.name.toUpperCase()} — {church.location.toUpperCase()}
            </Text>
            <Text style={styles.cardSummary}>{item.summary}</Text>

            <View style={{ marginTop: 16 }}>
              <Progress value={item.raised} goal={item.goal} />
              <View style={styles.cardBottomRow}>
                <Text style={styles.cardMeta}>
                  {pct}% — {item.donors} donors
                </Text>
                <Text style={styles.cardMeta}>{item.daysLeft}d left</Text>
              </View>
              <Text style={styles.cardRaised}>
                {formatMoney(item.raised)} raised of {formatMoney(item.goal)}
              </Text>
            </View>
          </Pressable>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: font.regular,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 34,
    marginTop: 12,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: font.regular, fontSize: 10, letterSpacing: 2, color: colors.ink },
  chipTextActive: { color: colors.accentInk },
  search: {
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 20,
  },
  card: {
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.bg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardChurch: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted, marginBottom: 12 },
  cardSummary: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardMeta: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkSoft },
  cardRaised: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted, marginTop: 4 },
});
