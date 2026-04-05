// src/pages/LibraryPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { StarRating, Empty, NeonDivider } from '../components/ui'
import { RATING_LABELS, scoreColor } from '../lib/constants'
import { useAuth } from '../lib/AuthContext'

export default function LibraryPage({ library, onRemoveFromLibrary, onUpdateRating }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sortBy, setSortBy]     = useState('added')
  const [filterBy, setFilterBy] = useState('all')
  const [search, setSearch]     = useState('')

  const stats = useMemo(() => {
    const rated = library.filter((g) => g.myRating)
    const avg   = rated.length ? (rated.reduce((s, g) => s + g.myRating, 0) / rated.length).toFixed(1) : null
    const genres = {}
    library.forEach((g) => g.genres?.forEach((gen) => { genres[gen.name] = (genres[gen.name] || 0) + 1 }))
    const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0]
    const dist = [1,2,3,4,5].map((r) => ({ r, count: rated.filter((g) => g.myRating === r).length }))
    return { total: library.length, rated: rated.length, avg, topGenre, dist }
  }, [library])

  const sorted = useMemo(() => {
    let arr = [...library]
    if (filterBy === 'rated')   arr = arr.filter((g) => g.myRating)
    if (filterBy === 'unrated') arr = arr.filter((g) => !g.myRating)
    if (search) arr = arr.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    if (sortBy === 'added')  arr.sort((a, b) => (b.addedAt?.seconds || b.addedAt || 0) - (a.addedAt?.seconds || a.addedAt || 0))
    if (sortBy === 'rating') arr.sort((a, b) => (b.myRating || 0) - (a.myRating || 0))
    if (sortBy === 'score')  arr.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'name')   arr.sort((a, b) => a.name.localeCompare(b.name))
    return arr
  }, [library, sortBy, filterBy, search])

  if (!user) return (
    <div className="page">
      <Empty icon="◉" title="Sign In to Access Your Library" body="Create a free account to track games, rate them, and sync across devices.">
        <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Games</button>
      </Empty>
    </div>
  )

  if (library.length === 0) return (
    <div className="page">
      <Empty icon="◻" title="Your Library is Empty" body="Browse games and click + to add them. Build your collection and rate every game you've played.">
        <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Games</button>
      </Empty>
    </div>
  )

  const maxDist = Math.max(...stats.dist.map((d) => d.count), 1)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 4 }}>
          <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>My Library</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>
          {stats.total} game{stats.total !== 1 ? 's' : ''} tracked
          {stats.rated ? ` · ${stats.rated} rated` : ''}
          {stats.avg ? ` · avg ${stats.avg}★` : ''}
        </p>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '◻', label: 'Total Games',  val: stats.total },
          { icon: '★', label: 'Rated',         val: stats.rated },
          { icon: '◈', label: 'Avg Rating',    val: stats.avg ? `${stats.avg} / 5` : '—' },
          { icon: '◎', label: 'Top Genre',     val: stats.topGenre || '—' },
        ].map(({ icon, label, val }) => (
          <div key={label} className="info-card" style={{ padding: '16px 18px' }}>
            <p className="section-label" style={{ marginBottom: 6 }}>{icon} {label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text0)', letterSpacing: '.02em' }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Rating distribution */}
      {stats.rated > 0 && (
        <div className="info-card" style={{ marginBottom: 24 }}>
          <h3>Rating Distribution</h3>
          <NeonDivider />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 64, marginTop: 16 }}>
            {stats.dist.map(({ r, count }) => (
              <div key={r} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {count > 0 && <span style={{ fontSize: '.7rem', color: 'var(--text2)', fontWeight: 600 }}>{count}</span>}
                <div style={{
                  width: '100%', borderRadius: 4,
                  height: count ? `${(count / maxDist) * 48}px` : 4,
                  background: count ? scoreColor(r) : 'var(--bg5)',
                  transition: 'height .4s ease',
                  boxShadow: count ? `0 0 8px ${scoreColor(r)}50` : 'none',
                }} />
                <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{'★'.repeat(r)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ width: 200, padding: '8px 12px', fontSize: '.85rem' }}
          placeholder="Search library…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all','rated','unrated'].map((f) => (
            <button key={f} onClick={() => setFilterBy(f)}
              className={`pill ${filterBy === f ? 'active' : ''}`}
              style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="input" style={{ width: 160, padding: '8px 10px', fontSize: '.84rem', marginLeft: 'auto' }}>
          <option value="added">Recently Added</option>
          <option value="rating">My Rating</option>
          <option value="score">RAWG Score</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Games grid */}
      {sorted.length === 0 ? (
        <Empty icon="⌕" title="No matches" body="Try adjusting your search or filter" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {sorted.map((game) => (
            <div key={game.id} className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cover */}
              <div onClick={() => navigate(`/game/${game.id}`)}
                style={{ cursor: 'pointer', position: 'relative', aspectRatio: '16/7', background: 'var(--bg1)', overflow: 'hidden' }}>
                {game.background_image && (
                  <img src={game.background_image} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg2), transparent 60%)' }} />
              </div>
              {/* Info */}
              <div style={{ padding: '13px 15px 15px' }}>
                <p style={{ fontWeight: 700, fontSize: '.91rem', color: 'var(--text0)', marginBottom: 10, cursor: 'pointer', lineHeight: 1.3 }}
                  onClick={() => navigate(`/game/${game.id}`)}>
                  {game.name}
                </p>
                <div style={{ marginBottom: 8 }}>
                  <p className="section-label" style={{ marginBottom: 6 }}>My Rating</p>
                  <StarRating value={game.myRating || 0} onChange={(r) => onUpdateRating(game.id, r)} size={20} />
                  {game.myRating && (
                    <p style={{ fontSize: '.74rem', color: 'var(--text2)', marginTop: 5 }}>{RATING_LABELS[game.myRating]}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveFromLibrary(game.id)}
                  style={{ width: '100%', background: 'none', border: '1px solid var(--border2)', color: 'var(--text3)', borderRadius: 'var(--radius-sm)', padding: '6px 0', fontSize: '.74rem', cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--font-body)', marginTop: 4 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
                >Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
