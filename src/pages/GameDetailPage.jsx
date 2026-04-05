// src/pages/GameDetailPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc,
  setDoc, getDoc, increment, getDocs,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { rawgFetch, geminiFetch, searchGames } from '../lib/api'
import { fmtDate, scoreColor, metaColor, RATING_LABELS, combinedScore } from '../lib/constants'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Tag, RatingBadge, MetaBadge, StarRating, Spinner, Avatar, Empty } from '../components/ui'
import GameCard from '../components/GameCard'; // reusable card for game recommendations, also used on ForYouPage

/* ══════════════════════════════════════════════════════════════════════════
   COMBINED SCORE BADGE
══════════════════════════════════════════════════════════════════════════ */
function CombinedScoreBadge({ metacritic, rawgRating, communityAvg, reviewCount, large }) {
  const score = combinedScore(metacritic, rawgRating, communityAvg, reviewCount)
  if (!score) return null
  const color = scoreColor(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: large ? '1.15rem' : '.88rem', fontWeight: 800, letterSpacing: '-.01em',
        padding: large ? '6px 14px' : '3px 10px', borderRadius: 'var(--radius-sm)',
        background: color + '22', border: `1px solid ${color}55`, color,
      }}>⭐ {score.toFixed(1)} <span style={{ fontWeight: 400, fontSize: large ? '.75rem' : '.68rem', opacity: .8 }}>/5</span></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {metacritic && <span style={{ fontSize: '.68rem', color: metaColor(metacritic), fontWeight: 600 }}>MC {metacritic}</span>}
        {rawgRating > 0 && <span style={{ fontSize: '.68rem', color: scoreColor(rawgRating), fontWeight: 600 }}>RAWG {rawgRating.toFixed(1)}</span>}
        {communityAvg && reviewCount >= 2 && <span style={{ fontSize: '.68rem', color: 'var(--text2)' }}>💬 {communityAvg.toFixed(1)} ({reviewCount})</span>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   REVIEW SECTION
   One review per user — enforced client + Firestore rule (docId = uid_gameId)
══════════════════════════════════════════════════════════════════════════ */
const REVIEW_MAX = 250

function ReviewForm({ gameId, gameName, existingReview, onDone }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [body, setBody]     = useState(existingReview?.body || '')
  const [saving, setSaving] = useState(false)

  const charsLeft = REVIEW_MAX - body.length
  const tooShort  = body.trim().length < 10
  const tooLong   = body.length > REVIEW_MAX

  const submit = async (e) => {
    
    e.preventDefault()
    if (!rating) return toast('Please choose a star rating', 'warning')
    if (tooShort) return toast('Review must be at least 10 characters', 'warning')
    if (tooLong)  return toast(`Review must be ${REVIEW_MAX} characters or fewer`, 'warning')
    setSaving(true)
    try {
      const docId = `${user.uid}_${gameId}`
      const data = {
        gameId: String(gameId), gameName,
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Gamer',
        photoURL: profile?.photoURL || user.photoURL || null,
        rating, body: body.trim(),
        updatedAt: serverTimestamp(),
        edited: !!existingReview,
      }
      if (existingReview) {
        await updateDoc(doc(db, 'reviews', docId), { ...data, edited: true })
        toast('Review updated!', 'success')
      } else {
        await setDoc(doc(db, 'reviews', docId), { ...data, createdAt: serverTimestamp() })
        toast('Review posted! 🎮', 'success')
      }
      onDone()
    } catch (err) {
      console.error(err)
      toast('Could not save review. Check Firestore rules.', 'error')
    } finally {
      setSaving(false)
    }
    await addDoc(collection(db, 'activity'), {
    uid: user.uid, displayName: user.displayName, photoURL: user.photoURL,
    type: 'review', gameId: String(gameId), gameName,
    gameImage: null, detail: body.trim(), rating,
    createdAt: serverTimestamp(),
  })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text0)' }}>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      <div>
        <p style={{ fontSize: '.76rem', color: 'var(--text2)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Rating *</p>
        <StarRating value={rating} onChange={setRating} size={28} />
        {rating > 0 && <p style={{ color: 'var(--cyan)', fontSize: '.82rem', marginTop: 6 }}>{RATING_LABELS[rating]}</p>}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <p style={{ fontSize: '.76rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Review *</p>
          <span style={{ fontSize: '.72rem', fontWeight: 600, color: tooLong ? 'var(--red)' : charsLeft <= 30 ? 'var(--cyan)' : 'var(--text3)' }}>
            {charsLeft} left
          </span>
        </div>
        <textarea
          className="input"
          rows={4}
          style={{ resize: 'vertical', minHeight: 90, borderColor: tooLong ? 'var(--red)' : undefined }}
          placeholder={`What did you think of ${gameName}? (10–${REVIEW_MAX} characters)`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={REVIEW_MAX + 10} /* soft-stop; hard validation on submit */
        />
        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--bg5)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min((body.length / REVIEW_MAX) * 100, 100)}%`,
            background: tooLong ? 'var(--red)' : charsLeft <= 30 ? 'var(--cyan)' : 'var(--green)',
            borderRadius: 999, transition: 'width .15s, background .2s',
          }} />
        </div>
        <p style={{ fontSize: '.71rem', color: tooLong ? 'var(--red)' : tooShort ? 'var(--text3)' : 'var(--green)', marginTop: 5 }}>
          {tooLong ? `Over limit by ${-charsLeft} character${-charsLeft !== 1 ? 's' : ''}` : tooShort ? `Min 10 characters` : '✓ Good to go'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || tooLong} style={{ opacity: saving || tooLong ? .6 : 1 }}>
          {saving ? 'Saving…' : existingReview ? 'Update Review' : 'Post Review'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

function ReviewCard({ review, currentUid, onEdit }) {
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const isOwner = currentUid === review.uid

  const handleDelete = async () => {
    const docId = `${review.uid}_${review.gameId}`
    try {
      await deleteDoc(doc(db, 'reviews', docId))
      toast('Review deleted', 'info')
    } catch { toast('Could not delete', 'error') }
  }

  return (
    /* full-width card — no fixed heights, text wraps naturally */
    <div style={{
      width: '100%',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
      boxSizing: 'border-box',
    }}>
      {/* Top row: avatar + name + date LEFT, stars RIGHT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Link to={`/profile/${review.uid}`} style={{ flexShrink: 0 }}>
            {review.photoURL
              ? <img src={review.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--cyan),var(--violet-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0a0a0f', flexShrink: 0 }}>{review.displayName?.charAt(0)}</div>
            }
          </Link>
          <div style={{ minWidth: 0 }}>
            <Link to={`/profile/${review.uid}`} style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text0)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {review.displayName}
            </Link>
            <p style={{ fontSize: '.71rem', color: 'var(--text3)', marginTop: 1 }}>
              {review.createdAt?.toDate ? fmtDate(review.createdAt.toDate()) : 'Recently'}
              {review.edited && <span style={{ marginLeft: 6 }}>· edited</span>}
            </p>
          </div>
        </div>
        {/* Stars + label — wraps below avatar row on very small screens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <StarRating value={review.rating} size={14} />
          <span style={{ fontSize: '.78rem', color: 'var(--cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {RATING_LABELS[review.rating]}
          </span>
        </div>
      </div>

      {/* Review body — wraps naturally, no clipping */}
      <p style={{
        color: 'var(--text1)',
        lineHeight: 1.75,
        fontSize: '.88rem',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
      }}>{review.body}</p>

      {/* Owner actions */}
      {isOwner && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '.76rem' }} onClick={onEdit}>Edit</button>
          {confirm
            ? <>
                <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: '.76rem' }} onClick={handleDelete}>Confirm Delete</button>
                <button className="btn btn-ghost"  style={{ padding: '5px 12px', fontSize: '.76rem' }} onClick={() => setConfirm(false)}>Cancel</button>
              </>
            : <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '.76rem', color: 'var(--red)' }} onClick={() => setConfirm(true)}>Delete</button>
          }
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GAME RECOMMENDATIONS TAB
   Users pick real games from API, write why, others upvote/downvote
══════════════════════════════════════════════════════════════════════════ */

// Game search picker component
function GamePicker({ selected, onChange, placeholder = 'Search for a game…', exclude = [] }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen]         = useState(false)
  const debounceRef             = useRef(null)
  const wrapRef                 = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleQuery = (v) => {
    setQuery(v)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 2) { setResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchGames(v, 8).catch(() => [])
      setResults(res.filter((g) => !exclude.includes(g.id)))
      setSearching(false)
    }, 350)
  }

  const pick = (game) => {
    onChange(game)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {selected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
          {selected.background_image && <img src={selected.background_image} alt="" style={{ width: 48, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
          <span style={{ fontWeight: 600, color: 'var(--text0)', fontSize: '.87rem', flex: 1 }}>{selected.name}</span>
          <button type="button" onClick={() => onChange(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
            <input className="input" style={{ paddingLeft: 32 }}
              value={query} onChange={(e) => handleQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setOpen(true)}
              placeholder={placeholder} />
          </div>
          {open && (results.length > 0 || searching) && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,.85)', maxHeight: 280, overflowY: 'auto' }}>
              {searching && <div style={{ padding: 12, color: 'var(--text2)', fontSize: '.84rem' }}>Searching…</div>}
              {results.map((g) => (
                <button key={g.id} type="button" onMouseDown={() => pick(g)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  {g.background_image && <img src={g.background_image} alt="" style={{ width: 52, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text0)', lineHeight: 1.2 }}>{g.name}</p>
                    {g.released && <p style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{g.released.slice(0,4)}</p>}
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

function RecForm({ forGameId, forGameName, existingRec, onDone }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [selectedGame, setSelectedGame] = useState(existingRec?.recommendedGame || null)
  const [reason, setReason]   = useState(existingRec?.reason || '')
  const [saving, setSaving]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedGame) return toast('Please select a game to recommend', 'warning')
    if (reason.trim().length < 15) return toast('Please write at least 15 characters explaining why', 'warning')
    if (selectedGame.id === forGameId) return toast("You can't recommend the same game!", 'warning')
    setSaving(true)
    try {
      const data = {
        forGameId: String(forGameId), forGameName,
        recommendedGame: {
          id: selectedGame.id,
          name: selectedGame.name,
          background_image: selectedGame.background_image || null,
          released: selectedGame.released || null,
          rating: selectedGame.rating || 0,
        },
        reason: reason.trim(),
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Gamer',
        photoURL: profile?.photoURL || user.photoURL || null,
        score: 0,
        edited: !!existingRec,
        updatedAt: serverTimestamp(),
      }
      if (existingRec) {
        await updateDoc(doc(db, 'gameRecs', existingRec.id), { ...data, edited: true })
        toast('Recommendation updated!', 'success')
      } else {
        await addDoc(collection(db, 'gameRecs'), { ...data, createdAt: serverTimestamp() })
        toast('Recommendation posted! 🎮', 'success')
      }
      onDone()
    } catch (err) {
      console.error(err)
      toast('Could not save recommendation. Check Firestore rules.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text0)' }}>
        {existingRec ? 'Edit Recommendation' : 'Recommend a Game'}
      </h3>
      <p style={{ color: 'var(--text2)', fontSize: '.84rem' }}>
        What game should fans of <strong style={{ color: 'var(--text0)' }}>{forGameName}</strong> also play?
      </p>
      <div>
        <p style={{ fontSize: '.76rem', color: 'var(--text2)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Select Game *</p>
        <GamePicker selected={selectedGame} onChange={setSelectedGame} exclude={[Number(forGameId)]} />
      </div>
      <div>
        <p style={{ fontSize: '.76rem', color: 'var(--text2)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Why recommend it? *</p>
        <textarea className="input" rows={4} style={{ resize: 'vertical' }}
          placeholder="Explain what makes this game a great follow-up — shared themes, mechanics, vibe…"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <p style={{ fontSize: '.72rem', color: reason.length < 15 ? 'var(--text3)' : 'var(--green)', marginTop: 4 }}>
          {reason.length} chars {reason.length < 15 ? '(min 15)' : '✓'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving…' : existingRec ? 'Update' : 'Post Recommendation'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

function RecCard({ rec, currentUid, onEdit }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [vote, setVote]     = useState(null) // 'up' | 'down' | null
  const [score, setScore]   = useState(rec.score || 0)
  const [voting, setVoting] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const isOwner = currentUid === rec.uid

  // Load user's existing vote
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'gameRecs', rec.id, 'votes', user.uid)).then((snap) => {
      if (snap.exists()) setVote(snap.data().direction)
    }).catch(() => {})
  }, [user?.uid, rec.id])

  const handleVote = async (direction) => {
    if (!user) return toast('Sign in to vote', 'warning')
    if (voting) return
    setVoting(true)
    try {
      const voteRef = doc(db, 'gameRecs', rec.id, 'votes', user.uid)
      const recRef  = doc(db, 'gameRecs', rec.id)
      if (vote === direction) {
        // Remove vote
        await deleteDoc(voteRef)
        const delta = direction === 'up' ? -1 : 1
        await updateDoc(recRef, { score: increment(delta) })
        setScore((s) => s + delta)
        setVote(null)
      } else {
        // Switch or new vote
        const wasVote = vote
        const delta = direction === 'up'
          ? (wasVote === 'down' ? 2 : 1)
          : (wasVote === 'up' ? -2 : -1)
        await setDoc(voteRef, { uid: user.uid, direction, at: serverTimestamp() })
        await updateDoc(recRef, { score: increment(delta) })
        setScore((s) => s + delta)
        setVote(direction)
      }
    } catch (err) {
      console.error(err)
      toast('Could not record vote', 'error')
    } finally {
      setVoting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'gameRecs', rec.id))
      toast('Recommendation deleted', 'info')
    } catch { toast('Could not delete', 'error') }
  }

  const g = rec.recommendedGame

  return (
    /* Full-width horizontal card: [cover | game info + reason | votes] */
    <div style={{
      width: '100%',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'stretch',
      transition: 'border-color .18s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border3)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Cover — fixed width, clickable */}
      <div
        onClick={() => navigate(`/game/${g.id}`)}
        style={{ width: 120, flexShrink: 0, overflow: 'hidden', background: 'var(--bg1)', cursor: 'pointer', position: 'relative' }}
      >
        {g.background_image
          ? <img src={g.background_image} alt={g.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s ease', display: 'block' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.07)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎮</div>
        }
      </div>

      {/* Middle — game name + scores + reason + submitter — takes all remaining space */}
      <div style={{ flex: 1, minWidth: 0, padding: '13px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Game title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/game/${g.id}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text0)', letterSpacing: '.02em', textAlign: 'left', lineHeight: 1.2 }}>
            {g.name}
          </button>
          {g.rating > 0 && <RatingBadge score={g.rating} size="sm" />}
          {g.released && <span style={{ fontSize: '.71rem', color: 'var(--text3)' }}>{g.released.slice(0, 4)}</span>}
        </div>

        {/* Reason */}
        <p style={{ 
          fontSize: '.85rem', 
          color: 'var(--text1)', 
          lineHeight: 1.65, 
          flex: 1,
          wordBreak: 'break-word',   // <--- ADD THIS
          overflowWrap: 'break-word', // <--- ADD THIS
          whiteSpace: 'normal'        // <--- ENSURE THIS
        }}>
          {rec.reason}
          {rec.edited && <span style={{ color: 'var(--text3)', fontSize: '.71rem', marginLeft: 6 }}>· edited</span>}
        </p>

        {/* Submitter */}
        <button onClick={() => navigate(`/profile/${rec.uid}`)}
          style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}>
          {rec.photoURL
            ? <img src={rec.photoURL} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,var(--cyan),var(--violet-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#0a0a0f' }}>{rec.displayName?.charAt(0)}</div>
          }
          <span style={{ fontSize: '.73rem', color: 'var(--text3)' }}>Recommended by {rec.displayName}</span>
        </button>
      </div>

      {/* Right — vote column + owner actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '12px 14px', borderLeft: '1px solid var(--border)', flexShrink: 0, minWidth: 64 }}>
        <button onClick={() => handleVote('up')} disabled={voting}
          style={{ background: vote === 'up' ? 'rgba(0,229,160,.15)' : 'none', border: `1px solid ${vote === 'up' ? 'var(--green)' : 'var(--border2)'}`, color: vote === 'up' ? 'var(--green)' : 'var(--text2)', borderRadius: 7, width: 36, height: 32, cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
        <span style={{ fontSize: '.9rem', fontWeight: 800, color: score > 0 ? 'var(--green)' : score < 0 ? 'var(--red)' : 'var(--text2)', minWidth: 28, textAlign: 'center', lineHeight: 1 }}>
          {score > 0 ? `+${score}` : score}
        </span>
        <button onClick={() => handleVote('down')} disabled={voting}
          style={{ background: vote === 'down' ? 'rgba(255,77,109,.15)' : 'none', border: `1px solid ${vote === 'down' ? 'var(--red)' : 'var(--border2)'}`, color: vote === 'down' ? 'var(--red)' : 'var(--text2)', borderRadius: 7, width: 36, height: 32, cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>

        {isOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '.7rem' }} onClick={() => onEdit(rec)}>Edit</button>
            {confirm
              ? <>
                  <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '.7rem' }} onClick={handleDelete}>Del</button>
                  <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '.7rem' }} onClick={() => setConfirm(false)}>✕</button>
                </>
              : <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '.7rem', color: 'var(--red)' }} onClick={() => setConfirm(true)}>Del</button>
            }
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function GameDetailPage({ library, onLibraryToggle, subscriptions, onSubscribe }) {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast    = useToast()

  const [details, setDetails]       = useState(null)
  const [screenshots, setScreenshots] = useState([])
  const [activeShot, setActiveShot] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('about')

  // Reviews
  const [reviews, setReviews]       = useState([])
  const [editingReview, setEditingReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Game Recommendations
  const [recs, setRecs]             = useState([])
  const [showRecForm, setShowRecForm] = useState(false)
  const [editingRec, setEditingRec] = useState(null)

  // AI similar
  const [aiSimilar, setAiSimilar]   = useState([])
  const [aiReasons, setAiReasons]   = useState({})
  const [aiLoading, setAiLoading]   = useState(false)

  const [myRating, setMyRating]     = useState(null)

  const libEntry = library?.find((g) => g.id === Number(id))
  const inLib    = !!libEntry

  // ── Load game details ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true); setDetails(null); setAiSimilar([]);
    window.scrollTo(0, 0);

    Promise.all([
      rawgFetch(`/games/${id}`),
      rawgFetch(`/games/${id}/game-series`).catch(() => ({ results: [] })),
    ]).then(async ([d, series]) => {
      setDetails(d);
      
      const libraryIds = new Set(library?.map(g => g.id) || []);
      const genreIds = d.genres?.map(g => g.id).join(',') || '';
      const devIds = d.developers?.map(dev => dev.id).join(',') || '';
      const tagIds = d.tags?.slice(0, 3).map(t => t.id).join(',') || '';

      // 1. Get the "Next in Series" (Top 1)
      const seriesGame = (series.results || [])
        .filter(g => g.id !== d.id && !libraryIds.has(g.id))[0];

      // 2. Get 1 "Other" game from the same Developer
      const devRes = await rawgFetch('/games', { 
        developers: devIds, 
        page_size: 10, 
        ordering: '-metacritic' 
      }).catch(() => ({ results: [] }));
      
      const studioGame = devRes.results?.find(g => 
        g.id !== d.id && 
        g.id !== seriesGame?.id && 
        !libraryIds.has(g.id)
      );

      // 3. Get 4 General Recommendations (Different Developers)
      const generalRes = await rawgFetch('/games', {
        genres: genreIds,
        tags: tagIds,
        page_size: 20,
        ordering: '-metacritic'
      }).catch(() => ({ results: [] }));

      const generalGames = generalRes.results?.filter(g => 
        g.id !== d.id && 
        g.id !== seriesGame?.id && 
        g.id !== studioGame?.id &&
        !d.developers?.some(dev => g.developers?.some(d => d.id === dev.id)) && // Check dev mismatch
        !libraryIds.has(g.id)
      ).slice(0, 4);

      // Final Assembly: [1 Series] + [1 Studio] + [4 General]
      const finalSelection = [
        ...(seriesGame ? [seriesGame] : []),
        ...(studioGame ? [studioGame] : []),
        ...(generalGames || [])
      ].slice(0, 6);

      setAiSimilar(finalSelection);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id, library]);

  // ── AI reasons ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!details || aiSimilar.length === 0) return
//     setAiLoading(true)
//     Promise.all(aiSimilar.map((sg) => {
//       const srcGenres = details.genres?.map((g) => g.name).join(', ') || 'various'
//       const tgtGenres = sg.genres?.map((g) => g.name).join(', ') || 'various'
//       const prompt = `Source game: "${details.name}" (${srcGenres}, released ${details.released?.slice(0,4) || 'unknown'}).
//         Target game: "${sg.name}" (${tgtGenres}, released ${sg.released?.slice(0,4) || 'unknown'}).
//         Write ONE sentence (max 20 words) explaining a SPECIFIC reason why a fan of "${details.name}" would enjoy "${sg.name}".
//         Focus on: shared mechanics, tone, narrative style, or a distinctive feature unique to the target game.
//         Do NOT use generic phrases like "similar gameplay" or "fans will love". Be concrete and interesting.`
//               return geminiFetch([{ role: 'user', content: prompt }], '', 80)
//         .then((text) => ({ id: sg.id, text: text.trim() }))
//         .catch(() => ({ id: sg.id, text: `Both reward patient exploration and feature ${tgtGenres} mechanics that fans of ${details.name} seek out.` }))
//     })).then((res) => {
//       const map = {}; res.forEach(({ id, text }) => { map[id] = text })
//       setAiReasons(prev => ({
//         ...prev,
//         ...map
//       }));
//  setAiLoading(false)
//     })
//   }, [details?.id, aiSimilar.length])

  // ── Firestore: reviews realtime ──────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const q = query(collection(db, 'reviews'), where('gameId', '==', String(id)), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [id])

  // ── Firestore: game recs realtime ────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const q = query(collection(db, 'gameRecs'), where('forGameId', '==', String(id)), orderBy('score', 'desc'))
    return onSnapshot(q, (snap) => setRecs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [id])

  const myReview      = reviews.find((r) => r.uid === user?.uid)
  const communityAvg  = reviews.length ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2) : null
  const myRec         = recs.find((r) => r.uid === user?.uid)
  const devSubscribed = details?.developers?.some((d) => subscriptions?.developers?.includes(d.slug))
  const dev           = details?.developers?.[0]

  const handleRate = async (r) => {
    setMyRating(r)
    await onLibraryToggle(details, r, true)
    toast(`Rated ${details.name}: ${r}★`, 'success')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spinner size={44} /></div>
  if (!details) return (
    <div className="page">
      <Empty icon="😕" title="Game not found" body="We couldn't load this game.">
        <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
      </Empty>
    </div>
  )

  return (
    <div className="anim-fade-in">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(300px,44vw,520px)', overflow: 'hidden' }}>
        <img src={activeShot || details.background_image} alt={details.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.4) saturate(1.1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg0) 0%, rgba(10,10,15,.5) 55%, transparent 100%)' }} />
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(10,10,15,.65)', border: '1px solid var(--border2)', color: 'var(--text1)', borderRadius: 999, padding: '8px 16px', backdropFilter: 'blur(12px)', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {details.esrb_rating && <Tag color="muted">{details.esrb_rating.name}</Tag>}
            {details.genres?.slice(0, 3).map((g) => <Tag key={g.id} color="accent">{g.name}</Tag>)}
            {details.tags?.filter((t) => ['Singleplayer','Multiplayer','Co-op'].includes(t.name)).slice(0,2).map((t) => <Tag key={t.id} color="blue">{t.name}</Tag>)}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4.5vw,3rem)', fontWeight: 900, color: 'var(--text0)', lineHeight: 1.1, letterSpacing: '-.02em', textShadow: '0 2px 24px rgba(0,0,0,.8)', maxWidth: 720 }}>{details.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <CombinedScoreBadge metacritic={details.metacritic} rawgRating={details.rating} communityAvg={communityAvg} reviewCount={reviews.length} large />
            {details.released && <span style={{ color: 'var(--text2)', fontSize: '.85rem' }}>Released {fmtDate(details.released)}</span>}
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ──────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 28px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'var(--bg1)' }}>
        <button onClick={() => onLibraryToggle(details, myRating, true)} className={`btn ${inLib ? 'btn-green' : 'btn-primary'}`}>
          {inLib ? '✓ In My Library' : '+ Add to Library'}
        </button>
        {dev && (
          <button onClick={() => onSubscribe('developers', dev.slug, dev.name)} className="btn btn-ghost"
            style={devSubscribed ? { borderColor: 'var(--violet-mid)', color: 'var(--violet-mid)', background: 'var(--violet-dim)' } : {}}>
            {devSubscribed ? '✓ Following' : 'Follow'} {dev.name}
          </button>
        )}
        {details.website && <a href={details.website} target="_blank" rel="noreferrer" className="btn btn-ghost">Official Site ↗</a>}
        {inLib && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '.76rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>My Rating</span>
            <StarRating value={myRating || 0} onChange={handleRate} size={22} />
            {myRating && <span style={{ color: 'var(--cyan)', fontSize: '.82rem' }}>{RATING_LABELS[myRating]}</span>}
          </div>
        )}
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 28, padding: '26px 28px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
            {[
              { id: 'about',   label: 'About' },
              { id: 'media',   label: 'Media' },
              { id: 'similar', label: 'Similar Games' },
              { id: 'recs',    label: `Recommendations (${recs.length})` },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: '.85rem', fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? 'var(--cyan)' : 'var(--text2)', borderBottom: `2px solid ${tab === t.id ? 'var(--cyan)' : 'transparent'}`, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ─ ABOUT ─ */}
          {tab === 'about' && (
            <div className="anim-fade-in">
              {details.description
                ? <div style={{ color: 'var(--text1)', lineHeight: 1.8, fontSize: '.91rem' }} dangerouslySetInnerHTML={{ __html: details.description.replace(/<a /g, '<a style="color:var(--cyan)" ') }} />
                : <p style={{ color: 'var(--text2)' }}>No description available.</p>}
              {details.ratings?.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--text0)' }}>Community Breakdown</h3>
                  {details.ratings.map((r) => {
                    const c = { exceptional: 'var(--green)', recommended: 'var(--cyan)', meh: 'var(--cyan)', skip: 'var(--red)' }[r.title] || 'var(--text2)'
                    return (
                      <div key={r.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '.82rem', color: 'var(--text1)', textTransform: 'capitalize', fontWeight: 500 }}>{r.title}</span>
                          <span style={{ fontSize: '.76rem', color: 'var(--text2)' }}>{r.count?.toLocaleString()} · {r.percent?.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--bg5)', borderRadius: 999 }}>
                          <div style={{ height: '100%', width: `${r.percent}%`, background: c, borderRadius: 999, transition: 'width .6s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─ MEDIA ─ */}
          {tab === 'media' && (
            <div className="anim-fade-in">
              {screenshots.length === 0 ? <p style={{ color: 'var(--text2)' }}>No screenshots available.</p> : (
                <>
                  <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 14, aspectRatio: '16/9' }}>
                    <img src={activeShot} alt="Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
                    {[details.background_image, ...screenshots.map((s) => s.image)].filter(Boolean).map((url, i) => (
                      <button key={i} onClick={() => setActiveShot(url)}
                        style={{ padding: 0, border: `2px solid ${activeShot === url ? 'var(--cyan)' : 'transparent'}`, borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─ RECOMMENDATIONS ─ */}
          {tab === 'recs' && (
            <div className="anim-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text0)' }}>Player Recommendations</h3>
                  <p style={{ color: 'var(--text2)', fontSize: '.83rem', marginTop: 3 }}>Games fans of <strong style={{ color: 'var(--text0)' }}>{details.name}</strong> should play next</p>
                </div>
                {user && !myRec && !showRecForm && (
                  <button className="btn btn-primary" onClick={() => { setShowRecForm(true); setEditingRec(null) }}>+ Recommend a Game</button>
                )}
                {!user && <p style={{ color: 'var(--text2)', fontSize: '.84rem' }}>Sign in to add recommendations</p>}
              </div>

              {(showRecForm || editingRec) && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 22 }}>
                  <RecForm forGameId={id} forGameName={details.name} existingRec={editingRec}
                    onDone={() => { setShowRecForm(false); setEditingRec(null) }} />
                </div>
              )}

              {myRec && !editingRec && (
                <div style={{ background: 'rgba(0,212,255,.07)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--cyan)', fontSize: '.83rem', fontWeight: 600 }}>✓ You recommended: {myRec.recommendedGame?.name}</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '.78rem' }} onClick={() => { setEditingRec(myRec); setShowRecForm(false) }}>Edit</button>
                </div>
              )}

              {recs.length === 0 ? (
                <Empty icon="🎯" title="No recommendations yet" body="Be the first to recommend a game to fans of this title!" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recs.map((rec) => (
                    <RecCard key={rec.id} rec={rec} currentUid={user?.uid}
                      onEdit={(r) => { setEditingRec(r); setShowRecForm(false) }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─ AI SIMILAR ─ */}
          {/* {tab === 'similar' && (
            <div className="anim-fade-in">
              <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: 20 }}>
                AI-powered suggestions for fans of <strong style={{ color: 'var(--text0)' }}>{details.name}</strong>
              </p>
              {aiSimilar.length === 0 ? <Spinner center /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {aiSimilar.map((sg) => (
                    <div key={sg.id} onClick={() => navigate(`/game/${sg.id}`)}
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', gap: 14, cursor: 'pointer', transition: 'all .2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border2)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      {sg.background_image && <img src={sg.background_image} alt={sg.name} style={{ width: 100, height: 68, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, fontSize: '.91rem', color: 'var(--text0)' }}>{sg.name}</span>
                          {sg.rating > 0 && <RatingBadge score={sg.rating} size="sm" />}
                        </div>
                        <p style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.55 }}>
                          {aiLoading ? <span style={{ color: 'var(--cyan)', animation: 'pulse 1.2s infinite' }}>✦ AI thinking…</span> : aiReasons[sg.id] || '…'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )} */}

          {/* Similar Games */}
          {tab === 'similar' && (
            <div className="news-grid"> {/* Uses your existing grid layout */}
              {aiSimilar.map((game, i) => (
                <div 
                  key={game.id} 
                  className="anim-fade-up" 
                  style={{ animationDelay: `${Math.min(i % 12, 8) * 35}ms` }} // Maintains your entry animation
                >
                  <GameCard 
                    game={game} 
                    library={library} 
                    onLibraryToggle={onLibraryToggle} 
                  />
                </div>
              ))}
            </div>
          )}

          {/* ─ REVIEWS ─ */}
          {tab === 'reviews' && (
            <div className="anim-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text0)' }}>Player Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>
                  {communityAvg && <p style={{ color: 'var(--cyan)', fontSize: '.88rem', marginTop: 2 }}>Community avg: ★ {communityAvg.toFixed(1)}</p>}
                </div>
                {user ? (!myReview && !showReviewForm && (
                  <button className="btn btn-primary" onClick={() => { setShowReviewForm(true); setEditingReview(null) }}>+ Write a Review</button>
                )) : <p style={{ color: 'var(--text2)', fontSize: '.84rem' }}>Sign in to review</p>}
              </div>

              {(showReviewForm || editingReview) && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 22 }}>
                  <ReviewForm gameId={id} gameName={details.name} existingReview={editingReview}
                    onDone={() => { setShowReviewForm(false); setEditingReview(null) }} />
                </div>
              )}

              {myReview && !editingReview && (
                <div style={{ background: 'rgba(0,212,255,.07)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--cyan)', fontSize: '.83rem', fontWeight: 600 }}>✓ You reviewed this game (★{myReview.rating})</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '.78rem' }} onClick={() => { setEditingReview(myReview); setShowReviewForm(false) }}>Edit Review</button>
                </div>
              )}

              {reviews.length === 0 ? (
                <Empty icon="💬" title="No reviews yet" body="Be the first to share your thoughts!" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} currentUid={user?.uid}
                      onEdit={() => { setEditingReview(r); setShowReviewForm(false) }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text0)', marginBottom: 14 }}>Score Breakdown</h3>
            {[
              details.metacritic && { label: 'Metacritic', val: `${details.metacritic}/100`, color: metaColor(details.metacritic) },
              details.rating > 0 && { label: 'RAWG Community', val: `${details.rating.toFixed(1)}/5`, color: scoreColor(details.rating) },
              communityAvg && reviews.length >= 2 && { label: `GameVault (${reviews.length})`, val: `${communityAvg.toFixed(1)}/5`, color: scoreColor(communityAvg) },
            ].filter(Boolean).map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{label}</span>
                <span style={{ fontSize: '.85rem', fontWeight: 700, color }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text0)', marginBottom: 14 }}>Game Details</h3>
            {[
              ['Developer',  details.developers?.map((d) => d.name).join(', ')],
              ['Publisher',  details.publishers?.map((p) => p.name).join(', ')],
              ['Released',   fmtDate(details.released)],
              ['Avg Playtime', details.playtime ? `~${details.playtime}h` : null],
              ['ESRB',       details.esrb_rating?.name],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: '.84rem', color: 'var(--text1)' }}>{val}</p>
              </div>
            ))}
          </div>

          {details.platforms?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text0)', marginBottom: 12 }}>Platforms</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {details.platforms.map((p) => <Tag key={p.platform.id} color="blue" small>{p.platform.name}</Tag>)}
              </div>
            </div>
          )}

          {details.tags?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text0)', marginBottom: 12 }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {details.tags.slice(0, 18).map((t) => <Tag key={t.id} color="muted" small>{t.name}</Tag>)}
              </div>
            </div>
          )}

          {details.stores?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text0)', marginBottom: 12 }}>Where to Buy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {details.stores.map((s) => (
                  <a key={s.id} href={`https://${s.store.domain}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', color: 'var(--text1)', fontSize: '.83rem', transition: 'color .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text1)'}
                  >{s.store.name} <span>↗</span></a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
