import { useAuth } from '../lib/AuthContext'
import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
export default function  BanGuard({ children }) {
  const { user, logOut } = useAuth();
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch user status from Firestore
    const userRef = doc(db, 'users', user.uid);
    getDoc(userRef).then(snap => {
      if (snap.exists() && snap.data().banned === true) {
        setIsBanned(true);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="loader">Checking account status...</div>;

  if (isBanned) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg0)',
        textAlign: 'center', padding: 20
      }}>
        <h1 style={{ color: 'var(--red)', fontSize: '2.5rem', marginBottom: 15 }}>Account Suspended</h1>
        <p style={{ color: 'var(--text2)', maxWidth: 400, lineHeight: 1.6, marginBottom: 25 }}>
          Your account has been permanently banned for violating community guidelines. 
          You no longer have access to the platform features.
        </p>
        <button 
          className="btn btn-danger" 
          onClick={() => {
            logOut().then(() => {
            // This forces the browser to reload to the homepage/login screen
            window.location.href = '/'; 
            });
        }}
          style={{ padding: '12px 30px', fontWeight: 700 }}
        >
          Log Out
        </button>
      </div>
    );
  }

  return children;
}