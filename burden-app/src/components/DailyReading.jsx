// DailyReading — overhaul §6. A small, quiet, reverent block at the bottom
// of the home feed. Deterministic by day-of-year: every visitor sees the
// same passage on the same calendar day in their locale. No commentary,
// no byline, no card, no border — typography and whitespace only.

import { colors, font, type } from '../theme.js'
import readings from '../data/dailyReadings.json'

const dayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
  return Math.floor(diff / 86_400_000)
}

export default function DailyReading({ date = new Date() }) {
  const passage = readings[dayOfYear(date) % readings.length]
  return (
    <section
      aria-label="Daily reading"
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '128px 0 96px',
        textAlign: 'center',
      }}
    >
      <p style={{
        fontFamily: font.serif,
        fontSize: type['2xl'].fontSize,
        lineHeight: type['2xl'].lineHeight,
        letterSpacing: '-1.5%',
        fontStyle: 'italic',
        fontWeight: 400,
        color: colors.ink,
        margin: 0,
      }}>
        {passage.text}
      </p>
      <div style={{
        marginTop: 24,
        fontFamily: font.sans,
        fontSize: type.sm.fontSize,
        lineHeight: type.sm.lineHeight,
        letterSpacing: '6%',
        textTransform: 'uppercase',
        color: colors.inkSoft,
      }}>
        {passage.ref}
      </div>
    </section>
  )
}
