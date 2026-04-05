// src/lib/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success', duration = 2800) => {
    const id = ++_id
    setToasts((p) => [...p, { id, msg, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration)
  }, [])

  const cfg = {
    success: { icon: '✓', bg: 'rgba(0,229,160,.12)',  border: 'rgba(0,229,160,.35)',  color: 'var(--green)',      glow: 'rgba(0,229,160,.2)' },
    error:   { icon: '✕', bg: 'rgba(255,77,109,.12)', border: 'rgba(255,77,109,.35)', color: 'var(--red)',        glow: 'rgba(255,77,109,.2)' },
    info:    { icon: 'ℹ', bg: 'rgba(0,212,255,.1)',   border: 'rgba(0,212,255,.3)',   color: 'var(--cyan)',       glow: 'rgba(0,212,255,.2)' },
    warning: { icon: '⚠', bg: 'rgba(255,179,71,.12)', border: 'rgba(255,179,71,.35)', color: 'var(--amber)',      glow: 'rgba(255,179,71,.2)' },
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none', maxWidth: 340, width: 'calc(100vw - 40px)',
      }}>
        {toasts.map((t) => {
          const c = cfg[t.type] || cfg.success
          return (
            <div key={t.id} className="toast" style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.color,
              boxShadow: `var(--shadow-lg), 0 0 20px ${c.glow}`,
            }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{c.icon}</span>
              <span style={{ fontSize: '.84rem', fontWeight: 600, lineHeight: 1.4 }}>{t.msg}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
