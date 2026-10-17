import { colors, font, type } from '../theme.js'
import { buildTimeline } from '../lib/giftTimeline.js'

// Vertical step-by-step tracker for one gift. Done steps are evergreen,
// the step in progress is ochre, a declined payment is red, and steps
// still to come are hollow.

const DOT = 14

const tone = {
  done: colors.trust,
  current: colors.warn,
  failed: colors.fundLow,
  upcoming: colors.ruleSoft,
  stopped: colors.ruleSoft,
}

function Dot({ state }) {
  const c = tone[state]
  const filled = state === 'done' || state === 'failed'
  return (
    <span aria-hidden="true" style={{
      width: DOT, height: DOT, borderRadius: '50%', flexShrink: 0,
      boxSizing: 'border-box',
      border: `2px solid ${c}`,
      background: filled ? c
        : state === 'current' ? `linear-gradient(90deg, ${c} 50%, transparent 50%)`
        : colors.bg,
      color: colors.bg, fontSize: 9, lineHeight: `${DOT - 4}px`, textAlign: 'center', fontWeight: 600,
    }}>{state === 'failed' ? '×' : ''}</span>
  )
}

export default function Timeline({ gift }) {
  const steps = buildTimeline(gift)
  return (
    <ol aria-label="Gift progress" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        const muted = s.state === 'upcoming' || s.state === 'stopped'
        return (
          <li key={s.key} style={{ display: 'flex', gap: 16 }}
            aria-current={s.state === 'current' ? 'step' : undefined}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
              <Dot state={s.state} />
              {!last && (
                <span aria-hidden="true" style={{
                  width: 2, flex: 1, minHeight: 24, margin: '4px 0',
                  background: s.state === 'done' ? colors.trust : colors.ruleSoft,
                }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: last ? 0 : 24, opacity: s.state === 'stopped' ? 0.5 : 1 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: font.sans, fontSize: type.base.fontSize, fontWeight: 500,
                  color: s.state === 'failed' ? colors.fundLow : muted ? colors.inkSoft : colors.ink,
                }}>
                  {s.label}
                  <span style={visuallyHidden}>{` — ${stateWord[s.state]}`}</span>
                </span>
                {s.time && (
                  <span style={{ fontSize: type.xs.fontSize, color: colors.inkMuted, letterSpacing: '2%' }}>{s.time}</span>
                )}
              </div>
              {s.detail && (
                <p style={{
                  margin: '4px 0 0', fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight,
                  color: muted ? colors.inkMuted : colors.inkSoft,
                }}>{s.detail}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const stateWord = {
  done: 'done', current: 'in progress', failed: 'did not go through', upcoming: 'not yet', stopped: 'will not happen',
}

const visuallyHidden = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
}
