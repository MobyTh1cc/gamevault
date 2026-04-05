// src/pages/NotFoundPage.jsx
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 40, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 72 }}>👾</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: 'var(--text0)', letterSpacing: '-.03em' }}>404</h1>
      <p style={{ color: 'var(--text2)', fontSize: '1rem', maxWidth: 340 }}>This page doesn't exist. Maybe it was delisted like an old DLC.</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  )
}
