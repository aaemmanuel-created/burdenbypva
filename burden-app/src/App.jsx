import { useState, useCallback, useMemo } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Splash from './screens/Splash.jsx'
import Home from './screens/Home.jsx'
import Discover from './screens/Discover.jsx'
import Campaign from './screens/Campaign.jsx'
import Give from './screens/Give.jsx'
import History from './screens/History.jsx'
import Profile from './screens/Profile.jsx'
import Spree from './screens/Spree.jsx'
import About from './screens/About.jsx'

// Joined prayer groups, recorded gifts, the splash gate, account credit,
// and donor name all live in App state. No persistence yet — refresh
// resets everything.

export default function App() {
  const [splashShown, setSplashShown] = useState(true)
  const [route, setRoute] = useState({ name: 'home' })
  const [gifts, setGifts] = useState([])
  const [joinedPrayerGroups, setJoinedPrayerGroups] = useState(new Set())
  const [creditBalance, setCreditBalance] = useState(0)
  const [donorName, setDonorName] = useState('')

  const navigate = useCallback((next) => {
    setRoute(next)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const recordGift = useCallback((gift) => {
    setGifts(prev => [...prev, gift])
    // If the gift was paid from the donor's account credit, debit it.
    if (gift.fromCredit) {
      setCreditBalance(b => Math.max(0, Math.round((b - gift.amount) * 100) / 100))
    }
  }, [])

  const togglePrayerGroup = useCallback((burdenId) => {
    setJoinedPrayerGroups(prev => {
      const next = new Set(prev)
      if (next.has(burdenId)) next.delete(burdenId); else next.add(burdenId)
      return next
    })
  }, [])

  const addCredit = useCallback((amount) => {
    setCreditBalance(b => Math.round((b + Number(amount)) * 100) / 100)
  }, [])

  const updateName = useCallback((name) => {
    setDonorName(name)
  }, [])

  // Profile object passed to screens that read donor identity / balance / gifts.
  const profile = useMemo(() => ({
    name: donorName,
    creditBalance,
    gifts,
    giftCount: gifts.length,
  }), [donorName, creditBalance, gifts])

  if (splashShown) {
    return <Splash onDismiss={() => setSplashShown(false)} />
  }

  let screen
  switch (route.name) {
    case 'discover': screen = <Discover navigate={navigate} />; break
    case 'campaign': screen = (
      <Campaign
        id={route.id}
        navigate={navigate}
        joined={joinedPrayerGroups.has(route.id)}
        onTogglePrayer={() => togglePrayerGroup(route.id)}
      />
    ); break
    case 'give':     screen = (
      <Give
        id={route.id}
        navigate={navigate}
        recordGift={recordGift}
        profile={profile}
      />
    ); break
    case 'history':  screen = <History gifts={gifts} navigate={navigate} />; break
    case 'profile':  screen = (
      <Profile
        profile={profile}
        navigate={navigate}
        addCredit={addCredit}
        updateName={updateName}
      />
    ); break
    case 'spree':    screen = <Spree navigate={navigate} profile={profile} />; break
    case 'about':    screen = <About />; break
    case 'home':
    default:         screen = <Home navigate={navigate} />; break
  }

  return (
    <>
      <Header
        route={route}
        navigate={navigate}
        givingCount={gifts.length}
        creditBalance={creditBalance}
      />
      {screen}
      <Footer />
    </>
  )
}
