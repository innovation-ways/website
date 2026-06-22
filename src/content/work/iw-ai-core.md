---
name: "IW AI Core"
tagline: "An AI-orchestration platform that runs AI-assisted development across projects — with all operational state in Postgres and a dual-agent runtime."
tags: ["Python 3.12", "FastAPI", "PostgreSQL", "llama-index", "OSS · MIT"]
status: "oss"
order: 1
diagram: "/diagrams/iw-ai-core.svg"
screenshots:
  - src: "/screenshots/iw-ai-core/screenshot-dashboard.png"
    alt: "IW AI Core dashboard showing active batches, recent activity and git status across projects"
    caption: "The dashboard — active batches, recent activity and git status across every registered project."
  - src: "/screenshots/iw-ai-core/screenshot-item-detail.png"
    alt: "IW AI Core work-item detail showing the step pipeline, agent assignments and fix cycles"
    caption: "A work item's pipeline — agent assignments, fix cycles and quality gates, each run in its own isolated git worktree so parallel runs never collide."
  - src: "/screenshots/iw-ai-core/screenshot-code-qa.png"
    alt: "IW AI Core code-understanding view with an architecture map and a RAG-backed Q&A panel"
    caption: "Code Understanding — an architecture map of a project with a RAG-backed Q&A panel for asking questions about the codebase."
  - src: "/screenshots/iw-ai-core/screenshot-research.png"
    alt: "IW AI Core research catalogue listing filed research documents with mode tags and search"
    caption: "The research catalogue — filed research documents with mode tags and full-text search."
---

## What it is

IW AI Core is an AI-orchestration platform — a daemon, a CLI, and a dashboard — that runs AI-assisted development across multiple registered projects. It plans work, hands it to LLM coding agents, runs the result through fix and quality cycles, and merges it — keeping every piece of operational state in PostgreSQL.

## The problem

AI coding agents are capable but awkward to run at any scale. Orchestrate more than a couple of runs and the cracks show: half-written state on disk, races between concurrent runs, no audit trail of what an agent actually did, no durable queue to claim work from. Treating that with loose files and shell scripts doesn't hold. The interesting engineering in agentic development isn't the prompt — it's the system around it that makes runs durable, observable, and safe to repeat.

## How it works

A single daemon polls Postgres every 60 seconds for approved work ("batches"). For each one it creates an isolated **git worktree**, launches an LLM agent (**Claude Code** or **OpenCode**), runs fix cycles against the project's quality gates, and squash-merges the result back to main. Because every run lives in its own worktree, multiple workstreams execute **in parallel** without colliding — the database, not a pile of file locks, arbitrates who works on what. A FastAPI + htmx dashboard — server-rendered, with live updates over SSE — gives real-time visibility into every run, down to the individual steps, fix cycles, and agent assignments of a single work item. The `iw` CLI is the bridge between agents and the database: agents report progress with commands like `iw step-done`, so the daemon always knows the true state.

The dashboard also folds in a **Code Understanding** view — an architecture map of each registered project with a RAG-backed Q&A panel, so you can ask questions about a codebase and get answers grounded in the actual repository, not a guess.

## Key decisions

- **All operational state in Postgres — no files, no race conditions.** Work is claimed with `FOR UPDATE / SKIP LOCKED`, letting the database do the concurrency control that ad-hoc file locks can't. That claim path is tested against a real Postgres via testcontainers, not mocks.
- **Git worktrees for isolation.** Parallel agent runs operate on separate working trees, so they never collide; every merge is deliberate and reviewable.
- **A pluggable, dual-agent runtime.** Claude Code and OpenCode are both first-class — the orchestration layer doesn't care which model writes the code.
- **Verification as a first-class concern.** Fix cycles and quality gates are part of the loop, not an afterthought — the same instinct that keeps a billing system honest.

## Dogfooding

IW AI Core orchestrates several internal projects through a single registry — including this website and the platform itself. The tool that builds the work is run by the platform it documents.

## Stack

Python 3.12 (strict mypy, extensive ruff) · FastAPI · Uvicorn · Jinja2 · htmx · Click · Rich · PostgreSQL (psycopg3) · SQLAlchemy 2.0 · Alembic · LanceDB · Tree-sitter · llama-index · pytest · testcontainers · Hypothesis · Playwright · uv · Docker.

## Status

In active development. Open source under the MIT licence.
