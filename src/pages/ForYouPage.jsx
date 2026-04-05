// src/pages/ForYouPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { rawgFetch, geminiFetch } from '../lib/api'
import { MOCK_NEWS, combinedScore, scoreColor, metaColor } from '../lib/constants'
import { Spinner, Tag, Empty } from '../components/ui'
import { useAuth } from '../lib/AuthContext'

const TODAY = new Date().toISOString().slice(0, 10)

/* ─── Recommendation card — rich, not plain ───────────────────────────── */
function RecCard({ game, index }) {
  const navigate  = useNavigate()
  const [hovered, setHovered] = useState(false)

  const combined = combinedScore(game.metacritic, game.rating, null, 0)
  const scoreClr = combined ? scoreColor(combined) : scoreColor(game.rating)
  const score    = combined || game.rating

  return (
    <div
      onClick={() => navigate(`/game/${game.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="anim-fade-up"
      style={{
        animationDelay: `${index * 50}ms`,
        background: 'var(--bg2)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,.6)' : 'none',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover image */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg1)', flexShrink: 0 }}>
        {game.background_image
          ? <img
              src={game.background_image}
              alt={game.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .35s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎮</div>
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,.9) 0%, transparent 55%)' }} />

        {/* Score badge on image */}
        {score > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: scoreClr + '28', border: `1px solid ${scoreClr}55`,
            backdropFilter: 'blur(8px)', borderRadius: 6,
            padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ color: scoreClr, fontWeight: 800, fontSize: '.78rem' }}>
              ⭐ {score.toFixed(1)}
            </span>
            {game.metacritic && (
              <span style={{ color: metaColor(game.metacritic), fontWeight: 600, fontSize: '.68rem', borderLeft: '1px solid rgba(255,255,255,.15)', paddingLeft: 5 }}>
                MC {game.metacritic}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '11px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text0)', lineHeight: 1.25, letterSpacing: '-.01em' }}>
          {game.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {game.released && (
            <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
              {game.released.slice(0, 4)}
            </span>
          )}
          {game.genres?.slice(0, 2).map((g) => (
            <span key={g.id} style={{ fontSize: '.68rem', color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>
              {g.name}
            </span>
          ))}
        </div>

        {game.platforms?.length > 0 && (
          <p style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 'auto' }}>
            {game.platforms.slice(0, 4).map((p) => p.platform.name).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function ForYouPage({ library, subscriptions }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [recs, setRecs]               = useState([])
  const [recLoading, setRecLoading]   = useState(false)
  const [recStrategy, setRecStrategy] = useState('')   // describes how recs were chosen
  const [aiProfile, setAiProfile]     = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [newsFilter, setNewsFilter]   = useState('All')

  // ── Smart recommendations ─────────────────────────────────────────────
  useEffect(() => {
    if (library.length === 0) return
    setRecLoading(true)
    setRecs([])

    const libIds = new Set(library.map((g) => g.id))

    // Build a smart query based on what's actually in the library
    const genreIds = [...new Set(library.flatMap((g) => g.genres?.map((x) => x.id) || []))].slice(0, 3)

    // Prefer top-rated games from the user's favourite genres
    // Also require: has release date (not upcoming), has a metacritic OR RAWG score
    const baseParams = {
      page_size: 40,                  // fetch more so we have room to filter
      ordering: '-metacritic',        // sorted by metacritic = best quality proxy
      dates: `1990-01-01,${TODAY}`,  // only released games
      metacritic: '60,100',           // must have a decent metacritic score
    }

    const genreParams = genreIds.length > 0
      ? { ...baseParams, genres: genreIds.join(',') }
      : baseParams

    Promise.all([
      // Primary: genre-matched with metacritic
      rawgFetch('/games', genreParams).catch(() => ({ results: [] })),
      // Fallback: all-time greats regardless of genre (ensures variety)
      rawgFetch('/games', { ...baseParams, ordering: '-added', page_size: 20 }).catch(() => ({ results: [] })),
    ]).then(([genreRes, popularRes]) => {
      const primary   = (genreRes.results   || []).filter((g) => !libIds.has(g.id) && g.background_image && g.released)
      const fallback  = (popularRes.results || []).filter((g) => !libIds.has(g.id) && g.background_image && g.released && !primary.find((p) => p.id === g.id))

      // Score each candidate and sort
      const scored = [...primary, ...fallback]
        .map((g) => ({ ...g, _score: combinedScore(g.metacritic, g.rating, null, 0) || g.rating || 0 }))
        .filter((g) => g._score > 0)
        .sort((a, b) => b._score - a._score)

      // Deduplicate and take top 12
      const seen = new Set()
      const final = []
      for (const g of scored) {
        if (!seen.has(g.id)) { seen.add(g.id); final.push(g) }
        if (final.length >= 12) break
      }

      setRecs(final)
      setRecStrategy(genreIds.length > 0 ? 'Matched to your favourite genres · Sorted by quality score' : 'Top-rated games you haven\'t played yet')
    }).catch(console.error)
      .finally(() => setRecLoading(false))
  }, [library.length])

  // ── AI gamer profile ──────────────────────────────────────────────────
  useEffect(() => {
    if (library.length < 2) return
    setProfileLoading(true)
    const titles   = library.slice(0, 8).map((g) => g.name).join(', ')
    const topRated = library.filter((g) => g.myRating >= 4).map((g) => g.name).join(', ')
    geminiFetch([{
      role: 'user',
      content: `Player library: ${titles}.${topRated ? ` Highly rated: ${topRated}.` : ''}\nWrite a 2-sentence gamer profile. Be insightful, specific, slightly witty. Don't start with "You".`,
    }], '', 120)
      .then(setAiProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [library.length])

  const newsTags     = ['All', ...new Set(MOCK_NEWS.map((n) => n.tag))]
  const filteredNews = newsFilter === 'All' ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.tag === newsFilter)
  const tagColors    = { 'Release Date': 'green', Announcement: 'accent', Hardware: 'blue', Development: 'purple', 'Leak Confirmed': 'red' }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, color: 'var(--text0)', letterSpacing: '-.02em', marginBottom: 4 }}>
          For You
        </h1>
        {user
          ? <p style={{ color: 'var(--text2)' }}>Your personalized gaming feed</p>
          : <p style={{ color: 'var(--text2)' }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600 }}>Sign in</button>
              {' '}for a personalized experience
            </p>
        }
      </div>

      {/* AI Profile card */}
      {library.length >= 2 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,.07) 0%, var(--violet-dim) 100%)',
          border: '1px solid rgba(0,212,255,.12)', borderRadius: 'var(--radius)',
          padding: '22px 26px', marginBottom: 40,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -24, right: -10, fontSize: 96, opacity: .05, pointerEvents: 'none' }}>✦</div>
          <p style={{ fontSize: '.72rem', color: 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
            ✦ Your Gamer Profile
          </p>
          {profileLoading
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Spinner size={18} />
                <span style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Analyzing your taste…</span>
              </div>
            : <p style={{ color: 'var(--text1)', lineHeight: 1.7, fontSize: '.93rem' }}>
                {aiProfile || 'Add more games to your library to unlock your personalized profile.'}
              </p>
          }
          <p style={{ color: 'var(--text3)', fontSize: '.76rem', marginTop: 10 }}>
            Based on {library.length} game{library.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
      )}

      {/* Recommendations */}
      <section style={{ marginBottom: 52 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text0)' }}>
            Recommended For You
          </h2>
          {recStrategy && !recLoading && (
            <span style={{ fontSize: '.76rem', color: 'var(--text3)' }}>{recStrategy}</span>
          )}
        </div>

        {library.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>🎯</div>
            <p style={{ color: 'var(--text1)', fontWeight: 600, marginBottom: 6 }}>No recommendations yet</p>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: 20 }}>
              Add games to your library and we'll recommend titles you'll love, based on your actual taste.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Games</button>
          </div>
        ) : recLoading ? (
          <div className="rec-grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '20px',
              maxWidth: '1200px', // Prevents them from getting TOO wide on big monitors
              margin: '0 auto'    // Centers the grid
            }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div className="skeleton" style={{ aspectRatio: '16/9' }} />
                <div style={{ padding: '11px 13px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 16, width: '80%' }} />
                  <div className="skeleton" style={{ height: 12, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : recs.length === 0 ? (
          <Empty
            icon="🔍"
            title="Couldn't find recommendations"
            body="Try adding more games with different genres to your library."
          />
        ) : (
          <div className="rec-grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '20px',
              maxWidth: '1200px', // Prevents them from getting TOO wide on big monitors
              margin: '0 auto'    // Centers the grid
            }}
          >
            {recs.map((g, i) => <RecCard key={g.id} game={g} index={i} />)}
          </div>
        )}
      </section>

      {/* News */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text0)' }}>
            Gaming News
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {newsTags.map((t) => (
              <button key={t} onClick={() => setNewsFilter(t)}
                className={`pill ${newsFilter === t ? 'active' : ''}`}
                style={{ fontSize: '.8rem', padding: '4px 12px' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="news-grid">
          {filteredNews.map((n, i) => (
            <article key={n.id}
              className="card-hover anim-fade-up"
              style={{ animationDelay: `${i * 50}ms`, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg1)' }}>
                <img src={n.img} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                  <Tag color={tagColors[n.tag] || 'muted'} small>{n.tag}</Tag>
                </div>
              </div>
              <div style={{ padding: '16px 18px 18px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '.76rem', color: 'var(--text2)', fontWeight: 600 }}>{n.source}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>· {n.date}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text0)', lineHeight: 1.4, marginBottom: 8 }}>{n.title}</h3>
                <p style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.65 }}>{n.body}</p>
              </div>
            </article>
          ))}
        </div>
        
      </section>
    </div>
  )
}
