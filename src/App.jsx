// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './lib/AuthContext'
import { useToast } from './lib/ToastContext'
import { useLibrary } from './hooks/useLibrary'

import Navbar             from './components/Navbar'
import DiscoverPage       from './pages/DiscoverPage'
import GameDetailPage     from './pages/GameDetailPage'
import LibraryPage        from './pages/LibraryPage'
import ForYouPage         from './pages/ForYouPage'
import SuggestPage        from './pages/SuggestPage'
import ProfilePage        from './pages/ProfilePage'
import SettingsPage       from './pages/SettingsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFoundPage       from './pages/NotFoundPage'
import { FilterProvider } from './lib/FilterContext'
import FriendsPage     from './pages/FriendsPage'
import ActivityPage    from './pages/ActivityPage'
import ForumPage       from './pages/ForumPage'
import ForumPostPage   from './pages/ForumPostPage'

export default function App() {
  const { user }  = useAuth()
  const toast     = useToast()
  const location  = useLocation()

  const { library, toggleLibrary, removeFromLibrary, updateRating } = useLibrary()

  const [subscriptions, setSubscriptions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gv_subs') || '{"developers":[]}') }
    catch { return { developers: [] } }
  })

  const saveSubs = (s) => { setSubscriptions(s); localStorage.setItem('gv_subs', JSON.stringify(s)) }

  const handleSubscribe = (type, slug, name) => {
    const arr  = subscriptions[type] || []
    const next = arr.includes(slug) ? arr.filter((x) => x !== slug) : [...arr, slug]
    saveSubs({ ...subscriptions, [type]: next })
    toast(next.includes(slug) ? `Following ${name}` : `Unfollowed ${name}`, 'info')
  }

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  const handleLibraryToggle = async (game, rating = null, keepIfPresent = false) => {
    const inLib = library.some((g) => g.id === game.id)
    if (inLib && keepIfPresent) {
      if (rating !== null) { await updateRating(game.id, rating); toast(`Rated ${rating}★`, 'success') }
    } else if (inLib) {
      await removeFromLibrary(game.id); toast('Removed from library', 'info')
    } else {
      await toggleLibrary(game, rating, false); toast(`Added "${game.name}" to library ✓`, 'success')
    }
  }

  const sharedProps = { library, onLibraryToggle: handleLibraryToggle, subscriptions, onSubscribe: handleSubscribe }

  // Pages that hide the navbar (full-screen flows)
  const hideNav = ['/forgot-password'].includes(location.pathname)

  return (
    <>
    <FilterProvider>
        {!hideNav && <Navbar libraryCount={library.length} />}
        <Routes>
          <Route path="/"                  element={<DiscoverPage {...sharedProps} />} />
          <Route path="/game/:id"          element={<GameDetailPage {...sharedProps} />} />
          <Route path="/library"           element={
            <LibraryPage
              library={library}
              onRemoveFromLibrary={async (id) => { await removeFromLibrary(id); toast('Removed from library', 'info') }}
              onUpdateRating={async (id, r) => { await updateRating(id, r); toast(`Rating updated to ${r}★`, 'success') }}
            />
          } />
          <Route path="/foryou"            element={<ForYouPage library={library} subscriptions={subscriptions} />} />
          <Route path="/suggest"           element={<SuggestPage />} />
          <Route path="/profile/:uid"      element={<ProfilePage />} />
          <Route path="/settings"          element={<SettingsPage />} />
          <Route path="/forgot-password"   element={<ForgotPasswordPage />} />
          <Route path="*"                  element={<NotFoundPage />} />
          <Route path="/friends"        element={<FriendsPage />} />
          <Route path="/activity"       element={<ActivityPage />} />
          <Route path="/forum"          element={<ForumPage />} />
          <Route path="/forum/:postId"  element={<ForumPostPage />} />
        </Routes>
      </FilterProvider>
    </>
  )
}
