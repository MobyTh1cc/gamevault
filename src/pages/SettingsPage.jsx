// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Avatar, Empty, NeonDivider } from '../components/ui'
import { GENRES } from '../lib/constants'

export default function SettingsPage() {
  const { user, profile, updateUserProfile, logOut } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    displayName:    profile?.displayName || user?.displayName || '',
    bio:            profile?.bio || '',
    favoriteGenres: profile?.favoriteGenres || [],
    showNSFW:       profile?.showNSFW || false,
  })
  const [saving, setSaving] = useState(false)

  if (!user) return (
    <div className="page">
      <Empty icon="◉" title="Sign In Required" body="You need to be signed in to access settings.">
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </Empty>
    </div>
  )

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const toggleBool = (k) => setForm((p) => ({ ...p, [k]: !p[k] }))
  const toggleGenre = (name) => setForm((p) => ({
    ...p,
    favoriteGenres: p.favoriteGenres.includes(name)
      ? p.favoriteGenres.filter((g) => g !== name)
      : [...p.favoriteGenres, name],
  }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.displayName.trim()) return toast('Display name is required', 'warning')
    setSaving(true)
    try {
      await updateUserProfile({ displayName: form.displayName.trim(), bio: form.bio.trim(), favoriteGenres: form.favoriteGenres, showNSFW: form.showNSFW })
      toast('Settings saved ✓', 'success')
    } catch (err) { toast('Could not save settings', 'error') }
    finally { setSaving(false) }
  }

  const SectionCard = ({ title, children }) => (
    <div className="info-card" style={{ marginBottom: 16 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text0)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</h2>
      <NeonDivider />
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  )

  const FieldLabel = ({ children }) => (
    <div className="section-label" style={{ marginBottom: 7 }}>{children}</div>
  )

  const Toggle = ({ label, desc, value, onToggle }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text0)', marginBottom: 3 }}>{label}</p>
        {desc && <p style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.55 }}>{desc}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          flexShrink: 0, width: 46, height: 26, borderRadius: 999, border: 'none',
          cursor: 'pointer', transition: 'background .25s',
          background: value ? 'var(--cyan)' : 'var(--bg5)',
          position: 'relative',
          boxShadow: value ? '0 0 12px rgba(0,212,255,.4)' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 23 : 3, width: 20, height: 20,
          borderRadius: '50%', background: '#fff',
          transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,.4)',
        }} />
      </button>
    </div>
  )

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text0)', marginBottom: 6 }}>Settings</h1>
        <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Manage your profile and preferences</p>
      </div>

      {/* Account info */}
      <SectionCard title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border2)' }}>
          <Avatar user={user} profile={profile} size={46} />
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text0)', fontSize: '.9rem' }}>{user.email}</p>
            <p style={{ fontSize: '.76rem', color: 'var(--text2)', marginTop: 2 }}>
              {user.providerData?.[0]?.providerId === 'google.com' ? '◉ Google account' : '◎ Email account'}
            </p>
          </div>
        </div>
      </SectionCard>

      <form onSubmit={handleSave}>
        {/* Profile */}
        <SectionCard title="Profile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <FieldLabel>Display Name *</FieldLabel>
              <input className="input" value={form.displayName} onChange={set('displayName')} placeholder="How others see you" maxLength={40} required />
            </div>
            <div>
              <FieldLabel>Bio</FieldLabel>
              <textarea className="input" rows={3} value={form.bio} onChange={set('bio')}
                placeholder="Tell the community about your gaming taste…" maxLength={200} />
              <p style={{ fontSize: '.71rem', color: 'var(--text3)', marginTop: 4 }}>{form.bio.length}/200</p>
            </div>
          </div>
        </SectionCard>

        {/* Genres */}
        <SectionCard title="Favourite Genres">
          <p style={{ color: 'var(--text2)', fontSize: '.82rem', marginBottom: 14 }}>Shown on your public profile</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {GENRES.map((g) => (
              <button key={g.id} type="button" onClick={() => toggleGenre(g.name)}
                className={`pill ${form.favoriteGenres.includes(g.name) ? 'active' : ''}`}>
                {g.icon} {g.name}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Content */}
        <SectionCard title="Content Preferences">
          <Toggle
            label="Show Adult Content (NSFW / 18+)"
            desc="Show Adults Only (AO) rated games in Discover. Not suitable for minors."
            value={form.showNSFW}
            onToggle={() => toggleBool('showNSFW')}
          />
        </SectionCard>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Sign out */}
      <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,.3)', borderRadius: 'var(--radius)', padding: '20px 22px', marginTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--red)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Sign Out</h2>
        <p style={{ color: 'var(--text2)', fontSize: '.83rem', marginBottom: 14 }}>Sign out of your account on this device.</p>
        <button className="btn btn-danger" onClick={async () => { await logOut(); navigate('/'); toast('Signed out', 'info') }}>
          ⏻ Sign Out
        </button>
      </div>
    </div>
  )
}
