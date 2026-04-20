import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Génère une image directement à partir du texte d'un post.
// Aucun prompt à écrire pour l'utilisateur — l'IA crée le prompt optimal toute seule.

const PROMPT_BUILDER_SYSTEM = `Tu es expert en direction artistique pour réseaux sociaux.
On te donne le texte d'un post. Tu renvoies UN SEUL prompt en anglais pour DALL-E 3 qui génèrera l'image visuelle parfaite pour accompagner ce post.

Règles strictes :
- Style : modern minimalist, clean typography, premium tech aesthetic (comme Linear, Vercel, Stripe)
- Palette : dark background (near-black), 1 accent color subtle, beaucoup de whitespace
- Pas de texte sur l'image (sauf si vraiment nécessaire — alors max 3-5 mots)
- Format : carré, lisible en mobile feed
- Subject : un visuel symbolique/abstrait qui ILLUSTRE le message sans être littéral
- Mood : confiant, professionnel, contemporain

Renvoie UNIQUEMENT le prompt en anglais, rien d'autre. Pas de "Here is..." pas de bloc code.`

async function craftImagePrompt(postText: string, style: string): Promise<string> {
  const styleHint =
    style === 'editorial' ? 'editorial magazine layout, serif headline, premium feel' :
    style === 'meme' ? 'bold pop art, high contrast, attention-grabbing meme aesthetic' :
    style === 'data' ? 'clean data visualization, minimalist chart, infographic style' :
    style === 'photo' ? 'cinematic photography, shallow depth of field, dramatic lighting' :
    'modern minimalist, premium tech aesthetic'

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: 400,
      messages: [
        { role: 'system', content: PROMPT_BUILDER_SYSTEM },
        { role: 'user', content: `Post text:\n"${postText}"\n\nStyle hint: ${styleHint}\n\nGenerate the image prompt:` },
      ],
    }),
  })
  const data = await res.json()
  const prompt = data.choices?.[0]?.message?.content?.trim() || ''
  return prompt.replace(/^["']|["']$/g, '')
}

async function generateWithDalle(prompt: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    })
    const data = await res.json()
    if (res.ok && data.data?.[0]?.url) return data.data[0].url
    console.error('DALL-E error:', data)
    return null
  } catch (e) {
    console.error('DALL-E fetch error:', e)
    return null
  }
}

async function generateWithReplicate(prompt: string): Promise<string | null> {
  if (!process.env.REPLICATE_API_TOKEN) return null
  try {
    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: { prompt, num_outputs: 1, aspect_ratio: '1:1', output_format: 'png' },
      }),
    })
    const data = await res.json()
    if (res.ok && data.output?.[0]) return data.output[0]
    return null
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { postText, style = 'modern' } = req.body
  if (!postText) return res.status(400).json({ error: 'Missing postText' })

  try {
    // 1. Auto-craft the optimal image prompt from the post text
    const imagePrompt = await craftImagePrompt(postText, style)
    if (!imagePrompt) {
      return res.status(500).json({ error: "Impossible de générer le prompt d'image" })
    }

    // 2. Try DALL-E 3 first
    let imageUrl = await generateWithDalle(imagePrompt)
    let provider = 'dalle3'

    // 3. Fallback to Flux (Replicate)
    if (!imageUrl) {
      imageUrl = await generateWithReplicate(imagePrompt)
      provider = 'flux'
    }

    // 4. If no image API → renvoie un lien Canva pré-rempli + le prompt
    if (!imageUrl) {
      const canvaSearch = `https://www.canva.com/search/templates?q=${encodeURIComponent(
        style + ' social media post'
      )}`
      return res.status(200).json({
        url: null,
        prompt: imagePrompt,
        canvaUrl: canvaSearch,
        provider: 'canva-link',
        note: "Pas de clé OpenAI/Replicate configurée. Voici le prompt + un lien Canva pour créer l'image manuellement.",
      })
    }

    res.status(200).json({ url: imageUrl, prompt: imagePrompt, provider })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message || 'Image generation failed' })
  }
}
