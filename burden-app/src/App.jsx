import { useState, useCallback, useEffect, useMemo } from 'react'
import Header from './components/Header.jsx'
import Dock from './components/Dock.jsx'
import Footer from './components/Footer.jsx'
import Splash from './screens/Splash.jsx'
import Home from './screens/Home.jsx'
import Discover from './screens/Discover.jsx'
import Campaign from './screens/Campaign.jsx'
import Give from './screens/Give.jsx'
import History from './screens/History.jsx'
import Profile from './screens/Profile.jsx'
import About from './screens/About.jsx'
import GiftDetail from './screens/GiftDetail.jsx'
import Fundraise from './screens/Fundraise.jsx'
import { takeCheckoutReturn } from './lib/payments.js'
import { isGiven, settleDemoGift } from './lib/giftTimeline.js'
import { takeShareLink } from './lib/community.js'

// Joined prayer groups, recorded gifts, the splash gate, account credit,
// and donor name all live in App state. Gifts are also kept in this
// browser's localStorage so their tracking timeline survives a refresh
// and the round trip to a payment provider's checkout page.

const GIFTS_KEY = 'burden-gifts-v1'

function loadGifts() {
  try {
    const saved = JSON.parse(localStorage.getItem(GIFTS_KEY) || '[]')
    return Array.isArray(saved) ? saved.map(g => settleDemoGift(g)) : []
  } catch {
    return []
  }
}

// Fundraisers the donor starts are kept beside their gifts.
const FUNDRAISERS_KEY = 'burden-fundraisers-v1'

function loadFundraisers() {
  try {
    const saved = JSON.parse(localStorage.getItem(FUNDRAISERS_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

// Coming back from checkout skips the splash and opens that gift; a shared
// link (?burden=…) skips it and opens that burden.
const checkoutReturn = takeCheckoutReturn()
const shareLink = checkoutReturn ? null : takeShareLink()

function firstRoute() {
  if (checkoutReturn) return { name: 'gift', id: checkoutReturn.id }
  if (shareLink) return { name: 'campaign', id: shareLink.id, fundraiserId: shareLink.fundraiserId }
  return { name: 'home' }
}

export default function App() {
  const [splashShown, setSplashShown] = useState(!checkoutReturn && !shareLink)
  const [route, setRoute] = useState(firstRoute)
  const [gifts, setGifts] = useState(() => {
    const saved = loadGifts()
    // A gift we've never seen (e.g. checkout finished on another tab): keep
    // a stub so GiftDetail can fetch the rest from the server.
    if (checkoutReturn && !saved.some(g => g.id === checkoutReturn.id)) {
      saved.push({ id: checkoutReturn.id, token: checkoutReturn.token, live: true, status: 'initiated', events: [] })
    }
    return saved
  })

  useEffect(() => {
    try { localStorage.setItem(GIFTS_KEY, JSON.stringify(gifts)) } catch { /* private mode — keep in memory */ }
  }, [gifts])
  const [fundraisers, setFundraisers] = useState(loadFundraisers)
  useEffect(() => {
    try { localStorage.setItem(FUNDRAISERS_KEY, JSON.stringify(fundraisers)) } catch { /* private mode */ }
  }, [fundraisers])
  const addFundraiser = useCallback((f) => {
    setFundraisers(prev => [f, ...prev])
  }, [])
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

  const updateGift = useCallback((id, patch) => {
    setGifts(prev => prev.map(g => (g.id === id ? { ...g, ...patch } : g)))
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
  // Only gifts that actually went through count as giving.
  const givenGifts = useMemo(() => gifts.filter(isGiven), [gifts])
  const profile = useMemo(() => ({
    name: donorName,
    creditBalance,
    gifts: givenGifts,
    giftCount: givenGifts.length,
  }), [donorName, creditBalance, givenGifts])

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
        gifts={gifts}
        fundraisers={fundraisers}
        fundraiserId={route.fundraiserId}
      />
    ); break
    case 'give':     screen = (
      <Give
        id={route.id}
        navigate={navigate}
        recordGift={recordGift}
        profile={profile}
        fundraisers={fundraisers}
        fundraiserId={route.fundraiserId}
      />
    ); break
    case 'fundraise': screen = (
      <Fundraise
        id={route.id}
        navigate={navigate}
        profile={profile}
        addFundraiser={addFundraiser}
      />
    ); break
    case 'history':  screen = <History gifts={gifts} navigate={navigate} />; break
    case 'gift':     screen = (
      <GiftDetail
        gift={gifts.find(g => g.id === route.id)}
        navigate={navigate}
        updateGift={updateGift}
      />
    ); break
    case 'profile':  screen = (
      <Profile
        profile={profile}
        navigate={navigate}
        addCredit={addCredit}
        updateName={updateName}
      />
    ); break
    case 'about':    screen = <About />; break
    case 'home':
    default:         screen = <Home navigate={navigate} profile={profile} />; break
  }

  return (
    <>
      <Header navigate={navigate} creditBalance={creditBalance} />
      {screen}
      <Footer />
      <Dock route={route} navigate={navigate} givingCount={givenGifts.length} />
    </>
  )
}
