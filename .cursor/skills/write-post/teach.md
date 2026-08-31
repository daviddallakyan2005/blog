# Teach, then zoom

Load from `write-post` when drafting or revising prose. Production posts still steal a real decision. They also have to teach it.

A competent engineer who did not live this cluster must be able to hold the system after the opening, then choose to go deeper. Config, chart pins, and hop-by-hop arrow tours are the deep dive, not the greeting.

## Why posts feel chaotic

These failures stack. Any one is enough to rewrite the opening.

| Failure | What the reader hits | Fix |
| --- | --- | --- |
| Series dump in the lede | Three prior posts before this claim | This post's claim first. One "where this sits" sentence later |
| Hop lecture before nouns | Figure 1 hop (1)–(5) with undefined boxes | Name the 2–4 nouns, then the map, then walk **layers** |
| Reference in the explainer | Helmfile YAML, chart versions, JDBC URLs in section 1 | Encyclopedia and samples live in the zoom, after why |
| Mixed Diátaxis kinds | Tutorial voice + war story + values dump | One type (craft). Explanation *around* the decision, not a second type |
| Jargon before definition | `JDBC2`, `IRSA`, `workflowDefaults` in sentence 1 | Define on first use, next to the sentence that needs it |
| Two zooms in one paragraph | Catalog *and* the Helm overlay *and* the next outage | One idea per paragraph. Opening sentence is the point |

[Diátaxis](https://diataxis.fr/explanation/) treats explanation as study: context, why, alternatives. Crossing into reference (tables of pins, exhaustive YAML) in the same breath is how documentation goes messy. [Google Technical Writing Two](https://developers.google.com/tech-writing/two/large-docs) calls the countermeasure **progressive disclosure**: new terms next to the sentences that need them; simple before complicated. [GitLab concept topics](https://docs.gitlab.com/development/documentation/topic_types/concept/) answer *what is this* and *why would you use it* before any task. Do not title that block `Overview`, `Introduction`, or `How it works`.

## Zoom levels (one at a time)

Same idea as [C4](https://c4model.com/): context, then containers, then one component. Do not jump.

| Level | Reader can answer | Allowed on the page | Not yet |
| --- | --- | --- | --- |
| 0 Map | What the pieces are and how they connect | Lede, noun paragraph, first figure, layer walk | Helm values, chart versions, JDBC URLs |
| 1 Why | Why this exists and what was rejected | Constraint → choice → rejected option → cost | Incident numbers, patches |
| 2 Mechanism | How the interesting part actually works | One sample that proves the claim | Adjacent subsystems |
| 3 Failure / pin | What broke, or the exact overlay | Numbers, YAML, chart patches, UTC | A new unexplained noun |

Finish the current level before opening the next. If a paragraph needs a noun from a deeper level, you skipped a zoom.

Level 2 is a **two-pass** ([Feynman](https://fs.blog/feynman-learning-technique/)): the same mechanism in language that needs no jargon, then the same sentences with the real names. Do not start from "what is Kubernetes." The reader is here for this cluster ([Evans on condescension](https://jvns.ca/blog/2020/11/15/simple-explanations-without-sounding-condescending/)). The incident, OOM, or overlay is evidence *after* the map, not the first screen that *is* the map ([Evans DNS](https://jvns.ca/blog/how-updating-dns-works/), [AWS backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)).

## Skeleton (production that teaches)

Replaces the craft production skeleton when the post has a system. How-to / tutorial / postmortem still follow craft; they still get a level-0 map before steps or the timeline.

```text
# {System}: {interesting claim}
Summary: {problem + what the reader leaves holding}

Lede (≤3 sentences): this claim, why it mattered (one real number), scope / non-scope.
Do not recap the rest of the series here.

## {The thing, as a noun}
2–4 nouns defined. Where this sits (one sentence, optional link).
Figure 1. Walk layers (data / catalog / engine / jobs), not hop ①②③④⑤.

## Why not {obvious alternative}
Constraint → choice → rejected option → cost.

## {The mechanism, still a noun or a specific outcome}
Prose first. Then one sample. Introduce the fence with a full sentence.

## {What broke / what we pinned}     # deep dive
Numbers, overlays, patches. New jargon defined here, not in the lede.

## When this applies
Use if … Skip if … Transfer the model, do not restate the lede.
```

Headings: sentence case, unique, a noun or a specific outcome. Not `Overview`, not `Introduction`, not `How it works`.

## Opening contract

After the lede plus the noun section, a reader who stops can still say:

1. What the system (or failure) is, in one sentence of their own.
2. Which 2–4 pieces it is made of.
3. What this post will not cover.

If they cannot, the opening is a dump. Rewrite it before touching later sections.

**Lede:** this post's claim. Series glue is one sentence under the nouns ("This sits after [Spark as the writer], before Events."), not three dependent clauses in sentence 1.

**Nouns:** GitLab's concept test. What is it, why would you use it, stop before how. Expand the acronym once. Prefer `Trino (query engine)` over assuming Trino.

**Figure:** still required for architecture / control-plane / data-path / incident posts (`diagrams.md`). It comes **after** the noun paragraph, still before the first deep section. Long description names layers first; hop numbers are optional and only after the boxes have names.

## Paragraphs and wording

From [Google Technical Writing One](https://developers.google.com/tech-writing/one/paragraphs): opening sentence is the point; one topic; about 3–5 sentences; answer **what, why, how**. Busy readers skip the rest of the paragraph.

- Teach in the body, not in a callout or `<details>`.
- Analogy is allowed once, then drop it. Do not mix metaphors.
- Do not write `simply`, `easy`, `just`, `let’s dive in`.
- Samples stay production-real (`craft.md`). They appear at level 2+, after the reader knows what they are looking at.
- Chart-version tables and full overlays are reference. Put them in the deep section, or cut them. A teaching post is allowed one pin sentence ("Events is stock `argo-helm` 2.4.15") without a seven-row encyclopedia.
- One reader for the whole post. Intermediate operator, not a beginner reset mid-H2. Extra "what is a Pod" scaffolding is load, not help.
- Scan test: headings plus the first sentence of each paragraph reconstruct the argument. If they do not, the claim is buried.

## Revision pass (existing drafts)

Do not add features or new incidents. Reorder and rewrite openings.

1. Cut the series recap out of the lede. Restore one sit-sentence after the nouns.
2. Write or move a noun section **above** Figure 1.
3. Rewrite the figure walk as layers. Keep hop numbers only if they earn their keep.
4. Move the first fence / values file / chart table to level 2 or 3.
5. Define every leftover jargon at first use.
6. Check: a reader can stop after the noun section and still hold the claim.

Facts, numbers, samples, and diagrams stay. If a fact is not in the draft, `grill`. Do not invent.

## Quality gate (add to craft)

- [ ] Opening contract holds (claim, nouns, non-scope) without reading past Figure 1
- [ ] Zoom order: map → why → mechanism → failure/pin. No skipped level
- [ ] First fence is after the nouns and the why
- [ ] Figure walk is layers, not an unexplained hop list
- [ ] Each heading passes GitLab's test: not Overview / Introduction / How it works
- [ ] Closing transfers (when to copy, when to skip), does not restate the lede
- [ ] Mechanism has a jargon-free pass, then the same structure with real names
- [ ] Headings plus first sentences reconstruct the argument (scan test)
- [ ] Audience does not yo-yo (no beginner reset mid-post)
