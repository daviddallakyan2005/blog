---
name: diagnose
description: Feedback-loop diagnosis for hard bugs and performance regressions. Use when something is broken, throwing, failing, or newly slow — not for known, specified fixes.
---

# Diagnose

Hard bugs. Skip a phase only with an explicit reason. Never target production Supabase or the production URL.

**Redact secrets** in anything you show: env values, cookies, `Authorization` headers.

## Phase 1 — tight loop

No hypothesis until you have **one command you have already run** that can go red on **this** symptom.

Prefer, in order: failing unit test → local integration test → `curl` against local Next → Playwright against local Next.

Tighten: faster, asserts the user's symptom (not "didn't crash"), deterministic. For flakes, raise reproduction rate until it is debuggable.

If you cannot build a loop: stop, list what you tried, ask for a redacted artifact or access. Do not proceed.

## Phase 2 — reproduce and minimise

Confirm the loop fails the way the user described. Shrink inputs until every remaining piece is load-bearing.

## Phase 3 — hypotheses

Write 3–5 **falsifiable** hypotheses before testing any. Show the ranked list. Format: "If X is the cause, then Y makes it disappear / worse."

## Phase 4 — instrument

Change one variable per probe. Tag temporary logs `[DEBUG-…]`. For slowness, **measure** first, then follow the `performance` skill.

## Phase 5 — fix

If a correct seam exists, turn the minimised repro into a failing test **before** the fix (`tdd`). Watch red, fix, watch green, then re-run the Phase 1 command. If no honest seam exists, say so.

## Phase 6 — cleanup

Phase 1 loop green on the original scenario; regression test or documented missing seam; no leftover `[DEBUG-…]`; throwaway harnesses deleted. Substantive fixes still go through `delivery-team`.
