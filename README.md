# 🎮 GameVault

A production-ready game discovery platform built with **React + Vite + Firebase + React Router**.

Discover games, track your library, write reviews, recommend games to other players, vote on community suggestions, and get AI-powered personalized picks — all with full user accounts and real-time sync.

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
cd gamevault
npm install
```

### 2. Set up Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → Add a **Web app** → Copy the config
3. Enable **Authentication** → Sign-in method:
   - ✅ Email/Password
   - ✅ Google
4. Enable **Firestore Database** → Start in test mode
5. Copy `.env` to `.env.local` and fill in your Firebase values:

```bash
cp .env .env.local
# then edit .env.local with your config values
```

### 3. Add Firestore Security Rules
In Firebase Console → Firestore → **Rules** tab, paste the rules found inside `src/lib/firebase.js` (in the comments at the bottom of the file).

### 4. Run locally
```bash
npm run dev
```

---

## 🚀 Deploy to GitHub Pages

### One-time setup
1. Create a GitHub repo named `gamevault`
2. Push your code:
   ```bash
   git init && git add . && git commit -m "init" && git remote add origin YOUR_REPO_URL && git push -u origin main
   ```
3. Confirm `vite.config.js` has `base: '/gamevault/'` (change to your repo name if different)
4. Confirm `src/main.jsx` has `basename="/gamevault"` (same as above)

### Deploy
```bash
npm run deploy
```

Then in GitHub → repo **Settings** → **Pages** → set source to the `gh-pages` branch.

Your app will be live at: `https://YOUR_USERNAME.github.io/gamevault/`

> **Environment variables on GitHub Pages**: Since GitHub Pages serves static files, your `.env.local` values get baked into the build at deploy time. Run `npm run deploy` from your local machine where `.env.local` exists — the credentials are embedded at build time and never stored in your repo.

---

## 🔒 Security & Privacy

### Firebase Config
Firebase web config (API keys etc.) is intentionally public-facing — it's how Firebase works. The values in `.env.local` are baked into the JS bundle at build time. What actually protects your data is **Firestore Security Rules**, not hiding the config. The rules in `src/lib/firebase.js` enforce:
- Users can only read/write their own library
- Reviews use `uid_gameId` as their document ID — enforcing one review per user per game at the database level
- Only authenticated users can create content
- Owners can only edit/delete their own content

### Temp/Disposable Email Blocking
The signup form checks against a list of 100+ known disposable email providers (Mailinator, TempMail, 10MinuteMail, YopMail, etc.) and rejects them with a clear message.

### NSFW Content
Adult-rated (18+) games are hidden from the Discover page by default. Users must be signed in and explicitly enable "Show Adult Content" in Settings to see AO-rated games.

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── firebase.js         ← Firebase init (reads from .env.local)
│   ├── api.js              ← RAWG + Claude + game search helpers
│   ├── constants.js        ← Genres, platforms, temp email blocklist, score utils
│   ├── AuthContext.jsx     ← Auth state, signUp/signIn/Google/logOut
│   └── ToastContext.jsx    ← Toast notification system
├── hooks/
│   └── useLibrary.js       ← Library CRUD (Firestore sync + localStorage fallback)
├── components/
│   ├── ui.jsx              ← Tag, StarRating, RatingBadge, Spinner, Modal, Avatar, Empty
│   ├── Navbar.jsx          ← Sticky nav with user dropdown
│   ├── AuthModal.jsx       ← Sign in/up with Google + temp email blocking
│   ├── GameCard.jsx        ← Card with combined score (⭐ Metacritic + RAWG + users)
│   └── FilterSidebar.jsx   ← Genre/platform/tag/sort filters
├── pages/
│   ├── DiscoverPage.jsx    ← Browse with combined score sort, NSFW filter, released-only
│   ├── GameDetailPage.jsx  ← Full detail: reviews (1/user), recommendations, AI similar, media
│   ├── LibraryPage.jsx     ← Personal library with stats + rating distribution chart
│   ├── ForYouPage.jsx      ← AI profile + personalized recs + news
│   ├── SuggestPage.jsx     ← Community suggestions with game picker + filters + voting
│   ├── ProfilePage.jsx     ← Public user profile
│   ├── SettingsPage.jsx    ← Profile, genres, NSFW toggle
│   ├── ForgotPasswordPage.jsx ← Beautiful dedicated password reset page
│   └── NotFoundPage.jsx    ← 404
├── styles/
│   └── global.css          ← CSS variables + global styles + animations
├── App.jsx                 ← Routes + shared state + library handlers
└── main.jsx                ← Entry point with BrowserRouter + providers
```

---

## ✨ Full Feature List

| Feature | Details |
|---|---|
| 🕹️ Game Discovery | 500k+ games from RAWG API, infinite scroll |
| 🔍 Search & Filters | Genre (16), Platform (8), Mode/Tags (12), Sort |
| ⭐ Combined Score | Weighted average of Metacritic + RAWG community + GameVault users |
| 📅 Released-only | Discover page shows only games with real release dates + scores |
| 🔞 NSFW Toggle | Adult games hidden by default; opt-in per-user in Settings |
| 📖 Game Detail | Description, screenshots, ratings breakdown, stores, platforms |
| 💬 Reviews | One review per user per game (enforced at Firestore level); edit with "edited" label |
| 🎯 Game Recommendations | Pick real games from search, write why, others upvote/downvote with cover art |
| 🤖 AI Similar Games | Claude generates specific reasons why you'd love each similar game |
| 📚 Library | Add/rate/sort/filter personal game history; syncs across devices when signed in |
| 🔐 Auth | Email/password + Google sign-in; disposable email blocking on signup |
| 🔑 Forgot Password | Beautiful dedicated `/forgot-password` page with success state |
| 👤 Public Profiles | See any user's reviews and suggestions |
| 💡 Community Suggestions | Suggest games (from real game search), tag genre/platform/mode, vote |
| 🔎 Suggestion Filters | Filter community suggestions by genre, platform, play mode, search |
| ✨ For You | AI gamer profile + genre-based recs + gaming news feed |
| ⚙️ Settings | Display name, bio, favorite genres, NSFW toggle |
| 🔗 Full Routing | Every page has its own URL; browser back/forward works everywhere |
| 📱 Responsive | Works on mobile, tablet, desktop |

---

## 🔑 APIs Used

- **RAWG** — [rawg.io/apidocs](https://rawg.io/apidocs) — Free, 500k+ games
- **Firebase** — Auth + Firestore — Free tier handles thousands of users
- **Claude (Anthropic)** — AI recommendations — requires API key (optional)

To add a free RAWG key (higher rate limits — get at rawg.io):
```
# in .env.local
VITE_RAWG_KEY=your_key_here
```

---

## 🛠️ Customization

| Thing to change | Where |
|---|---|
| Repo/app name | `vite.config.js` → `base`, `src/main.jsx` → `basename` |
| Color scheme | `src/styles/global.css` → CSS variables at top |
| More genres/platforms | `src/lib/constants.js` |
| More temp email domains | `src/lib/constants.js` → `TEMP_EMAIL_DOMAINS` |
| Score weights | `src/lib/constants.js` → `combinedScore()` function |
