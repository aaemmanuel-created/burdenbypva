// The burden page's community sections — Updates, Words of support,
// Fundraisers — and the Share sheet. Native twins of
// burden-app/src/components/Community.jsx.
import React, { useState } from 'react';
import { Linking, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Campaign, Church } from '../data/mock';
import { Button, Label, Progress, Tile } from './UI';
import { colors, font, formatMoney, tile } from '../constants/theme';
import { formatDay, shareText, shareUrl, type Fundraiser, type SupportWord, type Update } from '../lib/community';
import { useT } from '../lib/i18n';
import { reportContent } from '../lib/account';

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

const REASONS: [string, string][] = [
  ['scam', 'Scam or fraud'], ['abuse', 'Abusive or hateful'], ['false', 'Not true'],
  ['private', "Shares someone's private details"], ['other', 'Something else'],
];

// "Report" under an update, a word of support or a fundraiser. A person on
// the BURDEN team decides; nothing is taken down automatically.
export function ReportLink({ kind, refId, campaignId, onNavy = false }: { kind: string; refId: string; campaignId: string; onNavy?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [state, setState] = useState(''); // '', 'sending', 'sent', or an error
  const ink = onNavy ? tile.muted : colors.inkMuted;
  const strong = onNavy ? tile.ink : colors.ink;
  if (state === 'sent') return <Text accessibilityRole="text" style={[styles.report, { color: ink, textDecorationLine: 'none', marginTop: 8 }]}>Thank you. The BURDEN team will look at it.</Text>;
  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
        <Text style={[styles.report, { color: ink }]}>REPORT</Text>
      </Pressable>
    );
  }
  return (
    <View style={{ marginTop: 10, gap: 8 }} accessibilityLabel="Report this">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
        {REASONS.map(([id, label]) => (
          <Pressable key={id} onPress={() => setReason(id)} accessibilityRole="radio" accessibilityState={{ selected: reason === id }}
            style={[styles.reason, { borderColor: onNavy ? 'rgba(255,255,255,0.4)' : colors.rule }, reason === id && { backgroundColor: onNavy ? '#fff' : colors.ink }]}>
            <Text style={[styles.reasonText, { color: reason === id ? (onNavy ? colors.navyDeep : colors.accentInk) : strong }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput value={detail} onChangeText={setDetail} maxLength={500} placeholder="Anything else the team should know (optional)"
        placeholderTextColor={ink} accessibilityLabel="Anything else the team should know"
        style={[styles.reportInput, { color: strong, borderColor: onNavy ? 'rgba(255,255,255,0.4)' : colors.rule }]} />
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <Pressable disabled={!reason || state === 'sending'} accessibilityRole="button" hitSlop={8} onPress={async () => {
          setState('sending');
          try { await reportContent({ kind, ref: refId, campaignId, reason, detail }); setState('sent'); } catch (e) { setState((e as Error).message); }
        }}>
          <Text style={[styles.report, { color: reason ? strong : ink }]}>SEND REPORT</Text>
        </Pressable>
        <Pressable onPress={() => setOpen(false)} accessibilityRole="button" hitSlop={8}>
          <Text style={[styles.report, { color: ink }]}>CANCEL</Text>
        </Pressable>
      </View>
      {!!state && state !== 'sending' && <Text accessibilityRole="alert" style={[styles.reasonText, { color: colors.fundLow }]}>{state}</Text>}
    </View>
  );
}

// Dated posts from the burden's team — newest open, older ones folded.
export function UpdatesSection({ updates, campaignId }: { updates: Update[]; campaignId: string }) {
  const t = useT();
  const [all, setAll] = useState(false);
  const shown = all ? updates : updates.slice(0, 1);
  return (
    <View>
      <SectionHead label={t('campaign.updates')} count={updates.length} />
      {updates.length === 0 && (
        <Text style={styles.body}>The team posts a public update every month. The first is on its way.</Text>
      )}
      {shown.map((u, i) => (
        <View key={u.date + u.title} style={[styles.item, i === shown.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.meta}>{formatDay(u.date)} · {u.author.toUpperCase()}{u.role ? `, ${u.role.toUpperCase()}` : ''}</Text>
          <Text style={styles.updateTitle}>{u.title}</Text>
          <Text style={styles.body}>{u.body}</Text>
          <ReportLink kind="update" refId={(u as Update & { id?: string }).id ?? u.date + ' ' + u.title} campaignId={campaignId} />
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
export function SupportSection({ words, onGive, campaignId }: { words: SupportWord[]; onGive: () => void; campaignId: string }) {
  const t = useT();
  const [all, setAll] = useState(false);
  const shown = all ? words : words.slice(0, 3);
  return (
    <View>
      <SectionHead label={t('campaign.support')} count={words.length} />
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
          {!w.own && <ReportLink kind="support" refId={(w as SupportWord & { id?: string }).id ?? w.date + ' ' + w.name} campaignId={campaignId} />}
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
  fundraisers, highlightId, onGiveThrough, onStart, campaignId,
}: {
  fundraisers: Fundraiser[]; highlightId?: string; campaignId: string;
  onGiveThrough: (f: Fundraiser) => void; onStart: () => void;
}) {
  const t = useT();
  return (
    <View>
      <SectionHead label={t('campaign.carrying')} count={fundraisers.length} />
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
              {!f.own && <ReportLink kind="fundraiser" refId={f.id} campaignId={campaignId} onNavy />}
            </Tile>
          </View>
        ))}
      </View>
      <Button variant="ghost" style={{ marginTop: 20, alignSelf: 'flex-start' }} onPress={onStart}>
        {t('campaign.fundraise')}
      </Button>
    </View>
  );
}

// The link, the phone's own share menu (which also copies), WhatsApp and Email.
export function ShareOptions({
  campaign, church, fundraiser, onPoster,
}: { campaign: Campaign; church: Church; fundraiser?: Fundraiser | null; onPoster?: () => void }) {
  const t = useT();
  const url = shareUrl(campaign.id, fundraiser?.id);
  const text = shareText(campaign, church, fundraiser);
  const rows: { label: string; onPress: () => void }[] = [
    { label: t('share.shareOrCopy'), onPress: () => { Share.share({ message: `${text} ${url}`, url, title: campaign.title }).catch(() => {}); } },
    { label: 'WhatsApp', onPress: () => { Linking.openURL('whatsapp://send?text=' + encodeURIComponent(`${text} ${url}`)).catch(() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(`${text} ${url}`))); } },
    { label: t('share.email'), onPress: () => { Linking.openURL('mailto:?subject=' + encodeURIComponent(campaign.title) + '&body=' + encodeURIComponent(`${text}\n\n${url}`)).catch(() => {}); } },
    ...(onPoster ? [{ label: t('share.poster'), onPress: onPoster }] : []),
  ];
  return (
    <View>
      <Label>{t('share.link')}</Label>
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
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{t('share.title')}</Text>
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
            <Label>{t('share.further')}</Label>
            <Text style={[styles.body, { fontSize: 13 }]}>
              Start your own page for this burden and invite your friends, church or colleagues to give through it.
            </Text>
            <Button style={{ marginTop: 16 }} onPress={() => { onClose(); onFundraise(); }}>{t('campaign.fundraise')}</Button>
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
  report: { fontFamily: font.regular, fontSize: 11, letterSpacing: 1, textDecorationLine: 'underline' },
  reason: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10 },
  reasonText: { fontFamily: font.regular, fontSize: 12 },
  reportInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: font.regular, fontSize: 13 },
});
