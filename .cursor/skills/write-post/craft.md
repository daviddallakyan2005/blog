# Craft

Load from `write-post` when drafting or revising prose. Procedures, not essays. Teaching order (map then zoom): [teach.md](teach.md).

## Classify first

Write **one** type. Mixing tutorial voice + reference dump + thought-leadership closer is a fail.

Default here: **production post** (named system, constraint, what broke or what we would not repeat).

## Title, summary, lede

- Sentence case. Task titles: bare infinitive or a specific outcome. Not gerunds (`Integrating X`), not `A deep dive into X`.
- Summary: 1–2 sentences that name the problem and what the reader leaves with. Do not start with “This post explains…”.
- **Lede ≤3 sentences:** what we built or broke, why it mattered (one number if real), what this piece covers / does not cover.
- Put the answer first. Scope and non-scope in the opening. Do not withhold the punchline for section 4.

## Production skeleton

Use the teaching skeleton in [teach.md](teach.md) when the post has a system (architecture, control plane, data path, incident). Short form:

```text
# {System}: {interesting claim}
Summary: {problem + what the reader leaves holding}

Lede (≤3 sentences): this claim, why it mattered, scope / non-scope. Not a series recap.

## {The thing, as a noun}
2–4 nouns. Where this sits (one sentence). Figure 1. Walk layers, not hops.

## Why not {obvious alternative}
Constraint → choice → rejected option → cost.

## {The mechanism, noun or specific outcome}
Prose first. Then one sample.

## {What broke / what we pinned}
Numbers, overlays, patches.

## When this applies
Use if … Skip if …
```

How-to: start at a competent user’s goal; `you` voice; title `How to …`. Tutorial: one path, expected output after every command, no options. Postmortem: impact numbers, UTC timeline, contributing factors, owned actions — not “human error”.

## Voice

- Production: first person of who ran it. Specifics beat safety. Name the agent (person, team, system).
- How-tos/docs: `you`, active, present. Conditions before instructions (“If X, do Y”).
- Do not write `simply`, `easy`, `just`, `please`, `let’s dive in`.
- Define jargon on first use. Prefer `use` over `leverage`/`utilize`.
- **No double dashes as punctuation anywhere in a post:** not `--`, `---`, `—`, or `–` in titles, summaries, headings, captions, alt text, figure comments, or body prose. Rewrite as a period, comma, colon, semicolon, or parentheses. Keep `--` only as a CLI flag or SQL comment inside a fenced sample. Keep `| --- |` as GFM table syntax. Keep `---` only as a YAML document marker inside a fenced sample.

## Scannability

- Headings unique, descriptive, sentence case. Do not skip levels. Do not stack two headings with no body.
- Numbered lists for sequences; bullets when order does not matter. Introduce every list and code sample with a full sentence.
- One idea per paragraph. Open the paragraph with the point.
- Primary answer lives in body text, not a callout or `<details>`.
- Tables for exact values, feature matrices, version pins. Do not diagram a lookup table.

## Code samples

Treat samples as production code: they must build, do the claimed task, and not contain secrets.

- Language-tagged fences. Prefer the Shiki allowlist (`ts`, `js`, `tsx`, `python`, `bash`, `json`, `sql`, `rust`, `go`, `yaml`, `markdown`, `plaintext`).
- Placeholders: `ALL_CAPS_WITH_UNDERSCORES`. Explain them. Never live keys.
- Omit code with a language comment, not `...` presented as complete.
- Comment the non-obvious *why*. Show expected output, or say the sample is concept-only.
- Verify every identifier against official docs or the repo. If you cannot, cut it.

## Facts and grilling

Do not invent APIs, packages, version pins, latency numbers, or “last Tuesday” incidents.

Stop and `grill` when missing: what they actually ran, the failure that motivated the post, numbers they will stand behind, or architecture that is theirs.

If the owner says “make it sound like I lived it” without the facts: refuse. Rewrite as procedure or a labeled hypothetical.

Unmeasured claims: omit, or write “we did not measure this”. Do not write “orders of magnitude” or a fake 47%.

## Do not ship (anti-slop)

Kill or rewrite if any fire:

- Horoscope test: swap the topic, the prose still works
- Formulaic openers (`In today’s fast-paced…`, `Let’s dive in…`)
- Fingerprints: `delve`, `tapestry`, `landscape`, `unlock`, `harness`, `game-changer`, `seamless` (as fluff), `robust and scalable`, `not just X but Y`
- Closing that restates the lede (`In conclusion…`)
- Agentless marketing: feature lists, no constraints, no numbers, no failure
- First-person incident the owner did not confirm
- Stale claims presented as current
- Double-dash punctuation (`--`, `---`, `—`, `–`) outside a fenced flag, SQL comment, table rule, or YAML `---`

Closing is new information: limits, transfer, next experiment — not a restated lede.

## Quality gate (before review)

- [ ] One type; voice matches it
- [ ] Sentence-case title; summary is a standalone snippet
- [ ] Lede ≤3 sentences; this post's claim; scope + non-scope present
- [ ] Noun section before Figure 1; figure walk is layers (see [teach.md](teach.md))
- [ ] First fence after nouns and why, not in the opening
- [ ] Every sample: language tag, intro sentence, placeholders explained, no secrets
- [ ] Every API/flag/version checked or removed
- [ ] Numbers have denominators or are marked unmeasured
- [ ] No banned filler; closing is not a restated lede
- [ ] No `--` / `---` / `—` / `–` as punctuation (flags, SQL comments, table rules, YAML `---` in fences only)
- [ ] Tags: 2–5 stack/problem terms, not title synonyms (on-site taxonomy, not SEO stuffing)
