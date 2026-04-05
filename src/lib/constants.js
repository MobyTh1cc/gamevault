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
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&q=80',
  },
  {
    id: 2,
    title: "FromSoftware's Next Project Teased as 'Completely New World'",
    body: 'Hidetaka Miyazaki hinted at a new IP in development at FromSoftware, described as a departure from the Soulsborne formula.',
    source: 'FromSoftware', date: '2026-04-08', tag: 'Announcement',
    img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&q=80',
  },
  {
    id: 3,
    title: 'Valve Announces Steam Deck 2 with OLED Display',
    body: "Valve unveiled the Steam Deck 2 with an OLED display, AMD's latest mobile chip, and redesigned ergonomics. Pre-orders open next month at $599.",
    source: 'Valve', date: '2026-04-05', tag: 'Hardware',
    img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=700&q=80',
  },
  {
    id: 4,
    title: 'The Witcher 4 — First Gameplay Details Emerge',
    body: 'CD Projekt Red confirmed Ciri as the primary playable character in The Witcher 4, built on Unreal Engine 5 with a living world system.',
    source: 'CD Projekt Red', date: '2026-04-01', tag: 'Development',
    img: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=700&q=80',
  },
  {
    id: 5,
    title: 'Nintendo Direct: Four New Switch 2 Exclusives Revealed',
    body: "Nintendo's Direct showcased four exclusives: new Metroid, Pikmin sequel, and two Capcom/Bandai Namco titles.",
    source: 'Nintendo', date: '2026-03-28', tag: 'Announcement',
    img: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=700&q=80',
  },
  {
    id: 6,
    title: 'Bethesda Confirms Elder Scrolls VI Set in Hammerfell',
    body: "A confirmed leak places TES VI in Hammerfell, targeting a 2028 release on Xbox Series and PC.",
    source: 'Bethesda', date: '2026-03-22', tag: 'Leak Confirmed',
    img: 'https://images.unsplash.com/photo-1559163499-413811fb2344?w=700&q=80',
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

// ── Disposable / temp email domain blocklist ───────────────────────────────
// Covers the most common temp mail services
export const TEMP_EMAIL_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info','grr.la','sharklasers.com',
  'guerrillamailblock.com','spam4.me','trashmail.com','trashmail.at','trashmail.io',
  'trashmail.me','trashmail.net','trashmail.xyz','tempmail.com','temp-mail.org',
  'temp-mail.io','dispostable.com','throwam.com','throwam.net','yopmail.com',
  'yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc','nomail.xl.cx',
  'mega.zik.dj','speed.1s.fr','courriel.fr.nf','moncourrier.fr.nf',
  'monemail.fr.nf','monmail.fr.nf','mailnesia.com','mailnull.com','spamgourmet.com',
  'spamgourmet.net','spamgourmet.org','spamspot.com','spamthis.co.uk',
  'fakeinbox.com','maildrop.cc','discard.email','mailnull.com','spamfree24.org',
  'mailexpire.com','mail-temporaire.fr','wegwerfmail.de','wegwerfmail.net',
  'wegwerfmail.org','owlpic.com','trbvm.com','klzlk.com','tmailinator.com',
  'tempr.email','discard.email','spamherelots.com','spamhereplease.com',
  'tempemail.net','throwam.com','10minutemail.com','10minutemail.net',
  '10minutemail.org','10minemail.com','20minutemail.com','mohmal.com',
  'getnada.com','tempail.com','filzmail.com','tempomail.fr','jetable.net',
  'jetable.org','jetable.com','safetymail.info','objectmail.com',
  'spamfree.eu','spamfree24.de','spamfree24.eu','spamfree24.info',
  'spamfree24.net','spamfree24.com','spamgourmet.com','spamgourmet.net',
  'spoofmail.de','dispostable.com','mailinater.com','spaml.de','spamoff.de',
  'binkmail.com','bobmail.info','chammy.info','devnullmail.com',
  'letthemeatspam.com','mailandftp.com','mailbolt.com','mailc.net',
  'mailchop.com','maildrop.cc','maileater.com','mailexpire.com',
  'mailfa.tk','mailforspam.com','mailfreeonline.com','mailguard.me',
  'mailin8r.com','mailinator2.com','mailite.com','mailme.lv',
  'mailme24.com','mailmetrash.com','mailmoat.com','mailnew.com',
  'mailnull.com','mailsac.com','mailscrap.com','mailshell.com',
  'mailsiphon.com','mailslapping.com','mailslite.com','mailsoul.com',
  'mailtome.de','mailtothis.com','mailtrash.net','mailtv.net',
  'mailzilla.com','mailzilla.org','mbx.cc','mega.zik.dj',
  'meltmail.com','mierdamail.com','migumail.com','mintemail.com',
])

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
