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
import { colors, font, tile } from '../constants/theme';
import { Badge, FundingSquare, Label, Progress, Tile } from '../components/UI';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { DOCK_SPACE } from '../components/Dock';
import { DockSurfaceCtx, useDockSurface } from '../lib/dockSurface';

const CATEGORIES: ('All' | Campaign['category'])[] = ['All', 'Education', 'Health', 'Community', 'Building'];

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Discover'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen({ navigation }: { navigation: Nav }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');
  const surface = useDockSurface();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (cat !== 'All' && c.category !== cat) return false;
      if (query) {
        const ch = churches.find((ch) => ch.id === c.churchId);
        // Title, summary, objective, category, church, tradition, place and team names.
        const hay = [c.title, c.summary, c.objective, c.category, ch?.name, ch?.location, ch?.tradition,
          ...(c.team || []).map((m) => m.name)].join(' ').toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [cat, query]);

  return (
    <DockSurfaceCtx.Provider value={surface.ctx}>
    <FlatList
      onScroll={surface.onScroll}
      scrollEventThrottle={16}
      style={{ backgroundColor: colors.bg }}
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: DOCK_SPACE + 32 }}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 20, paddingVertical: 32, alignItems: 'flex-start', gap: 12 }}>
          <Text style={styles.empty}>No burdens match your search.</Text>
          <Pressable onPress={() => { setQuery(''); setCat('All'); }} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.empty, { textDecorationLine: 'underline', color: colors.ink }]}>Clear search</Text>
          </Pressable>
        </View>
      }
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Label>Discover</Label>
          <Text style={styles.h1}>Verified burdens.</Text>

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
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
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
          <Tile
            onPress={() => navigation.navigate('Campaign', { campaignId: item.id })}
            padding={20}
            image={item.image}
            imageColour={item.imageColour}
            funded={item.raised / item.goal}
            style={styles.card}
          >
            <View style={styles.cardTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap' }}>
                <Badge onNavy>{item.category}</Badge>
                {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
              </View>
              <FundingSquare raised={item.raised} goal={item.goal} />
            </View>
            {item.image && <View style={{ flex: 1 }} />}

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardChurch}>
              {church.name.toUpperCase()}
              {'\n'}<Text style={{ opacity: 0.75 }}>{church.location.toUpperCase()}</Text>
            </Text>
            <View style={{ marginTop: 4 }}>
              <Progress value={item.raised} goal={item.goal} onNavy />
              <View style={styles.cardBottomRow}>
                <Text style={styles.cardMeta}>{pct}% funded</Text>
                <Text style={styles.cardMeta}>{item.daysLeft}d left</Text>
              </View>
            </View>
          </Tile>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
    </DockSurfaceCtx.Provider>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft },
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
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 16,
    color: tile.ink,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardChurch: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, lineHeight: 15, color: tile.muted, marginBottom: 12 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardMeta: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: tile.soft },
});
