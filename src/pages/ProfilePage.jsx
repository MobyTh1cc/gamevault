// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { Avatar, Tag, RatingBadge, Spinner, Empty, StarRating } from '../components/ui'
import { fmtDate, RATING_LABELS, scoreColor } from '../lib/constants'

export default function ProfilePage() {
  const { uid }    = useParams()
  const { user, profile: myProfile } = useAuth()
  const navigate   = useNavigate()
  const isOwn      = user?.uid === uid

  const [profile, setProfile]   = useState(null)
  const [reviews, setReviews]   = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('reviews')

  useEffect(() => {
    if (!uid) return
    setLoading(true)
    Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDocs(query(collection(db, 'reviews'), where('uid', '==', uid), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'suggestions'), where('uid', '==', uid), orderBy('createdAt', 'desc'))),
    ]).then(([profSnap, reviewsSnap, sugSnap]) => {
      if (profSnap.exists()) setProfile(profSnap.data())
      setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setSuggestions(sugSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }).catch(console.error).finally(() => setLoading(false))
  }, [uid])

  if (loading) return <div className="page"><Spinner center /></div>
  if (!profile) return (
    <div className="page">
      <Empty icon="👤" title="Profile not found" body="This user doesn't exist or their profile is private.">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
      </Empty>
    </div>
  )

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="page">
      {/* Profile header */}
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap' }}>
        <Avatar user={{ photoURL: profile.photoURL, displayName: profile.displayName }} profile={profile} size={80} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 900, color: 'var(--text0)', letterSpacing: '-.02em' }}>
              {profile.displayName}
            </h1>
            {isOwn && (
              <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '.82rem' }} onClick={() => navigate('/settings')}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
          {profile.bio && <p style={{ color: 'var(--text1)', lineHeight: 1.6, marginBottom: 10, maxWidth: 520 }}>{profile.bio}</p>}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>📅 Joined {profile.joinedAt?.toDate ? fmtDate(profile.joinedAt.toDate()) : 'Recently'}</span>
            <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>💬 {reviews.length} reviews</span>
            <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>💡 {suggestions.length} suggestions</span>
            {avgRating && <span style={{ fontSize: '.82rem', color: 'var(--accent)', fontWeight: 600 }}>★ {avgRating} avg rating</span>}
          </div>
          {profile.favoriteGenres?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {profile.favoriteGenres.map((g) => <Tag key={g} color="accent" small>{g}</Tag>)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {[
          { id: 'reviews', label: `Reviews (${reviews.length})` },
          { id: 'suggestions', label: `Suggestions (${suggestions.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', padding: '10px 18px',
              fontSize: '.87rem', fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all .15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Reviews tab */}
      {tab === 'reviews' && (
        reviews.length === 0 ? (
          <Empty icon="💬" title="No reviews yet" body={isOwn ? "Start reviewing games from their detail pages." : "This user hasn't written any reviews yet."} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <Link to={`/game/${r.gameId}`}
                    style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--accent)' }}
                  >{r.gameName}</Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StarRating value={r.rating} size={15} />
                    <span style={{ fontSize: '.8rem', color: 'var(--accent)', fontWeight: 600 }}>{RATING_LABELS[r.rating]}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text1)', lineHeight: 1.7, fontSize: '.88rem', marginBottom: 8 }}>{r.body}</p>
                <p style={{ fontSize: '.74rem', color: 'var(--text3)' }}>{r.createdAt?.toDate ? fmtDate(r.createdAt.toDate()) : 'Recently'}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Suggestions tab */}
      {tab === 'suggestions' && (
        suggestions.length === 0 ? (
          <Empty icon="💡" title="No suggestions yet" body={isOwn ? "Head to the Suggest page to recommend games to the community." : "This user hasn't suggested any games yet."} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {suggestions.map((s) => (
              <div key={s.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text0)' }}>{s.title}</h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {s.genre && <Tag color="accent" small>{s.genre}</Tag>}
                    {s.platform && <Tag color="blue" small>{s.platform}</Tag>}
                    <span style={{ fontSize: '.8rem', color: 'var(--accent)', fontWeight: 700 }}>▲ {s.votes || 0}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text1)', lineHeight: 1.65, fontSize: '.87rem', marginBottom: 6 }}>{s.description}</p>
                {s.why && <p style={{ color: 'var(--text2)', fontSize: '.83rem', lineHeight: 1.6 }}>💡 {s.why}</p>}
                <p style={{ fontSize: '.74rem', color: 'var(--text3)', marginTop: 8 }}>{s.createdAt?.toDate ? fmtDate(s.createdAt.toDate()) : 'Recently'}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
