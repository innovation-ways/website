---
title: "Parallel agents, isolated worktrees: where AI orchestration actually buys you speed"
description: "Every coding tool shipped parallel agents and git-worktree support in 2026. The speed isn't in running more agents — it's in isolation, durable orchestration, and reviewing outcomes instead of process. The mechanics, and why I built IW AI Core around them."
pubDate: 2026-06-22
category: "AI orchestration"
draft: false
---

I wrote recently that AI agents changed the *building* of a system, not the *trusting* of it — that they'll scaffold your plumbing in an afternoon but can't make the judgment calls about where a system must not be trusted. That's still my view. This piece is about the half I waved at: if an agent can build a unit of work unattended, what does it take to run *many* of them at once without the whole thing collapsing into a pile of half-finished branches?

That question stopped being academic in 2026. Within a few months, every serious coding tool shipped some version of the same answer.

## The year parallelism went mainstream

The single-assistant-in-your-editor era ended quietly. Claude Code added background agent sessions, a `/batch` flow that opens a pull request per chunk, and orchestration scripts that fan work out across many subagents. Cursor shipped background and cloud agents that run for tens of minutes and come back with a PR. GitHub's Copilot coding agent runs in a cloud environment off a GitHub issue; OpenAI's Codex runs tasks in parallel sandboxes, each preloaded with the repo — the metaphor in their own materials is "several junior developers working at once." Cognition's Devin grew a "fleet" mode where a manager delegates to sub-agents.

The interfaces differ, but two primitives recur underneath almost all of them, and they're the ones worth understanding: **git worktrees** for isolation, and a **durable orchestrator** for state. Get those two right and parallelism is an engineering problem. Get them wrong and it's chaos with a progress bar.

## Why worktrees, specifically

A git worktree lets several branches exist as separate working directories at once, sharing one underlying object database. Each has its own `HEAD`, its own index, its own files on disk — but they all read and write the same history. The pattern that's crystallised across the ecosystem is almost a mantra: **one task → one branch → one worktree → one agent.**

The reason it beats the obvious alternatives is subtle and important. If you point two agents at the *same* working directory on different branches, they fight over `.git/index.lock` and silently overwrite each other's files — corruption you discover later, with no clean way to attribute it. Separate full *clones* avoid that but duplicate the entire repository and leave you hand-syncing between them. Worktrees thread the needle: real isolation of the working files, one shared history, and — the part that actually matters — **collisions surface as ordinary merge conflicts at integration time, instead of as silent corruption mid-edit.** That single property is what makes parallel agents reviewable. A conflict at `git merge` is a problem you can see and resolve; a half-overwritten file from two hours ago is not.

It's worth being equally clear about what worktrees *don't* solve, because the hype glosses over it. They isolate the git layer, not the runtime. Two agents each running a dev server still both reach for `localhost:3000`. They share one `.env`, one database, one set of migrations, one build cache. Run a schema migration in one and you've corrupted what the other is reading, and now your test failures are unattributable. Real parallel-agent setups need a second layer of isolation — per-worktree ports, namespaced database schemas, scoped secrets — and most of the friction people hit with "just use worktrees" lives in exactly this gap. The git primitive is necessary, not sufficient.

## The other half: durable orchestration

Worktrees give you isolation. They don't tell you *who works on what*, what happens when an agent dies halfway, or how you prove after the fact what an agent actually did. That's the orchestration layer, and the honest history is that most people started with shell scripts and a hope.

The second-generation pattern that's emerged is the one I'd argue for: treat the work queue as durable shared state, not files on disk. Agents *claim* a unit of work atomically — so two of them never grab the same task. State survives a crash, because it lives in a database, not in a process's memory. Every step an agent takes is logged, so there's an audit trail. And verification — running the tests, catching the failures, fixing and re-checking — is part of the loop, not a thing you bolt on after. The orchestrator decomposes and coordinates; the workers execute in parallel; results are reviewed centrally.

None of that is exotic. It's the same durable-work discipline that back-office systems have used for decades — it just hadn't met AI agents yet.

## The part nobody selling you this will lead with

Here's the calibration, and it's the reason I trust the mechanics more than the marketing. The most rigorous study we have — METR's 2025 randomised controlled trial — found experienced developers were **~19% *slower*** on their own mature codebases with AI assistance, while *believing* they'd been ~20% faster. Feeling fast and being fast are not the same measurement, and the gap is the story.

That result isn't an argument against any of this — it's a map of where parallel orchestration pays and where it burns money. The consistent finding across the serious evidence is that agents shine on work that is **independent, well-scoped, and verifiable** — boilerplate, migrations across many files, test-coverage expansion, mechanical refactors — and degrade sharply on work that is novel, tightly coupled, or hard to verify. One widely-cited framing puts multi-agent systems at large gains on parallelisable tasks and large *losses* when the same approach is forced onto sequential ones. The deciding variable is never the number of agents; it's task independence. And the practical ceiling is lower than the demos suggest — somewhere around three to five concurrent agents before coordination overhead, token cost, and the *review* bottleneck eat the gains.

That last one is the quiet killer. When generation speeds up and review doesn't, review becomes the constraint — Amdahl's Law, applied to your pull-request queue. Teams that adopt this hardest report more PRs merged *and* review time climbing right alongside. AI-written code also carries measurably more defects per change, which makes the human who can audit it worth *more*, not less. So the goal of a good orchestration system isn't to maximise agents in flight. It's to make the *outcomes* cheap to review — which means isolation clean enough to attribute every change, and verification thorough enough that most of what reaches you is already known-good.

## What I built, and why it looks like this

[IW AI Core](/work/iw-ai-core) is my take on those two primitives, built before "agent fleets" was a tagline, because the shape was already obvious from how back-office systems handle durable work.

All operational state lives in PostgreSQL — no files, no race conditions. Agents claim work with `FOR UPDATE / SKIP LOCKED`, so the database itself does the concurrency control that ad-hoc file locks can't, and two runs never collide on the same task. Each run executes in its own **isolated git worktree**, so parallel workstreams stay out of each other's way and every merge back to main is deliberate and reviewable. Fix cycles and quality gates are part of the loop, not an afterthought — the same instinct that keeps a billing system honest. And a server-rendered dashboard *observes* the whole thing over live updates, down to the individual steps and fix cycles of a single work item, so you watch outcomes rather than babysit process.

That phrase is the whole design goal, and it's where this connects back to the productivity reality: **review outcomes, not process.** The value of running agents in parallel isn't the parallelism — it's that clean isolation plus durable state plus built-in verification make the results trustworthy enough to review quickly. The worktree keeps the changes attributable. The database keeps the work honest. The fix cycles keep most of the noise from ever reaching you.

The agents will keep getting better at writing the code. What stays scarce is the system around them that makes a dozen unattended runs *safe to merge* — and the judgment, still yours, about which dozen tasks were worth running in parallel in the first place.

---

*Sérgio Gaspar is the founder of [Innovation Ways](https://github.com/innovation-ways) — two decades building and owning critical back-office systems, now building modern AI tooling in parallel. He writes about putting AI into places where correctness isn't optional.*
