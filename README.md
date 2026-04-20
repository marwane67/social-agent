# Social Agent — Marwane / Pixel Company

Agent IA pour générer des posts Twitter/X et LinkedIn. Built in public, Axora, Pulsa Creatives.

## Stack
- Next.js 14 (Pages Router)
- TypeScript
- Anthropic Claude API (claude-opus-4-5)

## Setup local

```bash
npm install
cp .env.example .env.local
# Ajoute ta clé Anthropic dans .env.local
npm run dev
```

App disponible sur http://localhost:3000

## Deploy sur Vercel

### Option 1 — Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2 — GitHub + Vercel Dashboard
1. Push ce repo sur GitHub
2. Importe le projet sur vercel.com
3. Dans Settings → Environment Variables, ajoute :
   - `ANTHROPIC_API_KEY` = ta clé API Anthropic

C'est tout. Vercel détecte Next.js automatiquement.

## Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Clé API Anthropic (https://console.anthropic.com) |

## Fonctionnalités

- Génération de posts pour **Twitter/X** et **LinkedIn**
- 4 modes : Building in public, Insight business, Hook viral, Storytelling
- 3 versions par génération avec angles différents
- Éditeur inline
- Copie en 1 clic
- Ouverture directe sur la plateforme pour poster
- Compteur de caractères (280 pour X, 3000 pour LinkedIn)
