# AGENTY: Your AI Quest for Knowledge
**Mission:** Turn 4th/5th grade learning into a high-stakes, rewarding adventure.

## The Collective
- **Cooper:** Strategy & Math (Blue #3B82F6)
- **Arlo:** Engineering & Physics (Orange #F97316)
- **Minh:** Vietnam & Language (Green #10B981)
- **Maya:** Writing & Stories (Violet #8B5CF6)

## The Economy
- **Gold:** Amazon Wishlist Credits
- **Energy:** Screen Time Minutes
- **Prestige:** Global Rank (XP)

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · AI SDK v6 · Anthropic Claude

## Current State (2026-03-12)
- **Auth:** Parent magic-link setup, child PIN login (6-digit, rate-limited)
- **Dashboard:** The Bridge with live Supabase data, agent theming, economy RPCs
- **AI Chat:** Streaming chat with Claude via `/api/chat`, agent personas
- **RAG:** PDF upload, chunking, OpenAI embeddings, vector search, contextual chat
- **Mission Mode:** `/bridge/lab` with Holographic Briefing Board, SVG blueprints, stat tracking via `updateStat` tool

## Dev Setup
```bash
npm install
cp .env.local.example .env.local  # fill in Supabase + Anthropic keys
npm run dev
```
