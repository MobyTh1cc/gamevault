// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Avatar } from './ui'
import AuthModal from './AuthModal'
import FriendsModal from './FriendsModal'

const NAV_LINKS = [
  { to: '/',        label: 'Discover', icon: '📖' },
  { to: '/foryou',  label: 'For You',  icon: '🫵' },
  { to: '/library', label: 'Library',  icon: '📚' },
  { to: '/forum',   label: 'Forum',    icon: '🗫' },
  { to: '/suggest', label: 'Suggest',  icon: '💡' },
]

export default function Navbar({ libraryCount }) {
  const { user, profile, logOut } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [showAuth, setShowAuth]         = useState(false)
  const [authMode, setAuthMode]         = useState('login')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobile, setShowMobile]     = useState(false)
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Watch incoming friend requests for badge
  useEffect(() => {
    if (!user) { setPendingCount(0); return }
    const q = query(collection(db, 'friendRequests'), where('to', '==', user.uid), where('status', '==', 'pending'))
    return onSnapshot(q, snap => setPendingCount(snap.size))
  }, [user?.uid])

  const handleLogOut = async () => {
    await logOut()
    setShowUserMenu(false)
    setShowMobile(false)
    toast('Signed out', 'info')
  }

  const openAuth = (mode) => {
    setAuthMode(mode)
    setShowAuth(true)
    setShowMobile(false)
  }

  const go = (path) => {
    navigate(path)
    setShowUserMenu(false)
    setShowMobile(false)
  }

  return (
    <>
      {/* ── Main nav bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 'var(--nav-h)',
        background: 'rgba(7,8,13,.92)',
        backdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 8,
        boxShadow: 'inset 0 1px 0 rgba(0,212,255,.15)',
      }}>

        {/* Logo */}
        <div className='home-btn'>
          <button onClick={() => go('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginRight: 6, flexShrink: 0, padding: '4px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, boxShadow: '0 0 16px rgba(0,212,255,.3)' }}>🎮</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '.04em', textTransform: 'uppercase', background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GameVault</span>
          </button>
        </div>

        {/* Desktop nav links */}
        <nav style={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }} className="Desktop-nav-links">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 7,
                fontSize: '.82rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--cyan)' : 'var(--text2)',
                background: isActive ? 'rgba(0,212,255,.08)' : 'none',
                border: `1px solid ${isActive ? 'rgba(0,212,255,.25)' : 'transparent'}`,
                textDecoration: 'none', transition: 'all .18s', whiteSpace: 'nowrap', letterSpacing: '.01em',
              })}
            >
              <span style={{ fontSize: 13, opacity: .85 }}>{icon}</span>
              <span className="nav-label">{label}</span>
              {to === '/library' && libraryCount > 0 && (
                <span style={{ background: 'var(--grad)', color: '#fff', borderRadius: 999, minWidth: 17, height: 17, fontSize: '.6rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', letterSpacing: 0 }}>{libraryCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {user ? (
            <div style={{ position: 'relative' }} className="user-btn">
              <button onClick={() => setShowUserMenu(p => !p)}
                style={{ background: showUserMenu ? 'rgba(0,212,255,.08)' : 'none', border: `1px solid ${showUserMenu ? 'rgba(0,212,255,.25)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', transition: 'all .18s', WebkitTapHighlightColor: 'transparent' }}>
                <Avatar user={user} profile={profile} size={28} />
                <h4 style={{ color: 'white', fontWeight: 600, fontSize: '.84rem', margin: 0, fontFamily: 'var(--font-body)' }}>{user.displayName}</h4>
                {pendingCount > 0 && (
                  <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: '.6rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>
                )}
                <span style={{ color: 'var(--text1)', fontSize: '.7rem', lineHeight: 1 }}>▾</span>
              </button>

              {showUserMenu && (
                <>
                  <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                  <div className="anim-slide-down" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'var(--bg2)', border: '1px solid var(--border3)', borderRadius: 12, padding: '8px 6px', minWidth: 210, boxShadow: 'var(--shadow-xl), 0 0 30px rgba(0,212,255,.08)', zIndex: 11 }}>
                    {/* User info */}
                    <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                      <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text0)', fontFamily: 'var(--font-body)' }}>{profile?.displayName || user.displayName}</p>
                      <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>

                    {[
                      { icon: '👤', label: 'My Profile',  path: `/profile/${user.uid}` },
                      { icon: '📚', label: 'My Library',  path: '/library' },
                      { icon: '📡', label: 'Activity Feed', path: '/activity' },
                      { icon: '⚙️', label: 'Settings',    path: '/settings' },
                    ].map(({ icon, label, path }) => (
                      <button key={path} onClick={() => go(path)}
                        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text1)', padding: '9px 12px', textAlign: 'left', borderRadius: 7, fontSize: '.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .15s, color .15s', fontFamily: 'var(--font-body)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,.07)'; e.currentTarget.style.color = 'var(--cyan)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text1)' }}
                      >
                        <span style={{ opacity: .7, fontSize: 12 }}>{icon}</span> {label}
                      </button>
                    ))}

                    {/* Friends button — opens modal */}
                    <button onClick={() => { setShowUserMenu(false); setShowFriendsModal(true) }}
                      style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text1)', padding: '9px 12px', textAlign: 'left', borderRadius: 7, fontSize: '.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .15s, color .15s', fontFamily: 'var(--font-body)', justifyContent: 'space-between' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,.07)'; e.currentTarget.style.color = 'var(--cyan)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text1)' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ opacity: .7, fontSize: 12 }}>👥</span> Friends
                      </span>
                      {pendingCount > 0 && (
                        <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 999, minWidth: 18, height: 18, fontSize: '.62rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{pendingCount} new</span>
                      )}
                    </button>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
                      <button onClick={handleLogOut}
                        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--red)', padding: '9px 12px', textAlign: 'left', borderRadius: 7, fontSize: '.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-body)', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      ><span style={{ opacity: .8, fontSize: 12 }}> ➜] </span> Sign Out</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="desktop-auth" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: '.82rem' }} onClick={() => openAuth('login')}>Sign In</button>
              <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '.82rem' }} onClick={() => openAuth('signup')}>Join Free</button>
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setShowMobile(p => !p)} aria-label="Toggle menu" className="hamburger-btn"
            style={{ display: 'none', background: showMobile ? 'rgba(0,212,255,.1)' : 'var(--bg3)', border: `1px solid ${showMobile ? 'rgba(0,212,255,.3)' : 'var(--border2)'}`, color: showMobile ? 'var(--cyan)' : 'var(--text1)', borderRadius: 7, padding: '6px 10px', fontSize: 17, lineHeight: 1, cursor: 'pointer', transition: 'all .18s', WebkitTapHighlightColor: 'transparent' }}
          >{showMobile ? '✕' : '☰'}</button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {showMobile && (
        <>
          <div onClick={() => setShowMobile(false)} style={{ position: 'fixed', inset: 0, zIndex: 148, background: 'rgba(7,8,13,.75)', backdropFilter: 'blur(4px)' }} />
          <div className="anim-slide-down" style={{ position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, zIndex: 149, background: 'var(--bg1)', borderBottom: '1px solid var(--border)', padding: '14px 16px 20px', boxShadow: '0 8px 40px rgba(0,0,0,.9)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
              {NAV_LINKS.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setShowMobile(false)}
                  style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, fontWeight: isActive ? 700 : 500, fontSize: '.95rem', color: isActive ? 'var(--cyan)' : 'var(--text1)', background: isActive ? 'rgba(0,212,255,.07)' : 'none', border: `1px solid ${isActive ? 'rgba(0,212,255,.2)' : 'transparent'}`, textDecoration: 'none' })}>
                  <span style={{ fontSize: 16 }}>{icon}</span><span>{label}</span>
                  {to === '/library' && libraryCount > 0 && <span style={{ background: 'var(--grad)', color: '#fff', borderRadius: 999, minWidth: 20, height: 20, fontSize: '.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', marginLeft: 'auto' }}>{libraryCount}</span>}
                </NavLink>
              ))}
              {user && (
                <>
                  <button onClick={() => { setShowMobile(false); go('/activity') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, fontWeight: 500, fontSize: '.95rem', color: 'var(--text1)', background: 'none', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                    <span style={{ fontSize: 16 }}>📡</span><span>Activity</span>
                  </button>
                  <button onClick={() => { setShowMobile(false); go('/friends') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, fontWeight: 500, fontSize: '.95rem', color: 'var(--text1)', background: 'none', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                    <span style={{ fontSize: 16 }}>👥</span><span>Friends</span>
                    {pendingCount > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 999, minWidth: 20, height: 20, fontSize: '.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', marginLeft: 'auto' }}>{pendingCount}</span>}
                  </button>
                </>
              )}
            </div>
            {user ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button onClick={() => go(`/profile/${user.uid}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: 'none', border: 'none', color: 'var(--text1)', fontSize: '.92rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <Avatar user={user} profile={profile} size={26} /><span style={{ fontWeight: 600 }}>{profile?.displayName || user.displayName}</span>
                </button>
                <button onClick={() => go('/settings')} style={{ padding: '10px 14px', borderRadius: 9, background: 'none', border: 'none', color: 'var(--text1)', fontSize: '.92rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>⚙️ Settings</button>
                <button onClick={handleLogOut} style={{ padding: '10px 14px', borderRadius: 9, background: 'none', border: 'none', color: 'var(--red)', fontSize: '.92rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>➜] Sign Out</button>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openAuth('login')}>Sign In</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openAuth('signup')}>Join Free</button>
              </div>
            )}
          </div>
        </>
      )}

      {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onSwitchMode={setAuthMode} />}
      {showFriendsModal && <FriendsModal onClose={() => setShowFriendsModal(false)} />}

      <style>{`
        @media (max-width: 520px) {
          .hamburger-btn { display: flex !important; align-items: center; }
          .desktop-auth  { display: none !important; }
          .Desktop-nav-links { display: none !important; }
          .user-btn { display: none !important; }
          .home-btn { flex: 1 1 0% }
        }
        @media (max-width: 400px) { .nav-label { display: none !important; } }
      `}</style>
    </>
  )
}
