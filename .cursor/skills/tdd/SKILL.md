---
name: tdd
description: Red-green unit tests at public seams (markdown, slug, Zod, pure helpers). Use when adding behavior or a regression at a testable seam; not for studio UI, RLS, or migrations.
---

# TDD

Red → green, one vertical slice at a time. Tests specify behavior at a **public seam**, not internals. Tiers: testing rule.

## Default seams

**Do TDD here** (`src/**/*.test.ts`, `pnpm test:unit`):

- `src/lib/markdown/*`
- slug / URL helpers
- Zod schemas in `src/lib/validations/`
- other pure `src/lib/` helpers with no Supabase

**Do not TDD-first:** studio or public UI; RLS / grants / `SECURITY DEFINER` (integration after SQL); migrations; Playwright as the loop.

If the work sits outside the default seams, name the seam and confirm with the user. If there is no honest public seam, skip this skill and say so.

## Loop

1. Write **one** failing test. Expected values are literals or spec examples, not a reimplementation of the code.
2. Run `pnpm test:unit` (or the single file). Watch it fail for the **right** reason.
3. Write the minimum production code to pass.
4. Re-run. Green, then next slice.

Cleanup unused imports/variables **this slice** introduced. Broader refactor is not part of the loop.

## Anti-patterns

- Mocks of internal collaborators, private methods, or asserting via the database instead of the seam
- Assertions that recompute the same way the code does
- All tests first, then all implementation
- Weakening assertions or changing production code only to make a test pass
- Hitting production Supabase or the production URL
