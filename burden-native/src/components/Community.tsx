// The burden page's community sections — Updates, Words of support,
// Fundraisers — and the Share sheet. Native twins of
// burden-app/src/components/Community.jsx.
import React, { useState } from 'react';
import { Linking, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Campaign, Church } from '../data/mock';
import { Button, Label, Progress, Tile } from './UI';
import { colors, font, formatMoney, tile } from '../constants/theme';
import { formatDay, shareText, shareUrl, type Fundraiser, type SupportWord, type Update } from '../lib/community';

function SectionHead({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.head}>
      <Label>{label}</Label>
      {count > 0 && <Text style={styles.count}>{count}</Text>}
    </View>
  );
}

function More({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      <Text style={styles.more}>{children.toUpperCase()}</Text>
    </Pressable>
  );
}

// Dated posts from the burden's team — newest open, older ones folded.
export function UpdatesSection({ updates }: { updates: Update[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? updates : updates.slice(0, 1);
  return (
    <View>
      <SectionHead label="Updates" count={updates.length} />
      {updates.length === 0 && (
        <Text style={styles.body}>The team posts a public update every month. The first is on its way.</Text>
      )}
      {shown.map((u, i) => (
        <View key={u.date + u.title} style={[styles.item, i === shown.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.meta}>{formatDay(u.date)} · {u.author.toUpperCase()}{u.role ? `, ${u.role.toUpperCase()}` : ''}</Text>
          <Text style={styles.updateTitle}>{u.title}</Text>
          <Text style={styles.body}>{u.body}</Text>
        </View>
      ))}
      {updates.length > 1 && (
        <More onPress={() => setAll((a) => !a)}>
          {all ? 'Show latest only' : `See ${updates.length - 1} older update${updates.length > 2 ? 's' : ''}`}
        </More>
      )}
    </View>
  );
}

// Messages givers leave with their gifts. Never the amount.
export function SupportSection({ words, onGive }: { words: SupportWord[]; onGive: () => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? words : words.slice(0, 3);
  return (
    <View>
      <SectionHead label="Words of support" count={words.length} />
      <Text style={styles.note}>Givers can leave a few words or a prayer with their gift. Every message is checked before it appears, and amounts are never shown.</Text>
      {shown.map((w, i) => (
        <View key={w.date + i} style={styles.item}>
          <View style={styles.wordHead}>
            <Text style={styles.wordName}>
              {w.name}{w.waiting ? ' (you — only you can see this until it is reviewed)' : w.own ? ' (you)' : ''}
            </Text>
            <Text style={styles.meta}>{formatDay(w.date)}</Text>
          </View>
          <Text style={[styles.body, { color: colors.ink, marginTop: 6 }]}>{w.message}</Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        {words.length > 3 && <More onPress={() => setAll((a) => !a)}>{all ? 'Show fewer' : `Show all ${words.length}`}</More>}
        <More onPress={onGive}>Give and leave words of support</More>
      </View>
    </View>
  );
}

// People carrying this burden with their own circle.
export function FundraisersSection({
  fundraisers, highlightId, onGiveThrough, onStart,
}: {
  fundraisers: Fundraiser[]; highlightId?: string;
  onGiveThrough: (f: Fundraiser) => void; onStart: () => void;
}) {
  return (
    <View>
      <SectionHead label="Carrying it with others" count={fundraisers.length} />
      <Text style={styles.note}>
        Anyone can raise for this burden among their own friends. Every gift still goes straight to the
        church's verified account.
      </Text>
      <View style={{ gap: 12, marginTop: 16 }}>
        {fundraisers.map((f) => (
          <View key={f.id} style={f.id === highlightId ? styles.highlight : undefined}>
            <Tile padding={20} style={{ gap: 12 }}>
              <View style={styles.wordHead}>
                <Text style={styles.frName}>{f.name}{f.own ? ' (you)' : ''}</Text>
                <Text style={styles.frSince}>SINCE {formatDay(f.started)}</Text>
              </View>
              <Text style={styles.frNote}>{f.note}</Text>
              <Progress value={f.raised} goal={f.goal} onNavy />
              <View style={styles.frFoot}>
                <Text style={styles.frSince}>{formatMoney(f.raised)} of {formatMoney(f.goal)}</Text>
                <Button variant="onNavy" style={{ paddingVertical: 10, paddingHorizontal: 14 }} onPress={() => onGiveThrough(f)}>
                  {`Give through ${f.own ? 'your page' : f.name.split(' ')[0]}`}
                </Button>
              </View>
            </Tile>
          </View>
        ))}
      </View>
      <Button variant="ghost" style={{ marginTop: 20, alignSelf: 'flex-start' }} onPress={onStart}>
        Fundraise for this burden
      </Button>
    </View>
  );
}

// The link, the phone's own share menu (which also copies), WhatsApp and Email.
export function ShareOptions({
  campaign, church, fundraiser, onPoster,
}: { campaign: Campaign; church: Church; fundraiser?: Fundraiser | null; onPoster?: () => void }) {
  const url = shareUrl(campaign.id, fundraiser?.id);
  const text = shareText(campaign, church, fundraiser);
  const rows: { label: string; onPress: () => void }[] = [
    { label: 'Share or copy link', onPress: () => { Share.share({ message: `${text} ${url}`, url, title: campaign.title }).catch(() => {}); } },
    { label: 'WhatsApp', onPress: () => { Linking.openURL('whatsapp://send?text=' + encodeURIComponent(`${text} ${url}`)).catch(() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(`${text} ${url}`))); } },
    { label: 'Email', onPress: () => { Linking.openURL('mailto:?subject=' + encodeURIComponent(campaign.title) + '&body=' + encodeURIComponent(`${text}\n\n${url}`)).catch(() => {}); } },
    ...(onPoster ? [{ label: 'QR code for church', onPress: onPoster }] : []),
  ];
  return (
    <View>
      <Label>Your link</Label>
      <View style={styles.linkBox}>
        <Text selectable numberOfLines={1} style={styles.linkText}>{url}</Text>
      </View>
      <View style={{ marginTop: 8 }}>
        {rows.map((r) => (
          <Pressable key={r.label} onPress={r.onPress} accessibilityRole="button" style={({ pressed }) => [styles.shareRow, pressed && { opacity: 0.6 }]}>
            <Text style={styles.shareLabel}>{r.label}</Text>
            <Text style={styles.shareLabel}>→</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// A sheet over the page, as GoFundMe's "Quick share", in BURDEN's paper and hairlines.
export function ShareSheet({
  open, onClose, campaign, church, fundraiser, onFundraise, onPoster,
}: {
  open: boolean; onClose: () => void; campaign: Campaign; church: Church;
  fundraiser?: Fundraiser | null; onFundraise?: () => void; onPoster?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Share this burden</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
        <ShareOptions
          campaign={campaign} church={church} fundraiser={fundraiser}
          onPoster={onPoster ? () => { onClose(); onPoster(); } : undefined}
        />
        {onFundraise && (
          <View style={{ marginTop: 24 }}>
            <Label>Carry it further</Label>
            <Text style={[styles.body, { fontSize: 13 }]}>
              Start your own page for this burden and invite your friends, church or colleagues to give through it.
            </Text>
            <Button style={{ marginTop: 16 }} onPress={() => { onClose(); onFundraise(); }}>Fundraise for this burden</Button>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  count: { fontFamily: font.regular, fontSize: 12, letterSpacing: 1, color: colors.inkMuted },
  body: { fontFamily: font.regular, fontSize: 13, lineHeight: 22, color: colors.inkSoft, marginTop: 10 },
  note: { fontFamily: font.regular, fontSize: 11, lineHeight: 17, color: colors.inkMuted, marginTop: 10 },
  meta: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, lineHeight: 15, color: colors.inkMuted },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.ruleSoft },
  updateTitle: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, color: colors.ink, marginTop: 8 },
  more: {
    fontFamily: font.regular, fontSize: 11, letterSpacing: 1, color: colors.ink,
    textDecorationLine: 'underline', marginTop: 16,
  },
  wordHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  wordName: { fontFamily: font.bold, fontSize: 13, color: colors.ink, flexShrink: 1 },
  highlight: { borderWidth: 2, borderColor: colors.ink, borderRadius: 17, padding: 1 },
  frName: { fontFamily: font.bold, fontSize: 14, color: tile.ink, flexShrink: 1 },
  frSince: { fontFamily: font.regular, fontSize: 10, letterSpacing: 1, color: tile.muted },
  frNote: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: tile.soft },
  frFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  linkBox: { borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 12, marginTop: 12 },
  linkText: { fontFamily: font.regular, fontSize: 12, color: colors.inkSoft },
  shareRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.ruleSoft,
  },
  shareLabel: { fontFamily: font.regular, fontSize: 14, color: colors.ink },
  scrim: { flex: 1, backgroundColor: 'rgba(10,10,10,0.45)' },
  sheet: { backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.rule },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: font.bold, fontSize: 18, color: colors.ink },
  close: { fontSize: 24, lineHeight: 26, color: colors.ink, fontFamily: font.regular },
});
