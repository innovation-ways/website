---
name: "PodForger"
tagline: "A full-stack platform that turns RSS feeds into multi-speaker AI audio podcasts — LLM scripting and self-hosted GPU text-to-speech, running in production."
tags: ["FastAPI", "Next.js 16", "async SQLAlchemy", "Multi-LLM", "GPU TTS", "OSS"]
status: "oss"
order: 3
diagram: "/diagrams/podforger.svg"
screenshots:
  - src: "/screenshots/podforger/Podforger_home.png"
    alt: "PodForger home dashboard showing a library of generated podcasts"
    caption: "The home dashboard — your library of generated podcasts."
  - src: "/screenshots/podforger/Podforger_podcast.png"
    alt: "PodForger podcast page for managing episodes and settings"
    caption: "A podcast — manage its episodes, voices and generation settings."
  - src: "/screenshots/podforger/Podforger_episode.png"
    alt: "PodForger episode page with audio player and the generated multi-speaker script"
    caption: "An episode — listen, read the generated multi-speaker script, and share."
---

## What it is

PodForger turns RSS news feeds into multi-speaker, AI-generated audio podcasts — end to end, automatically. A feed goes in; a published, listenable episode with natural multi-voice dialogue comes out.

## The pipeline

RSS ingestion → full-article extraction (the whole article, not the 200-word RSS summary) → LLM article classification → topic generation with live web research → a multi-speaker dialogue script in a configurable multi-segment structure → GPU text-to-speech synthesis → audio assembly → iTunes/Spotify-compatible RSS publishing → object storage. Each stage is a discrete, testable step rather than one opaque call.

## Key decisions

- **Self-hosted GPU TTS.** Synthesis runs on a home Nvidia RTX 5090, reached over a Tailscale VPN, with eight TTS engines running in parallel behind a shared, Postgres-backed job queue and a common worker-base abstraction. Full control over voices and quality, without a per-character cloud bill.
- **Right model for each task.** A multi-LLM setup routes work deliberately — local Ollama for cheap dev-time classification, frontier models for script and topic generation — with full tracing and cost tracking on every call.
- **A database-backed job queue.** The same durable-work pattern as IW AI Core (`FOR UPDATE / SKIP LOCKED`) coordinates ingestion, synthesis, and assembly across services without a separate message broker.
- **AI-first, under strict TDD.** The vast majority of the code was written by AI agents test-first, behind a multi-stage validation pipeline — lint, tests, coverage, and security, then an AI architecture/performance review, then human approval.

## Engineering signals

442 backend test files and 220 Playwright end-to-end test files, 80%+ CI-enforced coverage, and 217 REST endpoints — with a public status page running 60-second health checks across the database, the model runtime, TTS, and the front and back ends. It runs in production, not just on a slide.

## Stack

**Backend:** Python 3.12 · FastAPI · async SQLAlchemy 2.0 · Pydantic V2 · asyncpg · PostgreSQL · Alembic.
**Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · TanStack Query · NextAuth.
**AI:** Ollama · OpenAI · Anthropic · web research · LLM tracing & cost tracking.
**Infra:** Docker · Nginx · Dokploy · Cloudflare R2 · Uptime Kuma · self-hosted GPU over Tailscale.

## Status

Live in production. Open source under the Innovation Ways org.
