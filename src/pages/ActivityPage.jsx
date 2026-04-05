// src/pages/ActivityPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { Spinner, Empty, Tag } from '../components/ui'
import { fmtDate } from '../lib/constants'

/* ── Activity type config ── */
const TYPE_CFG = {
  library:    { icon: '◻', label: 'added to library',  color: 'var(--cyan)'       },
  review:     { icon: '★', label: 'reviewed',           color: 'var(--amber)'      },
  suggestion: { icon: '◎', label: 'suggested',         color: 'var(--violet-mid)' },
  forum:      { icon: '◈', label: 'posted in forum',   color: 'var(--green)'      },
}

function TimeAgo({ ts }) {
  if (!ts?.toDate) return <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>recently</span>
  const d = ts.toDate()
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const str = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : hours < 24 ? `${hours}h ago` : days < 7 ? `${days}d ago` : fmtDate(d)
  return <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>{str}</span>
}

function ActivityCard({ item, navigate }) {
  const cfg = TYPE_CFG[item.type] || TYPE_CFG.library
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'var(--bg2)', border: `1px solid ${hovered ? 'var(--border3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', gap: 14, transition: 'border-color .18s' }}
    >
      {/* User avatar */}
      <button onClick={() => navigate(`/profile/${item.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        {item.photoURL
          ? <img src={item.photoURL} alt={item.displayName} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15, fontFamily: 'var(--font-display)' }}>{item.displayName?.charAt(0)}</div>
        }
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <button onClick={() => navigate(`/profile/${item.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, color: 'var(--text0)', fontSize: '.88rem', fontFamily: 'var(--font-body)' }}>
            {item.displayName}
          </button>
          <span style={{ color: cfg.color, fontSize: '.8rem', fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
          {item.gameId && (
            <button onClick={() => navigate(`/game/${item.gameId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--cyan)', fontSize: '.83rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              {item.gameName}
            </button>
          )}
        </div>
        


        {/* Detail text (review excerpt, suggestion desc, etc.) */}
        {item.detail && (
          <p style={{ fontSize: '.83rem', color: 'var(--text1)', lineHeight: 1.6, marginBottom: item.gameImage ? 8 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{item.detail}"
          </p>
        )}

        {/* Rating stars for reviews */}
        {item.rating && (
          <p style={{ color: 'var(--amber)', fontSize: '.8rem', marginTop: 4 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p>
        )}
        <TimeAgo ts={item.createdAt} />
      </div>

      {/* Game thumbnail */}
      {item.gameImage && item.gameId && (
        <button onClick={() => navigate(`/game/${item.gameId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <img src={item.gameImage} alt={item.gameName} style={{ width: 80, height: 54, borderRadius: 8, objectFit: 'cover', display: 'block', opacity: hovered ? 1 : .85, transition: 'opacity .18s' }} />
        </button>
      )}
      
    </div>
  )
}

export default function ActivityPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [friendIds, setFriendIds]   = useState([])
  const [filter, setFilter]         = useState('all')

  // ── Load friends list ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const q = collection(db, 'friends', user.uid, 'list')
    return onSnapshot(q, snap => {
      setFriendIds(snap.docs.map(d => d.id))
    })
  }, [user?.uid])

  // ── Load activity for friends ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    if (friendIds.length === 0) { setActivities([]); setLoading(false); return }

    setLoading(true)
    // Firestore 'in' supports max 30 items per query
    const chunks = []
    for (let i = 0; i < friendIds.length; i += 30) chunks.push(friendIds.slice(i, i + 30))

    const unsubs = chunks.map(chunk => {
      const q = query(
        collection(db, 'activity'),
        where('uid', 'in', chunk),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      return onSnapshot(q, snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setActivities(prev => {
          // merge chunks, deduplicate by id, sort by date
          const merged = [...prev.filter(x => !chunk.includes(x.uid)), ...items]
          merged.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          return merged.slice(0, 100)
        })
        setLoading(false)
      })
    })

    return () => unsubs.forEach(u => u())
  }, [user?.uid, friendIds.join(',')])

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter)

  if (!user) return (
    <div className="page">
      <Empty icon="📡" title="Sign In to See Activity" body="Connect with friends to see what they're playing and reviewing.">
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </Empty>
    </div>
  )

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>
          <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Friend Activity</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>See what your friends are playing, reviewing, and recommending.</p>
      </div>

      {/* Filters */}
      <div className="scroll-row" style={{ marginBottom: 24 }}>
        {[
          { key: 'all',        label: '⬡ All' },
          { key: 'library',    label: '◻ Added' },
          { key: 'review',     label: '★ Reviews' },
          { key: 'suggestion', label: '◎ Suggestions' },
          { key: 'forum',      label: '◈ Forum' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className={`pill ${filter === key ? 'active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner center /> : friendIds.length === 0 ? (
        <Empty icon="👥" title="No friends yet" body="Add friends to see their gaming activity here.">
          <button className="btn btn-primary" onClick={() => navigate('/friends')}>Find Friends</button>
        </Empty>
      ) : filtered.length === 0 ? (
        <Empty icon="📡" title="No activity yet" body="Your friends haven't been active recently. Check back later!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => (
            <div key={item.id} className="anim-fade-up">
              <ActivityCard item={item} navigate={navigate} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
