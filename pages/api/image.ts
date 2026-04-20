import type { NextApiRequest, NextApiResponse } from 'next'

// Génère une image via DALL-E 3 (OpenAI) — plus fiable et rapide
// Fallback : génère juste un brief descriptif si pas de clé OpenAI

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt, style = 'modern', size = '1024x1024' } = req.body
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

  const stylePrompts: Record<string, string> = {
    modern: 'modern minimalist style, clean typography, lots of whitespace, premium tech aesthetic',
    handdrawn: 'hand-drawn sketch style on graph paper, like notebook illustration, casual',
    bold: 'bold colorful pop art, high contrast, attention-grabbing',
    corporate: 'professional corporate style, clean charts and data viz, LinkedIn aesthetic',
    dark: 'dark mode interface, neon accents, futuristic tech vibe',
  }

  const styleDesc = stylePrompts[style] || stylePrompts.modern
  const fullPrompt = `${prompt}. Style: ${styleDesc}. High quality, no text overlay unless specified.`

  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size,
          quality: 'standard',
        }),
      })
      const data = await openaiRes.json()
      if (openaiRes.ok && data.data?.[0]?.url) {
        return res.status(200).json({ url: data.data[0].url, prompt: fullPrompt, provider: 'dalle3' })
      }
      console.error('OpenAI error:', data)
    } catch (e) {
      console.error('OpenAI fetch error:', e)
    }
  }

  // Try Replicate (Flux) as fallback
  if (process.env.REPLICATE_API_TOKEN) {
    try {
      const replRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: { prompt: fullPrompt, num_outputs: 1, aspect_ratio: '1:1' },
        }),
      })
      const data = await replRes.json()
      if (replRes.ok && data.output?.[0]) {
        return res.status(200).json({ url: data.output[0], prompt: fullPrompt, provider: 'flux' })
      }
    } catch (e) {
      console.error('Replicate error:', e)
    }
  }

  // No image API → return prompt only (user can paste in DALL-E / Midjourney manually)
  return res.status(200).json({
    prompt: fullPrompt,
    provider: 'none',
    note: "Aucune clé API d'image configurée (OPENAI_API_KEY ou REPLICATE_API_TOKEN). Voici le prompt à coller dans DALL-E/Midjourney/Flux manuellement.",
  })
}
