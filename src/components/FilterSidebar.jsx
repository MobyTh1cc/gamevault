// src/components/FilterSidebar.jsx
import { GENRES, PLATFORMS, TAGS_SPECIAL, ORDERINGS } from '../lib/constants'
import { Tag } from './ui'

export default function FilterSidebar({ filters, setFilters, onClear, open, onClose }) {
  const toggle = (key, val) => {
    setFilters((p) => {
      const arr = p[key] || []
      return { ...p, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] }
    })
  }

  const activeCount = (filters.genres?.length || 0) + (filters.platforms?.length || 0) + (filters.tags?.length || 0)

  const Sec = ({ label, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{label}</div>
      {children}
    </div>
  )

  console.log(open)
  return (
    <>
      {/* Mobile backdrop */}
      {open === false && null}
      
      

      <aside
        className={`filter-sidebar${open === false ? ' hidden' : ''}`}
        style={{
          width: 220, flexShrink: 0,
          background: 'var(--bg1)',
          borderRight: '1px solid var(--border)',
          padding: '22px 14px',
          overflowY: 'auto',
          height: `calc(100vh - var(--nav-h))`,
          position: 'sticky',
          top: 'var(--nav-h)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '1rem', color: 'var(--text0)',
            letterSpacing: '.06em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Filters
            {activeCount > 0 && (
              <span style={{
                background: 'var(--grad)', color: '#fff',
                borderRadius: 999, minWidth: 18, height: 18,
                fontSize: '.62rem', fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
              }}>{activeCount}</span>
            )}
          </span>
          {activeCount > 0 && (
            <button onClick={onClear} style={{
              background: 'none', border: 'none', color: 'var(--cyan)',
              fontSize: '.74rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Clear</button>
          )}
        
          
          </div>

        {/* Neon accent line */}
        <div style={{ height: 1, background: 'linear-gradient(to right, var(--cyan), var(--violet-mid))', opacity: .3, marginBottom: 20, borderRadius: 1 }} />

        {/* Sort */}
        <Sec label="Sort By">
          <select
            value={filters.ordering || 'combined'}
            onChange={(e) => setFilters((p) => ({ ...p, ordering: e.target.value }))}
            className="input"
            style={{ padding: '8px 10px', fontSize: '.82rem' }}
          >
            {ORDERINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Sec>

        {/* Genre */}
        <Sec label="Genre">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {GENRES.map((g) => {
              const active = filters.genres?.includes(g.id)
              return (
                <button key={g.id} onClick={() => toggle('genres', g.id)}
                  style={{
                    background: active ? 'rgba(0,212,255,.08)' : 'none',
                    border: `1px solid ${active ? 'rgba(0,212,255,.28)' : 'transparent'}`,
                    color: active ? 'var(--cyan)' : 'var(--text2)',
                    borderRadius: 7, padding: '6px 10px',
                    textAlign: 'left', fontSize: '.82rem',
                    fontWeight: active ? 600 : 400,
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text0)' } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text2)' } }}
                >
                  <span style={{ fontSize: 13 }}>{g.icon}</span>
                  {g.name}
                </button>
              )
            })}
          </div>
        </Sec>

        {/* Platform */}
        <Sec label="Platform">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {PLATFORMS.map((p) => {
              const active = filters.platforms?.includes(p.id)
              return (
                <button key={p.id} onClick={() => toggle('platforms', p.id)}
                  className={`pill ${active ? 'active-violet' : ''}`}
                  style={{ fontSize: '.76rem', padding: '4px 10px' }}
                >{p.icon} {p.name}</button>
              )
            })}
          </div>
        </Sec>

        {/* Mode & Tags */}
        <Sec label="Mode & Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {TAGS_SPECIAL.map((t) => {
              const active = filters.tags?.includes(t.id)
              return (
                <button key={t.id} onClick={() => toggle('tags', t.id)}
                  className={`pill ${active ? 'active' : ''}`}
                  style={{ fontSize: '.76rem', padding: '4px 10px' }}
                >{t.name}</button>
              )
            })}
          </div>
        </Sec>
      </aside>
    </>
  )
}
