// src/pages/ForumPostPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  doc, getDoc, collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, updateDoc, deleteDoc, setDoc,
  increment, getDoc as getD,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { Spinner, Empty, StarRating } from '../components/ui'
import { fmtDate } from '../lib/constants'
import { FORUM_CATEGORIES } from './ForumPage'

/* ── Time ago helper ── */
function TimeAgo({ ts }) {
  if (!ts?.toDate) return <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>recently</span>
  const d = ts.toDate(), diff = Date.now() - d.getTime()
  const mins = Math.floor(diff/60000), hours = Math.floor(diff/3600000), days = Math.floor(diff/86400000)
  const str = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : hours < 24 ? `${hours}h ago` : days < 7 ? `${days}d ago` : fmtDate(d)
  return <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>{str}</span>
}

/* ── Reply card ── */
function ReplyCard({ reply, postId, currentUid }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [upvoted, setUpvoted] = useState(false)
  const [votes, setVotes]     = useState(reply.upvotes || 0)
  const [confirm, setConfirm] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'forumPosts', postId, 'replies', reply.id, 'upvotes', user.uid))
      .then(s => setUpvoted(s.exists())).catch(() => {})
  }, [user?.uid, reply.id])

  const handleVote = async () => {
    if (!user) return toast('Sign in to vote', 'warning')
    try {
      const vRef = doc(db, 'forumPosts', postId, 'replies', reply.id, 'upvotes', user.uid)
      const rRef = doc(db, 'forumPosts', postId, 'replies', reply.id)
      if (upvoted) {
        await deleteDoc(vRef); await updateDoc(rRef, { upvotes: increment(-1) })
        setVotes(v => v - 1); setUpvoted(false)
      } else {
        await setDoc(vRef, { uid: user.uid, at: serverTimestamp() }); await updateDoc(rRef, { upvotes: increment(1) })
        setVotes(v => v + 1); setUpvoted(true)
      }
    } catch { toast('Could not vote', 'error') }
  }

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'forumPosts', postId, 'replies', reply.id))
      await updateDoc(doc(db, 'forumPosts', postId), { replyCount: increment(-1) })
      toast('Reply deleted', 'info')
    } catch { toast('Could not delete', 'error') }
  }

  const isOwner = currentUid === reply.uid

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', display: 'flex', gap: 14 }}>
      {/* Avatar */}
      {/* <button onClick={() => navigate(`/profile/${reply.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        {reply.photoURL
          ? <img src={reply.photoURL} alt={reply.displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14, fontFamily: 'var(--font-display)' }}>{reply.displayName?.charAt(0)}</div>
        }
      </button> */}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {reply.photoURL
          ? <img src={reply.photoURL} alt={reply.displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14, fontFamily: 'var(--font-display)' }}>{reply.displayName?.charAt(0)}</div>
        }
          <button onClick={() => navigate(`/profile/${reply.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, color: 'var(--text0)', fontSize: '.86rem', fontFamily: 'var(--font-body)' }}>
            {reply.displayName}
          </button>
          <TimeAgo ts={reply.createdAt} />
        </div>
        <p style={{ fontSize: '.87rem', color: 'var(--text1)', lineHeight: 1.75, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{reply.body}</p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={handleVote} className='btn'
            style={{ background: upvoted ? 'rgba(0,212,255,.1)' : 'none', border: `1px solid ${upvoted ? 'var(--cyan)' : 'var(--border2)'}`, color: upvoted ? 'var(--cyan)' : 'var(--text2)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s', fontFamily: 'var(--font-body)' }}>
            ▲ {votes}
          </button>
          {isOwner && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              {confirm ? (
                <>
                  <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: '.75rem' }} onClick={handleDelete}>Confirm Delete</button>
                  <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: '.75rem' }} onClick={() => setConfirm(false)}>✕</button>
                </>
              ) : (
                <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: '.75rem', color: 'var(--red)' }} onClick={() => setConfirm(true)}>Delete</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main post page ── */
export default function ForumPostPage() {
  const { postId } = useParams()
  const navigate   = useNavigate()
  const { user, profile } = useAuth()
  const toast      = useToast()

  const [post, setPost]       = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [upvoted, setUpvoted] = useState(false)
  const [votes, setVotes]     = useState(0)
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const textareaRef = useRef(null)

  // Load post
  useEffect(() => {
    if (!postId) return
    window.scrollTo(0, 0)
    getDoc(doc(db, 'forumPosts', postId)).then(snap => {
      if (snap.exists()) { setPost({ id: snap.id, ...snap.data() }); setVotes(snap.data().upvotes || 0) }
      setLoading(false)
    })
  }, [postId])

  // Load post upvote state
  useEffect(() => {
    if (!user || !postId) return
    getDoc(doc(db, 'forumPosts', postId, 'upvotes', user.uid)).then(s => setUpvoted(s.exists())).catch(() => {})
  }, [user?.uid, postId])

  // Realtime replies
  useEffect(() => {
    if (!postId) return
    const q = query(collection(db, 'forumPosts', postId, 'replies'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [postId])

  const handlePostUpvote = async () => {
    if (!user) return toast('Sign in to vote', 'warning')
    try {
      const vRef = doc(db, 'forumPosts', postId, 'upvotes', user.uid)
      const pRef = doc(db, 'forumPosts', postId)
      if (upvoted) {
        await deleteDoc(vRef); await updateDoc(pRef, { upvotes: increment(-1) })
        setVotes(v => v - 1); setUpvoted(false)
      } else {
        await setDoc(vRef, { uid: user.uid, at: serverTimestamp() }); await updateDoc(pRef, { upvotes: increment(1) })
        setVotes(v => v + 1); setUpvoted(true)
      }
    } catch { toast('Could not vote', 'error') }
  }

  const submitReply = async e => {
    e.preventDefault()
    if (replyBody.trim().length < 5) return toast('Reply must be at least 5 characters', 'warning')
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'forumPosts', postId, 'replies'), {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName,
        photoURL: profile?.photoURL || user.photoURL || null,
        body: replyBody.trim(),
        upvotes: 0,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'forumPosts', postId), { replyCount: increment(1) })
      setReplyBody('')
      toast('Reply posted!', 'success')
      setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (err) { console.error(err); toast('Could not post reply. Check Firestore rules.', 'error') }
    finally { setSubmitting(false) }
  }

  const handleDeletePost = async () => {
    try {
      await deleteDoc(doc(db, 'forumPosts', postId))
      toast('Post deleted', 'info')
      navigate('/forum')
    } catch { toast('Could not delete post', 'error') }
  }

  if (loading) return <div className="page"><Spinner center /></div>
  if (!post) return (
    <div className="page">
      <Empty icon="◈" title="Post not found" body="This post may have been deleted.">
        <button className="btn btn-primary" onClick={() => navigate('/forum')}>Back to Forum</button>
      </Empty>
    </div>
  )

  const cat = FORUM_CATEGORIES.find(c => c.key === post.category) || FORUM_CATEGORIES[0]
  const isOwner = user?.uid === post.uid

  return (
    <div className="page anim-fade-in" style={{ maxWidth: 800 }}>
      {/* Back */}
      <button onClick={() => navigate('/forum')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '.84rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', padding: 0, transition: 'color .15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
      >← Back to Forum</button>

      {/* Post card */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24 }}>
        {/* Game banner */}
        {post.gameImage && (
          <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: 'var(--bg1)' }}>
            <img src={post.gameImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.4) saturate(1.1)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg2), transparent)' }} />
            {post.gameName && (
              <button onClick={() => navigate(`/game/${post.gameId}`)}
                style={{ position: 'absolute', bottom: 12, left: 18, background: 'rgba(0,212,255,.15)', border: '1px solid rgba(0,212,255,.3)', color: 'var(--cyan)', borderRadius: 999, padding: '4px 12px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                🎮 {post.gameName}
              </button>
            )}
          </div>
        )}

        <div style={{ padding: '20px 22px' }}>
          {/* Category + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.74rem', fontWeight: 700, color: cat.color, background: cat.color + '18', border: `1px solid ${cat.color}40`, borderRadius: 999, padding: '3px 10px' }}>{cat.icon} {cat.label}</span>
            {!post.gameImage && post.gameName && (
              <button onClick={() => navigate(`/game/${post.gameId}`)}
                style={{ background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.2)', color: 'var(--cyan)', borderRadius: 999, padding: '3px 10px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>🎮 {post.gameName}</button>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--text0)', letterSpacing: '.02em', lineHeight: 1.2, marginBottom: 16 }}>{post.title}</h1>

          {/* Body */}
          <p style={{ color: 'var(--text1)', lineHeight: 1.8, fontSize: '.92rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', marginBottom: 18 }}>{post.body}</p>

          {/* Author + vote row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button onClick={() => navigate(`/profile/${post.uid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {post.photoURL
                ? <img src={post.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 11 }}>{post.displayName?.charAt(0)}</div>
              }
              <span style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text0)', fontFamily: 'var(--font-body)' }}>{post.displayName}</span>
            </button>
            <TimeAgo ts={post.createdAt} />
            <span style={{ fontSize: '.76rem', color: 'var(--text2)' }}>💬 {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>

            {/* Upvote */}
            <button onClick={handlePostUpvote} 
              style={{ marginLeft: 'auto', background: upvoted ? 'rgba(0,212,255,.12)' : 'var(--bg3)', border: `1px solid ${upvoted ? 'var(--cyan)' : 'var(--border2)'}`, color: upvoted ? 'var(--cyan)' : 'var(--text1)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', fontFamily: 'var(--font-body)' }}>
              ▲ {votes}
            </button>

            {isOwner && (
              confirmDel
                ? <><button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: '.78rem' }} onClick={handleDeletePost}>Confirm Delete</button>
                   <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '.78rem' }} onClick={() => setConfirmDel(false)}>Cancel</button></>
                : <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '.78rem', color: 'var(--red)' }} onClick={() => setConfirmDel(true)}>Delete Post</button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text0)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 16 }}>
          {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}` : 'No Replies Yet'}
        </h2>

        {replies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {replies.map(r => (
              <ReplyCard key={r.id} reply={r} postId={postId} currentUid={user?.uid} />
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text0)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 14 }}>
          {user ? 'Write a Reply' : 'Sign In to Reply'}
        </h3>

        {user ? (
          <form onSubmit={submitReply} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {profile?.photoURL || user.photoURL
                ? <img src={profile?.photoURL || user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 11 }}>{(profile?.displayName || user.displayName)?.charAt(0)}</div>
              }
              <span style={{ fontWeight: 600, fontSize: '.84rem', color: 'var(--text0)' }}>{profile?.displayName || user.displayName}</span>
            </div>

            <textarea
              ref={textareaRef}
              className="input"
              rows={4}
              style={{ resize: 'vertical' }}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Share your thoughts, answer the question, or add to the discussion…"
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '.72rem', color: replyBody.length < 5 ? 'var(--text3)' : 'var(--green)' }}>
                {replyBody.length < 5 ? `${5 - replyBody.length} more chars needed` : '✓ Ready to post'}
              </p>
              <button type="submit" className="btn btn-primary" disabled={submitting || replyBody.trim().length < 5} style={{ opacity: submitting || replyBody.trim().length < 5 ? .6 : 1 }}>
                {submitting ? 'Posting…' : 'Post Reply'}
              </button>
            </div>
          </form>
        ) : (
          <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>
            <Link to="/" style={{ color: 'var(--cyan)', fontWeight: 700 }}>Sign in</Link> to join the discussion.
          </p>
        )}
      </div>
    </div>
  )
}
