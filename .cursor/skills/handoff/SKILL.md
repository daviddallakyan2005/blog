---
name: handoff
description: Writes a redacted handoff file in the OS temp directory so a fresh agent can continue. Use only when the user asks for a handoff or session compact.
disable-model-invocation: true
---

# Handoff

Write a short document so a new session can continue. Save under the OS temp directory (`$TMPDIR` on macOS), **not** this workspace. Do not commit it.

Redact secrets, tokens, `.env*` values, and cookies. Do not copy specs, diffs, or `docs/` that already exist — link them by path.

## File

`blog-handoff-YYYYMMDD.md` (add a suffix if one already exists).

```markdown
# Handoff

## Next session
<what the next agent should do>

## Settled
- …

## Open
- …

## Paths
- <files in flight>

## Suggested skills
- <names from `.cursor/skills/` only — e.g. grill, tdd, diagnose, delivery-team, write-post, migrate>

## Verify
- commands already run / skipped, and why
```

Print the absolute path when done.
