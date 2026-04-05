// src/pages/FriendsPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, orderBy, getDoc, setDoc, limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Avatar, Spinner, Empty } from '../components/ui'
import { fmtDate } from '../lib/constants'

/* ── tiny avatar placeholder ── */
function UserAvatar({ u, size = 40 }) {
  if (u.photoURL) return <img src={u.photoURL} alt={u.displayName} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: size * .4, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
      {u.displayName?.charAt(0).toUpperCase()}
    </div>
  )
}

/* ── Tabs ── */
const TABS = ['Find People', 'Requests', 'My Friends']

export default function FriendsPage() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Find People')

  // search
  const [searchQ, setSearchQ]     = useState('')
  const [searchResults, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debounce = useRef(null)

  // data
  const [incoming, setIncoming]   = useState([])
  const [outgoing, setOutgoing]   = useState([])
  const [friends, setFriends]     = useState([])
  const [loadingFriends, setLoadingFriends] = useState(true)

  // ── Realtime: incoming requests ────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'friendRequests'), where('to', '==', user.uid), where('status', '==', 'pending'))
    return onSnapshot(q, (snap) => setIncoming(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user?.uid])

  // ── Realtime: outgoing requests ────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'friendRequests'), where('from', '==', user.uid), where('status', '==', 'pending'))
    return onSnapshot(q, (snap) => setOutgoing(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user?.uid])

  // ── Realtime: friends list ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setLoadingFriends(true)
    const q = collection(db, 'friends', user.uid, 'list')
    return onSnapshot(q, (snap) => {
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoadingFriends(false)
    })
  }, [user?.uid])

  // ── Search users ───────────────────────────────────────────────────────
  const handleSearch = (v) => {
    setSearchQ(v)
    clearTimeout(debounce.current)
    if (v.trim().length < 2) { setResults([]); return }
    setSearching(true)
    debounce.current = setTimeout(async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'users'),
          where('displayName', '>=', v),
          where('displayName', '<=', v + '\uf8ff'),
          limit(10)
        ))
        const results = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.uid !== user?.uid)
        setResults(results)
      } catch (e) { console.error(e) }
      setSearching(false)
    }, 350)
  }

  // ── Friend request actions ─────────────────────────────────────────────
  const sendRequest = async (target) => {
    if (!user) return toast('Sign in first', 'warning')
    // check not already friends
    const already = friends.find(f => f.uid === target.uid)
    if (already) return toast('Already friends!', 'info')
    // check no existing request
    const existing = outgoing.find(r => r.to === target.uid)
    if (existing) return toast('Request already sent', 'info')
    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: user.uid,
        fromName: profile?.displayName || user.displayName,
        fromPhoto: profile?.photoURL || user.photoURL || null,
        to: target.uid,
        toName: target.displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      toast(`Friend request sent to ${target.displayName}!`, 'success')
    } catch (e) { toast('Could not send request', 'error') }
  }

  const acceptRequest = async (req) => {
    try {
      await updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' })
      // add to both users' friends lists
      await setDoc(doc(db, 'friends', user.uid, 'list', req.from), {
        uid: req.from, displayName: req.fromName, photoURL: req.fromPhoto || null, addedAt: serverTimestamp(),
      })
      await setDoc(doc(db, 'friends', req.from, 'list', user.uid), {
        uid: user.uid, displayName: profile?.displayName || user.displayName, photoURL: profile?.photoURL || user.photoURL || null, addedAt: serverTimestamp(),
      })
      toast(`You and ${req.fromName} are now friends!`, 'success')
    } catch (e) { toast('Could not accept request', 'error') }
  }

  const declineRequest = async (req) => {
    try {
      await updateDoc(doc(db, 'friendRequests', req.id), { status: 'declined' })
      toast('Request declined', 'info')
    } catch (e) { toast('Could not decline', 'error') }
  }

  const removeFriend = async (friend) => {
    try {
      await deleteDoc(doc(db, 'friends', user.uid, 'list', friend.uid))
      await deleteDoc(doc(db, 'friends', friend.uid, 'list', user.uid))
      toast(`Removed ${friend.displayName} from friends`, 'info')
    } catch (e) { toast('Could not remove friend', 'error') }
  }

  const cancelRequest = async (req) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', req.id))
      toast('Request cancelled', 'info')
    } catch (e) { toast('Could not cancel', 'error') }
  }

  if (!user) return (
    <div className="page">
      <Empty icon="👥" title="Sign In to See Friends" body="Create an account to connect with other players.">
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </Empty>
    </div>
  )

  const friendIds = new Set(friends.map(f => f.uid))
  const outgoingIds = new Set(outgoing.map(r => r.to))
  const incomingIds = new Set(incoming.map(r => r.from))

  const getRelation = (uid) => {
    if (friendIds.has(uid)) return 'friends'
    if (outgoingIds.has(uid)) return 'pending-out'
    if (incomingIds.has(uid)) return 'pending-in'
    return 'none'
  }

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>
          <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Friends</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Connect with other players, see their activity, share your taste.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 2 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: 'none', border: 'none', padding: '10px 18px', fontSize: '.87rem', fontFamily: 'var(--font-body)', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--cyan)' : 'var(--text2)', borderBottom: `2px solid ${tab === t ? 'var(--cyan)' : 'transparent'}`, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 7 }}>
            {t}
            {t === 'Requests' && incoming.length > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 999, minWidth: 18, height: 18, fontSize: '.62rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{incoming.length}</span>
            )}
            {t === 'My Friends' && friends.length > 0 && (
              <span style={{ background: 'var(--bg4)', color: 'var(--text2)', borderRadius: 999, minWidth: 18, height: 18, fontSize: '.62rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{friends.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Find People ── */}
      {tab === 'Find People' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', fontSize: 16 }}>⌕</span>
            <input className="input" style={{ paddingLeft: 36, fontSize: '.92rem' }}
              value={searchQ} onChange={e => handleSearch(e.target.value)}
              placeholder="Search by display name…" autoComplete="off" />
          </div>

          {searching && <Spinner center />}

          {!searching && searchQ.length >= 2 && searchResults.length === 0 && (
            <Empty icon="👤" title="No users found" body={`No one found matching "${searchQ}"`} />
          )}

          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {searchResults.map(u => {
                const rel = getRelation(u.uid)
                return (
                  <div key={u.uid} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={() => navigate(`/profile/${u.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 12, flex: 1, textAlign: 'left' }}>
                      <UserAvatar u={u} />
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.92rem' }}>{u.displayName}</p>
                        {u.bio && <p style={{ fontSize: '.76rem', color: 'var(--text2)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</p>}
                      </div>
                    </button>
                    {rel === 'friends' && <span style={{ fontSize: '.78rem', color: 'var(--green)', fontWeight: 600, background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,.3)', borderRadius: 999, padding: '4px 12px' }}>✓ Friends</span>}
                    {rel === 'pending-out' && <span style={{ fontSize: '.78rem', color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 999, padding: '4px 12px' }}>Pending…</span>}
                    {rel === 'pending-in' && <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '.78rem' }} onClick={() => acceptRequest(incoming.find(r => r.from === u.uid))}>Accept</button>}
                    {rel === 'none' && <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '.78rem', flexShrink: 0 }} onClick={() => sendRequest(u)}>+ Add Friend</button>}
                  </div>
                )
              })}
            </div>
          )}

          {searchQ.length < 2 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: '.9rem' }}>Type at least 2 characters to search for players</p>
            </div>
          )}
        </div>
      )}

      {/* ── Requests ── */}
      {tab === 'Requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Incoming */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text0)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 14 }}>
              Incoming {incoming.length > 0 && <span style={{ color: 'var(--cyan)' }}>({incoming.length})</span>}
            </h2>
            {incoming.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: '.86rem' }}>No pending incoming requests.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incoming.map(req => (
                  <div key={req.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/profile/${req.from}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 12, flex: 1, textAlign: 'left' }}>
                      <UserAvatar u={{ displayName: req.fromName, photoURL: req.fromPhoto }} />
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.9rem' }}>{req.fromName}</p>
                        <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2 }}>Wants to be your friend</p>
                      </div>
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '.82rem' }} onClick={() => acceptRequest(req)}>Accept</button>
                      <button className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: '.82rem', color: 'var(--red)' }} onClick={() => declineRequest(req)}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text0)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 14 }}>
              Sent <span style={{ color: 'var(--text3)' }}>({outgoing.length})</span>
            </h2>
            {outgoing.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: '.86rem' }}>No pending outgoing requests.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {outgoing.map(req => (
                  <div key={req.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <UserAvatar u={{ displayName: req.toName, photoURL: null }} />
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.9rem' }}>{req.toName}</p>
                        <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2 }}>Request pending…</p>
                      </div>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '.78rem' }} onClick={() => cancelRequest(req)}>Cancel</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── My Friends ── */}
      {tab === 'My Friends' && (
        <div>
          {loadingFriends ? <Spinner center /> : friends.length === 0 ? (
            <Empty icon="👥" title="No friends yet" body="Search for players and send friend requests to connect.">
              <button className="btn btn-primary" onClick={() => setTab('Find People')}>Find People</button>
            </Empty>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(auto, 1fr))', gap: 14 }}>
              {friends.map(f => (
                <div key={f.uid} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color .18s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <button onClick={() => navigate(`/profile/${f.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <UserAvatar u={f} size={44} />
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.92rem' }}>{f.displayName}</p>
                      <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 3 }}>Friends since {f.addedAt?.toDate ? fmtDate(f.addedAt.toDate()) : 'recently'}</p>
                    </div>
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '7px 0', fontSize: '.78rem' }} onClick={() => navigate(`/profile/${f.uid}`)}>View Profile</button>
                    <button className="btn btn-ghost" style={{ padding: '7px 10px', fontSize: '.78rem', color: 'var(--red)' }} onClick={() => removeFriend(f)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
