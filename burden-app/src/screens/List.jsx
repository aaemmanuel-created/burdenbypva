import { useEffect, useState } from 'react'
import {
  burdens,
  spreeIds,
  spreeTotal,
  formatMoney,
  pct,
  vibrate,
} from '../data/burdens.js'

// Shared list screen used by the "Burden of the Week" and "Spree" entries.
// Spree gets a top horizontal carousel of the week's seven selections plus a
// per-burden ±$1 commit pill that persists in localStorage.

const VIEW_CONFIG = {
  weekly: {
    eyebrow: 'This Week',
    title: 'Burden of the Week',
    subtitle: '',
    subTitle: 'Burden',
    filter: (b) => b.featured === true,
  },
  spree: {
    eyebrow: "This Week's Challenge",
    title: 'Spree',
    subtitle:
      "This is a challenge to give a dollar to seven different Burdens. When you SPREE, you spend a total of seven dollars. We've gone ahead and selected seven burdens as part of this week's spree selection. You still have the option to choose from the wider list of burdens available to carry.",
    subTitle: 'Spree',
    filter: () => true,
  },
}

const SPREE_STORAGE_KEY = 'burden.spree.given'

function loadSpree() {
  try {
    const raw = localStorage.getItem(SPREE_STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch (_) {
    return new Set()
  }
}

function saveSpree(set) {
  try {
    localStorage.setItem(SPREE_STORAGE_KEY, JSON.stringify([...set]))
  } catch (_) { /* no-op */ }
}

export default function List({ view, navigate }) {
  const cfg = VIEW_CONFIG[view] || VIEW_CONFIG.weekly
  const items = burdens.filter(cfg.filter)

  const [spreeGiven, setSpreeGiven] = useState(() => loadSpree())

  useEffect(() => {
    const scroller = document.querySelector('.list-scroll')
    if (scroller) scroller.scrollTop = 0
  }, [view])

  function toggleSpree(id) {
    setSpreeGiven((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        vibrate(10)
      } else {
        next.add(id)
        vibrate([18, 50, 22])
      }
      saveSpree(next)
      return next
    })
  }

  function openBurden(id) {
    vibrate(14)
    navigate({ name: 'campaign', id, from: 'list', view })
  }

  function back() {
    vibrate(12)
    navigate({ name: 'home' })
  }

  const givenInSpree = [...spreeGiven].filter((id) => spreeIds.has(id)).length

  return (
    <section className="screen">
      <div className="sub-header">
        <button type="button" className="back-btn" onClick={back}>← Back</button>
        <span className="sub-title">{cfg.subTitle}</span>
        <span className="sub-spacer" />
      </div>
      <div className="list-scroll">
        <div className="list-head">
          <span className="list-eyebrow">{cfg.eyebrow}</span>
          <h1 className="list-title">{cfg.title}</h1>
          {cfg.subtitle && <p className="list-subtitle">{cfg.subtitle}</p>}
        </div>

        {view === 'spree' && (
          <>
            <div className="spree-counter">
              <span className="spree-counter-label">Your Spree</span>
              <span className="spree-counter-value">
                ${givenInSpree} of ${spreeTotal} given
              </span>
            </div>

            <div className="spree-deck">
              {burdens
                .filter((b) => spreeIds.has(b.id))
                .map((b) => {
                  const reached = b.state.raised >= b.state.goal
                  const isGiven = spreeGiven.has(b.id)
                  const p = pct(b.state.raised, b.state.goal)
                  return (
                    <div
                      key={b.id}
                      className={'spree-tile' + (reached ? ' funded' : '')}
                      role="button"
                      tabIndex={0}
                      onClick={() => openBurden(b.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openBurden(b.id)
                      }}
                    >
                      <h3 className="spree-tile-name">{b.name}</h3>
                      <span className="burden-card-church">{b.church}</span>
                      <p className="spree-tile-objective">{b.objective}</p>
                      <div className="spree-tile-progress">
                        <div className="progress-bar"><span style={{ width: p + '%' }} /></div>
                      </div>
                      <div className="spree-tile-foot">
                        <span className="spree-tile-meta">
                          {formatMoney(b.state.raised, b.state.currency)} of {formatMoney(b.state.goal, b.state.currency)}
                        </span>
                        {reached ? (
                          <button type="button" className="spree-action-pill" disabled>
                            ✓ Goal reached
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={'spree-action-pill' + (isGiven ? ' given' : '')}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSpree(b.id)
                            }}
                          >
                            {isGiven ? '✓ $1' : '+ $1'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="spree-section-label">Wider list of burdens</div>
          </>
        )}

        <div className="burden-list">
          {items.length === 0 ? (
            <p className="list-subtitle">No burdens here right now. Check back soon.</p>
          ) : (
            items.map((b) => {
              const reached = b.state.raised >= b.state.goal
              const p = pct(b.state.raised, b.state.goal)
              const featured = b.featured && view === 'weekly'
              const classes = [
                'burden-card',
                featured ? 'featured' : '',
                reached ? 'funded' : '',
              ].filter(Boolean).join(' ')
              return (
                <div
                  key={b.id}
                  className={classes}
                  role="button"
                  tabIndex={0}
                  onClick={() => openBurden(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openBurden(b.id)
                  }}
                >
                  {reached ? (
                    <span className="funded-flag">Goal reached</span>
                  ) : featured ? (
                    <span className="featured-flag">This Week</span>
                  ) : null}
                  <h2 className="burden-card-name">{b.name}</h2>
                  <span className="burden-card-church">{b.church}</span>
                  <p className="burden-card-objective">{b.objective}</p>
                  <div className="burden-card-progress">
                    <div className="progress-bar"><span style={{ width: p + '%' }} /></div>
                    <div className="burden-card-meta">
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
    </section>
  )
}
