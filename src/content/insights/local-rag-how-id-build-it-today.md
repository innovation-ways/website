---
title: "I built a local RAG system 14 months ago — here's how I'd build it today"
description: "RAG matured, and AI agents changed how you build. What I'd change about CORE, what I'd keep, and the part agents didn't speed up: the judgment about where a system must not be trusted."
pubDate: 2026-06-05
draft: false
---

About fourteen months ago I built a thing I called CORE — a 100%-local, on-prem retrieval system that let people query an organisation's documents, databases, and source code in plain language, without a byte of data ever leaving the building. I wrote about *what* it was and the one lesson that stuck: in a domain where being wrong costs money, the model is not the hard part — the verification layer is.

This is the sequel. Because the field did not sit still, and neither did the tools you build with. Two things changed, and they're worth separating:

1. **RAG itself evolved.** A lot of what I reached for in early 2025 is no longer the best answer.
2. **How you build a system like this changed.** What took me weeks of hand-wiring, an AI coding agent will now scaffold in an afternoon.

The interesting part is what those two facts do *not* add up to. Let me walk through both, honestly.

*(Quick recap for anyone who didn't read part one: CORE was five cooperating agents — document RAG with citations, natural-language-to-SQL with a validation layer, a determinism-first "hybrid" query agent, a Git code-documenter, and an orchestrator — built on LangChain/LangGraph, PostgreSQL + pgvector, `all-mpnet-base-v2` embeddings, and local open-weight models via Ollama, all instrumented with Arize Phoenix. It worked; we didn't ship it; the bar for autonomous AI touching billing is correctly very high.)*

## RAG didn't die — it matured

Every few months since 2023 someone declares RAG dead, usually the week a new model ships a bigger context window. The honest 2026 read is that RAG didn't die; it grew up. The field moved through recognisable phases: naive retrieval (chunk, embed, top-k, stuff the prompt) → advanced/modular pipelines (hybrid search, reranking, query rewriting) → *agentic* RAG (the model decides what to retrieve and whether to trust it) → graph-augmented RAG for genuinely relational questions.

The "is RAG obsolete now that context windows are huge?" debate resolved into something boringly sensible: they're complementary, and you route between them. Long-context wins on small corpora and global reasoning; RAG wins on large/dynamic corpora, latency, cost, freshness, and — the one that matters most for my world — access control and source attribution. CORE committed to RAG for an on-prem, regulated, large-corpus, RBAC use case, and that call has aged well.

So CORE was built right at the seam between naive and advanced RAG. Some of what I did is now clearly dated. Some of it held up better than I expected. Here's the honest split.

## What I'd change today

![The retrieval pipeline I'd build today — hybrid retrieval, reranking, and a verification step](/diagrams/rag-pipeline.svg)

**Stop retrieving with a single dense vector search.** CORE retrieved with one embedding-similarity pass and nothing else. In 2026 that's the biggest gap. The baseline now is *hybrid* search — dense embeddings **and** keyword/BM25, fused with Reciprocal Rank Fusion — because pure vector search quietly fails on the exact-match queries (IDs, error codes, rare terms) that a billing system is full of. On Postgres specifically, this no longer means bolting on a second database: pgvector plus an extension like ParadeDB gives you real BM25 in the same instance.

**Add a reranker.** This is the single highest-return thing I'd add. Retrieve 50–100 candidates cheaply, then let a cross-encoder re-score the top ones for actual relevance. A small open reranker (e.g. `bge-reranker-v2-m3`) costs ~100ms and meaningfully lifts the precision of what reaches the model. CORE had no reranking stage at all.

**Give chunks their context back.** CORE chunked documents the naive way — fixed size, each chunk embedded in isolation. The problem is that "the policy applies to everyone hired after June 2021" is meaningless without knowing *which* policy. Anthropic's contextual-retrieval work (prepend a one-line LLM-generated context to each chunk before embedding) reported retrieval-failure drops of roughly a third to a half. It's a direct, high-ROI fix.

**Upgrade the models.** `all-mpnet-base-v2` was a fine general embedding model in early 2025; today BGE-M3 is a near-free upgrade that also gives you sparse vectors for hybrid search out of one model. On the generation side, the local default has shifted: the Qwen3 family has largely displaced Llama 3.1 as "what you run on one GPU," and a 14B Qwen3 comfortably beats the 8B Llama I was using at similar VRAM. And once more than one person is hitting the system at once, you move serving from Ollama (still my pick for *development*) to vLLM or SGLang for the throughput.

**Graphs — but only where they earn it.** This is the one I get asked about most. GraphRAG is real and genuinely better for multi-hop, relational questions ("how do these entities connect across ten documents?"). But it's expensive to index, and the research is clear that on simple, procedural, policy-style corpora — exactly what CORE mostly had — it's actually *worse* than plain vector RAG, while adding a lot of complexity. So CORE not having a knowledge graph wasn't a gap; it was the correct call for that content. If I added one today it'd be as an optional *mode* (LightRAG is the practical local entry point), routed to only for the queries that are actually relational.

## What I'd keep — because it was right

It would be easy to write this as "everything I did is obsolete." It isn't, and the parts that held up are the ones I'm proudest of, because they were judgment calls, not library choices:

- **Postgres + pgvector.** Still correct for this scale. Keeping embeddings, metadata, and access control transactionally consistent in one database — instead of running a separate vector store — is an operational and an auditing win. The "graduate to a dedicated vector DB" trigger is corpus size and query throughput, and CORE never came close.
- **Natural-language-to-SQL with a validation layer.** Letting an LLM write SQL and running it blindly is a great demo and a future incident. CORE validated every generated query — syntax, schema, security, performance — before it touched the database. The field has since converged on exactly this as the right pattern; it was ahead of most published systems in 2025.
- **Determinism where it counts.** For the expensive questions, CORE didn't let the model improvise SQL at all — it mapped the question to a *pre-approved, parameterised* query and filled in the blanks. Fuzzy where fuzzy is safe; deterministic where wrong costs money.
- **Observability before confidence.** Tracing every retrieval and generation with Arize Phoenix from day one is now table stakes for serious RAG; it wasn't, then. The only thing I'd add is automated faithfulness/precision scoring (e.g. Ragas) on top of the traces I already had.

## Agentic RAG: CORE was an early draft of it

The label that didn't exist when I built CORE but describes where it was heading is *agentic RAG* — where the model doesn't just consume retrieved text but actively decides how to query, which retriever to use, whether the answer is grounded, and whether to go back and retrieve again.

Looking back, CORE was a *proto*-agentic system. It had an orchestrator planning across specialised agents, it routed by query type, it validated actions before executing them, and it had the observability to see what happened. What it lacked is the self-correcting loop: it retrieved once per agent and trusted the result; there was no step that said "this answer isn't well-supported — rewrite the query and try again." That loop — query rewriting, multi-hop retrieval with a budget, a faithfulness check on the draft, re-retrieval on failure — is the architectural upgrade I'd make today. And notice what it is: it's *more verification*, automated. The same idea CORE had, pushed deeper.

## The twist: agents changed the building, not the trusting

Here's the part that actually motivated this article.

I hand-wired CORE. Designed it, set up FastAPI + Postgres + pgvector + LangGraph + Ollama + Phoenix from scratch, wrote the state-machine nodes, built the validators dimension by dimension, configured the access control, wrote the tests under TDD. It took weeks.

Today, with an AI coding agent — Claude Code, OpenCode, Cursor — a competent engineer would have the equivalent *plumbing* standing in an afternoon. The FastAPI skeleton, the pgvector wiring, the LangGraph scaffold, the Docker compose, the test stubs: hours, not days. That part of the speedup is real, and I've felt it directly — the same agents now build most of the code in my current projects.

But I want to be honest, because the audience for this is engineers who've used these tools and noticed the seams. The productivity story is not "10× faster, AI builds the whole thing." A widely-cited controlled study by METR in 2025 found experienced developers were actually *19% slower* on their own complex repos with AI assistance — while *believing* they were faster. The realistic, system-level number across the serious research is closer to a modest gain than a revolution. Agents are spectacular at the boilerplate and the known patterns; they get slower, not faster, on the genuinely novel and the hard-to-verify.

And that maps exactly onto the CORE story. What would an agent have accelerated? The scaffolding, the wiring, the glue. What would it *not* have accelerated — what it cannot do for you?

- Deciding to use a deterministic pre-approved query instead of free-form SQL for the high-stakes path. That's a domain judgment. Ask an agent to "build a RAG system for billing data" and it will happily generate free-form SQL.
- Designing what the validation layer actually checks, and what "safe enough" means for a billing query.
- Building the evaluation set — because "the right answer to this billing question" is a domain truth, not a statistical property.
- Knowing, at the end, whether to *trust* any of it. AI-written code carries more defects, not fewer; the engineer who can audit it is worth more, not less.

So the conclusion writes itself, and it's the same one from the first article, now confirmed from both directions. The models are a commodity. The frameworks are replaceable. The agents will build your plumbing while you sleep. **What doesn't commoditise is the judgment about where the system must not be trusted, and the verification layer that proves whether it can be.** That part still takes a human who's been burned by a production system where a wrong number had consequences.

Fourteen months ago that was the lesson I took from a POC that didn't ship. The tools got dramatically better since. The lesson got more true.

---

*Sérgio Gaspar is the founder of [Innovation Ways](https://github.com/innovation-ways) — two decades building and owning critical back-office systems, now building modern AI tooling in parallel. He writes about putting AI into places where correctness isn't optional.*
