// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { ToastProvider } from './lib/ToastContext'
import App from './App'
import './styles/global.css'

// GitHub Pages SPA routing fix — restore path from redirect
;(function () {
  const p = window.location.search
  if (p && p.startsWith('?p=')) {
    const path = decodeURIComponent(p.slice(3).split('&')[0])
    window.history.replaceState(null, null, '/' + path)
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/gamevault">
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
