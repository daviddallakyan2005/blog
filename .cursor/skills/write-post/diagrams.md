# Diagrams

Load from `write-post` when the post needs a visual. One figure = one claim. Color is semantic, not decoration.

This pipeline is GFM + KaTeX + Shiki + sanitize. There is **no Mermaid in `renderMarkdown`**. ` ```mermaid ` fences become highlighted source, not a drawing. Raw `<figure>` / inline `<svg>` in markdown are dropped (`remarkRehype` has no `allowDangerousHtml`).

Do not add a diagram renderer to `src/lib/markdown/` from this skill.

## Production path

**Render locally → SVG (transparent canvas) → studio `media` upload → markdown image.**

1. Write the claim in one sentence. Pick a type from the table below. If you cannot name the claim, do not draw.
2. Author source in `content/drafts/{slug}/` as `.d2` (nested architecture) or `.mmd` (sequence/flowchart/state). The post itself stays `content/drafts/{slug}.md`.
3. Export SVG. Prefer D2 for boxes-in-boxes; mermaid-cli for sequences.

```bash
d2 --pad 24 diagram.d2 diagram.svg
npx @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg -b transparent
```

4. Check the SVG on both paper and ink backgrounds. Do **not** pass D2 `--dark-theme` or rely on `prefers-color-scheme` inside the SVG — this site toggles `html.dark`.
5. In the draft, embed:

```markdown
![Happy-path: Trino plans a query, Iceberg REST returns a snapshot, Trino reads Parquet from S3](TO_UPLOAD: lakehouse-query-path.svg)

*Figure 1. Trino reads an Iceberg snapshot via REST, then S3.*
```

6. On publish, the owner drops the SVG (or 2× PNG) onto the studio editor. Replace `TO_UPLOAD:` with the public `media` URL. Studio inserts `![alt](https://…/storage/v1/object/public/media/posts/{id}/…)`.

**Fallback:** 2× PNG of the same diagram. Use PNG if SVG text/fonts look wrong.

**Do not:** GenerateImage / Midjourney architecture PNGs (garbled labels). Client Mermaid. Widening sanitize to “full SVG”. Screenshots of the editor. JPEG.

If neither CLI is available, author a small SVG by hand with the palette below. Keep ≤12 boxes. Still upload as `<img>`, never inline.

## When to draw vs not

Draw when the reader needs a map, a time-ordered conversation, or a failure path. Skip when a numbered list or table already carries the claim.

| If the section is about… | Draw | Not |
| --- | --- | --- |
| Who talks to the system | C4 context | Container dump, AWS icon soup |
| Deployable units (API, Spark, Trino, S3, catalog) | C4 container | Deployment topology, class diagram |
| Internals of **one** service | C4 component (rare) | Full-system poster |
| Happy-path request across services | Sequence, or numbered arrows on the container map | Flowchart of boxes |
| Branching control (if compaction fails…) | Flowchart | Sequence unless it is messages between systems |
| Where data is born, stored, transformed | Data-flow | Sequence |
| Success vs error as separate claims | Two sequences, or `alt` on one | One giant sequence plus topology |
| Failure / retry / poison path | Sequence of failure | Happy-path map with a red box |
| Where processes run (EKS, AZ, NLB, IRSA) | Deployment, one environment | Container diagram |
| Control-plane reconcile | Sequence of control plane | Kubernetes “all components” poster |
| Tables, FKs, Iceberg metadata vs files | ERD of 5–8 core entities | 40-table dump |
| Job graph, compaction, Airflow | DAG | Sequence unless jobs RPC each other |
| Lifecycle (pod phase, snapshot, lease) | State machine | Algorithm flowchart |
| Outage chronology, migration waves | Timeline | Architecture |
| Hive vs Iceberg, before vs after | Two aligned diagrams, shared legend | One overloaded as-is+to-be |
| OAuth / OIDC / IRSA | Sequence of auth | Architecture with a lock icon |
| Packet / CNI hop-by-hop | Numbered network path | C4 container |
| A metaphor the reader must hold | Mental-model (layers) | Accurate topology |
| Linear install / merge → CI → deploy | **Numbered list** | Five-box flowchart |
| Exact numbers, SLAs, pins | **Table** | Pie chart or diagram |

**Budget:** 2–5 figures in a 2–4k word post. Hard ceiling **5**. First figure = context/container after the noun paragraph. Later figures zoom one claim. A sixth figure is usually a second post or a table.

## Color (semantic)

WCAG: color is never the only signal. Pair hue with **label, number, or line style**. Text in the figure ≥ 4.5:1. Strokes ≥ 3:1.

One palette that reads on warm paper **and** warm ink. Transparent canvas. Mid-chroma fills. No near-white or near-black fills. No Okabe yellow `#F0E442` (vanishes on paper). No red vs green as the only success/fail cue.

| Role | Fill | Also encode with |
| --- | --- | --- |
| Compute / services | `#0072B2` | Rounded rect |
| Data / stores | `#E69F00` | Cylinder |
| Control / async | `#56B4E9` | Dashed stroke or dashed arrows |
| Failure / blast radius | `#D55E00` | Label `fail` / `×` |
| External / out of scope | `#686868` | Dashed boundary |
| Neutral default | paper + ink stroke | Name on the box |
| Accent (the hop this figure argues) | `#5B7FCF` (thicker stroke) | Number badge |

Ink for labels/strokes: dark brown-black on paper, cream on ink — but because the SVG is an `<img>`, paint **once** with mid values that clear contrast on both (`#3D4A5C` strokes, white or `#111` text on the fills above).

**Arrows:** solid = data / sync; dashed = control / async; numbered `① ② ③` = request path. Every line labelled with protocol + intent (`HTTPS/REST`, `S3 API`, `gRPC`). No unlabeled bidirectionals. One flow direction (left→right or top→bottom).

## Density and type

- 5–12 boxes. Split before shrinking fonts. One C4 zoom per figure.
- ViewBox aimed at the 68ch column (~550–620px). Readable at ~390px. Prefer vertical (`TD`) layouts. Renderer font 20–24px so labels stay ~12–14px after scale.
- Title on the figure: type + scope. Legend for colors, shapes, solid vs dashed.
- Name every box; expand acronyms once (`Trino (query engine)`). Labels match the article’s words.
- No chartjunk: drop shadows, 3D, vendor wallpaper, rainbow AWS stickers as the architecture.

## Caption, alt, prose

`alt` = the claim (not `"diagram"`). Italic line under the image = caption (`Figure N. Title.`). Place the figure **after** the noun paragraph (`teach.md`), still before the first deep section. Next 1–3 paragraphs are the long description: name layers first (data / catalog / engine / jobs). Hop ①②③ only after those boxes have names. Refer by figure number, not “the image below.”

Raw `<figure>` HTML does not survive this pipeline. Markdown image + italic caption is the caption that actually publishes.

Cover images are a separate `cover_path` field; `PostArticle` currently passes empty alt. Body alts must still be real.

## Do not ship

- Generic User → API Gateway → Lambda → DynamoDB when that is not this system
- Unlabeled arrows; boxes named “processing layer” / “insights engine”
- Color-only meaning; rainbow decoration
- Raster AI images as source of truth
- Light-only PNG inverted in CSS
- ` ```mermaid ` in `body_md` as if it will render
- A poster at the end instead of a map after the noun paragraph
