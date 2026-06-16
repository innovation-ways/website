---
name: "IW AI Core"
tagline: "An AI-orchestration platform that runs AI-assisted development across projects — with all operational state in Postgres and a dual-agent runtime."
tags: ["Python 3.12", "FastAPI", "PostgreSQL", "llama-index", "OSS · MIT"]
status: "oss"
order: 1
diagram: "/diagrams/iw-ai-core.svg"
---

## What it is

IW AI Core is an AI-orchestration platform — a daemon, a CLI, and a dashboard — that runs AI-assisted development across multiple registered projects. It plans work, hands it to LLM coding agents, runs the result through fix and quality cycles, and merges it — keeping every piece of operational state in PostgreSQL.

## The problem

AI coding agents are capable but awkward to run at any scale. Orchestrate more than a couple of runs and the cracks show: half-written state on disk, races between concurrent runs, no audit trail of what an agent actually did, no durable queue to claim work from. Treating that with loose files and shell scripts doesn't hold. The interesting engineering in agentic development isn't the prompt — it's the system around it that makes runs durable, observable, and safe to repeat.

## How it works

A single daemon polls Postgres every 60 seconds for approved work ("batches"). For each one it creates an isolated **git worktree**, launches an LLM agent (**Claude Code** or **OpenCode**), runs fix cycles against the project's quality gates, and squash-merges the result back to main. A FastAPI + htmx dashboard — server-rendered, with live updates over SSE — gives real-time visibility into every run. The `iw` CLI is the bridge between agents and the database: agents report progress with commands like `iw step-done`, so the daemon always knows the true state.

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
