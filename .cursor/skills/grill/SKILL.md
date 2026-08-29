---
name: grill
description: Interviews the user until an ambiguous plan is settled. Use when the user says grill or grill-me, or when a request has multiple valid interpretations before coding.
---

# Grill

Interview until you share one design tree. Do not implement until the user confirms that tree.

Skip for trivial copy, one-line fixes, or when the user already specified a single design.

## Design tree

Every decision branches into the decisions that hang off it. The **frontier** is every question whose prerequisites are already settled.

Work in **rounds**. Ask the whole current frontier in one message. Wait for answers before the next round. A question that depends on an unanswered question in this round belongs to a later round.

```
❓ **Q1** — **<title>**: <body, including choices if the decision is discrete>

➡️ <your recommended answer>

---

❓ **Q2** — **<title>**: …

➡️ <recommended answer>
```

Reshape the tree after each round. Stop when the frontier is empty: nothing left silently assumed.

## Whose job

- **Facts** (filesystem, git, docs, existing code): look them up. If you need a subagent, launch `Task` with `model: "cursor-grok-4.6-high"`. Do not ask the user what you can read.
- **Decisions**: the user's. Recommend, then wait.

Use names from the project rule. After the tree is empty, state the settled design (what, where, what you will not do), confirm, then follow `delivery-team` (or `write-post` / `migrate` if that owns the work).
