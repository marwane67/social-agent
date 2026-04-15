import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'Missing URL' })

  // Extract username from LinkedIn URL
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/)
  const username = match ? match[1] : ''

  // Try to fetch the LinkedIn page for meta tags
  let pageTitle = ''
  let pageDescription = ''

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    })
    const html = await response.text()

    // Extract title and description from meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) pageTitle = titleMatch[1]

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (descMatch) pageDescription = descMatch[1]

    // Try og:title
    if (!pageTitle) {
      const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      if (ogMatch) pageTitle = ogMatch[1]
    }
    // Try og:description
    if (!pageDescription) {
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      if (ogDescMatch) pageDescription = ogDescMatch[1]
    }
  } catch (e) {
    // Scraping failed, we'll use the username
  }

  // Combine all info we have
  const rawInfo = [
    username && `LinkedIn username: ${username}`,
    pageTitle && `Page title: ${pageTitle}`,
    pageDescription && `Page description: ${pageDescription}`,
  ].filter(Boolean).join('\n')

  if (!rawInfo) {
    // Fallback: parse the username slug
    const nameParts = username.replace(/-/g, ' ').replace(/\d+/g, '').trim()
    return res.status(200).json({
      name: nameParts || '',
      title: '',
      company: '',
      context: '',
      raw: username,
    })
  }

  // Use Claude to extract structured info
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Extrais les informations de ce profil LinkedIn à partir de ces données brutes :

${rawInfo}

Réponds en JSON strict :
{"name":"prénom et nom","title":"poste/titre professionnel","company":"entreprise actuelle","context":"résumé en 1 phrase de ce que fait la personne"}

Si une info n'est pas disponible, mets une chaîne vide "". JSON uniquement.`
        }],
      }),
    })

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.status(200).json({ ...parsed, raw: rawInfo })
  } catch (e) {
    // Fallback
    const nameParts = username.replace(/-/g, ' ').replace(/\d+/g, '').trim()
    res.status(200).json({
      name: nameParts || '',
      title: pageTitle || '',
      company: '',
      context: pageDescription || '',
      raw: rawInfo,
    })
  }
}
