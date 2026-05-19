import { useEffect, useRef } from 'react'
import { burdens, formatMoney, pct, vibrate } from '../data/burdens.js'

// Hinge-style horizontal swipe deck — one full-bleed glass tile per burden.
// Replaces the old "Discover" category grid; same route name kept so existing
// links still land here.

export default function Discover({ navigate }) {
  const deckRef = useRef(null)

  useEffect(() => {
    if (deckRef.current) deckRef.current.scrollLeft = 0
  }, [])

  function openBurden(id) {
    vibrate(14)
    navigate({ name: 'campaign', id, from: 'deck' })
  }

  function back() {
    vibrate(12)
    navigate({ name: 'home' })
  }

  return (
    <section className="screen">
      <div className="sub-header">
        <button type="button" className="back-btn" onClick={back}>← Back</button>
        <span className="sub-title">Burdens</span>
        <span className="sub-spacer" />
      </div>
      <div className="deck-area">
        <div className="deck" ref={deckRef}>
          {burdens.length === 0 ? (
            <div className="deck-empty">No burdens right now.<br />Check back soon.</div>
          ) : (
            burdens.map((b) => {
              const p = pct(b.state.raised, b.state.goal)
              return (
                <div
                  key={b.id}
                  className="tile"
                  role="button"
                  tabIndex={0}
                  onClick={() => openBurden(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openBurden(b.id)
                  }}
                >
                  <h2 className="tile-name">{b.name}</h2>
                  <span className="tile-church">{b.church}</span>
                  <div className="tile-body">{b.objective}</div>
                  <div className="tile-progress">
                    <div className="progress-bar"><span style={{ width: p + '%' }} /></div>
                    <div className="tile-meta">
                      <span>
                        {formatMoney(b.state.raised, b.state.currency)} of {formatMoney(b.state.goal, b.state.currency)}
                      </span>
                      <span>{b.prayer.members} praying</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="deck-hint">Swipe to browse · Tap to read</div>
    </section>
  )
}
