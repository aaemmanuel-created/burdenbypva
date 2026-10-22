// A burden's QR code, full size — to hold up after a service or show at the
// church door. Scanning opens the burden page (or a fundraiser's link).
// The website's version (burden-app/src/screens/Poster.jsx) also prints.
import React from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches } from '../data/mock';
import { Badge, Button, Label } from '../components/UI';
import { colors, font } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import { findFundraiser, shareText, shareUrl } from '../lib/community';
import { qrRuns } from '../lib/qr';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Poster'>;

const QR_SIZE = 260;

export default function PosterScreen({ route }: Props) {
  const { fundraisers } = useGifts();
  const campaign = campaigns.find((c) => c.id === route.params.campaignId);
  const church = campaign && churches.find((ch) => ch.id === campaign.churchId);
  if (!campaign || !church) {
    return (
      <View style={{ padding: 24, backgroundColor: colors.bg, flex: 1 }}>
        <Text style={{ fontFamily: font.regular, color: colors.ink }}>Burden not found.</Text>
      </View>
    );
  }
  const fundraiser = findFundraiser(route.params.fundraiserId, fundraisers);
  const url = shareUrl(campaign.id, fundraiser?.id);
  const { size, runs } = qrRuns(url);
  const cell = QR_SIZE / (size + 4); // two modules of quiet zone each side

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
      <View style={styles.card}>
        <Label>Carry this burden with us</Label>
        <Text style={styles.church}>{church.name}</Text>
        {church.verified && <View style={{ alignItems: 'center' }}><Badge tone="trust">{church.tier}</Badge></View>}
        <Text style={styles.title}>{campaign.title}</Text>
        {fundraiser && <Text style={styles.small}>with {fundraiser.name}</Text>}
        <View
          style={{ width: QR_SIZE, height: QR_SIZE, backgroundColor: '#fff', marginVertical: 16 }}
          accessible
          accessibilityLabel={`QR code for ${url}`}
        >
          {runs.map((r, i) => (
            <View
              key={i}
              style={{
                position: 'absolute', backgroundColor: colors.ink,
                left: (r.x + 2) * cell, top: (r.y + 2) * cell, width: r.w * cell + 0.5, height: cell + 0.5,
              }}
            />
          ))}
        </View>
        <Text style={styles.scan}>Scan with your phone camera to give.</Text>
        <Text style={styles.small}>
          Mobile money, card, Apple Pay or Google Pay. Every gift goes to the church's verified account, and the
          page shows where every dollar goes.
        </Text>
        <Text style={styles.url} selectable>{url}</Text>
      </View>
      <Button
        style={{ marginTop: 20 }}
        onPress={() => { Share.share({ message: `${shareText(campaign, church, fundraiser)} ${url}`, url }).catch(() => {}); }}
      >
        Share the link
      </Button>
      <Text style={styles.help}>To print this poster, open the link on a computer and choose "QR poster for church".</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.rule,
    paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', gap: 10,
  },
  church: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  title: { fontFamily: font.regular, fontSize: 24, lineHeight: 30, color: colors.ink, textAlign: 'center', marginTop: 4 },
  scan: { fontFamily: font.regular, fontSize: 14, color: colors.ink },
  small: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft, textAlign: 'center' },
  url: { fontFamily: font.regular, fontSize: 10, color: colors.inkMuted, textAlign: 'center', marginTop: 6 },
  help: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: colors.inkMuted, marginTop: 14 },
});
