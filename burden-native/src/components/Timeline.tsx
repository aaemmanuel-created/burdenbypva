// Vertical step-by-step tracker for one gift — native twin of
// burden-app/src/components/Timeline.jsx.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../constants/theme';
import { buildTimeline, type StepState } from '../lib/giftTimeline';
import type { Gift } from '../data/mock';

const DOT = 14;

const tone: Record<StepState, string> = {
  done: colors.trust,
  current: colors.warn,
  failed: colors.fundLow,
  upcoming: colors.ruleSoft,
  stopped: colors.ruleSoft,
};

const stateWord: Record<StepState, string> = {
  done: 'done', current: 'in progress', failed: 'did not go through', upcoming: 'not yet', stopped: 'will not happen',
};

function Dot({ state }: { state: StepState }) {
  const c = tone[state];
  const filled = state === 'done' || state === 'failed';
  return (
    <View style={[styles.dot, { borderColor: c, backgroundColor: filled ? c : colors.bg }]}>
      {state === 'current' && <View style={[styles.halfDot, { backgroundColor: c }]} />}
      {state === 'failed' && <Text style={styles.cross}>×</Text>}
    </View>
  );
}

export default function Timeline({ gift }: { gift: Gift }) {
  const steps = buildTimeline(gift);
  return (
    <View accessibilityLabel="Gift progress">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const muted = s.state === 'upcoming' || s.state === 'stopped';
        return (
          <View
            key={s.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${s.label}, ${stateWord[s.state]}. ${s.time ?? ''}. ${s.detail ?? ''}`}
          >
            <View style={styles.rail}>
              <Dot state={s.state} />
              {!last && (
                <View style={[styles.line, { backgroundColor: s.state === 'done' ? colors.trust : colors.ruleSoft }]} />
              )}
            </View>
            <View style={[styles.body, last && { paddingBottom: 0 }, s.state === 'stopped' && { opacity: 0.5 }]}>
              <View style={styles.head}>
                <Text style={[
                  styles.label,
                  muted && { color: colors.inkSoft },
                  s.state === 'failed' && { color: colors.fundLow },
                ]}>{s.label}</Text>
                {s.time ? <Text style={styles.time}>{s.time}</Text> : null}
              </View>
              {s.detail ? (
                <Text style={[styles.detail, muted && { color: colors.inkMuted }]}>{s.detail}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', paddingTop: 3 },
  dot: {
    width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  halfDot: { position: 'absolute', left: 0, top: 0, bottom: 0, width: DOT / 2 - 2 },
  cross: { color: colors.bg, fontSize: 9, lineHeight: 10, fontFamily: font.bold },
  line: { width: 2, flex: 1, minHeight: 24, marginVertical: 4 },
  body: { flex: 1, paddingBottom: 22 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  label: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  time: { fontFamily: font.regular, fontSize: 10, color: colors.inkMuted },
  detail: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft, marginTop: 4 },
});
