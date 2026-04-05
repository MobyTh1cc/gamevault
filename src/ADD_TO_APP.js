// ─── ADD THESE TO YOUR EXISTING src/App.jsx ─────────────────────────────────
//
// 1. Add these imports at the top:
//
//    import FriendsPage     from './pages/FriendsPage'
//    import ActivityPage    from './pages/ActivityPage'
//    import ForumPage       from './pages/ForumPage'
//    import ForumPostPage   from './pages/ForumPostPage'
//
//
// 2. Add these routes inside your <Routes> block:
//
//    <Route path="/friends"        element={<FriendsPage />} />
//    <Route path="/activity"       element={<ActivityPage />} />
//    <Route path="/forum"          element={<ForumPage />} />
//    <Route path="/forum/:postId"  element={<ForumPostPage />} />
//
//
// ─── FIRESTORE SECURITY RULES — add these to your existing rules ─────────────
//
// // Friend requests
// match /friendRequests/{reqId} {
//   allow read: if request.auth != null &&
//     (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
//   allow create: if request.auth != null && request.resource.data.from == request.auth.uid;
//   allow update: if request.auth != null && resource.data.to == request.auth.uid;
//   allow delete: if request.auth != null &&
//     (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
// }
//
// // Friends lists (both sides)
// match /friends/{uid}/list/{friendUid} {
//   allow read: if request.auth != null;
//   allow write: if request.auth != null &&
//     (request.auth.uid == uid || request.auth.uid == friendUid);
// }
//
// // Activity feed
// match /activity/{activityId} {
//   allow read: if request.auth != null;
//   allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
//   allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
// }
//
// // Forum posts
// match /forumPosts/{postId} {
//   allow read: if true;
//   allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
//   allow update: if request.auth != null &&
//     (resource.data.uid == request.auth.uid ||
//      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvotes','replyCount']));
//   allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
// }
//
// match /forumPosts/{postId}/upvotes/{uid} {
//   allow read: if true;
//   allow write: if request.auth != null && request.auth.uid == uid;
// }
//
// match /forumPosts/{postId}/replies/{replyId} {
//   allow read: if true;
//   allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
//   allow update: if request.auth != null &&
//     (resource.data.uid == request.auth.uid ||
//      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvotes']));
//   allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
// }
//
// match /forumPosts/{postId}/replies/{replyId}/upvotes/{uid} {
//   allow read: if true;
//   allow write: if request.auth != null && request.auth.uid == uid;
// }
//
// ─────────────────────────────────────────────────────────────────────────────
//
// ─── ACTIVITY WRITES — add these to pages that create activity ───────────────
//
// Whenever a user adds a game to their library, writes a review, or posts a
// suggestion, write an activity document so friends can see it.
//
// In useLibrary.js addToLibrary():
//   await addDoc(collection(db, 'activity'), {
//     uid: user.uid, displayName, photoURL,
//     type: 'library', gameId: game.id, gameName: game.name,
//     gameImage: game.background_image || null,
//     detail: null, rating: null, createdAt: serverTimestamp(),
//   })
//
// In GameDetailPage.jsx ReviewForm submit():
//   await addDoc(collection(db, 'activity'), {
//     uid: user.uid, displayName, photoURL,
//     type: 'review', gameId: String(gameId), gameName,
//     gameImage: null, detail: body.trim(), rating,
//     createdAt: serverTimestamp(),
//   })
//
// In SuggestPage.jsx SuggestForm submit():
//   await addDoc(collection(db, 'activity'), {
//     uid: user.uid, displayName, photoURL,
//     type: 'suggestion', gameId: selectedGame.id, gameName: selectedGame.name,
//     gameImage: selectedGame.background_image || null,
//     detail: description.trim(), rating: null, createdAt: serverTimestamp(),
//   })
