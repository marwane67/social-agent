import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useNetwork } from '../lib/network-context'
import { saveBatch, saveEntry } from '../lib/calendar'
import { computeInsights, getPerformances } from '../lib/performance'

type Role = 'user' | 'assistant'
type Action = { tool: string; args: any; result: any }
type Msg = {
  id: string
  role: Role
  content: string
  actions?: Action[]
  ts: number
}

const SUGGESTIONS = [
  { label: 'Planifie ma semaine', prompt: 'Planifie-moi 7 posts pour la semaine prochaine sur Twitter, thème building Axora' },
  { label: '30 jours de lancement', prompt: 'Génère un calendrier de 30 jours pour le lancement d\'Axora sur LinkedIn' },
  { label: 'Brief du jour', prompt: 'Donne-moi le brief du jour avec 5 idées de posts' },
  { label: 'Mes performances', prompt: 'Analyse mes performances et dis-moi ce qui marche le mieux' },
  { label: 'Optimise ma bio', prompt: 'Génère 5 variantes optimisées de ma bio LinkedIn' },
  { label: 'Suggère des hooks', prompt: 'Donne-moi 5 hooks viraux sur le thème de l\'IA pour entrepreneurs' },
]

export default function AgentPage() {
  const router = useRouter()
  const { network, isLi } = useNetwork()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agent-history')
      if (saved) setMessages(JSON.parse(saved))
    } catch {}
  }, [])

  // Save history
  useEffect(() => {
    try { localStorage.setItem('agent-history', JSON.stringify(messages.slice(-30))) } catch {}
  }, [messages])

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // === CLIENT-SIDE TOOL EXECUTOR ===
  // Each tool runs in the browser, calling the right API directly.
  // This bypasses Vercel function timeouts on the agent endpoint.
  const executeTool = async (name: string, args: any): Promise<{ success: boolean; summary: string; data?: any }> => {
    try {
      switch (name) {
        case 'plan_calendar': {
          // Cap at 14 days to stay under timeouts
          const days = Math.min(Math.max(args.days || 7, 1), 14)
          const startDate = args.start_date ? new Date(args.start_date) : new Date()

          const body: any = {
            duration: days,
            network: args.network || network,
            launchDate: startDate.toISOString().split('T')[0],
            productPitch: args.theme,
          }
          try {
            const vp = localStorage.getItem('voice-profile')
            if (vp) body.voiceProfile = JSON.parse(vp)
          } catch {}

          const res = await fetch('/api/series', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (!data.posts) {
            return { success: false, summary: data.error || 'Échec génération série' }
          }

          // Convert to calendar entries
          const entries = data.posts.map((p: any, i: number) => {
            const d = new Date(startDate)
            d.setDate(d.getDate() + i)
            d.setHours(10, 0, 0, 0)
            return {
              network: args.network || network,
              format: p.type || 'storytelling',
              topic: p.goal || p.phase,
              text: p.text,
              scheduledAt: d.toISOString(),
              status: 'scheduled' as const,
            }
          })
          saveBatch(entries)
          return {
            success: true,
            summary: `${days} posts planifiés sur ${args.network || network} (thème: ${args.theme}). Ajoutés au calendrier à 10h.`,
            data: { entries_count: entries.length },
          }
        }

        case 'generate_post': {
          const body: any = { input: args.topic, format: args.format, network: args.network }
          try {
            const vp = localStorage.getItem('voice-profile')
            if (vp) body.voiceProfile = JSON.parse(vp)
          } catch {}
          const res = await fetch('/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (!data.posts?.length) return { success: false, summary: data.error || 'Échec génération' }
          return {
            success: true,
            summary: `Post généré (${data.posts.length} variantes) — ${args.format} sur ${args.network}`,
            data: { posts: data.posts },
          }
        }

        case 'schedule_post': {
          saveEntry({
            network: args.network,
            format: args.format || 'manual',
            topic: args.topic || args.text.slice(0, 50),
            text: args.text,
            scheduledAt: new Date(args.scheduled_at).toISOString(),
            status: 'scheduled',
          })
          return {
            success: true,
            summary: `Post programmé pour le ${new Date(args.scheduled_at).toLocaleString('fr-FR')}`,
          }
        }

        case 'get_performance_summary': {
          const insights = computeInsights(getPerformances())
          if (insights.totalPosts === 0) {
            return { success: true, summary: 'Aucun post tracké. Va dans /analytics pour ajouter des stats.' }
          }
          const parts = [
            `${insights.totalPosts} posts trackés`,
            `${insights.avgImpressions.toLocaleString()} vues/post en moyenne`,
            `${insights.avgEngagementRate}% engagement`,
            `tendance ${insights.trend === 'up' ? '↗' : insights.trend === 'down' ? '↘' : '→'}`,
          ]
          if (insights.topFormat) parts.push(`top format: ${insights.topFormat.format}`)
          return { success: true, summary: parts.join(' · '), data: insights }
        }

        case 'suggest_hooks': {
          const { HOOKS } = await import('../lib/hooks')
          const filtered = args.category && args.category !== 'all'
            ? HOOKS.filter(h => h.category === args.category)
            : HOOKS
          const sample = [...filtered].sort(() => Math.random() - 0.5).slice(0, 5)
          return {
            success: true,
            summary: `5 hooks pour "${args.topic}" : ${sample.map(h => `"${h.text}"`).join(' · ')}`,
            data: { hooks: sample },
          }
        }

        case 'generate_brief': {
          const res = await fetch('/api/brief', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: args.context }),
          })
          const data = await res.json()
          if (!data.headline) return { success: false, summary: 'Échec brief' }
          return { success: true, summary: `Brief : ${data.headline}`, data }
        }

        case 'optimize_bio': {
          const res = await fetch('/api/bio', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              network: args.network, currentBio: args.current_bio || '', goal: args.goal || '',
            }),
          })
          const data = await res.json()
          if (!data.variants) return { success: false, summary: 'Échec' }
          return { success: true, summary: `${data.variants.length} variantes de bio générées`, data }
        }

        case 'sync_to_google_calendar': {
          const which = args.which || 'upcoming'
          const { getEntries } = await import('../lib/calendar')
          const allEntries = getEntries()
          const toSync = which === 'all'
            ? allEntries
            : allEntries.filter((e: any) => new Date(e.scheduledAt).getTime() > Date.now())
          if (toSync.length === 0) return { success: false, summary: 'Aucun post à syncer' }
          const res = await fetch('/api/google/sync', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: toSync }),
          })
          const data = await res.json()
          if (!res.ok) return { success: false, summary: data.message || 'Sync échouée — connecte Google Calendar d\'abord' }
          return { success: true, summary: `${data.created}/${data.total} évènements synchronisés sur Google Calendar` }
        }

        case 'send_to_buffer': {
          const which = args.which || 'upcoming'
          const { getEntries } = await import('../lib/calendar')
          const allEntries = getEntries()
          const toSend = which === 'all'
            ? allEntries
            : allEntries.filter((e: any) => new Date(e.scheduledAt).getTime() > Date.now())
          if (toSend.length === 0) return { success: false, summary: 'Aucun post à envoyer' }
          const res = await fetch('/api/buffer/schedule', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: toSend }),
          })
          const data = await res.json()
          if (!res.ok) return { success: false, summary: data.error || 'Buffer échoué' }
          if (data.created === 0) {
            const firstErr = data.details?.failed?.[0]?.error || 'aucun profil match'
            return { success: false, summary: `0 envoyé : ${firstErr}` }
          }
          return { success: true, summary: `${data.created}/${data.total} posts envoyés dans Buffer pour publication auto` }
        }

        default:
          return { success: false, summary: `Outil inconnu : ${name}` }
      }
    } catch (e: any) {
      return { success: false, summary: 'Erreur : ' + (e.message || 'inconnue') }
    }
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      ts: Date.now(),
    }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    const clientState: any = { network }
    try {
      const vp = localStorage.getItem('voice-profile')
      if (vp) clientState.voiceProfile = JSON.parse(vp)
    } catch {}
    try {
      clientState.performanceInsights = computeInsights(getPerformances())
    } catch {}

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const apiMessages = newMsgs.map(m => ({ role: m.role, content: m.content }))

      // 1. Quick call to agent → get text + tool_calls
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, clientState }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      let data: any
      const rawText = await res.text()
      try { data = JSON.parse(rawText) }
      catch { throw new Error(`Réponse non-JSON (HTTP ${res.status})`) }

      if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`)

      // 2. Add the assistant message immediately (text only)
      const assistantMsgId = (Date.now() + 1).toString()
      const initialMsg: Msg = {
        id: assistantMsgId,
        role: 'assistant',
        content: data.message || (data.tool_calls?.length ? '' : 'Pas de réponse'),
        actions: [],
        ts: Date.now(),
      }
      setMessages([...newMsgs, initialMsg])

      // 3. Execute tool calls in parallel (browser-side)
      if (data.tool_calls?.length) {
        const actions: Action[] = []
        await Promise.all(
          data.tool_calls.map(async (tc: any) => {
            const result = await executeTool(tc.name, tc.args)
            actions.push({ tool: tc.name, args: tc.args, result })
          })
        )
        // Update message with actions
        setMessages(curr => curr.map(m => m.id === assistantMsgId ? { ...m, actions } : m))
      }
    } catch (e: any) {
      clearTimeout(timeoutId)
      const isAbort = e.name === 'AbortError'
      const errMsg: Msg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isAbort ? '⚠️ Pulse n\'a pas répondu (timeout 30s). Réessaye.' : '⚠️ ' + (e.message || 'erreur'),
        ts: Date.now(),
      }
      setMessages([...newMsgs, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    if (!confirm('Effacer la conversation ?')) return
    setMessages([])
    localStorage.removeItem('agent-history')
  }

  return (
    <>
      <Head><title>Pulse — Agent IA</title></Head>
      <Layout title="Pulse" subtitle="Ton agent IA personnel · planifie, génère, exécute">
        <div className="agent">
          {/* Messages */}
          <div className="thread" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome-orb">
                  <div className="orb-core" />
                  <div className="orb-ring" />
                </div>
                <h2>Salut Marwane.</h2>
                <p>Je suis Pulse. Demande-moi de planifier ta semaine, générer des posts, analyser ta perf, ou optimiser ta bio.</p>
                <div className="suggestions">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} className="sugg" onClick={() => send(s.prompt)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`msg msg-${m.role}`}>
                  {m.role === 'assistant' && (
                    <div className="avatar">
                      <div className="avatar-dot" />
                    </div>
                  )}
                  <div className="bubble">
                    {m.actions && m.actions.length > 0 && (
                      <div className="actions">
                        {m.actions.map((a, i) => (
                          <ActionRow key={i} action={a} onOpen={(href) => router.push(href)} />
                        ))}
                      </div>
                    )}
                    {m.content && <div className="content">{renderContent(m.content)}</div>}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="msg msg-assistant">
                <div className="avatar"><div className="avatar-dot" /></div>
                <div className="bubble">
                  <div className="thinking">
                    <span /><span /><span />
                    <span className="thinking-label">Pulse réfléchit · jusqu'à 60s pour les tâches complexes</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="input-bar">
            <textarea
              className="input"
              placeholder={`Parle à Pulse · ${isLi ? 'mode LinkedIn' : 'mode Twitter'}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
              }}
              rows={1}
              disabled={loading}
            />
            <button className="send" onClick={() => send(input)} disabled={loading || !input.trim()}>
              {loading ? <span className="spin" /> : <SendIcon />}
            </button>
          </div>
          {messages.length > 0 && (
            <button onClick={clear} className="clear">Effacer la conversation</button>
          )}
        </div>

        <style jsx>{`
          .agent {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 180px);
            min-height: 500px;
            margin: -8px 0;
          }

          .thread {
            flex: 1;
            overflow-y: auto;
            padding: 8px 4px 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          /* Welcome */
          .welcome {
            margin: auto;
            text-align: center;
            max-width: 480px;
            padding: 24px;
          }
          .welcome-orb {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .orb-core {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--net);
            box-shadow: 0 0 40px var(--net), 0 0 80px var(--net-soft);
            animation: pulse-soft 2.4s ease-in-out infinite;
          }
          .orb-ring {
            position: absolute;
            inset: 0;
            border: 2px solid var(--net-soft);
            border-radius: 50%;
            animation: orb-ring 3s ease-in-out infinite;
          }
          @keyframes orb-ring {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.2; }
          }
          .welcome h2 {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            margin: 0 0 8px;
            letter-spacing: -0.02em;
          }
          .welcome p {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
            margin: 0 0 24px;
          }
          .suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: center;
          }
          .sugg {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 7px 14px;
            border-radius: 100px;
            font-weight: 500;
            transition: all var(--t-fast) var(--ease);
          }
          .sugg:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-strong);
            color: var(--text);
            transform: translateY(-1px);
          }

          /* Messages */
          .msg {
            display: flex;
            gap: 12px;
            animation: fade-in var(--t-med) var(--ease);
          }
          .msg-user { justify-content: flex-end; }

          .avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--bg-card);
            border: 1px solid var(--border-strong);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
          }
          .avatar-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--net);
            box-shadow: 0 0 8px var(--net);
          }

          .bubble {
            max-width: 76%;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .msg-user .bubble {
            background: var(--accent);
            color: var(--accent-text-on);
            padding: 12px 16px;
            border-radius: 16px 16px 4px 16px;
          }
          .msg-assistant .bubble .content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 12px 16px;
            border-radius: 4px 16px 16px 16px;
          }
          .content {
            font-size: 14px;
            line-height: 1.55;
            white-space: pre-wrap;
          }

          .thinking {
            display: inline-flex;
            gap: 6px;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 4px 16px 16px 16px;
          }
          .thinking-label {
            font-size: 11px;
            color: var(--text-muted);
            margin-left: 8px;
            font-family: var(--mono);
          }
          .thinking span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--text-muted);
            animation: bounce 1.2s ease-in-out infinite;
          }
          .thinking span:nth-child(2) { animation-delay: 0.15s; }
          .thinking span:nth-child(3) { animation-delay: 0.3s; }
          @keyframes bounce {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-3px); }
          }

          /* Input */
          .input-bar {
            display: flex;
            gap: 8px;
            padding: 12px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-xl);
            margin-top: 12px;
            transition: border-color var(--t-fast) var(--ease);
          }
          .input-bar:focus-within {
            border-color: var(--border-focus);
          }
          .input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text);
            font-size: 14px;
            line-height: 1.5;
            resize: none;
            font-family: var(--font);
            padding: 6px 4px;
            min-height: 24px;
            max-height: 200px;
          }
          .input::placeholder { color: var(--text-muted); }
          .input:focus { box-shadow: none; }

          .send {
            background: var(--accent);
            color: var(--accent-text-on);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .send:hover:not(:disabled) { transform: scale(1.05); }
          .send:disabled { background: var(--bg-card); color: var(--text-faint); }

          .spin {
            width: 14px;
            height: 14px;
            border: 1.5px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }

          .clear {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 11px;
            font-family: var(--mono);
            padding: 8px;
            margin-top: 4px;
            align-self: flex-end;
          }
          .clear:hover { color: var(--danger); }
        `}</style>
      </Layout>
    </>
  )
}

function renderContent(text: string) {
  // Simple markdown-like rendering : bold + line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>
    }
    return <span key={i}>{p}</span>
  })
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  )
}

function ActionRow({ action, onOpen }: { action: Action; onOpen: (href: string) => void }) {
  const labels: Record<string, string> = {
    plan_calendar: 'Calendrier planifié',
    generate_post: 'Post généré',
    schedule_post: 'Post programmé',
    get_performance_summary: 'Performance',
    suggest_hooks: 'Hooks suggérés',
    generate_brief: 'Brief généré',
    optimize_bio: 'Bio optimisée',
    sync_to_google_calendar: 'Sync Google Calendar',
    send_to_buffer: 'Envoi Buffer',
  }
  const label = labels[action.tool] || action.tool
  const ok = action.result?.success !== false
  const summary = action.result?.summary || action.result?.message || ''

  // Quick links per action
  const link =
    action.tool === 'plan_calendar' || action.tool === 'schedule_post' || action.tool === 'sync_to_google_calendar' ? '/calendar' :
    action.tool === 'generate_brief' ? '/brief' :
    action.tool === 'get_performance_summary' ? '/analytics' :
    action.tool === 'optimize_bio' ? '/bio' :
    action.tool === 'generate_post' ? '/' : ''

  return (
    <div className={`action ${ok ? 'ok' : 'fail'}`}>
      <div className="action-icon">{ok ? '✓' : '✗'}</div>
      <div className="action-body">
        <div className="action-name">{label}</div>
        {summary && <div className="action-summary">{summary}</div>}
      </div>
      {link && (
        <button className="action-link" onClick={() => onOpen(link)}>
          Voir →
        </button>
      )}

      <style jsx>{`
        .action {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          border-radius: var(--r-md);
          padding: 10px 12px;
          font-size: 12px;
        }
        .action.ok { border-left: 3px solid var(--success); }
        .action.fail { border-left: 3px solid var(--danger); }
        .action-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${'var(--net-soft)'};
          color: var(--net);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .action.fail .action-icon { background: rgba(239,68,68,.1); color: var(--danger); }
        .action-body { flex: 1; min-width: 0; }
        .action-name {
          font-weight: 600;
          color: var(--text);
          font-size: 12px;
        }
        .action-summary {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
          line-height: 1.4;
        }
        .action-link {
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          font-size: 11px;
          padding: 4px 10px;
          border-radius: var(--r-sm);
          font-family: var(--mono);
          flex-shrink: 0;
        }
        .action-link:hover { color: var(--text); border-color: var(--text-faint); }
      `}</style>
    </div>
  )
}
