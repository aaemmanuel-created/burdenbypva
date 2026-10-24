import { tile, font, type } from '../theme.js'
import { Badge, Button, FundingSquare, Label, Progress, Tile, formatMoney } from './UI.jsx'

// One burden as a tile — used by Home (highlight, grid, Shared Burdens) and
// Discover, so every list shows the same card. Mirrors the native
// HighlightCard / ProjectCard: category + trust badges, funding square,
// title, church with city/country beneath, progress. Only the essentials;
// the detail lives on the burden's page.

export default function BurdenTile({ campaign, church, onOpen, highlight = false }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100)
  const hasPhoto = !!campaign.image
  return (
    <Tile
      as={highlight ? 'div' : 'button'}
      // The highlight card has its own "View burden" button, so the card itself
      // isn't a second control (WCAG: no interactive element inside another).
      onClick={highlight ? undefined : onOpen}
      padding={highlight ? 28 : 20}
      minHeight={hasPhoto ? undefined : highlight ? 320 : 220}
      image={campaign.image}
      imageColour={campaign.imageColour}
      funded={campaign.raised / campaign.goal}
      style={{ gap: 12, flex: 1 }}
      ariaLabel={`${campaign.title}, ${church.name}, ${pct}% funded`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge onNavy>{campaign.category}</Badge>
          {church.verified && <Badge onNavy>{church.tier}</Badge>}
        </div>
        <FundingSquare raised={campaign.raised} goal={campaign.goal} size={highlight ? 18 : 16} />
      </div>

      {hasPhoto && <div style={{ flex: 1 }} aria-hidden />}

      <div>
        <div style={{
          fontFamily: font.sans,
          fontSize: highlight ? `clamp(${type.xl.fontSize}px, 4vw, ${type['2xl'].fontSize}px)` : type.lg.fontSize,
          fontWeight: 600, lineHeight: 1.25, color: tile.ink,
        }}>{campaign.title}</div>
        <div style={{
          fontFamily: font.sans, fontSize: type.xs.fontSize, letterSpacing: '6%',
          textTransform: 'uppercase', color: tile.muted, marginTop: 10, lineHeight: 1.5,
        }}>
          {church.name}
          <br />
          <span style={{ opacity: 0.8 }}>{church.location}</span>
        </div>
      </div>

      {highlight && (
        <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Stat label="Raised" value={formatMoney(campaign.raised)} />
          <Stat label="Goal" value={formatMoney(campaign.goal)} />
        </div>
      )}

      <div>
        <Progress value={campaign.raised} goal={campaign.goal} onNavy />
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: font.sans, fontSize: type.xs.fontSize, color: tile.soft,
        }}>
          <span>{pct}% funded</span>
          <span>{campaign.daysLeft}{highlight ? ' days' : 'd'} left</span>
        </div>
      </div>

      {highlight && (
        <Button variant="onNavy" full onClick={(e) => { e.stopPropagation(); onOpen() }} style={{ marginTop: 4 }}>View burden</Button>
      )}
    </Tile>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <Label onNavy>{label}</Label>
      <div style={{ fontFamily: font.sans, fontSize: type.xl.fontSize, fontWeight: 600, marginTop: 4, color: tile.ink }}>
        {value}
      </div>
    </div>
  )
}
