import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGifts } from '../context/GiftsContext';
import { Button, Label, Rule } from '../components/UI';
import { colors, font, formatMoney } from '../constants/theme';
import type { RootStackParamList, TabParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Giving'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function GivingScreen({ navigation }: { navigation: Nav }) {
  const { gifts } = useGifts();
  const total = gifts.reduce((s, g) => s + g.amount, 0);
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
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={reversed}
      keyExtractor={(g) => g.id}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Label>Giving history</Label>
          <Text style={styles.h1}>Your gifts on BURDEN.</Text>
          <View style={styles.summary}>
            <View>
              <Label>Lifetime giving</Label>
              <Text style={styles.summaryAmount}>{formatMoney(total)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Label>Gifts</Label>
              <Text style={styles.summaryAmount}>{gifts.length}</Text>
            </View>
          </View>
          <Rule />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('Campaign', { campaignId: item.campaignId })}
          style={styles.giftRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.giftTitle}>{item.campaignTitle}</Text>
            <Text style={styles.giftMeta}>
              {item.churchName.toUpperCase()} · {new Date(item.timestamp).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).toUpperCase()}
              {item.recurring ? ' · MONTHLY' : ''}
              {item.anonymous ? ' · ANONYMOUS' : ''}
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
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: font.regular, fontSize: 28, color: colors.ink, marginTop: 12, marginBottom: 24 },
  summary: {
    borderWidth: 1, borderColor: colors.rule, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  summaryAmount: { fontFamily: font.bold, fontSize: 22, color: colors.ink, marginTop: 8 },
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
  giftAmount: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  giftFee: { fontFamily: font.regular, fontSize: 9, color: colors.inkMuted, marginTop: 2, letterSpacing: 1 },
});
