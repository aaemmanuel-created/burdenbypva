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
import Poster from './screens/Poster.jsx'
import Church from './screens/Church.jsx'
import Admin from './screens/Admin.jsx'
import ChurchApply from './screens/ChurchApply.jsx'
import { takeCheckoutReturn } from './lib/payments.js'
import { isGiven, settleDemoGift } from './lib/giftTimeline.js'
import { takeShareLink } from './lib/community.js'
import { authLive, callFunction, currentSession, signOut as endSession } from './lib/auth.js'
import { deleteAccount, saveDemoAccount, syncAccount } from './lib/account.js'
import { applyBurdenContent, loadBurdenContent, useDemoTrust } from './lib/trust.js'

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
// Church dashboard demo (no server): updates posted and payout accounts
// submitted in this browser.
const CHURCH_UPDATES_KEY = 'burden-church-updates-v1'
const CHURCH_PAYOUTS_KEY = 'burden-church-payouts-v1'

function loadJson(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null')
    return v ?? fallback
  } catch {
    return fallback
  }
}

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
  const closeOwnFundraiser = useCallback((id) => {
    setFundraisers(prev => prev.map(f => (f.id === id ? { ...f, closed: true } : f)))
  }, [])
  const [churchUpdates, setChurchUpdates] = useState(() => loadJson(CHURCH_UPDATES_KEY, []))
  const [demoPayouts, setDemoPayouts] = useState(() => loadJson(CHURCH_PAYOUTS_KEY, {}))
  useEffect(() => {
    try {
      localStorage.setItem(CHURCH_UPDATES_KEY, JSON.stringify(churchUpdates))
      localStorage.setItem(CHURCH_PAYOUTS_KEY, JSON.stringify(demoPayouts))
    } catch { /* private mode */ }
  }, [churchUpdates, demoPayouts])
  const addChurchUpdate = useCallback((u) => setChurchUpdates(prev => [u, ...prev]), [])
  const setDemoPayout = useCallback((churchId, p) => setDemoPayouts(prev => ({ ...prev, [churchId]: p })), [])
  const [joinedPrayerGroups, setJoinedPrayerGroups] = useState(new Set())
  const [creditBalance, setCreditBalance] = useState(0)
  const [donorName, setDonorName] = useState('')

  // ── The giver's account (lib/account.js) ──
  // Signed in, gifts and fundraisers belong to the person, not this browser:
  // what was made here is added to the account, and the account's come here.
  const [account, setAccount] = useState(null) // { email }
  const [accountError, setAccountError] = useState('')
  const signIn = useCallback(async (session) => {
    const email = session?.user?.email
    if (!email) return
    setAccountError('')
    try {
      const acc = await syncAccount(email, gifts, fundraisers)
      setGifts(acc.gifts.map(g => settleDemoGift(g)))
      setFundraisers(acc.fundraisers)
      setAccount({ email })
    } catch (e) {
      setAccountError(e.message)
    }
  }, [gifts, fundraisers])
  useEffect(() => { currentSession().then(s => s?.user?.email && signIn(s)) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Signing out leaves nothing of the account on this browser.
  const signOutAccount = useCallback(async ({ remove = false } = {}) => {
    if (remove) await deleteAccount(account?.email)
    await endSession()
    setAccount(null); setGifts([]); setFundraisers([])
  }, [account])
  // Demo: every change while signed in is saved to the account.
  useEffect(() => { if (account) saveDemoAccount(account.email, gifts, fundraisers) }, [account, gifts, fundraisers])
  // Live: a gift made while signed in is added to the account once it goes through.
  useEffect(() => {
    if (!authLive || !account) return
    const fresh = gifts.filter(g => g.live && g.token && !g.account && isGiven(g))
    if (!fresh.length) return
    callFunction('account', 'POST', { action: 'claim', gifts: fresh.map(g => ({ id: g.id, token: g.token })) })
      .then(() => setGifts(prev => prev.map(g => (fresh.some(f => f.id === g.id) ? { ...g, account: true } : g))))
      .catch(() => { /* retried on the next change */ })
  }, [account, gifts])

  // Wording churches changed on their burdens, after BURDEN approved it.
  const trust = useDemoTrust()
  const [liveContent, setLiveContent] = useState(null)
  useEffect(() => { if (authLive) loadBurdenContent().then(setLiveContent).catch(() => {}) }, [])
  applyBurdenContent(authLive ? liveContent : trust.content)

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
        churchUpdates={churchUpdates}
        account={account}
      />
    ); break
    case 'admin':    screen = (
      <Admin navigate={navigate} demoPayouts={demoPayouts} setDemoPayout={setDemoPayout} />
    ); break
    case 'apply':    screen = <ChurchApply navigate={navigate} />; break
    case 'church':   screen = (
      <Church
        navigate={navigate}
        gifts={gifts}
        updateGift={updateGift}
        churchUpdates={churchUpdates}
        addChurchUpdate={addChurchUpdate}
        demoPayouts={demoPayouts}
        setDemoPayout={setDemoPayout}
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
        account={account}
      />
    ); break
    case 'fundraise': screen = (
      <Fundraise
        id={route.id}
        navigate={navigate}
        profile={profile}
        addFundraiser={addFundraiser}
        account={account}
        onSignIn={signIn}
      />
    ); break
    case 'poster':   screen = (
      <Poster id={route.id} navigate={navigate} fundraisers={fundraisers} fundraiserId={route.fundraiserId} />
    ); break
    case 'history':  screen = <History gifts={gifts} navigate={navigate} account={account} />; break
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
        account={account}
        accountError={accountError}
        onSignIn={signIn}
        onSignOut={signOutAccount}
        fundraisers={fundraisers}
        closeFundraiser={closeOwnFundraiser}
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
      <Footer navigate={navigate} />
      <Dock route={route} navigate={navigate} givingCount={givenGifts.length} />
    </>
  )
}
