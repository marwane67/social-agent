import type { NextApiRequest, NextApiResponse } from 'next'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le bot Telegram personnel de Marwane (@ismaa_pxl), entrepreneur tech à Bruxelles.
Projets : Axora (marketplace acquisition business digitaux francophone), Pulsa Creatives (agence IA Bruxelles).
Style : direct, cash, authentique, mélange FR/EN naturel, zéro bullshit.`

const FORMATS = ['raw_build', 'hot_take', 'behind_scenes', 'ai_authority', 'storytelling', 'one_liner', 'axora_hype', 'engagement_bait']
const FORMAT_LABELS: Record<string, string> = {
  raw_build: 'Raw Build', hot_take: 'Hot Take', behind_scenes: 'BTS',
  ai_authority: 'AI Authority', storytelling: 'Micro Story',
  one_liner: 'One-Liner', axora_hype: 'Axora Hype', engagement_bait: 'Reply Magnet'
}

async function sendTelegram(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

async function callAI(prompt: string, maxTokens = 800) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// Télécharge un fichier vocal depuis Telegram et le transcrit via Whisper (OpenAI ou Groq)
async function transcribeVoice(fileId: string): Promise<string> {
  // 1. Get file path from Telegram
  const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  if (!fileData.ok) throw new Error('Cannot get file')
  const filePath = fileData.result.file_path

  // 2. Download the audio
  const audioRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`)
  const audioBuf = await audioRes.arrayBuffer()

  // 3. Send to Whisper (Groq is fast & free tier — fallback to OpenAI)
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
  const apiUrl = process.env.GROQ_API_KEY
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions'
  const model = process.env.GROQ_API_KEY ? 'whisper-large-v3' : 'whisper-1'

  if (!apiKey) throw new Error('Pas de GROQ_API_KEY ni OPENAI_API_KEY configurée')

  const form = new FormData()
  form.append('file', new Blob([audioBuf], { type: 'audio/ogg' }), 'voice.ogg')
  form.append('model', model)
  form.append('language', 'fr')

  const transcRes = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  const transcData = await transcRes.json()
  if (!transcRes.ok) throw new Error(transcData.error?.message || 'Transcription failed')
  return transcData.text || ''
}

async function generatePost(topic: string, format: string, network: string) {
  const isTwitter = network !== 'linkedin'
  const maxChars = isTwitter ? 280 : 1500
  return callAI(`Génère 1 post ${isTwitter ? 'Twitter/X' : 'LinkedIn'} au format "${FORMAT_LABELS[format] || format}".

Sujet : "${topic}"

UNIQUEMENT le texte du post, rien d'autre. Max ${maxChars} chars. Hook fort en ligne 1. ${isTwitter ? 'Zéro emoji, max 1 hashtag.' : 'Format aéré, CTA à la fin.'}`)
}

async function generateWeek(topic: string, network: string) {
  const isTwitter = network !== 'linkedin'
  const raw = await callAI(`Génère 7 posts ${isTwitter ? 'Twitter/X' : 'LinkedIn'} pour la semaine.

Thème : "${topic}"

Format : un post par jour, chaque jour un format différent. Présente comme ça :

LUNDI (Raw Build):
[post]

MARDI (Hot Take):
[post]

etc.

Max ${isTwitter ? '280' : '1500'} chars par post. Hook fort. ${isTwitter ? 'Pas d\'emojis.' : 'Format aéré.'}`, 3000)
  return raw
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  const update = req.body
  const message = update?.message
  if (!message) return res.status(200).json({ ok: true })

  const chatId = message.chat.id

  // === HANDLE VOICE MESSAGES ===
  if (message.voice || message.audio) {
    try {
      await sendTelegram(chatId, '🎙️ Je transcris ton vocal...')
      const fileId = (message.voice || message.audio).file_id
      const transcript = await transcribeVoice(fileId)
      if (!transcript) {
        await sendTelegram(chatId, "Transcription vide. Réessaye.")
        return res.status(200).json({ ok: true })
      }
      await sendTelegram(chatId, `📝 *Transcription :*\n_${transcript}_\n\n⏳ Je génère 3 posts à partir de ça...`)
      // Génère 3 posts dans 3 formats différents à partir du vocal
      const posts = await callAI(`Sur la base de ce vocal de Marwane, génère 3 posts Twitter (280 chars max chacun) avec 3 angles différents.

Vocal transcrit : "${transcript}"

Format obligatoire :
🟢 RAW BUILD
[post]

🟡 STORY
[post]

🔴 HOT TAKE
[post]

Pas d'emojis dans les posts. Hook fort en ligne 1.`, 1500)
      await sendTelegram(chatId, `*3 posts générés* 🎯\n\n${posts}\n\n_Copie celui que tu préfères._`)
    } catch (e: any) {
      console.error(e)
      await sendTelegram(chatId, `Erreur transcription : ${e.message || 'inconnue'}.\n\nVérifie que GROQ_API_KEY ou OPENAI_API_KEY est configurée.`)
    }
    return res.status(200).json({ ok: true })
  }

  if (!message.text) return res.status(200).json({ ok: true })
  const text = message.text.trim()
  const parts = text.split(/\s+/)
  const cmd = parts[0].replace('/', '').toLowerCase()
  const rest = parts.slice(1).join(' ')

  // Detect network
  let network = 'twitter'
  let cleanRest = rest
  if (/linkedin|^li$/i.test(rest)) {
    network = 'linkedin'
    cleanRest = rest.replace(/linkedin|^li$/gi, '').trim()
  }

  // Detect format
  let format = ''
  for (const f of FORMATS) {
    const label = FORMAT_LABELS[f].toLowerCase()
    if (cleanRest.toLowerCase().includes(label) || cleanRest.toLowerCase().includes(f)) {
      format = f
      cleanRest = cleanRest.replace(new RegExp(label, 'gi'), '').replace(new RegExp(f, 'gi'), '').trim()
      break
    }
  }

  try {
    switch (cmd) {
      case 'start':
      case 'help': {
        await sendTelegram(chatId,
          `*Social Agent Bot* 🤖\n\n` +
          `Commandes :\n\n` +
          `/today — Post pour aujourd'hui\n` +
          `/tomorrow — Post pour demain\n` +
          `/week — 7 posts pour la semaine\n` +
          `/post [sujet] — Post custom\n` +
          `/formats — Voir les formats\n\n` +
          `Options :\n` +
          `• Ajoute *linkedin* pour LinkedIn\n` +
          `• Ajoute un sujet pour personnaliser\n\n` +
          `Exemples :\n` +
          `\`/today J'ai shippé le matching Axora\`\n` +
          `\`/week linkedin\`\n` +
          `\`/post hot take agences IA en 2026\``
        )
        break
      }

      case 'today':
      case 'aujourdhui': {
        await sendTelegram(chatId, '⏳ Je génère ton post...')
        const f = format || FORMATS[Math.floor(Math.random() * FORMATS.length)]
        const post = await generatePost(cleanRest || "Ce que je build aujourd'hui", f, network)
        await sendTelegram(chatId,
          `*Post du jour* (${FORMAT_LABELS[f]}) — ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}\n\n` +
          `${post}\n\n` +
          `_Copie et poste !_`
        )
        break
      }

      case 'tomorrow':
      case 'demain': {
        await sendTelegram(chatId, '⏳ Je génère ton post pour demain...')
        const f = format || FORMATS[Math.floor(Math.random() * FORMATS.length)]
        const post = await generatePost(cleanRest || "Ce que je prépare pour demain", f, network)
        await sendTelegram(chatId,
          `*Post pour demain* (${FORMAT_LABELS[f]}) — ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}\n\n` +
          `${post}\n\n` +
          `_Sauvegarde-le et poste demain !_`
        )
        break
      }

      case 'week':
      case 'semaine': {
        await sendTelegram(chatId, '⏳ Je génère 7 posts pour ta semaine...')
        const weekPosts = await generateWeek(cleanRest || 'Building Axora, IA, entrepreneuriat', network)
        await sendTelegram(chatId,
          `*7 posts pour la semaine* — ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}\n\n${weekPosts}`
        )
        break
      }

      case 'post': {
        if (!cleanRest) {
          await sendTelegram(chatId, 'Donne-moi un sujet.\n\nEx: `/post J\'ai lancé la beta d\'Axora`')
          break
        }
        await sendTelegram(chatId, '⏳ Je génère...')
        const f = format || FORMATS[Math.floor(Math.random() * FORMATS.length)]
        const post = await generatePost(cleanRest, f, network)
        await sendTelegram(chatId,
          `*Post* (${FORMAT_LABELS[f]}) — ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}\n\n` +
          `${post}`
        )
        break
      }

      case 'formats': {
        const list = Object.entries(FORMAT_LABELS).map(([_, label]) => `• ${label}`).join('\n')
        await sendTelegram(chatId, `*Formats disponibles :*\n\n${list}\n\nUtilise le nom du format dans ta commande.\nEx: \`/post hot take sur les agences IA\``)
        break
      }

      default: {
        // If it's just text without a command, treat as /post
        if (!text.startsWith('/')) {
          await sendTelegram(chatId, '⏳ Je génère...')
          const f = format || FORMATS[Math.floor(Math.random() * FORMATS.length)]
          const post = await generatePost(text, f, network)
          await sendTelegram(chatId,
            `*Post* (${FORMAT_LABELS[f]}) — ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}\n\n${post}`
          )
        } else {
          await sendTelegram(chatId, 'Commande inconnue. Tape /help pour voir les commandes.')
        }
      }
    }
  } catch (e) {
    console.error(e)
    await sendTelegram(chatId, 'Erreur de génération. Réessaie.')
  }

  return res.status(200).json({ ok: true })
}
