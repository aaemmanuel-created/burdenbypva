import { vibrate } from '../data/burdens.js'

// Menu screen — BURDEN by PVA mark + the three entry points.
// "Burdens" opens the swipe deck; "Burden of the Week" and "Spree" open the
// list screen with different headings and (for Spree) extra widgets.

export default function Home({ navigate }) {
  function go(target) {
    vibrate(14)
    navigate(target)
  }

  return (
    <section className="screen menu">
      <div className="brand">
        <span className="brand-name">BURDEN</span>
        <span className="brand-tag">by PVA</span>
      </div>
      <div className="menu-list">
        <button
          type="button"
          className="menu-item"
          onClick={() => go({ name: 'list', view: 'weekly' })}
        >Burden of the Week</button>
        <button
          type="button"
          className="menu-item"
          onClick={() => go({ name: 'deck' })}
        >Burdens</button>
        <button
          type="button"
          className="menu-item"
          onClick={() => go({ name: 'list', view: 'spree' })}
        >Spree</button>
      </div>
    </section>
  )
}
