// src/components/FriendsModal.jsx
// Rendered from the Navbar dropdown — shows friends list and quick links
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { createPortal } from 'react-dom'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'

export default function FriendsModal({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends]       = useState([])
  const [pendingReqs, setPending]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('friends') // 'friends' | 'pending'

  useEffect(() => {
    if (!user) return
    const unsub1 = onSnapshot(collection(db, 'friends', user.uid, 'list'), snap => {
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsub2 = onSnapshot(
      query(collection(db, 'friendRequests'), where('to', '==', user.uid), where('status', '==', 'pending')),
      snap => setPending(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsub1(); unsub2() }
  }, [user?.uid])

  const go = (path) => { navigate(path); onClose() }

  const content = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,8,13,.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', animation: 'fadeIn .2s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg2)', border: '1px solid var(--border3)', borderRadius: 18, width: '100%', maxWidth: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 64px rgba(0,0,0,.95), 0 0 40px rgba(0,212,255,.06)', animation: 'modalIn .25s ease', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text0)', letterSpacing: '.04em', textTransform: 'uppercase', margin: 0 }}>Friends</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
            {[
              { key: 'friends', label: `Friends (${friends.length})` },
              { key: 'pending', label: `Requests${pendingReqs.length > 0 ? ` (${pendingReqs.length})` : ''}`, badge: pendingReqs.length },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ background: 'none', border: 'none', padding: '8px 14px', fontSize: '.82rem', fontFamily: 'var(--font-body)', fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? 'var(--cyan)' : 'var(--text2)', borderBottom: `2px solid ${tab === t.key ? 'var(--cyan)' : 'transparent'}`, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                {t.badge > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 999, minWidth: 16, height: 16, fontSize: '.58rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : tab === 'friends' ? (
            friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>👥</p>
                <p style={{ color: 'var(--text2)', fontSize: '.86rem', marginBottom: 16 }}>You don't have any friends yet.</p>
                <button className="btn btn-primary" style={{ fontSize: '.82rem' }} onClick={() => go('/friends')}>Find Friends</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {friends.map(f => (
                  <button key={f.uid} onClick={() => go(`/profile/${f.uid}`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 8px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', width: '100%', transition: 'background .15s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {f.photoURL
                      ? <img src={f.photoURL} alt={f.displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14, fontFamily: 'var(--font-display)', flexShrink: 0 }}>{f.displayName?.charAt(0)}</div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.displayName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            pendingReqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                <p style={{ color: 'var(--text2)', fontSize: '.86rem' }}>No pending requests.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendingReqs.map(req => (
                  <div key={req.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 13, flexShrink: 0 }}>{req.fromName?.charAt(0)}</div>
                    <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.86rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.fromName}</p>
                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '.76rem' }} onClick={() => go('/friends')}>Review</button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '.82rem' }} onClick={() => go('/friends')}>
            Manage Friends
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '.82rem' }} onClick={() => go('/activity')}>
            Activity Feed
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
