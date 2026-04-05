// src/lib/constants.js

export const GENRES = [
  { id: 4,  name: 'Action',     icon: '⚔️' },
  { id: 51, name: 'Indie',      icon: '🎨' },
  { id: 3,  name: 'Adventure',  icon: '🗺️' },
  { id: 5,  name: 'RPG',        icon: '🧙' },
  { id: 10, name: 'Strategy',   icon: '♟️' },
  { id: 2,  name: 'Shooter',    icon: '🔫' },
  { id: 40, name: 'Casual',     icon: '🎲' },
  { id: 14, name: 'Simulation', icon: '🏙️' },
  { id: 7,  name: 'Puzzle',     icon: '🧩' },
  { id: 11, name: 'Arcade',     icon: '🕹️' },
  { id: 83, name: 'Platformer', icon: '🏃' },
  { id: 1,  name: 'Racing',     icon: '🏎️' },
  { id: 15, name: 'Sports',     icon: '⚽' },
  { id: 6,  name: 'Fighting',   icon: '🥊' },
  { id: 19, name: 'Family',     icon: '👨‍👩‍👧' },
  { id: 28, name: 'Card',       icon: '🃏' },
]

export const PLATFORMS = [
  { id: 4,   name: 'PC',        icon: '🖥️' },
  { id: 187, name: 'PS5',       icon: '🎮' },
  { id: 18,  name: 'PS4',       icon: '🎮' },
  { id: 1,   name: 'Xbox One',  icon: '🟢' },
  { id: 186, name: 'Xbox S/X',  icon: '🟢' },
  { id: 7,   name: 'Switch',    icon: '🔴' },
  { id: 3,   name: 'iOS',       icon: '📱' },
  { id: 21,  name: 'Android',   icon: '📱' },
]

export const TAGS_SPECIAL = [
  { id: 31,  name: 'Singleplayer' },
  { id: 7,   name: 'Multiplayer'  },
  { id: 42,  name: 'Co-op'        },
  { id: 18,  name: 'Online Co-Op' },
  { id: 36,  name: 'Open World'   },
  { id: 411, name: 'Horror'       },
  { id: 13,  name: 'Atmospheric'  },
  { id: 198, name: 'Story Rich'   },
  { id: 8,   name: 'First-Person' },
  { id: 30,  name: 'VR'           },
  { id: 149, name: 'Pixel Art'    },
  { id: 40,  name: 'Sci-fi'       },
]

// Default sort is now combined score
export const ORDERINGS = [
  { value: 'combined',    label: '⭐ Top Rated (Combined)' },
  { value: '-metacritic', label: '🎯 Metacritic Score'     },
  { value: '-rating',     label: '👥 RAWG Community Score' },
  { value: '-released',   label: '🆕 Newest First'         },
  { value: 'released',    label: '📅 Oldest First'         },
  { value: '-added',      label: '🔥 Most Added'           },
  { value: 'name',        label: '🔤 A → Z'               },
]

export const MOCK_NEWS = [
  {
    id: 1,
    title: 'GTA VI Gets Official Fall 2026 Release Window',
    body: 'Rockstar Games confirmed Grand Theft Auto VI will release in Fall 2026 for PS5 and Xbox Series X|S, with a PC version to follow. A second trailer showcased the Vice City setting and dual protagonists.',
    source: 'Rockstar Games', date: '2026-04-12', tag: 'Release Date',
    img: 'https://www.rockstargames.com/VI/_next/image?url=%2FVI%2F_next%2Fstatic%2Fmedia%2FJason_Duval_01.6e287338.jpg&w=3840&q=75',
  },
  {
    id: 2,
    title: "FromSoftware's Next Project Teased as 'Completely New World'",
    body: 'Hidetaka Miyazaki hinted at a new IP in development at FromSoftware, described as a departure from the Soulsborne formula.',
    source: 'FromSoftware', date: '2026-04-08', tag: 'Announcement',
    img: 'https://cdn.dlcompare.com/others_jpg/upload/news/image/en-fromsoftware-s-next-big-move-0b9ba356-image-0b9ba33e.jpg.webp',
  },
  {
    id: 3,
    title: 'Valve Announces Steam Deck 2 with OLED Display',
    body: "Valve unveiled the Steam Deck 2 with an OLED display, AMD's latest mobile chip, and redesigned ergonomics. Pre-orders open next month at $599.",
    source: 'Valve', date: '2026-04-05', tag: 'Hardware',
    img: 'https://media.wired.com/photos/654c04b098d337ba5af8c644/1:1/w_1190,h_1190,c_limit/Steam-Deck-OLED-review-Featured-Gear.jpg',
  },
  {
    id: 4,
    title: 'The Witcher 4 — First Gameplay Details Emerge',
    body: 'CD Projekt Red confirmed Ciri as the primary playable character in The Witcher 4, built on Unreal Engine 5 with a living world system.',
    source: 'CD Projekt Red', date: '2026-04-01', tag: 'Development',
    img: 'https://thewitcher.cdn.cdpr.app/media/wallpaper/1748/3840x2160/02_Silver_Demo_Wallpaper_3840x2160_EN.png',
  },
  {
    id: 5,
    title: 'Nintendo Direct: Four New Switch 2 Exclusives Revealed',
    body: "Nintendo's Direct showcased four exclusives: new Metroid, Pikmin sequel, and two Capcom/Bandai Namco titles.",
    source: 'Nintendo', date: '2026-03-28', tag: 'Announcement',
    img: 'https://static0.polygonimages.com/wordpress/wp-content/uploads/chorus/uploads/chorus_asset/file/24417914/nintendo_direct_stock.jpg',
  },
  {
    id: 6,
    title: 'Bethesda Confirms Elder Scrolls VI Set in Hammerfell',
    body: "A confirmed leak places TES VI in Hammerfell, targeting a 2028 release on Xbox Series and PC.",
    source: 'Bethesda', date: '2026-03-22', tag: 'Leak Confirmed',
    img: 'https://www.pcgamesn.com/wp-content/sites/pcgamesn/2021/12/elder-scrolls-6-release-date-speculation.jpg',
  },
]

export const RATING_LABELS = ['', 'Skip it', 'Meh', 'Decent', 'Good', 'Must play']

// ── Score utilities ────────────────────────────────────────────────────────
export const scoreColor = (s) => {
  if (!s) return '#6b7280'
  if (s >= 4.2) return '#10b981'
  if (s >= 3.5) return '#f59e0b'
  if (s >= 2.5) return '#f97316'
  return '#ef4444'
}

export const metaColor = (m) => m >= 80 ? '#10b981' : m >= 60 ? '#f59e0b' : '#ef4444'

// Combined score: weight Metacritic (0-100→0-5) and RAWG community (0-5) and our users (0-5)
// Returns a 0-5 value
export const combinedScore = (metacritic, rawgRating, communityAvg, reviewCount = 0) => {
  const scores = []
  if (metacritic)    scores.push({ v: metacritic / 20, w: 2 })   // MC: weight 2
  if (rawgRating)    scores.push({ v: rawgRating,      w: 1.5 }) // RAWG: weight 1.5
  if (communityAvg && reviewCount >= 2) scores.push({ v: communityAvg, w: 2 }) // Ours: weight 2
  if (scores.length === 0) return null
  const totalW = scores.reduce((s, x) => s + x.w, 0)
  return scores.reduce((s, x) => s + x.v * x.w, 0) / totalW
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA'



export const isTempEmail = (email) => {
  const allowedDomains = [
    'gmail.com', 'outlook.com', 'hotmail.com', 
    'yahoo.com', 'icloud.com', 'protonmail.com', 
    'proton.me', 'live.com', 'msn.com', 'me.com', 'aol.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  // If the domain is NOT in our allowed list, we treat it as "temp/fake"
  return !allowedDomains.includes(domain);
};
