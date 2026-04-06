// src/components/GameCard.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaBadge, Tag } from './ui'
import { combinedScore, scoreColor } from '../lib/constants'
import { useAuth } from '../lib/AuthContext'

export default function GameCard({ game, library, onLibraryToggle }) {
  const navigate  = useNavigate()
  const [hovered, setHovered] = useState(false)

  const libEntry = library?.find((g) => g.id === game.id)
  const inLib    = !!libEntry
  const combined = combinedScore(game.metacritic, game.rating, null, 0)
  const score    = combined || (game.rating > 0 ? game.rating : null)
  const color    = score ? scoreColor(score) : null
  const { user, profile } = useAuth()
  

  return (
    console.log(game.name + " inLib: " + inLib + " score: " + score),
    <article
      className="game-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/game/${game.id}`)}
      aria-label={game.name}
    >
      {/* ── Image ── */}
      <div className="game-card-img">
        {game.background_image
          ? <img
              src={game.background_image}
              alt=""
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform .45s ease',
                transform: hovered ? 'scale(1.07)' : 'scale(1)',
              }}
            />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎮</div>
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,8,13,.9) 0%, rgba(7,8,13,.3) 50%, transparent 100%)' }} />

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {game.metacritic
            ? <MetaBadge score={game.metacritic} />
            : <span />
          }
          {/* Library button */}
          { user && (
          <button
            aria-label={inLib ? 'Remove from library' : 'Add to library'}
            onClick={(e) => { e.stopPropagation(); onLibraryToggle?.(game) }}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: inLib ? 'rgba(0,229,160,.18)' : 'rgba(7,8,13,.75)',
              border: `1px solid ${inLib ? 'var(--green)' : 'rgba(255,255,255,.15)'}`,
              color: inLib ? 'var(--green)' : 'rgba(255,255,255,.6)',
              backdropFilter: 'blur(8px)',
              transition: 'all .18s',
              cursor: 'pointer',
            }}
          >{inLib ? '✓' : '+'}</button>)}
        </div> 

        {/* Combined score bottom-left */}
        {score && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: color + '25',
            border: `1px solid ${color}45`,
            borderRadius: 5, padding: '2px 8px',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ color, fontWeight: 800, fontSize: '.73rem', fontFamily: 'var(--font-body)' }}>
              ⭐ {score.toFixed(1)}
            </span>
          </div>
        )}

        {/* My rating star if in library */}
        {libEntry?.myRating && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(255,179,71,.18)',
            border: '1px solid rgba(255,179,71,.4)',
            borderRadius: 5, padding: '2px 7px',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '.71rem' }}>
              {'★'.repeat(libEntry.myRating)}
            </span>
          </div>
        )}
      </div>

      {/* ── Info body ── */}
      <div className="game-card-body">
        {/* Title — clamp to 2 lines */}
        <div className="game-card-title">{game.name}</div>

        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {game.rating > 0 && (
            <span style={{ fontSize: '.71rem', color: scoreColor(game.rating), fontWeight: 700 }}>
              👥 {game.rating.toFixed(1)}
            </span>
          )}
          {game.released && (
            <span style={{ fontSize: '.69rem', color: 'var(--text3)', marginLeft: 'auto' }}>
              {game.released.slice(0, 4)}
            </span>
          )}
        </div>

        {/* Genres */}
        {game.genres?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, overflow: 'hidden', flexWrap: 'nowrap', flexShrink: 0 }}>
            {game.genres.slice(0, 5).map((g) => (
              <Tag key={g.id} color="muted" small>{g.name}</Tag>
            ))}
          </div>
        )}

        {/* Platforms — pinned bottom, ellipsis */}
        <div style={{
          fontSize: '.65rem', color: 'var(--text3)',
          marginTop: 'auto',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          letterSpacing: '.01em',
        }}>
          {game.platforms?.slice(0, 5).map((p) => p.platform.name).join(' · ') || ''}
        </div>
      </div>
    </article>
  )
}
