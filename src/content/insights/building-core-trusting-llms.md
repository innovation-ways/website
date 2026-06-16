---
title: "Building CORE: trusting LLMs where being wrong costs money"
description: "I built a 100%-local, five-agent AI platform for a regulated enterprise. The lasting lesson wasn't the demo — it was knowing when to trust an LLM where errors cost real money, and when not to."
pubDate: 2026-06-04
draft: false
---

In early 2025 I built a system that let people inside a regulated enterprise ask questions in plain language and get answers back — grounded in the organization's own documents, its databases, and even its source code — without a single byte ever leaving the building. Everything ran locally, on one GPU box, on open-weight models.

It worked. We didn't take it to production. And the most useful thing I took away wasn't the demo — it was a conviction about *when an LLM should be trusted in a system where being wrong costs real money, and when it absolutely shouldn't.*

I've spent most of the last decade as the sole developer of a Swiss telecom operator's internal invoicing system — the thing that produces millions of invoices a month, where a wrong number isn't a bug, it's a customer complaint, a regulator's letter, or a seven-figure revenue problem. That background shaped every decision in this project.

Here's the honest version of what I built and what it taught me.

## What it actually was

I called it **CORE** — Collaborative Organization & Retrieval Engine. It wasn't a single RAG chatbot; it was a small platform of five cooperating agents, all running on-prem:

- **A document RAG agent** — answers questions from the organization's documents *with source citations*, and respects **document-level access control**: you only ever retrieve from the groups (HR, IT, Management, Billing) you're entitled to see.
- **A natural-language-to-SQL agent** — translates a plain-English question into SQL against the actual databases, runs it, and explains/visualizes the result. Crucially, it runs every generated query through a **validation layer** before execution (more on that below).
- **A "hybrid" agent** — for the high-stakes questions, instead of letting the model write free-form SQL, it maps the question to a library of **pre-approved, parameterized queries**, extracts the parameters from the question, and executes those. Determinism where determinism matters.
- **A code-analysis agent** — ingests a Git repository, walks it with language-aware analyzers (Python / JavaScript / TypeScript), and generates **per-file documentation** in natural language, with dependency and version awareness.
- **A core orchestrator** — plans a query across the other agents (documents + structured data), can analyze an uploaded PDF in real time, and synthesizes a single answer with references back to its sources.

![CORE — five cooperating on-prem agents under one orchestrator](/diagrams/core.svg)

The stack, for the engineers reading: **FastAPI (Python 3.11) · SQLAlchemy 2.0 · PostgreSQL + pgvector** for the vector store · **LangChain + LangGraph** for the agent flows · **Ollama** serving open-weight models locally (the running config used Llama 3.1 8B and 3.2 3B; it was model-agnostic by design, so swapping models was a config change) · **sentence-transformers (`all-mpnet-base-v2`)** for embeddings · **React + TypeScript + Tailwind** front end · all wired together with Docker and a GPU. Security wasn't an afterthought: **Active Directory integration, role-based access control, group-scoped document security, and audit logging** were in from the start, because in a regulated environment that's the entry ticket, not a nice-to-have.

The whole thing ran 100% locally. In a context where the data is customer billing information, a system that ships that data to a third-party API is a non-starter before the first demo. Building it fully on-prem — local models, local vector store, local everything — is what made the conversation possible at all.

I built it solo, AI-agent-assisted, under strict TDD, working from real design docs (a master plan, high- and low-level design). I wanted the POC itself to be evidence of *how* I'd build the production version, not just *that* it could be demoed.

## The part I'd tell any engineer working in a high-stakes domain

A RAG demo is trivially easy to make look magical. Ask three rehearsed questions, get three beautiful answers, everyone nods. The trap is that **a fluent answer and a correct answer are indistinguishable to the person watching the demo.** In a billing or finance context, that gap isn't a minor risk — it's the entire risk.

So the most important parts of CORE weren't the parts that generate answers. They were the parts that decide whether to trust them.

**1. Observability on every step.** I instrumented the whole system with **Arize Phoenix** (via OpenInference auto-instrumentation of the LangChain calls). That meant for any question I could see, trace by trace: which chunks were actually retrieved, whether the answer was grounded in them or quietly invented, where the latency went, and — the dangerous category — the cases where the answer *sounded* authoritative but the retrieval had pulled the wrong context entirely. Those are the answers a non-technical user believes. Being able to *see* them is the difference between "neat demo" and "something you could responsibly put in front of a finance team."

**2. A validation layer on generated SQL.** The text-to-SQL agent never blindly executes what the model writes. Every generated query goes through a validator that checks it across several dimensions — **syntax, schema compatibility, security, and performance** — and classifies issues by severity before anything touches the database. An LLM writing SQL against real data is exactly the kind of thing that's a great demo and a terrible production incident; the validator is the seatbelt.

**3. Determinism where it counts.** The reason the hybrid agent exists at all is the same instinct. For the questions where a wrong answer is expensive, you don't want the model improvising SQL — you want it to *recognize the question*, pick a query a human already vetted, and just fill in the parameters. Let the model do the fuzzy part (understanding intent) and keep the consequential part (what actually runs against billing data) deterministic and reviewed.

The throughline across all three: **in domains where being wrong costs money, the model isn't the hard part — the verification layer is.** Retrieval and generation are commodities now. Knowing whether to trust the output, and being able to *prove* it, is the scarce skill. That conviction comes directly from years of owning a system where "it usually works" was never an acceptable standard.

## What was hard / what I'd flag honestly

- **Structured, regulated data fights generic RAG.** Naïve document chunking over billing-shaped content loses exactly the relationships that make an answer correct. Real work went into how data was represented and retrieved, and into the access-control layer, not into prompt cleverness.
- **Small local models force real tradeoffs.** The open-weight models that fit on one GPU are genuinely good in 2025 — but you feel the ceiling on multi-step reasoning versus frontier hosted models. The honest design answer was to match model and approach to the *class* of question (free-form vs. parameterized), not to pretend one model won everything.
- **"Looks right" is a liability, not a milestone.** The thing I had to keep resisting was treating a good-looking answer as done. Without the trace and the validator, I'd have over-trusted the system. With them, I trusted it *appropriately* — which sometimes meant concluding "no, this class of question isn't reliable enough yet."

## Why we didn't ship it

CORE did its job. The organization looked at it and chose not to take it to production — and that was a reasonable call, not a failure of the POC. The honest reasons, at the level I can share: the bar for *autonomous* AI touching billing is correctly very high ("useful 90% of the time" is a great consumer product and an unacceptable billing tool — the 10% is exactly where the money and the trust live), and weighed against the cost and the operational ownership it would have required, the value case wasn't there *yet* for that specific use.

I'd rather write that plainly than dress it up. A POC that surfaces "here's what it would actually take to trust this in production, and here's why it's not worth it today" is a successful POC. The failure mode would have been shipping the demo-grade version.

## What it seeded

CORE didn't die — it became the seed of what I've been building since. The questions it raised about orchestration, durable state, and *verifying* non-deterministic systems are now the centre of **IW AI Core**, an AI-orchestration platform I'm building in active development under my own company, and now open source ([`github.com/innovation-ways`](https://github.com/innovation-ways)). The throughline is the same one CORE taught me: treat the evaluation and verification of AI systems as a first-class concern, not an afterthought — durable state, real test rigor, observability before confidence.

If there's one thing I'd want a fellow engineer to take from this: when you put an LLM somewhere that being wrong is expensive, **build the part that tells you whether to believe it before you build the part that sounds impressive.** The model will improve on its own. The judgment about when to trust it is the part that's actually yours.

---

*Sérgio Gaspar is the founder of [Innovation Ways](https://github.com/innovation-ways) — two decades building and owning critical back-office systems, now building modern AI tooling in parallel. Always happy to compare notes with people putting AI into places where correctness isn't optional.*
