// src/pages/ForumPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  where, updateDoc, doc, setDoc, deleteDoc, getDoc, increment, limit,
} from 'firebase/firestore'
import { createPortal } from 'react-dom'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Tag, Spinner, Empty } from '../components/ui'
import { fmtDate } from '../lib/constants'
import { searchGames } from '../lib/api'

export const FORUM_CATEGORIES = [
  { key: 'general',     label: 'General',         icon: '◈', color: 'var(--cyan)'       },
  { key: 'new-release', label: 'New Release',      icon: '🆕', color: 'var(--green)'     },
  { key: 'help',        label: 'Help & Tips',      icon: '❓', color: 'var(--amber)'     },
  { key: 'easter-eggs', label: 'Easter Eggs',      icon: '🥚', color: 'var(--violet-mid)'},
  { key: 'lore',        label: 'Lore & Story',     icon: '📖', color: 'var(--cyan)'      },
  { key: 'bugs',        label: 'Bugs & Issues',    icon: '🐛', color: 'var(--red)'       },
  { key: 'mods',        label: 'Mods & Patches',   icon: '⚙',  color: 'var(--text1)'    },
  { key: 'discussion',  label: 'Discussion',       icon: '💬', color: 'var(--violet-mid)'},
]

/* ── Game picker for new post form ── */
function MiniGamePicker({ selected, onChange }) {
  const [q, setQ]           = useState('')
  const [results, setRes]   = useState([])
  const [open, setOpen]     = useState(false)
  const [busy, setBusy]     = useState(false)
  const debRef              = useRef(null)
  const wrapRef             = useRef(null)

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const search = v => {
    setQ(v); setOpen(true)
    clearTimeout(debRef.current)
    if (v.length < 2) { setRes([]); return }
    setBusy(true)
    debRef.current = setTimeout(async () => {
      const r = await searchGames(v, 6).catch(() => [])
      setRes(r); setBusy(false)
    }, 350)
  }

  if (selected) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
      {selected.background_image && <img src={selected.background_image} alt="" style={{ width: 44, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
      <span style={{ fontWeight: 600, color: 'var(--text0)', fontSize: '.86rem', flex: 1 }}>{selected.name}</span>
      <button type="button" onClick={() => onChange(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16 }}>✕</button>
    </div>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input className="input" value={q} onChange={e => search(e.target.value)} onFocus={() => q.length >= 2 && setOpen(true)}
        placeholder="Search for a game (optional)…" autoComplete="off" />
      {open && (results.length > 0 || busy) && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
          {busy && <div style={{ padding: 10, color: 'var(--text2)', fontSize: '.82rem' }}>Searching…</div>}
          {results.map(g => (
            <button key={g.id} type="button" onMouseDown={() => { onChange(g); setQ(''); setOpen(false) }}
              style={{ width: '100%', background: 'none', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {g.background_image && <img src={g.background_image} alt="" style={{ width: 44, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
              <div>
                <p style={{ fontWeight: 600, fontSize: '.84rem', color: 'var(--text0)', lineHeight: 1.2 }}>{g.name}</p>
                {g.released && <p style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{g.released.slice(0,4)}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── New Post form rendered via portal ── */
function NewPostForm({ onClose, user, profile, toast }) {
  const [game, setGame]         = useState(null)
  const [category, setCategory] = useState('general')
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [saving, setSaving]     = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!title.trim()) return toast('Please add a title', 'warning')
    if (body.trim().length < 20) return toast('Post body must be at least 20 characters', 'warning')
    setSaving(true)
    try {
      await addDoc(collection(db, 'forumPosts'), {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName,
        photoURL: profile?.photoURL || user.photoURL || null,
        gameId:    game?.id    || null,
        gameName:  game?.name  || null,
        gameImage: game?.background_image || null,
        category,
        title: title.trim(),
        body: body.trim(),
        upvotes: 0,
        replyCount: 0,
        createdAt: serverTimestamp(),
      })

      // Write activity
      if (game) {
        await addDoc(collection(db, 'activity'), {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName,
          photoURL: profile?.photoURL || user.photoURL || null,
          type: 'forum',
          gameId: game.id, gameName: game.name, gameImage: game.background_image || null,
          detail: title.trim(),
          createdAt: serverTimestamp(),
        })
      }

      toast('Post created! 🎮', 'success')
      onClose()
    } catch (err) { console.error(err); toast('Could not post. Check Firestore rules.', 'error') }
    finally { setSaving(false) }
  }

  const content = (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,8,13,.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', animation: 'fadeIn .2s ease' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg2)', border: '1px solid var(--border3)', borderRadius: 18, padding: '32px 28px', width: '100%', maxWidth: 580, boxShadow: '0 16px 64px rgba(0,0,0,.95)', animation: 'modalIn .25s ease', margin: 'auto', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--text0)', marginBottom: 4 }}>New Forum Post</h2>
        <p style={{ color: 'var(--text2)', fontSize: '.84rem', marginBottom: 22 }}>Start a conversation with the community.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Game (optional) */}
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Game <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
            <MiniGamePicker selected={game} onChange={setGame} />
          </div>

          {/* Category */}
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 9 }}>Category *</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FORUM_CATEGORIES.map(c => (
                <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                  style={{ padding: '5px 12px', borderRadius: 999, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--font-body)', background: category === c.key ? c.color + '22' : 'var(--bg3)', border: `1px solid ${category === c.key ? c.color : 'var(--border2)'}`, color: category === c.key ? c.color : 'var(--text2)' }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Title *</div>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your post a clear, specific title…" maxLength={120} required />
            <p style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: 4 }}>{title.length}/120</p>
          </div>

          {/* Body */}
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Post *</div>
            <textarea className="input" rows={5} style={{ resize: 'vertical' }} value={body} onChange={e => setBody(e.target.value)}
              placeholder="Share your thoughts, question, or discovery in detail…" />
            <p style={{ fontSize: '.7rem', color: body.length < 20 ? 'var(--text3)' : 'var(--green)', marginTop: 4 }}>
              {body.length} chars {body.length < 20 ? `(${20 - body.length} more needed)` : '✓'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? .7 : 1 }}>{saving ? 'Posting…' : 'Post to Forum'}</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
  return createPortal(content, document.body)
}

/* ── Forum post card ── */
function PostCard({ post, navigate }) {
  const { user } = useAuth()
  const toast    = useToast()
  const [upvoted, setUpvoted] = useState(false)
  const [votes, setVotes]     = useState(post.upvotes || 0)
  const cat = FORUM_CATEGORIES.find(c => c.key === post.category) || FORUM_CATEGORIES[0]

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'forumPosts', post.id, 'upvotes', user.uid)).then(s => setUpvoted(s.exists())).catch(() => {})
  }, [user?.uid, post.id])

  const handleUpvote = async e => {
    e.stopPropagation()
    if (!user) return toast('Sign in to vote', 'warning')
    try {
      const vRef = doc(db, 'forumPosts', post.id, 'upvotes', user.uid)
      const pRef = doc(db, 'forumPosts', post.id)
      if (upvoted) {
        await deleteDoc(vRef)
        await updateDoc(pRef, { upvotes: increment(-1) })
        setVotes(v => v - 1); setUpvoted(false)
      } else {
        await setDoc(vRef, { uid: user.uid, at: serverTimestamp() })
        await updateDoc(pRef, { upvotes: increment(1) })
        setVotes(v => v + 1); setUpvoted(true)
      }
    } catch { toast('Could not vote', 'error') }
  }

  return (
    <div onClick={() => navigate(`/forum/${post.id}`)}
      style={{ 
        position: 'relative', // CRITICAL: For the background image to stay inside
        overflow: 'hidden',   // CRITICAL: Crops the blur at the edges
        background: 'var(--bg2)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius)', 
        padding: '16px 18px', 
        cursor: 'pointer', 
        display: 'flex', 
        gap: 16, 
        transition: 'border-color .18s' 
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* 1. Blurry Background Image Section */}
      {post.gameImage && (
        <img 
          src={post.gameImage} 
          alt="" 
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: '60%',      // Covers slightly more than half
            objectFit: 'cover',
            zIndex: 0,         // Behind the text
            opacity: 0.25,     // Soft subtle look
            filter: 'blur(2px)', // The blur effect
            pointerEvents: 'none',
            /* Fades the image from right (solid) to left (transparent) */
            maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)'
          }} 
        />
      )}

      {/* 2. Vote column (Z-Index ensures it stays above background) */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button onClick={handleUpvote}
          style={{ background: upvoted ? 'rgba(0,212,255,.12)' : 'none', border: `1px solid ${upvoted ? 'var(--cyan)' : 'var(--border2)'}`, color: upvoted ? 'var(--cyan)' : 'var(--text2)', borderRadius: 7, width: 36, height: 30, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
        <span style={{ fontSize: '.82rem', fontWeight: 800, color: upvoted ? 'var(--cyan)' : 'var(--text1)', lineHeight: 1 }}>{votes}</span>
      </div>

      {/* 3. Main content (Z-Index ensures it stays above background) */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: cat.color, background: cat.color + '18', border: `1px solid ${cat.color}40`, borderRadius: 999, padding: '2px 9px' }}>{cat.icon} {cat.label}</span>
          {post.gameName && (
            <span style={{ fontSize: '.72rem', color: 'var(--cyan)', fontWeight: 600, background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 999, padding: '2px 9px' }}>🎮 {post.gameName}</span>
          )}
        </div>

        <h3 style={{ fontWeight: 700, fontSize: '.96rem', color: 'var(--text0)', lineHeight: 1.35, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>

        {/* ... keep the rest of your Submitter info the same ... */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {post.photoURL
              ? <img src={post.photoURL} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{post.displayName?.charAt(0)}</div>
            }
            <span style={{ fontSize: '.73rem', color: 'var(--text2)' }}>{post.displayName}</span>
          </div>
          <span style={{ fontSize: '.7rem', color: 'var(--text3)' }}>
            {post.createdAt?.toDate ? fmtDate(post.createdAt.toDate()) : 'recently'}
          </span>
          <span style={{ fontSize: '.73rem', color: 'var(--text2)', marginLeft: 'auto' }}>💬 {post.replyCount || 0} replies</span>
        </div>
      </div>
    </div>
)
}

/* ── Main forum page ── */
export default function ForumPage() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [catFilter, setCatFilter] = useState(searchParams.get('cat') || 'all')
  const [gameFilter, setGameFilter] = useState(searchParams.get('game') || '')
  const [sortBy, setSortBy]     = useState('new')
  const [search, setSearch]     = useState('')

  // Freeze ref to stop form losing focus on snapshot updates
  const formOpenRef = useRef(false)
  const latestPosts = useRef([])
  formOpenRef.current = showForm

  useEffect(() => {
    const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'), limit(100))
    return onSnapshot(q, snap => {
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      latestPosts.current = results
      if (!formOpenRef.current) { setPosts(results); setLoading(false) }
    })
  }, [])

  useEffect(() => {
    if (!showForm && latestPosts.current.length > 0) { setPosts([...latestPosts.current]); setLoading(false) }
  }, [showForm])

  let filtered = [...posts]
  if (catFilter !== 'all') filtered = filtered.filter(p => p.category === catFilter)
  if (gameFilter) filtered = filtered.filter(p => p.gameName?.toLowerCase().includes(gameFilter.toLowerCase()))
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()))
  if (sortBy === 'top') filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
  if (sortBy === 'active') filtered.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0))

  return (
    <div className="page">
      {showForm && <NewPostForm onClose={() => setShowForm(false)} user={user} profile={profile} toast={toast} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Forum</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Discuss games, share secrets, ask for help, celebrate discoveries.</p>
        </div>
        {user
          ? <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Post</button>
          : <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>Sign in to post</p>
        }
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search + game filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>⌕</span>
            <input className="input" style={{ paddingLeft: 28, fontSize: '.85rem' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…" />
          </div>
          <input className="input" style={{ flex: '1 1 160px', fontSize: '.85rem' }} value={gameFilter} onChange={e => setGameFilter(e.target.value)} placeholder="Filter by game…" />
          <div style={{ display: 'flex', gap: 6 }}>
            {[['new','🕒 New'],['top','🔥 Top'],['active','💬 Active']].map(([k,l]) => (
              <button key={k} onClick={() => setSortBy(k)} className="btn btn-ghost"
                style={{ padding: '7px 12px', fontSize: '.8rem', ...(sortBy === k ? { borderColor: 'var(--cyan)', color: 'var(--cyan)', background: 'rgba(0,212,255,.07)' } : {}) }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="scroll-row">
          <button onClick={() => setCatFilter('all')} className={`pill ${catFilter === 'all' ? 'active' : ''}`}>⬡ All</button>
          {FORUM_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCatFilter(c.key)}
              className="pill"
              style={{ ...(catFilter === c.key ? { background: c.color + '18', borderColor: c.color, color: c.color } : {}) }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ color: 'var(--text3)', fontSize: '.78rem', marginBottom: 14 }}>{filtered.length} post{filtered.length !== 1 ? 's' : ''}</div>

      {loading ? <Spinner center /> : filtered.length === 0 ? (
        <Empty icon="◈" title="No posts found" body="Be the first to start a discussion!">
          {user && <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create First Post</button>}
        </Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p, i) => (
            <div key={p.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
              <PostCard post={p} navigate={navigate} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
