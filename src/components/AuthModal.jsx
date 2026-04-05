// src/components/AuthModal.jsx
import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Modal, Spinner } from './ui'
import { isTempEmail } from '../lib/constants'

// ─── views: 'login' | 'signup' | 'forgot' | 'forgot-sent'
export default function AuthModal({ mode, onClose, onSwitchMode }) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const toast = useToast()

  const [view, setView]       = useState(mode) // tracks current screen
  const [form, setForm]       = useState({ email: '', password: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPw, setShowPw]   = useState(false)

  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setError('') }

  const friendly = (code) => ({
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/too-many-requests':    'Too many attempts — please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }[code] || 'Something went wrong. Please try again.')

  // ── Sign in / Sign up ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (view === 'signup' && isTempEmail(form.email)) {
      setError("We don't support temporary or disposable email addresses. Please use a real email.")
      return
    }

    setLoading(true)
    try {
      if (view === 'signup') {
        await signUp(form.email, form.password, form.displayName || 'Gamer')
        toast('Welcome to GameVault! 🎮', 'success')
        onClose()
      } else {
        await signIn(form.email, form.password)
        toast('Welcome back! 👾', 'success')
        onClose()
      }
    } catch (err) {
      setError(friendly(err.code))
    } finally {
      setLoading(false)
    }
  }

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      await signInWithGoogle()
      toast('Signed in with Google! 🎮', 'success')
      onClose()
    } catch (err) {
      setError(friendly(err.code))
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password — sends Firebase reset email ──────────────────────────
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim()) return setError('Please enter your email address.')
    setLoading(true); setError('')
    try {
      await sendPasswordResetEmail(auth, form.email.trim())
      setView('forgot-sent')
    } catch (err) {
      setError(friendly(err.code))
    } finally {
      setLoading(false)
    }
  }

  // ── Switch between login / signup and keep the parent in sync ────────────
  const switchTo = (v) => {
    setView(v)
    setError('')
    onSwitchMode?.(v === 'signup' ? 'signup' : 'login')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Shared sub-components (defined inline, no hooks — just JSX helpers)
  // ─────────────────────────────────────────────────────────────────────────

  const GoogleBtn = () => (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      style={{
        width: '100%', background: 'var(--bg3)',
        border: '1px solid var(--border2)',
        color: 'var(--text0)', borderRadius: 8, padding: '11px 0',
        fontWeight: 600, fontSize: '.88rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginBottom: 20, cursor: 'pointer', transition: 'all .18s',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,212,255,.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google
    </button>
  )

  const Divider = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: '.72rem', color: 'var(--text3)', fontWeight: 600, letterSpacing: '.06em' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )

  const ErrorBox = ({ msg }) => msg ? (
    <div style={{
      background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.3)',
      borderRadius: 7, padding: '10px 13px',
      color: 'var(--red)', fontSize: '.82rem', lineHeight: 1.5,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span style={{ flexShrink: 0 }}>⚠</span> {msg}
    </div>
  ) : null

  const Header = ({ emoji, title, sub }) => (
    <div style={{ textAlign: 'center', marginBottom: 26 }}>
      <div style={{
        width: 50, height: 50, borderRadius: 13,
        background: 'var(--grad)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, margin: '0 auto 14px',
        boxShadow: '0 0 22px rgba(0,212,255,.28)',
      }}>{emoji}</div>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 900,
        letterSpacing: '.04em', textTransform: 'uppercase',
        background: 'var(--grad-text)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        marginBottom: 5,
      }}>{title}</h2>
      <p style={{ color: 'var(--text2)', fontSize: '.84rem' }}>{sub}</p>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // VIEWS
  // ─────────────────────────────────────────────────────────────────────────

  // ── Forgot password — sent confirmation ───────────────────────────────────
  if (view === 'forgot-sent') return (
    <Modal onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>📬</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 900,
          letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text0)', marginBottom: 10,
        }}>Check Your Inbox</h2>
        <p style={{ color: 'var(--text1)', lineHeight: 1.7, marginBottom: 6, fontSize: '.9rem' }}>
          We sent a password reset link to
        </p>
        <p style={{
          color: 'var(--cyan)', fontWeight: 700, fontSize: '.95rem',
          marginBottom: 6, wordBreak: 'break-all',
          background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.2)',
          borderRadius: 7, padding: '8px 14px', display: 'inline-block',
        }}>{form.email}</p>
        <p style={{ color: 'var(--text2)', fontSize: '.82rem', lineHeight: 1.65, margin: '14px 0 24px' }}>
          The link expires in <strong style={{ color: 'var(--text1)' }}>1 hour</strong>.
          Check your spam folder if you don't see it.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center' }}
            onClick={() => { setView('forgot'); setForm((p) => ({ ...p, email: '' })); setError('') }}
          >
            Send to a different email
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center' }}
            onClick={() => switchTo('login')}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </Modal>
  )

  // ── Forgot password — email entry ─────────────────────────────────────────
  if (view === 'forgot') return (
    <Modal onClose={onClose} maxWidth={420}>
      <Header emoji="🔑" title="Reset Password" sub="Enter your account email and we'll send a reset link." />

      <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 7 }}>
            Email Address
          </div>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoFocus
          />
        </div>

        <ErrorBox msg={error} />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !form.email}
          style={{ justifyContent: 'center', padding: '11px 0', opacity: loading || !form.email ? .6 : 1 }}
        >
          {loading
            ? <><Spinner size={15} /> Sending…</>
            : 'Send Reset Link'
          }
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--text2)', fontSize: '.83rem' }}>
        Remember it?{' '}
        <button
          type="button"
          onClick={() => switchTo('login')}
          style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontWeight: 700, cursor: 'pointer', fontSize: '.83rem', fontFamily: 'var(--font-body)' }}
        >
          Sign In
        </button>
      </p>
    </Modal>
  )

  // ── Sign in ───────────────────────────────────────────────────────────────
  if (view === 'login') return (
    <Modal onClose={onClose} maxWidth={420}>
      <Header emoji="🎮" title="Welcome Back" sub="Sign in to your account" />

      <GoogleBtn />
      <Divider />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input className="input" type="email" placeholder="Email address"
          value={form.email} onChange={set('email')} required autoFocus />

        <div style={{ position: 'relative' }}>
          <input
            className="input"
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={set('password')}
            required minLength={6}
            style={{ paddingRight: 52 }}
          />
          <button type="button" onClick={() => setShowPw((p) => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.73rem', fontFamily: 'var(--font-body)', letterSpacing: '.04em' }}>
            {showPw ? 'HIDE' : 'SHOW'}
          </button>
        </div>

        <ErrorBox msg={error} />

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{ justifyContent: 'center', padding: '11px 0', marginTop: 2, opacity: loading ? .7 : 1 }}
        >
          {loading ? <><Spinner size={15} /> Signing in…</> : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => { setView('forgot'); setError('') }}
          style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color .15s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}
        >
          Forgot password?
        </button>
        <p style={{ color: 'var(--text2)', fontSize: '.83rem' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => switchTo('signup')}
            style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontWeight: 700, cursor: 'pointer', fontSize: '.83rem', fontFamily: 'var(--font-body)' }}
          >
            Join Free
          </button>
        </p>
      </div>
    </Modal>
  )

  // ── Sign up ───────────────────────────────────────────────────────────────
  return (
    <Modal onClose={onClose} maxWidth={420}>
      <Header emoji="🎮" title="Create Account" sub="Join GameVault — free forever" />

      <GoogleBtn />
      <Divider />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input className="input" type="text" placeholder="Display name"
          value={form.displayName} onChange={set('displayName')} required autoFocus />
        <input className="input" type="email" placeholder="Email address"
          value={form.email} onChange={set('email')} required />

        <div style={{ position: 'relative' }}>
          <input
            className="input"
            type={showPw ? 'text' : 'password'}
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={set('password')}
            required minLength={6}
            style={{ paddingRight: 52 }}
          />
          <button type="button" onClick={() => setShowPw((p) => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.73rem', fontFamily: 'var(--font-body)', letterSpacing: '.04em' }}>
            {showPw ? 'HIDE' : 'SHOW'}
          </button>
        </div>

        <ErrorBox msg={error} />

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{ justifyContent: 'center', padding: '11px 0', marginTop: 2, opacity: loading ? .7 : 1 }}
        >
          {loading ? <><Spinner size={15} /> Creating account…</> : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text2)', fontSize: '.83rem' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => switchTo('login')}
          style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontWeight: 700, cursor: 'pointer', fontSize: '.83rem', fontFamily: 'var(--font-body)' }}
        >
          Sign In
        </button>
      </p>
    </Modal>
  )
}
