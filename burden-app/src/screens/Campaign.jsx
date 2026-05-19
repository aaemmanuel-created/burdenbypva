import { useEffect, useRef, useState } from 'react'
import { findBurden, formatMoney, pct, vibrate } from '../data/burdens.js'

// Burden detail. Five sections from the data shape (current state, who
// handles what, money workflow, on the ground, prayer group) plus the
// sticky join / contribute action bar at the foot.

const STORAGE_KEY = 'burden.prayer.joined'

function loadJoined() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch (_) {
    return new Set()
  }
}

function saveJoined(set) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])) } catch (_) { /* no-op */ }
}

export default function Campaign({ id, from, view, navigate, joined: joinedProp, onTogglePrayer }) {
  const burden = findBurden(id)
  const scrollRef = useRef(null)
  const [joinedSet, setJoinedSet] = useState(() => loadJoined())
  const [contributed, setContributed] = useState(false)

  // Reset the inner scroller when a different burden is loaded.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setContributed(false)
  }, [id])

  if (!burden) {
    return (
      <section className="screen">
        <div className="sub-header">
          <button type="button" className="back-btn" onClick={() => navigate({ name: 'home' })}>← Back</button>
          <span className="sub-title">Burden</span>
          <span className="sub-spacer" />
        </div>
        <div className="detail-scroll"><p className="list-subtitle">Burden not found.</p></div>
      </section>
    )
  }

  // Prefer the prop pair from App (single source of truth across sessions);
  // fall back to local persistence if the parent doesn't pass anything.
  const isJoined = typeof joinedProp === 'boolean' ? joinedProp : joinedSet.has(burden.id)
  function toggleJoin() {
    if (typeof onTogglePrayer === 'function') {
      onTogglePrayer()
    } else {
      setJoinedSet((prev) => {
        const next = new Set(prev)
        if (next.has(burden.id)) next.delete(burden.id); else next.add(burden.id)
        saveJoined(next)
        return next
      })
    }
    vibrate(isJoined ? 10 : [18, 60, 24])
  }

  function back() {
    vibrate(12)
    if (from === 'deck') navigate({ name: 'deck' })
    else if (from === 'list') navigate({ name: 'list', view: view || 'weekly' })
    else navigate({ name: 'home' })
  }

  const p = pct(burden.state.raised, burden.state.goal)
  const reached = burden.state.raised >= burden.state.goal
  const memberCount = burden.prayer.members + (isJoined ? 1 : 0)

  return (
    <section className="screen detail">
      <div className="sub-header">
        <button type="button" className="back-btn" onClick={back}>← Back</button>
        <span className="sub-title">Burden</span>
        <span className="sub-spacer" />
      </div>
      <div className="detail-scroll" ref={scrollRef}>
        <div className="detail-head">
          <span className="detail-church">{burden.church} · {burden.tag}</span>
          <h2 className="detail-name">{burden.name}</h2>
          <p className="detail-objective">{burden.objective}</p>
          <div className="detail-progress">
            <div className="detail-progress-numbers">
              <span>
                <strong>{formatMoney(burden.state.raised, burden.state.currency)}</strong>
                {' of '}
                {formatMoney(burden.state.goal, burden.state.currency)}
              </span>
              <span>{reached ? 'Goal reached' : p + '%'}</span>
            </div>
            <div className="progress-bar"><span style={{ width: p + '%' }} /></div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Current State</h3>
          <p>{burden.state.note}</p>
        </div>

        <div className="detail-section">
          <h3>Who Handles What</h3>
          <ul className="role-list">
            {burden.handlers.map((h, i) => (
              <li key={`${h.role}-${i}`}>
                <span className="role">{h.role}</span>
                <span>{h.person}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-section">
          <h3>Money Workflow</h3>
          <ol className="workflow-steps">
            {burden.workflow.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="detail-section">
          <h3>On the Ground</h3>
          <p>{burden.delivery}</p>
        </div>

        <div className="prayer-section">
          <h3>Prayer Group</h3>
          <div className="prayer-meta">{memberCount} praying · {burden.prayer.meets}</div>
          <p>Donors who carry this burden also pray for it. Prayer here is specific to this burden — nothing generic.</p>
          {burden.prayer.focus && <p className="prayer-focus">“{burden.prayer.focus}”</p>}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className={'btn ' + (isJoined ? 'joined' : 'btn-ghost')}
            onClick={toggleJoin}
          >
            {isJoined ? '✓ In the prayer group' : 'Join the prayer group'}
          </button>
          {reached ? (
            <button type="button" className="btn btn-reached" disabled>✓ Goal reached</button>
          ) : contributed ? (
            <button type="button" className="btn btn-primary" disabled style={{ opacity: 0.85 }}>
              Thank you · receipt coming
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                vibrate([14, 40, 14])
                setContributed(true)
              }}
            >Contribute</button>
          )}
        </div>
      </div>
    </section>
  )
}
