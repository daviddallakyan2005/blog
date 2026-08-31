---
name: delivery-team
description: Wave/fan-out orchestration for this blog. Brief disjoint-path subagents on grok, gate with typecheck/test/build, fan-out reviewers. After green, ask whether to commit and push to main. When finished, stop local Next/Supabase. A FAIL goes back to the owning implementer — never a silent orchestrator patch. Use for features, fixes, migrations, and meaningful UI before claiming done.
---

# Delivery team

The main agent is an **orchestrator**. It plans, delegates, gates, and routes review. It does not write feature code (small integration fixes only). Subagent model: `subagents` rule.

## Before wave 1

- **Ambiguous request** → `grill`. Wait for confirmation. Do not start implementers.
- **Hard bug / unexplained regression** → `diagnose` until there is a tight red loop, then implement the fix through this skill.
- Skip grill and diagnose for trivial copy, one-line fixes, or when the user already specified a single design.

## Wave 1 — implement

1. Split the request into **disjoint paths** (no two subagents edit the same files).
2. Brief each implementation subagent with goal, acceptance criteria, allowed paths, and files they must not touch. Testable seams → `tdd`. Do not TDD-first studio UI, RLS, or migrations.
3. Launch them in parallel on `cursor-grok-4.6-high`.
4. Integrate: resolve conflicts yourself only at the seam. If a path is wrong, send it back to that owner.

## Gate

Before review, run what the change can break:

- `pnpm typecheck`
- `pnpm test:unit` (always when `src/` changed)
- `pnpm test:integration` only with local `.env.test`
- `pnpm build` when routes, cache, or markdown changed

Do not claim the gate passed if a command was skipped. Record skips.

## Wave 2 — review

Fan out independent **read-only** reviewers in one parallel batch so they do not anchor on each other.

| Always (substantive code) | Add when |
| --- | --- |
| `blog-code-reviewer` | — |
| `blog-verifier` | — |
| `blog-performance-reviewer` | — |
| `blog-db-reviewer` | migrations, RLS, grants, supabase clients, auth |
| `blog-product-reviewer` | public or studio UI, a11y, mobile |
| `blog-content-reviewer` | posts, drafts, markdown pipeline, code samples |

Skip the team for trivial copy, comments, or docs-only edits unless risk warrants it.

Give every reviewer the user goal, acceptance criteria, changed scope, and paths. Fresh context.

## Shared review contract

Each reviewer returns `PASS`, `FAIL`, or `BLOCKED` with evidence, path/line findings, impact, smallest remediation, and unverified areas.

Preferences and unrelated pre-existing issues are not findings.

## Adjudicate — FAIL goes to the owner

1. Cross-check findings against the code. Subagent claims are leads.
2. Deduplicate. Drop speculation.
3. **Do not silently patch** confirmed material issues in the orchestrator context.
4. Send each confirmed `FAIL` back to the **owning implementation subagent** with the finding, the original brief, and the exact files to change.
5. Re-gate, then re-launch every reviewer that `FAIL`ed (and `blog-verifier` if the fail was material).
6. Cap at one re-pass per reviewer unless new material findings appear — then one more round for those reviewers only.

Do not let reviewers commit, deploy, or mutate remote services.

## Ship

After the gate (and Wave 2 when it ran) is green: ask **Should I commit and push to main?** Wait. Do not commit or push until they answer yes. If they say no, stop local Next/Supabase (`deploy` teardown). If they say yes, follow `deploy` (watch Vercel logs, confirm Supabase migrations, smoke the live site, then teardown local). Skip the question only when there is nothing to commit.
