// src/pages/SuggestPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, setDoc, deleteDoc, getDoc, serverTimestamp, updateDoc, increment,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Tag, Spinner, Empty, Modal } from '../components/ui'
import { fmtDate, GENRES, PLATFORMS, TAGS_SPECIAL} from '../lib/constants'
import { searchGames } from '../lib/api'

/* ─── Game picker ──────────────────────────────────────────────────────────
   Defined at MODULE SCOPE — not inside another component — so its identity
   is stable. If defined inside a parent component body, React sees a new
   component type every render and remounts it (killing focus on every keystroke).
─────────────────────────────────────────────────────────────────────────── */
function GamePicker({ selected, onChange }) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen]           = useState(false)
  const debounceRef               = useRef(null)
  const wrapRef                   = useRef(null)

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleQuery = useCallback((v) => {
    setQuery(v)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 2) { setResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchGames(v, 8).catch(() => [])
      setResults(res)
      setSearching(false)
    }, 350)
  }, [])

  const pick = useCallback((game) => {
    onChange(game)
    setQuery('')
    setResults([])
    setOpen(false)
  }, [onChange])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {selected ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg3)', border: '1px solid var(--cyan)',
          borderRadius: 'var(--radius-sm)', padding: '8px 12px',
        }}>
          {selected.background_image && (
            <img src={selected.background_image} alt="" style={{ width: 52, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: 600, color: 'var(--text0)', fontSize: '.87rem', flex: 1 }}>{selected.name}</span>
          <button type="button" onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setOpen(true)}
              placeholder="Search for a game to suggest…"
              autoComplete="off"
            />
          </div>
          {open && (results.length > 0 || searching) && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-sm)', maxHeight: 260, overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {searching && (
                <div style={{ padding: 12, color: 'var(--text2)', fontSize: '.84rem' }}>Searching…</div>
              )}
              {results.map((g) => (
                <button key={g.id} type="button" onMouseDown={() => pick(g)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  {g.background_image && (
                    <img src={g.background_image} alt="" style={{ width: 52, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text0)', lineHeight: 1.2 }}>{g.name}</p>
                    {g.released && <p style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{g.released.slice(0, 4)}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}




/* ─── Suggest form ─────────────────────────────────────────────────────────
   Also at MODULE SCOPE for the same reason. Props receive user/profile/toast
   since hooks can't be used in components defined inside other components.
─────────────────────────────────────────────────────────────────────────── */
function SuggestForm({ onClose, user, profile, toast }) {
  console.log("Rendering SuggestForm")
  const [selectedGame, setSelectedGame]         = useState(null)
  const [description, setDescription]           = useState('')
  const [selectedGenres, setSelectedGenres]     = useState([])
  const [selectedPlatforms, setSelectedPlatforms] = useState([]) 
  const [selectedTags, setSelectedTags]         = useState([])
  const [saving, setSaving]                     = useState(false)

  const toggleTag = useCallback((setter, name) => {
  setter((prev) => 
    prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
  )
}, [])

  const handleGameChange = useCallback((g) => setSelectedGame(g), [])

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedGame) return toast('Please select a game from the list', 'warning')
    if (description.trim().length < 20) return toast('Please write at least 20 characters', 'warning')
    setSaving(true)
    try {
      await addDoc(collection(db, 'suggestions'), {
        gameId:       selectedGame.id,
        gameName:     selectedGame.name,
        gameImage:    selectedGame.background_image || null,
        gameReleased: selectedGame.released || null,
        gameRating:   selectedGame.rating || 0,
        description:  description.trim(),
        genre: selectedGenres, 
        platform: selectedPlatforms,
        tags:         selectedTags,
        uid:          user.uid,
        displayName:  profile?.displayName || user.displayName || 'Gamer',
        photoURL:     profile?.photoURL || user.photoURL || null,
        votes:        0,
        createdAt:    serverTimestamp(),
      })
      toast('Suggestion posted! 🎮', 'success')
      onClose()
    } catch (err) {
      console.error(err)
      toast('Could not post. Check Firestore rules.', 'error')
    } finally {
      setSaving(false)
    }
      await addDoc(collection(db, 'activity'), {
        uid: user.uid, displayName: user.displayName, photoURL: user.photoURL,
        type: 'suggestion', gameId: selectedGame.id, gameName: selectedGame.name,
        gameImage: selectedGame.background_image || null,
        detail: description.trim(), rating: null, createdAt: serverTimestamp(),
      })
  }

  const Field = ({ label, required, children }) => (
    <div>
      <label style={{
        fontSize: '.74rem', color: 'var(--text2)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.06em',
        display: 'block', marginBottom: 7,
      }}>
        {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
      </label>
      {children}
    </div>
  )

  // ── Portal render: escapes SuggestPage's React subtree entirely.
  // This means Firestore onSnapshot re-renders of SuggestPage CANNOT touch
  // this DOM — the textarea keeps focus no matter what fires upstream.
 const formContent = (
  <div
    // onClick={(e) => { if (e.target === e.currentTarget) onClose() }} can bring it back but causes accidental closes when clicking inside the form, so removed for now
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(7,8,13,.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px 16px', overflowY: 'auto', animation: 'fadeIn .2s ease',
    }}
  >
    <div
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border3)',
        borderRadius: '18px', padding: '32px 28px',
        width: '100%', maxWidth: 560, boxShadow: '0 16px 64px rgba(0,0,0,.95)',
        animation: 'modalIn .25s ease', margin: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--text0)', marginBottom: 4 }}>
        Suggest a Game
      </h2>

      {/* STEP 1: Search & Pick */}
      {!selectedGame ? (
        <div className="anim-fade-in">
          <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: 22 }}>
            Pick a game from the database to recommend.
          </p>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '.76rem', color: 'var(--text2)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Select Game *</p>
            <GamePicker selected={selectedGame} onChange={handleGameChange} />
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ width: '100%' }}>Cancel</button>
        </div>
      ) : (
        /* STEP 2: Fill Details (Textarea focus is safe here) */
        <form onSubmit={submit} className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <img src={selectedGame.background_image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
               <h4 style={{ color: 'var(--cyan)', margin: 0, fontSize: '1rem' }}>{selectedGame.name}</h4>
            </div>
            <button 
              type="button" 
              onClick={() => handleGameChange(null)} 
              style={{ 
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: 'var(--red)',
                background: 'rgba(255, 70, 70, 0.05)',
                border: '1px solid rgba(255, 70, 70, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 70, 70, 0.1)';
                e.currentTarget.style.borderColor = 'var(--red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 70, 70, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 70, 70, 0.2)';
              }}
            >
              Change Game
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>            
            <Field label="Genres">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {GENRES.map((g) => {
                  const active = selectedGenres.includes(g.name)
                  return (
                    <button key={g.id} type="button" className={`pill ${active ? 'active' : ''}`}
                      onClick={() => toggleTag(setSelectedGenres, g.name)}>
                      {g.icon} {g.name}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Tags">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TAGS_SPECIAL.map((t) => {
                  const active = selectedTags.includes(t.name)
                  return (
                    <button key={t.id} type="button" className={`pill ${active ? 'active-violet' : ''}`}
                      onClick={() => toggleTag(setSelectedTags, t.name)}>
                      {t.icon} {t.name}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Platforms">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p.name)
                  return (
                    <button key={p.id} type="button" className={`pill ${active ? 'active-violet' : ''}`}
                      onClick={() => toggleTag(setSelectedPlatforms, p.name)}>
                      {p.icon} {p.name}
                    </button>
                  )
                })}
              </div>
            </Field>

            

          </div>

          <Field label="Why play it? *" required>
            <input
              type="text"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              onFocus={(e) => {
                // Moves cursor to the end on every re-mount
                const val = e.target.value;
                e.target.setSelectionRange(val.length, val.length);
              }}
            />
          </Field>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>
              {saving ? 'Posting…' : 'Post Suggestion'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  </div>
);

   return createPortal(formContent, document.body)
}

/* ─── Suggestion card ──────────────────────────────────────────────────── */
function SuggestionCard({ suggestion, currentUid }) {
  const { user }  = useAuth()
  const toast     = useToast()
  const navigate  = useNavigate()
  const [voted, setVoted]     = useState(false)
  const [votes, setVotes]     = useState(suggestion.votes || 0)
  const [voting, setVoting]   = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!user || !suggestion.id) return
    getDoc(doc(db, 'suggestions', suggestion.id, 'votes', user.uid))
      .then((snap) => setVoted(snap.exists()))
      .catch(() => {})
  }, [user?.uid, suggestion.id])

  const handleVote = async () => {
    if (!user) return toast('Sign in to vote', 'warning')
    if (voting) return
    setVoting(true)
    try {
      const voteRef = doc(db, 'suggestions', suggestion.id, 'votes', user.uid)
      const sugRef  = doc(db, 'suggestions', suggestion.id)
      if (voted) {
        await deleteDoc(voteRef)
        await updateDoc(sugRef, { votes: increment(-1) })
        setVotes((v) => v - 1)
        setVoted(false)
      } else {
        await setDoc(voteRef, { uid: user.uid, at: serverTimestamp() })
        await updateDoc(sugRef, { votes: increment(1) })
        setVotes((v) => v + 1)
        setVoted(true)
        toast('Vote recorded! 👍', 'success')
      }
    } catch { toast('Could not record vote', 'error') }
    finally { setVoting(false) }
  }

  const handleDelete = async () => {
    try { await deleteDoc(doc(db, 'suggestions', suggestion.id)); toast('Deleted', 'info') }
    catch { toast('Could not delete', 'error') }
  }

  const isOwner = currentUid === suggestion.uid

  return (
    <div
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        display: 'flex', transition: 'border-color .2s',
        
        
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Game cover */}
      <div
        onClick={() => navigate(`/game/${suggestion.gameId}`)}
        style={{ width: 100, flexShrink: 0, cursor: 'pointer', overflow: 'hidden', background: 'var(--bg1)', minHeight: 90 }}
      >
        {suggestion.gameImage
          ? <img src={suggestion.gameImage} alt={suggestion.gameName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, minHeight: 90 }}>🎮</div>
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <button
              onClick={() => navigate(`/game/${suggestion.gameId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.98rem', color: 'var(--text0)', textAlign: 'left', lineHeight: 1.2 }}
            >
              {suggestion.gameName}
            </button>
            {suggestion.gameReleased && (
              <p style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: 2 }}>{suggestion.gameReleased.slice(0, 4)}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
            {/* GENRES: Cyan Glow */}
            {Array.isArray(suggestion.genre) ? (
              suggestion.genre.map((g, i) => (
                <span key={i} className="pill active" style={{ fontSize: '.7rem', padding: '2px 9px' }}>{g}</span>
              ))
            ) : (
              suggestion.genre && <span className="pill active" style={{ fontSize: '.7rem', padding: '2px 9px' }}>{suggestion.genre}</span>
            )}
            
            {/* PLATFORMS: Violet Glow */}
            {Array.isArray(suggestion.platform) ? (
              suggestion.platform.map((p, i) => (
                <span key={i} className="pill active-violet" style={{ fontSize: '.7rem', padding: '2px 9px' }}>{p}</span>
              ))
            ) : (
              suggestion.platform && <span className="pill active-violet" style={{ fontSize: '.7rem', padding: '2px 9px' }}>{suggestion.platform}</span>
            )}

            {/* TAGS: Cyan Glow */}
            {Array.isArray(suggestion.tags) && suggestion.tags.map((t, i) => (
              <span key={i} className="pill active" style={{ fontSize: '.7rem', padding: '2px 9px' }}>{t}</span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '.84rem', color: 'var(--text1)', lineHeight: 1.65 }}>{suggestion.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
          <button
            onClick={() => navigate(`/profile/${suggestion.uid}`)}
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}
          >
            {suggestion.photoURL
              ? <img src={suggestion.photoURL} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,var(--cyan),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#0a0a0f' }}>{suggestion.displayName?.charAt(0)}</div>
            }
            <span style={{ fontSize: '.74rem', color: 'var(--text2)' }}>{suggestion.displayName}</span>
          </button>

          <span style={{ fontSize: '.7rem', color: 'var(--text3)' }}>
            {suggestion.createdAt?.toDate ? fmtDate(suggestion.createdAt.toDate()) : 'Recently'}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={handleVote} disabled={voting} className='btn'
              style={{
                background: voted ? 'rgba(0,212,255,.12)' : 'var(--bg3)',
                border: `1px solid ${voted ? 'var(--cyan)' : 'var(--border)'}`,
                color: voted ? 'var(--cyan)' : 'var(--text2)',
                borderRadius: 'var(--radius-sm)', padding: '4px 11px',
                cursor: 'pointer', fontWeight: 700, fontSize: '.82rem',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s',
              }}
            >▲ {votes}</button>

            {isOwner && (
              confirm
                ? <>
                    <button className="btn btn-danger" style={{ padding: '4px 9px', fontSize: '.73rem' }} onClick={handleDelete}>Confirm</button>
                    <button className="btn btn-ghost"  style={{ padding: '4px 9px', fontSize: '.73rem' }} onClick={() => setConfirm(false)}>✕</button>
                  </>
                : <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: '.73rem', color: 'var(--red)' }} onClick={() => setConfirm(true)}>Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}









/* ─── Main page ────────────────────────────────────────────────────────── */
export default function SuggestPage() {
  const { user, profile } = useAuth()
  const toast = useToast()

  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)

  const [sortBy, setSortBy]                 = useState('votes')
  const [search, setSearch]                 = useState('')
  const [filterGenre, setFilterGenre]       = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterTag, setFilterTag]           = useState('')

  // Single stable snapshot — never re-subscribes, never causes form remounts.
  // We use a ref to buffer updates that arrive while the form is open,
  // then flush them to state the moment the form closes.
  const latestDocs   = useRef([])
  const formOpenRef  = useRef(false)

  // Keep the ref in sync with state without adding it as a dep of the effect
  formOpenRef.current = showForm

  useEffect(() => {
    const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      latestDocs.current = results
      // Only update state when the form is closed — avoids re-rendering
      // the page (and touching the portal) while the user is typing
      if (!formOpenRef.current) {
        setSuggestions(results)
        setLoading(false)
      }
    })
    return unsub
  }, []) // ← empty deps: subscribe once, never re-subscribe

  // Flush buffered data the moment the form closes
  useEffect(() => {
    if (!showForm && latestDocs.current.length > 0) {
      setSuggestions([...latestDocs.current])
      setLoading(false)
    }
  }, [showForm])

  const filtered = suggestions
    .filter((s) => !search || 
      s.gameName?.toLowerCase().includes(search.toLowerCase()) || 
      s.description?.toLowerCase().includes(search.toLowerCase())
    )
    // Fix Genre: Check if the array includes the filter string
    .filter((s) => !filterGenre || (
      Array.isArray(s.genre) ? s.genre.includes(filterGenre) : s.genre === filterGenre
    ))
    // Fix Platform: Check if the array includes the filter string
    .filter((s) => !filterPlatform || (
      Array.isArray(s.platform) ? s.platform.includes(filterPlatform) : s.platform === filterPlatform
    ))
    // Tags (Already uses includes, but added safety for single strings)
    .filter((s) => !filterTag || (
      Array.isArray(s.tags) ? s.tags.includes(filterTag) : s.tags === filterTag
    ))
    .sort((a, b) => sortBy === 'votes'
      ? (b.votes || 0) - (a.votes || 0)
      : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    )

  const hasActiveFilter = search || filterGenre || filterPlatform || filterTag

  return (
    <div className="page">
      {showForm && (
        <SuggestForm
          onClose={() => setShowForm(false)}
          user={user}
          profile={profile}
          toast={toast}
        />
      )
      }

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--text0)', letterSpacing: '-.02em', marginBottom: 4 }}>
            Community Suggestions
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>
            Recommend hidden gems from real games. Vote on what the community should play next.
          </p>
        </div>
        {user
          ? <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Suggest a Game</button>
          : <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>Sign in to suggest and vote</p>
        }
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 18px',
        marginBottom: 22, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 140 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
          <input className="input" style={{ paddingLeft: 30, padding: '8px 10px 8px 30px', fontSize: '.84rem' }}
            placeholder="Search suggestions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select className="input" style={{ flex: '1 1 120px', minWidth: 110, padding: '8px 10px', fontSize: '.83rem' }}
          value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
          <option value="">All Genres</option>
          {GENRES.map((g) => <option  key={g.id} value={g.name}>{g.name}</option>)}
        </select>

        <select className="input" style={{ flex: '1 1 120px', minWidth: 110, padding: '8px 10px', fontSize: '.83rem' }}
          value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>

        <select className="input" style={{ flex: '1 1 120px', minWidth: 110, padding: '8px 10px', fontSize: '.83rem' }}
          value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          <option value="">All Modes</option>
          {TAGS_SPECIAL.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          {['votes', 'newest'].map((s) => (
            <button key={s} onClick={() => setSortBy(s)} className="btn btn-ghost"
              style={{ padding: '7px 12px', fontSize: '.8rem', ...(sortBy === s ? { borderColor: 'var(--cyan)', color: 'var(--cyan)', background: 'rgba(0,212,255,.07)' } : {}) }}>
              {s === 'votes' ? '🔥 Top' : '🕒 New'}
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: '.8rem', color: 'var(--red)' }}
            onClick={() => { setSearch(''); setFilterGenre(''); setFilterPlatform(''); setFilterTag('') }}>
            Clear
          </button>
        )}

        <span style={{ color: 'var(--text3)', fontSize: '.78rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} suggestion{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <Spinner center />
      ) : filtered.length === 0 ? (
        <Empty
          icon="💡"
          title={suggestions.length === 0 ? 'No suggestions yet' : 'No matches'}
          body={suggestions.length === 0
            ? 'Be the first to recommend a game to the community!'
            : 'Try adjusting your filters or search query'}
        >
          {user && suggestions.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Suggest a Game</button>
          )}
        </Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((s, i) => (
            <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <SuggestionCard suggestion={s} currentUid={user?.uid} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
