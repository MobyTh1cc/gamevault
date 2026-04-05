// src/hooks/useLibrary.js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'

/**
 * Manages a user's game library in Firestore.
 * Falls back to localStorage for unauthenticated users.
 */
export function useLibrary() {
  const { user } = useAuth()
  const [library, setLibrary]   = useState([])
  const [libLoading, setLibLoading] = useState(true)

  // ── Firestore realtime sync (when signed in) ──────────────────────────────
  useEffect(() => {
    if (!user) {
      // Fallback: localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('gv_library') || '[]')
        setLibrary(saved)
      } catch { setLibrary([]) }
      setLibLoading(false)
      return
    }

    setLibLoading(true)
    const colRef = collection(db, 'users', user.uid, 'library')
    const unsub  = onSnapshot(colRef, (snap) => {
      const games = snap.docs.map((d) => ({ ...d.data(), _docId: d.id }))
      setLibrary(games)
      setLibLoading(false)
    })
    return unsub
  }, [user?.uid])

  // ── Add / update ──────────────────────────────────────────────────────────
  const addToLibrary = useCallback(async (game, myRating = null) => {
    const entry = {
      id: game.id,
      name: game.name,
      background_image: game.background_image || null,
      rating: game.rating || 0,
      genres: game.genres || [],
      platforms: game.platforms || [],
      released: game.released || null,
      myRating,
      addedAt: Date.now(),
    }

    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'library', String(game.id)), {
        ...entry, addedAt: serverTimestamp(),
      })
    } else {
      const next = [entry, ...library.filter((g) => g.id !== game.id)]
      localStorage.setItem('gv_library', JSON.stringify(next))
      setLibrary(next)
    }
  }, [user, library])

  const removeFromLibrary = useCallback(async (gameId) => {
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid, 'library', String(gameId)))
    } else {
      const next = library.filter((g) => g.id !== gameId)
      localStorage.setItem('gv_library', JSON.stringify(next))
      setLibrary(next)
    }
  }, [user, library])

  const updateRating = useCallback(async (gameId, myRating) => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'library', String(gameId)), { myRating }, { merge: true })
    } else {
      const next = library.map((g) => g.id === gameId ? { ...g, myRating } : g)
      localStorage.setItem('gv_library', JSON.stringify(next))
      setLibrary(next)
    }
  }, [user, library])

  const toggleLibrary = useCallback(async (game, myRating = null, keepIfPresent = false) => {
    const inLib = library.some((g) => g.id === game.id)
    if (inLib && keepIfPresent) {
      if (myRating !== null) await updateRating(game.id, myRating)
    } else if (inLib) {
      await removeFromLibrary(game.id)
    } else {
      await addToLibrary(game, myRating)
    }
  }, [library, addToLibrary, removeFromLibrary, updateRating])

  return { library, libLoading, addToLibrary, removeFromLibrary, updateRating, toggleLibrary }
}
