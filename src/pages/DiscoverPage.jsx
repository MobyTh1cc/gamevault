// src/pages/DiscoverPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { rawgFetch } from '../lib/api'
import { GENRES, TAGS_SPECIAL, PLATFORMS, ORDERINGS, combinedScore } from '../lib/constants'
import { SkeletonCard, Empty, NeonDivider } from '../components/ui'
import GameCard from '../components/GameCard'
import FilterSidebar from '../components/FilterSidebar'
import { useAuth } from '../lib/AuthContext'
import { useFilters } from '../lib/FilterContext'; 

const DEFAULT_FILTERS = { genres: [], platforms: [], tags: [], ordering: 'combined' }
const TODAY = new Date().toISOString().slice(0, 10)

export default function DiscoverPage({ library, onLibraryToggle }) {
  const { user, profile } = useAuth()
  const showNSFW = user && profile?.showNSFW === true
  const { 
    filters, setFilters, 
    search, setSearch, 
    searchInput, setSearchInput, 
    clearAll 
  } = useFilters();

  const [searchParams, setSearchParams] = useSearchParams()
  const [games, setGames]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [nextUrl, setNextUrl]   = useState(null)
  const [loadMore, setLoadMore] = useState(false)
  const [total, setTotal]       = useState(0)
  // const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  // const [search, setSearch]           = useState(searchParams.get('q') || '')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // const [filters, setFilters]         = useState(DEFAULT_FILTERS)
  const loaderRef = useRef(null)

  

  const activeCount = filters.genres.length + filters.platforms.length + filters.tags.length

  const buildParams = useCallback(() => {
    const apiOrdering = filters.ordering === 'combined' ? '-metacritic' : filters.ordering
    return {
      page_size: 24,
      ordering: apiOrdering,
      dates: `1970-01-01,${TODAY}`,
      ...(search   && { search }),
      ...(filters.genres.length    && { genres:    filters.genres.join(',') }),
      ...(filters.platforms.length && { platforms: filters.platforms.join(',') }),
      ...(filters.tags.length      && { tags:      filters.tags.join(',') }),
    }
  }, [search, filters])

  useEffect(() => {
    setLoading(true); setGames([])
    rawgFetch('/games', buildParams()).then((d) => {
      let results = d.results || []
      results = results.filter((g) => g.metacritic || g.rating > 0)
      if (!showNSFW) results = results.filter((g) => g.esrb_rating?.slug !== 'adults-only')
      if (filters.ordering === 'combined') {
        results = results
          .map((g) => ({ ...g, _cs: combinedScore(g.metacritic, g.rating, null, 0) || 0 }))
          .sort((a, b) => b._cs - a._cs)
      }
      setGames(results)
      setNextUrl(d.next || null)
      setTotal(d.count || 0)
    }).catch(console.error).finally(() => setLoading(false))
  }, [buildParams])


  useEffect(() => {
  if (sidebarOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
})

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextUrl && !loadMore) {
        setLoadMore(true)
        fetch(nextUrl).then((r) => r.json()).then((d) => {
          let results = d.results || []
          if (!showNSFW) results = results.filter((g) => g.esrb_rating?.slug !== 'adults-only')
          results = results.filter((g) => g.metacritic || g.rating > 0)
          if (filters.ordering === 'combined') {
            results = results
              .map((g) => ({ ...g, _cs: combinedScore(g.metacritic, g.rating, null, 0) || 0 }))
              .sort((a, b) => b._cs - a._cs)
          }
          setGames((p) => [...p, ...results])
          setNextUrl(d.next || null)
        }).finally(() => setLoadMore(false))
      }
    }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [nextUrl, loadMore, showNSFW, filters.ordering])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setSearchParams(searchInput ? { q: searchInput } : {})
  }

  // const clearAll = () => {
  //   setFilters(DEFAULT_FILTERS); setSearch(''); setSearchInput(''); setSearchParams({})
  // }

  const currentSortLabel = ORDERINGS.find((o) => o.value === filters.ordering)?.label || 'Top Rated'

  
  return (
    <div style={{ display: 'flex' }}>

      {/* 1. The Backdrop (Overlay) */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)', // Dim the background
            zIndex: 140, // Just below the sidebar (which is 150)
          }}
        />
      )}
      {/* Sidebar */}
      <FilterSidebar
        filters={filters}
        setFilters={setFilters}
        onClear={clearAll}
        open={sidebarOpen}
      />


      {/* Main content */}
      <div className="discover-main" style={{ flex: 1, minWidth: 0, padding: '24px 20px' }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 2, flexWrap: 'wrap', alignItems: 'center' }}> 
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="btn btn-ghost filt" 
            
            style={{
              padding: '8px 14px', fontSize: '.82rem',
              gap: 6, display: 'none', alignItems: 'center',
              ...(sidebarOpen ? { borderColor: 'rgba(0,212,255,.3)', color: 'var(--cyan)', background: 'rgba(0,212,255,.07)' } : {}),
            }}
          >
            {/* hello man */}
            <span  style={{ fontSize: 13 }}>◫</span> 
            Filterss
            {activeCount > 0 && (
              <span style={{ background: 'var(--grad)', color: '#fff', borderRadius: 999, minWidth: 17, height: 17, fontSize: '.6rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{activeCount}</span>
            )}
          </button>

          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, minWidth: 160 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', fontSize: 14 }}>⌕</span>
              <input
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search games…"
                style={{ paddingLeft: 32, fontSize: '.88rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', fontSize: '.84rem' }}>Search</button>
            {search && (
              <button type="button" className="btn btn-ghost" style={{ padding: '0 11px', fontSize: '.88rem' }} onClick={clearAll}>✕</button>
            )}
          </form>

          
        </div>
        <span style={{ fontSize: '.78rem', color: 'var(--text3)', whiteSpace: 'nowrap', marginBottom: 25 }}>
            {total.toLocaleString()} games
          </span>

        {/* ── Status row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.76rem', color: 'var(--text2)' }}>
            Sort: <strong style={{ color: 'var(--text0)' }}>{currentSortLabel}</strong>
          </span>
          {!showNSFW && (
            <span className="pill" style={{ fontSize: '.7rem', padding: '2px 9px' }}>🔞 NSFW off</span>
          )}
          <span className="pill" style={{ fontSize: '.7rem', padding: '2px 9px' }}>📅 Released only</span>
        </div>

        {/* ── Active filter pills ── */}
        {activeCount > 0 && (
          <div className="scroll-row" style={{ marginBottom: 16 }}>
            {filters.genres.map((id) => {
              const g = GENRES.find((x) => x.id === id)
              return g ? (
                <span key={id} className="pill active" onClick={() => setFilters((p) => ({ ...p, genres: p.genres.filter((x) => x !== id) }))}>
                  {g.icon} {g.name} ✕
                </span>
              ) : null
            })}
            {filters.platforms.map((id) => {
              const p = PLATFORMS.find((x) => x.id === id)
              return p ? (
                <span key={id} className="pill active-violet" onClick={() => setFilters((prev) => ({ ...prev, platforms: prev.platforms.filter((x) => x !== id) }))}>
                  {p.name} ✕
                </span>
              ) : null
            })}
            {filters.tags.map((id) => {
              const t = TAGS_SPECIAL.find((x) => x.id === id)
              return t ? (
                <span key={id} className="pill active" onClick={() => setFilters((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== id) }))}>
                  {t.name} ✕
                </span>
              ) : null
            })}
          </div>
        )}

        {search && (
          <p style={{ color: 'var(--text1)', fontSize: '.85rem', marginBottom: 16 }}>
            Results for <strong style={{ color: 'var(--cyan)' }}>"{search}"</strong>
          </p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="games-grid">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <Empty icon="⌕" title="No games found" body="Try adjusting your filters or search terms.">
            <button className="btn btn-primary" onClick={clearAll}>Clear All Filters</button>
          </Empty>
        ) : (
          <>
            <div className="games-grid">
              {games.map((game, i) => (
                <div key={game.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i % 12, 8) * 35}ms` }}>
                  <GameCard game={game} library={library} onLibraryToggle={onLibraryToggle} />
                </div>
              ))}
            </div>
            <div ref={loaderRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadMore && <div className="spinner" style={{ width: 26, height: 26 }} />}
            </div>
          </>
        )}
      </div>


      <style>{`
        @media (max-width: 520px) {
          .filt {
            display: flex !important;
          }
        }
      `}</style>


    </div>





  )
}
