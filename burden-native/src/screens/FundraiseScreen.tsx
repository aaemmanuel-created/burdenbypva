// Start a fundraiser for a burden: your name, why you're carrying it, and a
// goal for your own circle. Gifts through it go to the church as usual.
// Kept in memory until fundraisers live on the payment server.
// Mirrors burden-app/src/screens/Fundraise.jsx.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { campaigns, churches } from '../data/mock';
import { Button, Label, Rule } from '../components/UI';
import { ShareOptions } from '../components/Community';
import { colors, font, formatMoney } from '../constants/theme';
import { useGifts } from '../context/GiftsContext';
import { MESSAGE_MAX, type Fundraiser } from '../lib/community';
import type { RootStackParamList } from '../navigation/types';

const PRESETS = [100, 250, 500, 1000];

type Props = NativeStackScreenProps<RootStackParamList, 'Fundraise'>;

export default function FundraiseScreen({ route, navigation }: Props) {
  const { addFundraiser } = useGifts();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [goal, setGoal] = useState(250);
  const [custom, setCustom] = useState('');
  const [made, setMade] = useState<Fundraiser | null>(null);

  const campaign = campaigns.find((c) => c.id === route.params.campaignId);
  const church = campaign && churches.find((ch) => ch.id === campaign.churchId);
  if (!campaign || !church) {
    return (
      <View style={{ padding: 24, backgroundColor: colors.bg, flex: 1 }}>
        <Text style={{ fontFamily: font.regular, color: colors.ink }}>Burden not found.</Text>
      </View>
    );
  }

  const value = custom !== '' ? Math.floor(Number(custom) || 0) : goal;
  const ready = name.trim().length > 0 && note.trim().length > 0 && value >= 1;

  function submit() {
    if (!ready || !campaign) return;
    const fundraiser: Fundraiser = {
      id: 'fr_' + Date.now(),
      campaignId: campaign.id,
      name: name.trim(),
      note: note.trim(),
      goal: value,
      raised: 0,
      started: new Date().toISOString().slice(0, 10),
      own: true,
    };
    addFundraiser(fundraiser);
    setMade(fundraiser);
  }

  if (made) {
    return (
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
        <Label>Your fundraiser</Label>
        <Text style={styles.h1}>You're carrying {campaign.title} with {church.name}.</Text>
        <Text style={styles.body}>
          Share your link below. Gifts through it go straight to {church.name}'s verified account and count
          towards your {formatMoney(made.goal)} goal.
        </Text>
        <Rule soft style={{ marginVertical: 24 }} />
        <ShareOptions campaign={campaign} church={church} fundraiser={made} />
        <Text style={styles.help}>
          For now your fundraiser is kept on this phone only, so the link opens the burden for others but they
          won't see your page yet.
        </Text>
        <Button
          style={{ marginTop: 28 }}
          onPress={() => navigation.navigate('Campaign', { campaignId: campaign.id, fundraiserId: made.id })}
        >
          See it on the burden
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
      <Label>Fundraise</Label>
      <Text style={styles.h1}>Carry this burden with your circle</Text>
      <Text style={styles.sub}>{church.name.toUpperCase()} · {campaign.title.toUpperCase()}</Text>

      <Rule soft style={{ marginVertical: 24 }} />

      <Label style={{ marginBottom: 12 }}>Your name, or your group's</Label>
      <TextInput
        placeholder="e.g. Ama Mensah, or St Paul's youth"
        placeholderTextColor={colors.inkMuted}
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Label style={{ marginTop: 24, marginBottom: 12 }}>Why you're carrying it</Label>
      <TextInput
        multiline
        maxLength={MESSAGE_MAX}
        placeholder="A sentence or two for the people you'll share it with."
        placeholderTextColor={colors.inkMuted}
        value={note}
        onChangeText={setNote}
        style={[styles.input, { minHeight: 96, textAlignVertical: 'top' }]}
      />
      <Text style={[styles.help, { textAlign: 'right', marginTop: 6 }]}>{note.length}/{MESSAGE_MAX}</Text>

      <Label style={{ marginTop: 24, marginBottom: 12 }}>Your goal (USD)</Label>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => {
          const active = custom === '' && goal === p;
          return (
            <Pressable key={p} onPress={() => { setGoal(p); setCustom(''); }} style={[styles.preset, active && styles.presetActive]}>
              <Text style={[styles.presetText, active && styles.presetTextActive]}>${p}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        keyboardType="numeric"
        placeholder="Custom goal"
        placeholderTextColor={colors.inkMuted}
        value={custom}
        onChangeText={setCustom}
        style={styles.input}
      />
      <Text style={styles.help}>Your goal is your own. It sits inside the burden's goal, not on top of it.</Text>

      <Button style={{ marginTop: 32 }} onPress={submit} disabled={!ready}>Start my fundraiser</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: font.bold, fontSize: 22, color: colors.ink, marginTop: 12, lineHeight: 28 },
  sub: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: colors.inkMuted, marginTop: 8 },
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 21, color: colors.inkSoft, marginTop: 12 },
  help: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: colors.inkMuted, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: font.regular, fontSize: 13, color: colors.ink,
  },
  presetRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  preset: { flex: 1, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.rule },
  presetActive: { backgroundColor: colors.ink },
  presetText: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  presetTextActive: { color: colors.accentInk },
});
