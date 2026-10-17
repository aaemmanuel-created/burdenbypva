import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGifts } from '../context/GiftsContext';
import { Button, Label, Rule, Tile } from '../components/UI';
import { colors, font, formatMoney, tile } from '../constants/theme';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { DOCK_SPACE } from '../components/Dock';
import { DockSurfaceCtx, useDockSurface } from '../lib/dockSurface';
import { isGiven, statusLabel } from '../lib/giftTimeline';

const statusTone: Record<string, string> = {
  initiated: colors.warn, held: colors.warn, paid_out: colors.trust, church_confirmed: colors.trust,
  failed: colors.fundLow, cancelled: colors.inkMuted,
};

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Giving'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function GivingScreen({ navigation }: { navigation: Nav }) {
  const { gifts } = useGifts();
  const surface = useDockSurface();
  const given = gifts.filter(isGiven);
  const total = given.reduce((s, g) => s + g.amount, 0);
  const reversed = [...gifts].reverse();

  if (gifts.length === 0) {
    return (
      <View style={{ padding: 20, backgroundColor: colors.bg, flex: 1 }}>
        <Label>Giving history</Label>
        <Text style={styles.h1}>Your gifts on BURDEN.</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>You haven't given a gift yet.</Text>
          <Button onPress={() => navigation.navigate('Tabs', { screen: 'Discover' })}>
            Discover churches
          </Button>
        </View>
      </View>
    );
  }

  return (
    <DockSurfaceCtx.Provider value={surface.ctx}>
    <FlatList
      onScroll={surface.onScroll}
      scrollEventThrottle={16}
      style={{ backgroundColor: colors.bg }}
      data={reversed}
      keyExtractor={(g) => g.id}
      contentContainerStyle={{ paddingBottom: DOCK_SPACE + 32 }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Label>Giving history</Label>
          <Text style={styles.h1}>Your gifts on BURDEN.</Text>
          <Tile style={styles.summary}>
            <View>
              <Label onNavy>Lifetime giving</Label>
              <Text style={styles.summaryAmount}>{formatMoney(total)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Label onNavy>Gifts</Label>
              <Text style={styles.summaryAmount}>{given.length}</Text>
            </View>
          </Tile>
          <Rule />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('Gift', { giftId: item.id })}
          style={styles.giftRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.giftTitle}>{item.campaignTitle || 'Gift'}</Text>
            <Text style={styles.giftMeta}>
              {item.churchName.toUpperCase()} · {new Date(item.timestamp).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).toUpperCase()}
              {item.recurring ? ' · MONTHLY' : ''}
              {item.anonymous ? ' · ANONYMOUS' : ''}
            </Text>
            <Text style={[styles.giftStatus, { color: statusTone[item.status] ?? colors.inkMuted }]}>
              {statusLabel(item).toUpperCase()} →
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.giftAmount}>{formatMoney(item.amount)}</Text>
            {item.coveredFee > 0 && (
              <Text style={styles.giftFee}>+{formatMoney(item.coveredFee)} fee covered</Text>
            )}
          </View>
        </Pressable>
      )}
    />
    </DockSurfaceCtx.Provider>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: font.regular, fontSize: 28, color: colors.ink, marginTop: 12, marginBottom: 24 },
  summary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  summaryAmount: { fontFamily: font.bold, fontSize: 22, color: tile.ink, marginTop: 8 },
  emptyCard: {
    borderWidth: 1, borderColor: colors.rule, padding: 32, marginTop: 24,
    backgroundColor: colors.bgAlt, alignItems: 'center', gap: 16,
  },
  emptyText: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft },
  giftRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.ruleSoft, gap: 16,
  },
  giftTitle: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  giftMeta: { fontFamily: font.regular, fontSize: 10, color: colors.inkMuted, marginTop: 4, letterSpacing: 1 },
  giftStatus: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, marginTop: 6 },
  giftAmount: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  giftFee: { fontFamily: font.regular, fontSize: 9, color: colors.inkMuted, marginTop: 2, letterSpacing: 1 },
});
