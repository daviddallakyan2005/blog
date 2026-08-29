---
name: design
description: Typography-first reading UI for this blog. Use for new screens, redesigns, or UI/UX review; skip for one-property style edits.
---

# Design

Invariants: `ui` rule. Read [DESIGN.md](DESIGN.md) before substantial work. A critique is read-only unless the user also asks to implement.

## Calibrate

Identify new flow vs focused component vs studio vs public reading. For small specified edits, stay surgical.

## Pass 1 — plan

```text
Reader and situation:
Screen's single job:
Primary action and next step:
Information hierarchy:
Journey in and out:
Required states:
Why this fits a long-form blog (not a dashboard):
Existing tokens and primitives to reuse:
```

## Implementation

- Do not add a font, color system, or primitive without a concrete reading benefit.
- Check ~390px and laptop. No horizontal overflow in prose or header.

## Pass 2 — render and critique

Inspect the real screen when possible. Verify dark toggle, focus, contrast, and reduced motion.

## Report

User problem, reused patterns, breakpoints checked, remaining decisions.
