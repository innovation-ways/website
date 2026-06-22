---
name: "CORE — on-prem multi-agent RAG"
tagline: "A 100%-local, five-agent retrieval platform built for a Swiss telecom operator: document RAG with citations and RBAC, NL→SQL behind a validation layer, code analysis, and an orchestrator."
tags: ["LangGraph", "pgvector", "Ollama", "RBAC", "On-prem"]
status: "private"
order: 4
diagram: "/diagrams/core.svg"
---

## What it is

CORE (Collaborative Organization & Retrieval Engine) is a 100%-local, on-prem AI platform built for a Swiss telecom operator and presented in 2025. It is not a single RAG chatbot — it is five cooperating agents, built so that no data ever leaves the client's own infrastructure. For regulated billing data, that on-prem guarantee is the entry ticket; nothing else matters until it's met.

## The five agents

- **Chat / document RAG** — answers questions over the document corpus with **source citations** and **document-level group RBAC**, so people only see what their group is allowed to.
- **SQL agent** — natural language → SQL with a real **validation layer**: syntax, schema, security, and performance checks all run *before* any query touches the database.
- **Hybrid agent** — natural language → **pre-approved, parameterized queries**, for the cases where determinism matters and a wrong answer is expensive.
- **Code Analyzer** — ingests a Git repository and produces **per-file documentation**, with language-aware analyzers and dependency/version tracking.
- **Orchestrator** — plans across the other agents, performs real-time PDF analysis, and synthesizes across sources with references.

## Key decisions

- **100% local / on-prem.** Every model and every byte stays on the client's infrastructure. This is the precondition for letting AI anywhere near billing data — not a nice-to-have bolted on later.
- **A validation layer in front of NL→SQL.** You cannot let a language model run arbitrary SQL against billing tables. Generated queries pass syntax, schema, security, and performance gates before they execute.
- **Determinism where errors are costly.** The hybrid agent trades flexibility for safety, mapping language onto pre-approved parameterized queries.
- **Access control and audit from the start.** Active Directory integration, group RBAC, and audit logging — because "who is allowed to see this?" comes before "what's the answer?"

## Stack

FastAPI (Python 3.11) · SQLAlchemy 2.0 · PostgreSQL + **pgvector** · LangChain + **LangGraph** · **Ollama** (Llama 3.1 8B / 3.2 3B; model-agnostic by design) · sentence-transformers embeddings · React + TypeScript + Tailwind frontend · Active Directory + RBAC + audit logging · **Arize Phoenix** observability via OpenInference · Docker + Nvidia CUDA. Built solo, AI-agent-assisted, under strict TDD. The demo ran entirely on public documents and synthetic data — no real customer data.

## Outcome

The operator chose not to put it into production — the bar for autonomous AI touching billing is, correctly, very high, and the value case wasn't there *yet* for that use. But CORE proved the architecture and seeded **IW AI Core**: orchestration, durable state, and evaluation as first-class concerns. The lesson it crystallized still runs through everything here — the model is becoming a commodity; the verification layer is the moat.
