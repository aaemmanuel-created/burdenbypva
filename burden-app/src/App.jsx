import { useCallback, useState } from 'react'
import Splash from './screens/Splash.jsx'
import Home from './screens/Home.jsx'
import Discover from './screens/Discover.jsx'
import List from './screens/List.jsx'
import Campaign from './screens/Campaign.jsx'

// Mobile-first single-screen app. Five surfaces:
//   intro    splash (Helvetica thank-you, tap to continue)
//   home     menu (BURDEN by PVA + three entry points)
//   list     "Burden of the Week" or "Spree" list with extras
//   deck     "Burdens" horizontal swipe carousel
//   campaign single-burden detail
//
// Routing is state-based so the app stays fully self-contained — no router
// dependency, no URL state, no server side. Joined prayer groups live in
// App state and persist to localStorage from the detail screen.

export default function App() {
  const [splashShown, setSplashShown] = useState(true)
  const [route, setRoute] = useState({ name: 'home' })
  const [joinedPrayerGroups, setJoinedPrayerGroups] = useState(new Set())

  const navigate = useCallback((next) => {
    setRoute(next)
  }, [])

  const togglePrayerGroup = useCallback((burdenId) => {
    setJoinedPrayerGroups((prev) => {
      const next = new Set(prev)
      if (next.has(burdenId)) next.delete(burdenId); else next.add(burdenId)
      return next
    })
  }, [])

  if (splashShown) {
    return (
      <>
        <div className="app-glow" aria-hidden="true" />
        <Splash onDismiss={() => setSplashShown(false)} />
      </>
    )
  }

  let screen
  switch (route.name) {
    case 'list':
      screen = <List view={route.view || 'weekly'} navigate={navigate} />
      break
    case 'deck':
    case 'discover':
      screen = <Discover navigate={navigate} />
      break
    case 'campaign':
      screen = (
        <Campaign
          id={route.id}
          from={route.from}
          view={route.view}
          navigate={navigate}
          joined={joinedPrayerGroups.has(route.id)}
          onTogglePrayer={() => togglePrayerGroup(route.id)}
        />
      )
      break
    case 'home':
    default:
      screen = <Home navigate={navigate} />
      break
  }

  return (
    <>
      <div className="app-glow" aria-hidden="true" />
      {screen}
    </>
  )
}
