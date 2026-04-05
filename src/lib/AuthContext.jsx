// src/lib/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile, sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (u) => {
    const snap = await getDoc(doc(db, 'users', u.uid))
    const data = snap.exists() ? snap.data() : null
    setProfile(data)
    return data
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) await fetchProfile(u)
      else setProfile(null)
      setLoading(false)
    })
    return unsub
  }, [])

  const createUserDoc = async (u, extra = {}) => {
    const ref  = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const data = {
        uid: u.uid,
        displayName: u.displayName || extra.displayName || 'Gamer',
        email: u.email,
        photoURL: u.photoURL || null,
        bio: '',
        favoriteGenres: [],
        showNSFW: false,        // NSFW content hidden by default
        joinedAt: serverTimestamp(),
        ...extra,
      }
      await setDoc(ref, data)
      setProfile(data)
    } else {
      setProfile(snap.data())
    }
  }

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await createUserDoc(cred.user, { displayName })
    return cred.user
  }

  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await createUserDoc(cred.user)
    return cred.user
  }

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    await createUserDoc(cred.user)
    return cred.user
  }

  const logOut = () => signOut(auth)

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const updateUserProfile = async (data) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    setProfile((p) => ({ ...p, ...data }))
    if (data.displayName) await updateProfile(user, { displayName: data.displayName })
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signInWithGoogle, logOut, resetPassword, updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
