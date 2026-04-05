// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Values come from .env.local (gitignored) — never hardcoded in source
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth           = getAuth(app)
export const db             = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// ── FIRESTORE SECURITY RULES (paste into Firebase Console → Firestore → Rules)
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{uid} {
//       allow read: if true;
//       allow create: if request.auth != null && request.auth.uid == uid;
//       allow update: if request.auth != null && request.auth.uid == uid;
//     }
//     match /users/{uid}/library/{gameId} {
//       allow read, write: if request.auth != null && request.auth.uid == uid;
//     }
//     match /reviews/{reviewId} {
//       allow read: if true;
//       allow create: if request.auth != null
//                     && reviewId == (request.auth.uid + '_' + request.resource.data.gameId)
//                     && request.resource.data.uid == request.auth.uid;
//       allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
//     }
//     match /gameRecs/{recId} {
//       allow read: if true;
//       allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
//       allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
//     }
//     match /gameRecs/{recId}/votes/{uid} {
//       allow read: if true;
//       allow write: if request.auth != null && request.auth.uid == uid;
//     }
//     match /suggestions/{suggestionId} {
//       allow read: if true;
//       allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
//       allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
//     }
//     match /suggestions/{suggestionId}/votes/{uid} {
//       allow read: if true;
//       allow write: if request.auth != null && request.auth.uid == uid;
//     }
//   }
// }
