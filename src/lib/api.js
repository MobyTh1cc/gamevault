// src/lib/api.js
const RAWG_BASE = 'https://api.rawg.io/api'
const RAWG_KEY  = import.meta.env.VITE_RAWG_KEY || ''
const GeminiApiKey = import.meta.env.VITE_GEMINI_API_KEY

export async function rawgFetch(path, params = {}) {
  const url = new URL(RAWG_BASE + path)
  if (RAWG_KEY) url.searchParams.set('key', RAWG_KEY)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`RAWG ${res.status}`)
  return res.json()
}

export async function geminiFetch(messages, system = '', maxTokens = 200) {
  try {
    console.log("Starting Fetch to Gemini...");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GeminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
      }),
    });

    if (!res.ok) {
      // This catches 400, 401, 429, and 500 errors
      const errorData = await res.json();
      console.error("API Response Error:", errorData);
      throw new Error(`Google API returned ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  } catch (error) {
    // This catches Network errors, CORS errors, and the error we threw above
    console.error("CRITICAL FETCH ERROR:", error.message);
    return ''; 
  }
}

// Search games by name for pickers — returns array of {id, name, background_image, released}
export async function searchGames(query, pageSize = 10) {
  if (!query || query.length < 2) return []
  const data = await rawgFetch('/games', {
    search: query,
    page_size: pageSize,
    search_precise: true,
  })
  return (data.results || []).map((g) => ({
    id: g.id,
    name: g.name,
    background_image: g.background_image,
    released: g.released,
    rating: g.rating,
    metacritic: g.metacritic,
    genres: g.genres,
    platforms: g.platforms,
  }))
}
