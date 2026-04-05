// src/components/ui.jsx
// Neon Noir design system — shared atomic components
import { useState } from 'react'
import { scoreColor, metaColor } from '../lib/constants'

/* ── Tag / chip ─────────────────────────────────────────────── */
export const Tag = ({ children, color = 'accent', small = false, onClick }) => {
  const palette = {
    accent: { bg: 'rgba(0,212,255,.12)',   border: 'rgba(0,212,255,.35)',  text: 'var(--cyan)'       },
    blue:   { bg: 'rgba(0,212,255,.12)',   border: 'rgba(0,212,255,.35)',  text: 'var(--cyan)'       },
    green:  { bg: 'rgba(0,229,160,.12)',   border: 'rgba(0,229,160,.35)',  text: 'var(--green)'      },
    red:    { bg: 'rgba(255,77,109,.12)',  border: 'rgba(255,77,109,.35)', text: 'var(--red)'        },
    purple: { bg: 'rgba(124,58,237,.15)',  border: 'rgba(157,92,246,.4)',  text: 'var(--violet-mid)' },
    amber:  { bg: 'rgba(255,179,71,.12)',  border: 'rgba(255,179,71,.35)', text: 'var(--amber)'      },
    muted:  { bg: 'var(--bg3)',            border: 'var(--border2)',       text: 'var(--text2)'      },
  }
  const c = palette[color] || palette.muted
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: small ? '2px 7px' : '3px 10px',
        borderRadius: 999,
        fontSize: small ? '.68rem' : '.74rem',
        fontWeight: 600, letterSpacing: '.03em',
        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
      }}
    >{children}</span>
  )
}

/* ── Star rating ─────────────────────────────────────────────── */
export const StarRating = ({ value = 0, max = 5, onChange, size = 18 }) => (
  <div style={{ display: 'flex', gap: 2 }} role="group" aria-label="Star rating">
    {Array.from({ length: max }, (_, i) => {
      const filled = i < value
      return (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          aria-label={`${i + 1} star`}
          className={`star-btn ${filled ? 'filled' : ''}`}
          style={{ fontSize: size }}
        >★</button>
      )
    })}
  </div>
)

/* ── Rating badge ────────────────────────────────────────────── */
export const RatingBadge = ({ score, size = 'md' }) => {
  if (!score) return null
  const sz = { sm: '.72rem', md: '.88rem', lg: '1.05rem' }[size] || '.88rem'
  const pd = { sm: '2px 7px', md: '3px 9px', lg: '5px 12px' }[size] || '3px 9px'
  const color = scoreColor(score)
  return (
    <span style={{
      fontSize: sz, padding: pd,
      borderRadius: 6, fontWeight: 700, letterSpacing: '.02em',
      background: color + '20',
      border: `1px solid ${color}45`,
      color,
      fontFamily: 'var(--font-body)',
    }}>★ {typeof score === 'number' ? score.toFixed(1) : score}</span>
  )
}

/* ── Metacritic badge ────────────────────────────────────────── */
export const MetaBadge = ({ score }) => {
  if (!score) return null
  const color = metaColor(score)
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5, fontSize: '.7rem', fontWeight: 800,
      background: color + '20', border: `1px solid ${color}45`, color,
      letterSpacing: '.04em', fontFamily: 'var(--font-body)',
    }}>MC {score}</span>
  )
}

/* ── Spinner ─────────────────────────────────────────────────── */
export const Spinner = ({ size = 30, center = false }) => {
  const el = <div className="spinner" style={{ width: size, height: size }} />
  if (!center) return el
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
      {el}
    </div>
  )
}

/* ── Skeleton card ───────────────────────────────────────────── */
export const SkeletonCard = () => (
  <div className="game-card" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
    <div className="skeleton" style={{ height: 168, flexShrink: 0 }} />
    <div style={{ padding: '11px 13px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="skeleton" style={{ height: 16, width: '80%' }} />
      <div className="skeleton" style={{ height: 14, width: '55%' }} />
      <div className="skeleton" style={{ height: 12, width: '40%' }} />
    </div>
  </div>
)

/* ── Modal ───────────────────────────────────────────────────── */
export const Modal = ({ onClose, children, maxWidth = 480 }) => (
  <div
    className="modal-backdrop"
    onClick={onClose}
  >
    <div
      className="modal-card"
      style={{ maxWidth }}
      onClick={(e) => e.stopPropagation()}
    >{children}</div>
  </div>
)

/* ── Avatar ──────────────────────────────────────────────────── */
export const Avatar = ({ user, profile, size = 36 }) => {
  const name    = profile?.displayName || user?.displayName || '?'
  const initial = name.charAt(0).toUpperCase()
  const photo   = profile?.photoURL || user?.photoURL

  if (photo) {
    return <img src={photo} alt={name} className="avatar" style={{ width: size, height: size }} />
  }
  return (
    <div
      className="avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >{initial}</div>
  )
}

/* ── Empty state ─────────────────────────────────────────────── */
export const Empty = ({ icon = '🎮', title, body, children }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    {title && (
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.6rem', fontWeight: 800,
        color: 'var(--text0)', letterSpacing: '.02em',
      }}>{title}</h3>
    )}
    {body && <p style={{ color: 'var(--text2)', maxWidth: 360, lineHeight: 1.65, fontSize: '.9rem' }}>{body}</p>}
    {children}
  </div>
)

/* ── Neon divider ────────────────────────────────────────────── */
export const NeonDivider = () => <div className="neon-divider" />

/* ── Section heading ─────────────────────────────────────────── */
export const SectionHeading = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '1.6rem', fontWeight: 800,
      color: 'var(--text0)', letterSpacing: '.02em',
      lineHeight: 1.1,
    }}>{children}</h2>
    {sub && <p style={{ color: 'var(--text2)', fontSize: '.82rem', marginTop: 5 }}>{sub}</p>}
  </div>
)
