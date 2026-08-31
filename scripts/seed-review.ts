/**
 * Throwaway production seed for public-UI review.
 *
 *   pnpm dlx tsx --env-file=.env.production scripts/seed-review.ts
 *
 * This package is not `"type": "module"`, so tsx emits CJS — do not use
 * top-level await. Pair with scripts/teardown-review.ts.
 *
 * Timeline marker: sort_order >= 9000 (no slug column).
 * Posts/tags/projects: slug prefix `zzreview-`.
 */
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../src/lib/database.types";
import { renderMarkdown } from "../src/lib/markdown/render";

const MANIFEST_REL = "content/drafts/review-seed-manifest.json";
const MARKER = "zzreview";
const TIMELINE_SORT_MIN = 9000;
const FLAGSHIP_SLUG = `${MARKER}-iceberg-metadata-planner`;
const LONG_TOKEN =
  "s3://prod-lakehouse-eu-central-1/warehouse/analytics/marts/fct_query_events/data/00000-79-a1b2c3d4e5f6.parquet";

type Db = SupabaseClient<Database>;
type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

type Manifest = {
  seededAt: string;
  projectRef: string;
  originalSiteSettings: SiteSettingsRow;
  postIds: string[];
  tagIds: string[];
  projectIds: string[];
  timelineIds: string[];
  commentIds: string[];
  authUserIds: string[];
};

type PostSpec = {
  slug: string;
  title: string;
  summary: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  coverPath: string | null;
  tagSlugs: string[];
  body: string;
};

function fail(message: string, err?: unknown): never {
  console.error(message);
  if (err !== undefined) {
    console.error(err);
  }
  process.exit(1);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    fail(
      `Missing ${name}. Run with:\n  pnpm dlx tsx --env-file=.env.production scripts/seed-review.ts`,
    );
  }
  return value;
}

function queryError(
  label: string,
  error: { message: string; details?: string; hint?: string; code?: string } | null,
): never {
  console.error(`FAILED: ${label}`);
  if (error) {
    console.error(error.message);
    if (error.details) console.error(error.details);
    if (error.hint) console.error(error.hint);
    if (error.code) console.error(`code=${error.code}`);
  }
  process.exit(1);
}

function fence(lang: string, code: string): string {
  return "```" + lang + "\n" + code.trimEnd() + "\n```";
}

function cover(seed: string): string {
  return `https://picsum.photos/seed/${seed}/1200/630`;
}

function writeManifest(path: string, manifest: Manifest): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

const TAGS: { slug: string; name: string; description: string }[] = [
  {
    slug: `${MARKER}-postgres`,
    name: "Postgres",
    description: "Catalogs, RLS, and the OLTP systems that still run the business.",
  },
  {
    slug: `${MARKER}-trino`,
    name: "Trino",
    description: "Distributed SQL, coordinators, and the cost of split planning.",
  },
  {
    slug: `${MARKER}-iceberg`,
    name: "Iceberg",
    description: "Snapshots, manifests, delete files, and table evolution.",
  },
  {
    slug: `${MARKER}-duckdb`,
    name: "DuckDB",
    description: "In-process analytics and the cases where a cluster is the wrong tool.",
  },
  {
    slug: `${MARKER}-dbt`,
    name: "dbt",
    description: "Incremental models, contracts, and warehouse-shaped transformations.",
  },
  {
    slug: `${MARKER}-superset`,
    name: "Superset",
    description: "Dashboards that should not melt the query engine behind them.",
  },
  {
    slug: `${MARKER}-caching`,
    name: "Caching",
    description: "Result caches, metadata caches, and the lies they can tell.",
  },
  {
    slug: `${MARKER}-rust`,
    name: "Rust",
    description: "Parquet, Arrow, and the systems code around query engines.",
  },
  {
    slug: `${MARKER}-observability`,
    name: "Observability",
    description: "Traces and metrics that explain a slow scan, not a pretty chart.",
  },
  {
    slug: `${MARKER}-data-modeling`,
    name: "Data modeling",
    description: "Grain, SCD, and the table design that query planners inherit.",
  },
];

function flagshipBody(): string {
  const sqlLong =
    "SELECT event_id, tenant_id, event_ts, payload FROM lake.analytics.fct_query_events WHERE event_ts >= TIMESTAMP '2026-07-01 00:00:00' AND event_ts < TIMESTAMP '2026-08-01 00:00:00' AND tenant_id IN ('acme','globex','initech','umbrella','soylent','stark','wayne','oscorp','hooli','massivedynamic') AND status = 'succeeded' AND bytes_scanned > 0 AND query_kind IN ('select','merge','ctas') AND NOT starts_with(user_name, 'svc-') ORDER BY event_ts DESC LIMIT 500";

  return [
    "Most query-planning conversations still start at the wrong layer. People argue about join reordering, broadcast thresholds, and whether the cost model undercounts shuffle, while the scan that dominates wall time was already decided by a handful of Avro files in the Iceberg metadata tree. If the snapshot you picked has a thousand manifests, and those manifests describe ten thousand data files that a min-max bound will not prune, no amount of cleverness in the worker will save you. The catalog already wrote the plan; the engine is just executing it.",
    "I have spent the last few years contributing to Trino, poking at DuckDB's Iceberg reader, and watching Spark jobs spend more time listing than scanning. The pattern is boringly consistent. The expensive question is not \"how do I execute this SELECT\". It is \"which files even exist, and which of them can I ignore\". That question is answered by Iceberg metadata, or it is answered by a Hive-style directory listing that you should have stopped doing in 2021. This post is a tour of that metadata as if it were a planner, because that is how it behaves in production.",
    "The public site you are reading this on is a small Next.js app. The warehouse behind the dashboards I care about is not. The same discipline applies: persist the rendered artifact, do not re-plan on every request, and treat metadata as data. Iceberg already does the first two if you let it. The third is on us.",
    "",
    "## Why metadata is the plan",
    "",
    "A snapshot is a pointer to a manifest list. A manifest list is a pointer to manifests. A manifest is a pointer to data files, delete files, and the lower/upper bounds that make pruning possible. That is the whole game. When Trino's Iceberg connector enumerates splits, it is walking this tree with a predicate in hand. When DuckDB opens a table, it is walking the same tree, just on one machine and usually with less ceremony. Spark does it too, then adds a shuffle because it can.",
    "If you only remember one thing: **file pruning is query planning**. Row-group pruning inside a Parquet file is a later, cheaper pass. If you skip the first pass, the second pass is a consolation prize you run on terabytes you should never have opened.",
    "",
    "### Snapshots as a selectivity oracle",
    "",
    "Snapshot metadata is a selectivity oracle wearing work boots. The sequence number tells you which delete files apply. The summary map tells you added/deleted records and files, which is enough to catch a compaction that silently rewrote the table under you. The schema-id tells you whether the projection you compiled last week still matches. I treat `summary[\"total-records\"]` the way I treat `reltuples` in Postgres: directionally honest, occasionally stale, never a substitute for a residual filter.",
    "When a dashboard query asks for yesterday, you want a snapshot whose manifests already exclude last month. Time travel makes that explicit: you pick a snapshot-id, and every scan is a consistent cut. The cost of that consistency is that the planner cannot cheat. If yesterday's partition still contains equality deletes from a late-arriving CDC stream, those deletes are part of the plan whether you like it or not. See the [Iceberg spec](https://iceberg.apache.org/spec/) for the exact apply order. The short version is: data file, then position deletes, then equality deletes, by sequence number.",
    "I used to think snapshot summaries were marketing. Then I watched a Trino coordinator spend 40 seconds downloading a manifest list that described 1.2 million files for a query that needed 80 of them. The summary said `total-data-files=1204410`. That number should have been a page in the runbook, not a surprise in a trace. We now alert when a snapshot's file count jumps by more than 3x without a matching record count, because that is how small-file explosions announce themselves.",
    "",
    "### Manifest lists versus manifest files",
    "",
    "The manifest list is the first filter. Each entry carries partition-field summaries: null counts, lower bounds, upper bounds, for every partition column. If your table is partitioned by `days(event_ts)` and the query has `event_ts >= DATE '2026-07-01'`, a competent reader should drop manifests whose upper bound is June. That is not partition pruning in the Hive sense. It is metadata pruning of the metadata.",
    "Manifest files themselves are Avro, and they are where the per-file stats live. This is also where people get sloppy. If you write with a process that does not populate column bounds — old Spark, a custom writer, a conversion from Hive that skipped metrics — the planner sees `null` bounds and must keep the file. You did not lose stats. You never had them. I have a greppable note for this: empty bounds are a write bug, not a read bug.",
    "A practical rule that has held up: keep manifests in the low hundreds of files each, and keep the manifest list short enough that a coordinator can decode it without swapping. Compaction is not only about small data files. Compaction of manifests is how you keep the planner honest. Iceberg's `rewrite_manifests` is the unglamorous cousin of `rewrite_data_files`, and in several of our tables it was the one that moved p95.",
    "",
    "## How Trino actually plans an Iceberg scan",
    "",
    "Trino's Iceberg connector does not ask the metastore for a partition list and then list object storage. That path is the Hive connector, and it is why Hive tables with 200k partitions still show up in incident channels. Iceberg planning is: load table metadata from the catalog, pick a snapshot, read the manifest list, prune manifests, read remaining manifests, prune files, apply delete-file correlation, then produce splits. The coordinator does this. Workers do not list buckets.",
    "That last sentence is the whole operational pitch. If your coordinator CPU is high and worker CPU is idle at the start of every query, you are paying for planning, not execution. The [metastore RPC piece](/articles/zzreview-trino-metastore-rpc) is the Hive version of this story. Iceberg replaces RPCs with object-storage GETs of known keys, which is better, but not free. A 40 MB metadata JSON plus a 200 MB pile of manifests will still stall a coordinator, especially if you are not caching them.",
    "",
    "### Split enumeration and residual predicates",
    "",
    "Split enumeration is where residual predicates earn their keep. Iceberg can only prune on columns that have bounds in the manifest. Nested fields, poorly typed timestamps, and JSON blobs pretending to be structs will not prune. The residual stays in the scan and becomes a filter on the worker. That is fine for a 2 GB file. It is not fine for 8,000 files you opened because `event_type` was stored as a string with no metrics.",
    "I want the residual to be visible in `EXPLAIN`. Trino will show you the Iceberg table scan with a remaining filter. If that remaining filter is the only selective predicate you had, you are doing a metadata-unaware scan with extra steps. The fix is usually at write time: flatten the column, or add a generated partition transform, or stop shipping JSON into the lake and calling it a table.",
    "Delete files complicate splits. A data file with a matching position-delete file is not a clean sequential read. The reader must load delete rows, build a bitmap or a sorted set of positions, and skip. Equality deletes are worse: they are joins. If you ingest CDC as equality deletes against a high-cardinality key, you have rebuilt Spark's merge-on-read tax inside Trino. I would rather compact. Deletion vectors are the hopeful sequel.",
    "",
    "### Equality deletes, position deletes, and bitmaps",
    "",
    "Position deletes are the polite kind. They name a file and a row number. You can sort them, you can bitmap them, you can apply them with a sequential scan. Equality deletes name a key and say \"this key is gone, wherever it lives\". Applying them means hashing the scan's key and probing. On a wide fact table with a 16-byte identifier, that probe is cache-friendly. On a table whose \"key\" is five columns including a timestamp truncated by accident, it is a second shuffle you did not budget.",
    "Sequence numbers decide which deletes apply to which data files. A data file written at sequence 40 is not affected by an equality delete written at sequence 39. People forget this and then \"debug\" a query that correctly returns a row they thought was deleted. Time travel makes the same confusion worse, because you can query a snapshot where the delete has not been committed yet. This is not a bug. It is MVCC. Treat it like Postgres `xmin`.",
    "I keep a mental model borrowed from cost-based optimizers. Let $n_m$ be the row count of file $m$, and $\\sigma_m$ the combined selectivity of min-max prune plus residual. Expected rows after prune are $\\lceil n_m \\cdot \\sigma_m \\rceil$. Deletes then subtract. If equality deletes are a large fraction of $n_m$, compact. Do not tune the engine to be good at applying them forever.",
    "",
    "## DuckDB's different bet",
    "",
    "DuckDB Iceberg support is the same metadata tree with a different runtime. There is no coordinator. The process that parsed SQL is the process that will scan Parquet. That makes metadata caching both easier and more important: you cannot hide a 30-second planning phase behind \"the cluster is warming up\". If `iceberg_scan` is slow before it prints the first row, you are decoding manifests on the hot path.",
    "The bet DuckDB makes is that a single node with vectorized execution and mmap-friendly reads will beat a distributed engine on the queries analysts actually run: a few hundred files, a few joins, a GROUP BY that fits in RAM. That bet is often correct. It fails when the metadata says otherwise — when the snapshot points at 80,000 files and DuckDB dutifully considers them. DuckDB will not save you from an unpartitioned dump. It will just fail on one host instead of twenty.",
    "I use DuckDB as a metadata debugger as much as a query engine. Open the table, `SELECT * FROM iceberg_metadata(...)` (or the equivalent snapshot/manifest functions in your version), and look at file counts before you look at query text. If the metadata is ugly, the query is already lost. This is also why I still keep a local Parquet extract of the manifest list for tables that misbehave. It is faster to `DESCRIBE` a problem in DuckDB than to wait for a cluster EXPLAIN ANALYZE that includes 20 seconds of planning.",
    "There is a second DuckDB-shaped lesson: **projection pushdown is only as good as the footer**. If you `SELECT two_columns FROM wide_table` and the writer used a Parquet schema with 400 columns and huge footers, you still pay to parse the footer. Iceberg file-level bounds help you skip files. They do not shrink the footer of a file you must open. Narrower files, or column-oriented layout with reasonable footer size, still matter. Rust readers that parse footers without taking the whole object are a whole other post; the short version is that range requests are not optional.",
    "",
    "## A cost model you can write down",
    "",
    "I do not trust cost models that cannot be written on a whiteboard. For an Iceberg scan, the dominant terms are metadata download, per-file open, and per-row residual. In KaTeX, because it is easier to argue about a formula than a feeling:",
    "",
    "The expected rows after a min-max prune are $\\lceil N \\cdot \\prod_i s_i \\rceil$ where $s_i$ is the selectivity of predicate $i$ against the file bounds, or $1$ if bounds are missing.",
    "",
    "$$",
    "C_{\\text{scan}} = C_{\\text{meta}} + \\sum_{m \\in M} \\left( C_{\\text{open}} + n_m \\cdot C_{\\text{row}} \\cdot \\sigma_m + C_{\\text{del}}(d_m) \\right)",
    "$$",
    "",
    "$C_{\\text{meta}}$ is the part everyone forgets to measure. It is GET latency to the metadata location, Avro decode, and the CPU to hash delete keys. On a cold coordinator it can exceed scan time for selective queries. Cache it. Invalidate on snapshot-id, not on a 5-minute TTL that lies to the next query.",
    "The table below is the comparison I actually use when someone asks \"should this be Trino, Spark, or DuckDB\". It is deliberately wide, because the answer is never one column.",
    "",
    "| Engine | Metadata walk | Split enum | Delete apply | Typical files before it hurts | Coordinator? | Cache story | Best default | Failure mode |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Trino Iceberg connector | Catalog then object storage GETs of manifest list + manifests | Coordinator, predicate-aware | Position deletes as bitmaps; equality deletes as hash-join-shaped work | Low tens of thousands if manifests are healthy | Yes, and it will show up in CPU | Connector-level metadata cache keyed by snapshot | Interactive SQL over a curated lake | Coordinator OOM / slow planning on metadata bloat |",
    "| Spark Iceberg | Driver-side planning, often with more shuffle afterwards | Driver, then tasks | Merge-on-read or copy-on-write depending on write path | High tens of thousands, then you rewrite | Driver, which is a coordinator with a different resume | Catalog cache plus executor file cache | Batch rewrites, compaction, backfills | Driver planning plus shuffle for work that was a scan |",
    "| DuckDB Iceberg | In-process, no RPC, still decodes the same Avro | Single process | Depends on reader version; do not assume Spark's apply order is copied 1:1 | Low thousands unless you like swapping | No | OS page cache and whatever you persist locally | Debug, extracts, analyst-scale joins | Opens too many files because nobody compacted |",
    "| Postgres foreign scan (for contrast) | `pg_class` / stats, not a lake snapshot | Executor | MVCC, not delete files | Millions of rows, not millions of files | Postmaster is not a lake planner | `shared_buffers` is not a manifest cache | Serving, catalogs, RLS | Using it as a warehouse until vacuum and bloat vote no |",
    "",
    "That last row is a reminder. [Postgres as a catalog](/articles/zzreview-postgres-catalog) is a good idea. Postgres as the lake is how you get a 2 a.m. autovacuum story. Iceberg exists because the lake needed MVCC that does not live inside a single node.",
    "",
    "## What this looks like in code",
    "",
    "The snippets below are the shape of the checks I want in CI and in the coordinator's logs. They are not a library. They are the difference between \"we use Iceberg\" and \"we can explain a slow scan\". Inline, the important identifier is the `snapshot-id` — if you log query text without it, you cannot reproduce the plan.",
    "",
    fence(
      "sql",
      sqlLong +
        ";\n-- The line above is intentionally one statement: horizontal scroll in <pre> is the point.\n-- Planning should prune to a handful of files if day-partition bounds exist.",
    ),
    "",
    "Trino's split count after prune is the metric. If it tracks the unpruned file count, your bounds are missing or your predicate is not on a bound column.",
    "",
    fence(
      "ts",
      `type SnapshotSummary = {
  snapshotId: bigint;
  manifestListUri: string;
  totalDataFiles: number;
  totalDeleteFiles: number;
  totalRecords: number;
};

export function planningLooksSick(s: SnapshotSummary): boolean {
  if (s.totalDataFiles > 50_000 && s.totalRecords / s.totalDataFiles < 5_000) {
    return true; // small-file explosion
  }
  return s.totalDeleteFiles > s.totalDataFiles * 0.3;
}`,
    ),
    "",
    fence(
      "python",
      `def prune_manifests(manifests, predicate_bounds):
    kept = []
    for m in manifests:
        if m.upper_bound is None or m.lower_bound is None:
            kept.append(m)  # missing metrics: cannot prune
            continue
        if overlaps(m.lower_bound, m.upper_bound, predicate_bounds):
            kept.append(m)
    return kept`,
    ),
    "",
    fence(
      "rust",
      `fn should_skip_file(lower: &[u8], upper: &[u8], needle: &[u8]) -> bool {
    // Byte-wise compare matches Iceberg's bound encoding for most primitives.
    needle < lower || needle > upper
}`,
    ),
    "",
    fence(
      "bash",
      `#!/usr/bin/env bash
set -euo pipefail
# Count data files in the current snapshot without spinning up Trino.
avro-tools tojson "$MANIFEST_LIST" | jq '[.manifests[].added_files_count] | add'`,
    ),
    "",
    fence(
      "yaml",
      `iceberg:
  table: analytics.fct_query_events
  partition_spec: [{ transform: days, source: event_ts }]
  write:
    target_file_size_bytes: 134217728
    metrics:
      default: truncate(16)
  compaction:
    max_files_per_manifest: 200
    delete_file_threshold: 0.2`,
    ),
    "",
    fence(
      "json",
      `{
  "snapshot-id": 72057594037928960,
  "operation": "append",
  "summary": {
    "added-data-files": "12",
    "added-records": "481102",
    "total-data-files": "1844",
    "total-delete-files": "37"
  }
}`,
    ),
    "",
    fence(
      "go",
      `func residualSelectivity(boundsMissing bool, ndv int64, rows int64) float64 {
  if boundsMissing {
    return 1
  }
  if ndv <= 0 || rows <= 0 {
    return 1
  }
  return math.Min(1, float64(ndv)/float64(rows))
}`,
    ),
    "",
    "If you only automate one check, automate the small-file ratio. Everything else in this post is downstream of that number getting away from you.",
    "",
    "## Operational checklist",
    "",
    "I keep this next to the on-call notes. It is intentionally mixed in structure, because incidents are mixed in structure.",
    "",
    "> Metadata is part of the query. If you do not cache it, measure it, and compact it, you do not have a lakehouse. You have a collection of Parquet files and a prayer.",
    "",
    "A coordinator that is \"mysteriously slow\" is usually doing one of the following:",
    "",
    "1. Decoding a bloated metadata tree.",
    "   1. Manifest list too large to be a list.",
    "   2. Manifests with empty bounds, so nothing prunes.",
    "      - Check the writer, not the reader.",
    "      - Re-rewrite with metrics enabled, then `rewrite_manifests`.",
    "   3. Delete-file storms from CDC applied as equality deletes.",
    "2. Hitting a catalog that still thinks in Hive partitions.",
    "3. Re-planning on every dashboard refresh because the result cache key omitted `snapshot-id`.",
    "",
    "Things I want to be true before the next compaction ticket:",
    "",
    "- [x] Snapshot-id is in query logs and in the result-cache key",
    "- [x] Manifest rewrite runs on a schedule, not as a hero query",
    "- [ ] Equality-delete ratio alerting is wired to the same panel as small files",
    "- [ ] EXPLAIN output for the ten heaviest dashboards is snapshotted weekly",
    "",
    "---",
    "",
    "A short aside on naming: people still say ~~Hive-style directory listing~~ as if it were a cute legacy mode. It is a coordinator-side denial-of-service you opted into. Iceberg is the way you stop listing. If your catalog still lists, you did not migrate; you wrapped Hadoop in YAML.",
    "",
    "![Hypothetical file-count vs snapshot sequence, the shape of a table that needs rewrite_manifests](https://picsum.photos/seed/zzreview-manifests/960/540)",
    "",
    "The image is a stand-in for the Grafana panel I actually look at: files per snapshot, deletes per snapshot, and planning time on the coordinator. When the first two jump and the third follows, I do not tune worker concurrency. I compact.",
    "",
    "### What I would change in the engines",
    "",
    "Trino should treat metadata-cache miss rate as a first-class metric next to split time. DuckDB should fail fast with a file-count warning instead of politely trying 80k files. Spark should stop winning arguments by adding executors to a planning problem. Iceberg should keep pushing deletion vectors so merge-on-read stops being a join. None of that replaces the write-path discipline of bounds, file size, and partition transforms that match the predicates you actually run.",
    "I also want catalogs to expose a cheap RPC for \"give me the summary map for snapshot X\" without downloading the rest of the tree. REST catalogs are close. JDBC catalogs that hide a Postgres table of pointers are close in a different way — see again the [catalog post](/articles/zzreview-postgres-catalog). The worst option is a Hive metastore that you ping for every partition because the table was never converted.",
    "",
    "## The boring conclusion",
    "",
    "If you take the metadata layer seriously, most \"engine\" incidents become table-maintenance incidents, which is a better class of incident. You can schedule those. You can put file-count SLOs on them. You can refuse a write path that does not emit bounds. You can teach the dashboard team that a filter on a JSON blob is not a predicate the lake can see.",
    "The query planner you shipped in Trino or DuckDB is real, and it is worth understanding. It is also downstream. The planner that decided whether yesterday's dashboard would be 800 ms or 80 s was a pile of Avro, a snapshot-id, and whoever wrote the files. Treat that pile as a product. Compact it. Cache it. Log it. Then go argue about join reordering if you still have time.",
    "I will keep writing down the parts that surprised me in production: residual predicates that never pruned, delete files that were secretly joins, coordinators that were secretly namenodes. The through-line is the same. **Read the snapshot first.** The SQL is the second sentence.",
    "",
    "Further reading I keep sending to people: the [Iceberg spec](https://iceberg.apache.org/spec/), Trino's Iceberg connector docs, and DuckDB's Iceberg extension notes.",
    "",
    "[^apply]: Apply order is data file, then position deletes, then equality deletes, filtered by sequence number. If your reader disagrees, you do not have a consistent table, you have a race.",
    "[^cache]: Cache metadata on snapshot-id. A TTL cache will serve a compacted table's old manifests until it expires, which is how dashboards go stale in a way that looks like a timezone bug.",
    "[^bounds]: Missing lower/upper bounds are a writer bug. Readers that skip files without bounds are corrupt. Readers that keep them are slow. Pick slow, then fix the writer.",
  ].join("\n");
}

function posts(): PostSpec[] {
  return [
    {
      slug: FLAGSHIP_SLUG,
      title: "The Iceberg metadata layer is the real query planner",
      summary:
        "File pruning is planning. A tour of snapshots, manifests, delete files, and why coordinator CPU is usually metadata, not SQL.",
      status: "published",
      publishedAt: "2026-08-10T09:00:00.000Z",
      coverPath: cover(`${MARKER}-iceberg`),
      tagSlugs: [
        `${MARKER}-iceberg`,
        `${MARKER}-trino`,
        `${MARKER}-duckdb`,
        `${MARKER}-observability`,
        `${MARKER}-caching`,
      ],
      body: flagshipBody(),
    },
    {
      slug: `${MARKER}-trino-metastore-rpc`,
      title:
        "Why your Trino coordinator spends more time in Hive metastore RPCs than scanning Parquet footers on a cold Iceberg table",
      summary:
        "Hive listing vs Iceberg metadata GETs, and how a \"quick\" dashboard query becomes a metastore outage.",
      status: "published",
      publishedAt: "2026-07-22T14:30:00.000Z",
      coverPath: cover(`${MARKER}-trino-rpc`),
      tagSlugs: [`${MARKER}-trino`, `${MARKER}-iceberg`],
      body: [
        "The title is not a hypothetical. I have a trace where a Hive connector query spent 11 seconds in `getPartitionsByNames` and 1.4 seconds reading Parquet. The table had 180k partitions because someone partitioned by hour and never expired them. The coordinator did what coordinators do: it asked the metastore, serially enough to hurt, and the workers waited.",
        "Iceberg does not make this class of bug impossible. It changes the failure mode. Instead of N partition RPCs you get a metadata JSON and a manifest list. That is one to a few dozen object-storage reads, cacheable by snapshot-id. If you still see metastore RPC dominating Iceberg queries, you are probably on a JDBC catalog that is itself a chatty Postgres, or you disabled the metadata cache because it \"felt stale\".",
        "Staleness is a snapshot problem, not a TTL problem. Key the cache by `snapshot-id` (and the table UUID). When a write commits, the next query loads new metadata on purpose. A five-minute TTL is how you serve a compacted table's old file list and then spend an afternoon blaming S3.",
        "What I measure now: coordinator time before the first split is scheduled, metastore/catalog RPC count, metadata bytes decoded, and files after prune versus files in the snapshot. If the first number is large and the last ratio is ~1, you do not have a scan problem. You have a listing problem wearing a SQL costume.",
        "Migration-wise, convert the Hive table, do not wrap it. A Hive table with Iceberg-ish naming still lists. The coordinator does not care that your folder is called `warehouse/`. It cares whether the plan came from a snapshot or from `listStatus`.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-iceberg-delete-files`,
      title: "Predicate pushdown through Iceberg delete files",
      summary: null,
      status: "published",
      publishedAt: "2026-07-01T11:15:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-iceberg`, `${MARKER}-trino`, `${MARKER}-data-modeling`],
      body: [
        "This one has no summary on purpose: I want to see how cards and OG images behave when the only text is the title. The content is still real.",
        "Delete files are not an afterthought you apply at the end of a scan like a WHERE clause you forgot. Position deletes change which rows in a data file exist. Equality deletes change which keys exist across files. A predicate on a column that also appears in an equality-delete file can, in principle, prune delete files too. Most readers are better at pruning data files than pruning delete files. That asymmetry shows up as \"why is this selective query opening 2 GB of delete Avro\".",
        "If your CDC pipeline emits equality deletes against `id`, and analysts filter on `event_ts`, the delete files may not prune at all. You will hash every delete key for a scan that needed one partition. The modeling fix is to compact on a schedule that tracks delete-file bytes, not feelings. The engine fix is to attach bounds to delete files with the same seriousness as data files.",
        "Until deletion vectors are the default everywhere I work, I treat a growing equality-delete directory as a correctness tax that also happens to be a latency tax. Merge-on-read is a feature. It is also how you reconstruct a join in the read path and then wonder why Trino looks like Spark.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-duckdb-parquet-afternoon`,
      title: "A quiet afternoon with DuckDB on a 40 GB Parquet dump",
      summary:
        "No tags, one suspiciously long object key, and a reminder that a laptop can still beat a cluster.",
      status: "published",
      publishedAt: "2026-06-18T16:00:00.000Z",
      coverPath: null,
      tagSlugs: [],
      body: [
        "I copied 40 GB of Parquet out of the lake because the cluster queue was a political problem and I needed an answer before standup. DuckDB opened the directory, pushed a projection, and finished the aggregation while the Trino UI was still saying \"waiting for resources\". This is not a morality tale about vendors. It is a file-count tale.",
        "The dump was 64 files, ~640 MB each, clean bounds, no delete files. That is a DuckDB-shaped table. The production snapshot of the same logical dataset was 18,000 files and a pile of equality deletes. Same SQL, different metadata, different engine winner. If you benchmark engines without fixing the table, you are benchmarking your compaction backlog.",
        `The object key that started the detour is worth rendering as a single token, because UIs choke on it: ${LONG_TOKEN}`,
        "That path is 90-ish characters with no spaces. It is a legal S3 key. It is also how a layout that wraps on spaces fails: cards, log lines, `pre`, table cells. If your CSS does not break long tokens, the lake will do it for you in code review.",
        "I still sent the cluster version of the query after lunch, because production identity, RLS-ish warehouse grants, and the catalog's idea of truth live there. DuckDB was the replica I could hold. The replica is allowed to be right on arithmetic and wrong on authorization. Do not confuse those.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-dbt-iceberg-lineage`,
      title: "End-to-end lineage from dbt models to Iceberg snapshots",
      summary:
        "A model name is not a table identity. Snapshot-ids, dbt contracts, and the eight tags this post is carrying for the tags page.",
      status: "published",
      publishedAt: "2026-05-29T10:00:00.000Z",
      coverPath: null,
      tagSlugs: [
        `${MARKER}-postgres`,
        `${MARKER}-trino`,
        `${MARKER}-iceberg`,
        `${MARKER}-duckdb`,
        `${MARKER}-dbt`,
        `${MARKER}-superset`,
        `${MARKER}-caching`,
        `${MARKER}-data-modeling`,
      ],
      body: [
        "dbt will happily tell you that `fct_query_events` depends on `stg_query_logs`. Iceberg will happily tell you that snapshot 72057594037928960 added 12 files. Neither view is lineage by itself. Lineage I can debug is: this dashboard tile ran this SQL against this snapshot of this Iceberg table that was produced by this dbt invocation with this git SHA.",
        "We store the dbt invocation id in Iceberg snapshot summary properties. Cheap, writable from the adapter, visible to any engine that can read metadata. Superset then includes the snapshot-id in its query tag. When a tile is wrong, I do not start with the chart. I start with \"which snapshot did you read, and which dbt run produced it\".",
        "Contracts help only if the warehouse enforces them. A dbt contract that says `event_ts` is `timestamptz` does not stop a Spark job from writing a string. Iceberg schema-id does. The painful part is the join between dbt's schema.yml and Iceberg's schema evolution: added columns are easy, type widens are easy, \"we renamed it in dbt but not in the table\" is how you get two truths.",
        "Caching makes lineage harder. A result cache keyed by SQL text will serve yesterday's snapshot. Key by SQL plus snapshot-id plus the dbt contract hash if you are serious. Otherwise you will chase a timezone bug that is actually a TTL.",
        "Postgres shows up here as the catalog and as the store for dbt's metadata database. That is fine. Do not put the fact table there. The eight tags on this post are a UI test; the architecture is not \"tag everything\". It is \"put identity in the snapshot, not in a wiki\".",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-spark-vs-trino-yerevan`,
      title: "Spark shuffle vs Trino exchange — նշումներ from Երևան 🇦🇲",
      summary:
        "Notes from a week of explaining why the same join is a shuffle in Spark and an exchange in Trino, written between espresso and the 44 bus.",
      status: "published",
      publishedAt: "2026-05-04T18:45:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-trino`, `${MARKER}-observability`],
      body: [
        "Երևան is a good place to think about shuffles because the city is itself an exchange: marshrutkas, the metro, and everyone walking as if they had a better join order. Spark calls the thing a shuffle. Trino calls it an exchange. Both are \"stop pipelining and wait for this key to land on another machine\".",
        "The practical difference I keep repeating in reviews: Spark will write shuffle files and let tasks restart. Trino prefers pipelined exchanges and pays for that with a more fragile query lifetime. If your join is larger than RAM and you needed Spark's spill, forcing it through Trino is not a win. If your join is a broadcast that Spark scheduled as a shuffle because AQE was off, Trino looking faster is not a miracle.",
        "Observability: I want the bytes moved across the exchange, not a stage-duration bar chart. Spark's UI makes shuffle bytes obvious. Trino's operator stats do too if you export them. Dashboards that only show wall time will make you scale workers for a planning problem, or add partitions for a broadcast that should have stayed a broadcast.",
        "The accented and Cyrillic-adjacent bits in the title are load-bearing for the layout. Armenian `նշումներ` is \"notes\". If a card clips it, that is a font and wrapping bug, not a content bug. Emoji at the end is the other test: OG image, `<title>`, and the header wrapping on a phone.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-postgres-catalog`,
      title: "Postgres as a catalog, not a warehouse",
      summary:
        "REST catalogs, JDBC catalogs, and why the database that should store pointers should not store the lake.",
      status: "published",
      publishedAt: "2026-04-12T09:30:00.000Z",
      coverPath: cover(`${MARKER}-postgres`),
      tagSlugs: [`${MARKER}-postgres`, `${MARKER}-iceberg`, `${MARKER}-data-modeling`],
      body: [
        "A catalog is a pointer service with transactions. Postgres is excellent at that. Iceberg's JDBC catalog, and several REST catalog implementations that are Postgres wearing an HTTP suit, are a good idea. The bad idea is loading 400 columns of event JSON into the same instance because \"we already have Postgres\".",
        "What I want from a catalog database: atomic snapshot pointer updates, a small amount of table metadata, and RLS if you are exposing it to humans. What I do not want: the fact table, autovacuum on 2 TB, and a replica lag incident that looks like a lake outage.",
        "If you are choosing between Hive metastore and Postgres as the catalog, choose Postgres (or a REST catalog backed by it). Hive metastore's partition API is the original sin of coordinator slowness. Postgres will not save you from a chatty connector, but at least you can `EXPLAIN ANALYZE` the catalog queries and add an index.",
        "Modeling the catalog tables is not glamorous. Table UUID, current snapshot, metadata location, and a history that you can audit. When someone asks \"why did the dashboard change at 14:02\", the catalog row is the answer, not the SQL.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-trino-iceberg-stats`,
      title: "Cost-based planning in Trino with Iceberg stats",
      summary:
        "NDVs from manifests, the lies of nested fields, and when to collect extra stats anyway.",
      status: "published",
      publishedAt: "2026-03-20T13:00:00.000Z",
      coverPath: cover(`${MARKER}-stats`),
      tagSlugs: [`${MARKER}-trino`, `${MARKER}-iceberg`, `${MARKER}-caching`],
      body: [
        "Trino's cost-based optimizer will use Iceberg column stats when they exist: null counts, min/max, and sometimes NDV-like information depending on version and table properties. If they do not exist, you get whatever default selectivity the engine picked in 2019 and a join order that looks creative.",
        "I would rather have slightly wrong bounds than no bounds. Missing stats are interpreted as \"this filter does nothing\", which is how a 1:1000 dimension join becomes a broadcast of the fact table in someone's imagination. Writers must emit metrics. Readers must not invent NDVs from unique counts on a 1% sample and then act sure.",
        "Caching stats separately from snapshots is how you get a join order from last week. Cache the metadata blob, including stats, on snapshot-id. If collecting extra Trino ANALYZE-style stats, store the snapshot they were collected against and refuse to use them otherwise.",
        "Nested fields remain the hole. If the predicate is on `payload.user.id`, Iceberg file bounds on `payload` as a blob will not help. Flatten the columns you filter on. That is data modeling, not a planner feature request.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-superset-without-melting`,
      title: "Building a Superset dashboard that does not melt the cluster",
      summary:
        "Tile SQL, cache keys, and the dashboard anti-pattern of nine cross-joins on the hottest Iceberg table.",
      status: "published",
      publishedAt: "2026-02-14T12:00:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-superset`, `${MARKER}-trino`, `${MARKER}-caching`],
      body: [
        "Superset is innocent. The SQL in the tiles is not. A dashboard with twelve charts is twelve queries, plus async refresh, plus everyone opening it at 09:01. If each tile scans the raw event table \"just to be flexible\", you have built a load test and called it analytics.",
        "What works: pre-aggregate in dbt to the grain the chart actually needs, point tiles at that table, and cache on snapshot-id. What does not: a Jinja filter that removes the date predicate when the user clears the box. That one change turns a pruned Iceberg scan into a full snapshot read. I have seen it take the coordinator with it.",
        "I also want each tile to have a cost ceiling. Trino query max memory and a scanned-bytes guardrail are friendlier than a Slack thread titled \"is the cluster down\". Superset's global cache without a snapshot in the key is how you serve a compacted table's old numbers until someone hits Reload.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-query-engine-telemetry`,
      title: "Observability for query engines: traces, not dashboards",
      summary:
        "Split time, planning time, and delete-apply time as spans. RED metrics are not enough.",
      status: "published",
      publishedAt: "2026-01-08T08:20:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-observability`, `${MARKER}-trino`],
      body: [
        "A query engine dashboard that shows QPS and p99 is a product dashboard. An on-call dashboard has to split p99 into planning, split enumeration, scan, exchange, and finish. Otherwise you will scale workers when the coordinator is stuck in Avro decode.",
        "I export Trino operator stats as traces when I can: one span per pipeline, attributes for snapshot-id, files scanned, files skipped, delete files applied. Metrics without those dimensions average away the only tables that matter.",
        "Logs should carry the snapshot-id, the query hash, and the user. If you cannot join a slow query to a snapshot summary, you will re-run it on a different snapshot and \"fail to reproduce\". That is not flakiness. That is MVCC.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-dbt-incremental-iceberg`,
      title: "dbt incremental models against Iceberg: merge, not mutate",
      summary:
        "Copy-on-write vs merge-on-read, and why lookback windows exist.",
      status: "published",
      publishedAt: "2025-11-22T15:10:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-dbt`, `${MARKER}-iceberg`, `${MARKER}-data-modeling`],
      body: [
        "dbt's incremental `merge` on Iceberg is a new snapshot, not an in-place mutate. That sentence would have saved me a week in 2024. You are always appending metadata. Whether you also append delete files or rewrite data files depends on the engine and table properties.",
        "Lookback windows are how you catch late data without scanning the world. They only work if `event_ts` is both a predicate and a partition transform. If you incremental on `ingested_at` and analysts filter on `event_ts`, you will be correct in dbt and wrong in the dashboard.",
        "I prefer copy-on-write for small dimensions and merge-on-read for fat facts, with a compaction job that is part of the dbt project, not a hero notebook. If the incremental unique key does not match the Iceberg equality-delete key, you will duplicate rows and then argue about grain.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-result-cache-honesty`,
      title: "Caching query results without lying to users",
      summary:
        "TTL caches lie. Snapshot-keyed caches are honest, and sometimes slower in a way you can explain.",
      status: "published",
      publishedAt: "2025-10-03T10:40:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-caching`, `${MARKER}-postgres`, `${MARKER}-duckdb`],
      body: [
        "A result cache is a materialized view with amnesia. If you key it on SQL text and a TTL, you will serve a snapshot that no longer exists in the user's head. They refreshed; you did not. Postgres `LISTEN/NOTIFY` is not going to save a lake cache. Iceberg snapshot-id will.",
        "DuckDB makes this tempting because a local result is instant and there is no cluster to blame. Persist DuckDB extracts with the snapshot-id in the filename. When someone asks if it is current, answer with a number, not \"it should be\".",
        "Honesty is a UI problem too. Show \"as of snapshot 72… committed 14:02 UTC\". Hide TTL. TTL is an implementation detail that trains people to distrust the numbers, which is how shadow spreadsheets get born.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-rust-parquet-footer`,
      title: "Reading Parquet footers from Rust without taking the whole file",
      summary:
        "Range requests, footer size, and why a 12 MB footer is a write bug.",
      status: "published",
      publishedAt: "2025-08-19T17:05:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-rust`, `${MARKER}-duckdb`],
      body: [
        "Parquet stores metadata at the end of the file. A correct reader issues a range request for the tail, finds the footer length, and only then decides which column chunks to GET. A lazy reader downloads the object. On a 512 MB file with a 8 KB footer, laziness is a 64,000% tax.",
        "Rust's parquet crates make the honest path available. You still have to wire your object-store client to actually do ranges. I have seen production code that used `get_object` because the S3 helper was copy-pasted from a CSV tutorial. DuckDB does this right; copy that behavior, not the CSV helper.",
        "Huge footers are a write-side bug: too many row groups, too many columns, statistics set to full JSON. Truncate stats. Increase row-group size. If the footer is measured in megabytes, skip-planning is already lost for that file.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-draft-spark-aqe`,
      title: "What Spark AQE gets right that Trino still refuses to",
      summary: "Draft: adaptive broadcast conversion mid-query, and why coordinators hate it.",
      status: "draft",
      publishedAt: null,
      coverPath: null,
      tagSlugs: [`${MARKER}-trino`],
      body: [
        "This draft must not appear on the public site. It exists so a reviewer can confirm drafts do not leak through list pages, RSS, sitemaps, or search.",
        "AQE's useful trick is changing a join strategy after seeing real sizes. Trino's philosophy is plan-once, run. I am not sure the public post should pick a winner yet. The notes below stay in studio.",
        "If this slug is fetchable anonymously, the seed failed its only security-adjacent job.",
      ].join("\n\n"),
    },
    {
      slug: `${MARKER}-archived-hive-listing`,
      title: "Stop listing Hive partitions from the coordinator",
      summary: "Archived: superseded by the Iceberg metadata post. Must not leak publicly.",
      status: "archived",
      publishedAt: "2025-06-20T10:00:00.000Z",
      coverPath: null,
      tagSlugs: [`${MARKER}-trino`],
      body: [
        "This article is archived on purpose. It was the angry version of the Hive metastore RPC piece, and I do not want it on the public index.",
        "If an anonymous client can load this slug or see it in `/articles`, the published-only filters are broken.",
      ].join("\n\n"),
    },
  ];
}

function bioMd(): string {
  return [
    "I work on query engines and lakehouse metadata — Trino, Iceberg, DuckDB, dbt, and the Postgres catalogs that hold the pointers.",
    "Most of what I write is about treating **snapshots as plans**: file pruning, delete files, and the coordinator time nobody budgets.",
    "I contribute upstream when I can (Trino, Iceberg, DuckDB, Superset, Spark) and I still believe a well-compacted table beats a clever join reorder.",
  ].join("\n\n");
}

type ProjectSpec = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  repoUrl: string;
  homepageUrl: string | null;
  primaryLanguage: string;
  tech: string[];
  role: string;
  status: "active" | "paused" | "archived";
  featured: boolean;
  sortOrder: number;
  stars: number;
  forks: number;
};

function projects(): ProjectSpec[] {
  return [
    {
      slug: `${MARKER}-iceberg-manifest-lab`,
      name: "Iceberg Manifest Lab",
      tagline: "Decode snapshot trees without standing up a cluster.",
      description:
        "A small Rust CLI that prints manifest-list summaries, file counts, and missing-bounds rates for an Iceberg table. I use it before I open Trino.\n\nIt reads metadata JSON and Avro only — no data-file GETs — so it is safe on production locations if your IAM is.",
      repoUrl: "https://github.com/daviddallakyan2005/iceberg-manifest-lab",
      homepageUrl: "https://github.com/daviddallakyan2005/iceberg-manifest-lab#readme",
      primaryLanguage: "Rust",
      tech: ["Rust", "Iceberg", "Avro", "object-store"],
      role: "Author",
      status: "active",
      featured: true,
      sortOrder: 10,
      stars: 84,
      forks: 11,
    },
    {
      slug: `${MARKER}-trino-spill-profiler`,
      name: "Trino spill profiler",
      tagline: "Per-operator spill and reservation traces for Iceberg scans.",
      description:
        "A Trino event-listener sidecar that records planning time, split count after prune, and memory reservations for delete-file bitmaps.\n\nBuilt to answer \"is this query slow because of SQL or because of metadata\".",
      repoUrl: "https://github.com/daviddallakyan2005/trino-spill-profiler",
      homepageUrl: null,
      primaryLanguage: "Java",
      tech: ["Java", "Trino", "OpenTelemetry"],
      role: "Maintainer",
      status: "active",
      featured: true,
      sortOrder: 20,
      stars: 41,
      forks: 6,
    },
    {
      slug: `${MARKER}-duckdb-httpfs-cache`,
      name: "DuckDB httpfs cache notes",
      tagline: "Range-request caching in front of Iceberg scans.",
      description:
        "Notes and a thin extension experiment: cache Parquet footers and Iceberg manifests on disk, keyed by ETag and snapshot-id.\n\nPaused while upstream httpfs caching landed parts of this. Still useful as a design record.",
      repoUrl: "https://github.com/daviddallakyan2005/duckdb-httpfs-cache",
      homepageUrl: "https://duckdb.org/docs/extensions/httpfs",
      primaryLanguage: "C++",
      tech: ["C++", "DuckDB", "HTTP"],
      role: "Contributor",
      status: "paused",
      featured: false,
      sortOrder: 30,
      stars: 19,
      forks: 3,
    },
    {
      slug: `${MARKER}-dbt-iceberg-adapter-notes`,
      name: "dbt Iceberg adapter notes",
      tagline: "Snapshot summary properties from dbt run results.",
      description:
        "A patch series and runbook for writing dbt invocation id, git SHA, and contract hash into Iceberg snapshot summaries.\n\nNot a full adapter — notes that belong next to whatever adapter you already run.",
      repoUrl: "https://github.com/daviddallakyan2005/dbt-iceberg-adapter-notes",
      homepageUrl: "https://docs.getdbt.com",
      primaryLanguage: "Python",
      tech: ["Python", "dbt", "Iceberg"],
      role: "Author",
      status: "active",
      featured: false,
      sortOrder: 40,
      stars: 27,
      forks: 4,
    },
    {
      slug: `${MARKER}-superset-trino-thin`,
      name: "Superset thin tiles",
      tagline: "Dashboard patterns that do not full-scan the lake.",
      description:
        "Archived collection of Superset tile SQL, cache-key conventions, and a linter that rejects missing date predicates.\n\nSuperseded by the internal dashboard platform. Left here so the catalog still shows an archived project.",
      repoUrl: "https://github.com/daviddallakyan2005/superset-trino-thin",
      homepageUrl: null,
      primaryLanguage: "Python",
      tech: ["Python", "Superset", "Trino"],
      role: "Author",
      status: "archived",
      featured: false,
      sortOrder: 50,
      stars: 8,
      forks: 1,
    },
    {
      slug: `${MARKER}-lakehouse-cost-model`,
      name: "Lakehouse cost model",
      tagline: "Whiteboard formulas for metadata, opens, and residuals.",
      description:
        "A tiny TypeScript library plus a notebook that estimates scan cost from snapshot summaries. Featured because I keep linking it from posts.\n\nPaused pending real NDV inputs from the catalog; the formula is still the one in the flagship article.",
      repoUrl: "https://github.com/daviddallakyan2005/lakehouse-cost-model",
      homepageUrl: "https://daviddallakyan.com/projects/zzreview-lakehouse-cost-model",
      primaryLanguage: "TypeScript",
      tech: ["TypeScript", "Iceberg", "Trino"],
      role: "Author",
      status: "paused",
      featured: true,
      sortOrder: 15,
      stars: 33,
      forks: 5,
    },
  ];
}

type TimelineSpec = {
  kind: "role" | "education" | "talk" | "award" | "oss_contribution";
  title: string;
  org: string;
  orgUrl: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  highlights: string[];
  sortOrder: number;
};

function timeline(): TimelineSpec[] {
  return [
    {
      kind: "role",
      title: "Staff Data Infrastructure Engineer",
      org: "Independent / consulting",
      orgUrl: "https://daviddallakyan.com",
      startDate: "2024-03-01",
      endDate: null,
      isCurrent: true,
      description:
        "Query engines, Iceberg table maintenance, and the catalogs that sit in front of object storage. Most of the writing on this site comes from this work.",
      highlights: [
        "Iceberg compaction and manifest-rewrite SLOs for multi-TB facts",
        "Trino planning-time tracing (snapshot-id, files after prune)",
        "dbt incremental models that commit snapshot summary lineage",
      ],
      sortOrder: TIMELINE_SORT_MIN + 1,
    },
    {
      kind: "role",
      title: "Query Engine Engineer",
      org: "Analytics platform team",
      orgUrl: "https://trino.io",
      startDate: "2021-06-01",
      endDate: "2024-02-01",
      isCurrent: false,
      description:
        "Trino connectors, Hive-to-Iceberg migration, and the coordinator incidents that taught me to measure metadata GETs.",
      highlights: [
        "Migrated high-partition Hive tables off metastore listing",
        "Introduced Iceberg metadata cache keyed by snapshot-id",
        "On-call for cluster memory and spill during dashboard peaks",
      ],
      sortOrder: TIMELINE_SORT_MIN + 2,
    },
    {
      kind: "education",
      title: "BSc Computer Science",
      org: "Yerevan State University",
      orgUrl: "https://www.ysu.am",
      startDate: "2017-09-01",
      endDate: "2021-06-01",
      isCurrent: false,
      description:
        "Systems and databases. The useful residue is still B-trees, MVCC, and being suspicious of directory listings.",
      highlights: [
        "Thesis-adjacent work on external merge sort vs in-memory hash",
        "Teaching assistant for an intro databases course",
      ],
      sortOrder: TIMELINE_SORT_MIN + 3,
    },
    {
      kind: "talk",
      title: "Iceberg metadata as a query planner",
      org: "Data Council",
      orgUrl: "https://www.datacouncil.ai",
      startDate: "2025-11-12",
      endDate: "2025-11-12",
      isCurrent: false,
      description:
        "A talk version of the flagship post: snapshots, manifests, and why coordinator CPU is usually Avro.",
      highlights: [
        "Live decode of a bloated manifest list",
        "Cost model for opens vs residuals",
      ],
      sortOrder: TIMELINE_SORT_MIN + 4,
    },
    {
      kind: "talk",
      title: "DuckDB for production debugging",
      org: "DuckCon",
      orgUrl: "https://duckdb.org",
      startDate: "2025-04-18",
      endDate: "2025-04-18",
      isCurrent: false,
      description:
        "Using DuckDB as a metadata debugger against Iceberg tables that misbehave in Trino, without pretending a laptop is the warehouse.",
      highlights: [
        "Manifest-level file-count queries",
        "When not to use DuckDB (80k files, equality-delete storms)",
      ],
      sortOrder: TIMELINE_SORT_MIN + 5,
    },
    {
      kind: "award",
      title: "Open source spotlight — Trino Iceberg",
      org: "Trino Software Foundation",
      orgUrl: "https://trino.io",
      startDate: "2024-10-01",
      endDate: "2024-10-01",
      isCurrent: false,
      description:
        "Recognition for connector work around metadata caching and scan planning. The plaque is a GitHub comment thread.",
      highlights: [
        "Metadata cache keyed by snapshot-id",
        "Docs on delete-file apply order",
      ],
      sortOrder: TIMELINE_SORT_MIN + 6,
    },
    {
      kind: "oss_contribution",
      title: "Trino Iceberg connector",
      org: "trinodb/trino",
      orgUrl: "https://github.com/trinodb/trino",
      startDate: "2022-01-01",
      endDate: null,
      isCurrent: true,
      description:
        "Planning-time fixes, Iceberg stats plumbing, and the occasional test that fails only with delete files present.",
      highlights: [
        "Split enumeration traces",
        "Reviewer on metadata-cache PRs",
      ],
      sortOrder: TIMELINE_SORT_MIN + 7,
    },
    {
      kind: "oss_contribution",
      title: "Apache Iceberg spec & engine gaps",
      org: "apache/iceberg",
      orgUrl: "https://github.com/apache/iceberg",
      startDate: "2023-03-01",
      endDate: null,
      isCurrent: true,
      description:
        "Mostly tests and spec clarifications around equality-delete apply order and v3 deletion vectors, plus Spark rewrite_manifests notes.",
      highlights: [
        "Equality-delete sequence-number tests",
        "Deletion-vector portability checklist",
      ],
      sortOrder: TIMELINE_SORT_MIN + 8,
    },
  ];
}

async function main(): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const projectRef =
    process.env.SUPABASE_PROJECT_ID ??
    new URL(url).hostname.split(".")[0] ??
    "unknown";

  const manifestPath = resolve(process.cwd(), MANIFEST_REL);
  if (existsSync(manifestPath)) {
    fail(
      `Manifest already exists at ${manifestPath}.\n` +
        `Refusing to double-seed. Run teardown first:\n` +
        `  pnpm dlx tsx --env-file=.env.production scripts/teardown-review.ts`,
    );
  }

  console.log(`LONG_TOKEN length (expect ~90): ${LONG_TOKEN.length}`);
  console.log(
    `Long title length: ${
      posts().find((p) => p.slug === `${MARKER}-trino-metastore-rpc`)?.title.length ?? 0
    }`,
  );

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: originalSettings, error: settingsReadError } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (settingsReadError) queryError("read site_settings", settingsReadError);
  if (!originalSettings) {
    fail("site_settings id=1 is missing; refusing to seed.");
  }

  const manifest: Manifest = {
    seededAt: new Date().toISOString(),
    projectRef,
    originalSiteSettings: originalSettings,
    postIds: [],
    tagIds: [],
    projectIds: [],
    timelineIds: [],
    commentIds: [],
    authUserIds: [],
  };
  writeManifest(manifestPath, manifest);
  console.log(`Wrote initial manifest (settings snapshot) → ${manifestPath}`);
  console.log(`Target project ref: ${projectRef}`);

  console.log("\n[tags]");
  const { data: tagRows, error: tagError } = await supabase
    .from("tags")
    .insert(TAGS)
    .select("id, slug");
  if (tagError || !tagRows) queryError("insert tags", tagError);
  manifest.tagIds = tagRows.map((row) => row.id);
  writeManifest(manifestPath, manifest);
  console.log(`  inserted ${tagRows.length} tags`);
  const tagIdBySlug = new Map(tagRows.map((row) => [row.slug, row.id]));

  console.log("\n[posts]");
  const postSpecs = posts();
  let flagshipId: string | null = null;
  const postTagLinks: { post_id: string; tag_id: string }[] = [];

  for (const [index, spec] of postSpecs.entries()) {
    const rendered = await renderMarkdown(spec.body);
    if (spec.slug === FLAGSHIP_SLUG && rendered.wordCount < 2500) {
      fail(
        `Flagship article is only ${rendered.wordCount} words (need >= 2500).`,
      );
    }

    const { data: postRow, error: postError } = await supabase
      .from("posts")
      .insert({
        slug: spec.slug,
        title: spec.title,
        summary: spec.summary,
        body_md: spec.body,
        body_html: rendered.html,
        toc_json: rendered.toc as unknown as Json,
        cover_path: spec.coverPath,
        status: spec.status,
        published_at: spec.publishedAt,
        reading_minutes: rendered.readingMinutes,
        word_count: rendered.wordCount,
      })
      .select("id, slug")
      .maybeSingle();
    if (postError || !postRow) {
      queryError(`insert post ${spec.slug}`, postError);
    }

    manifest.postIds.push(postRow.id);
    if (spec.slug === FLAGSHIP_SLUG) {
      flagshipId = postRow.id;
    }

    for (const tagSlug of spec.tagSlugs) {
      const tagId = tagIdBySlug.get(tagSlug);
      if (!tagId) fail(`Unknown tag slug ${tagSlug} on post ${spec.slug}`);
      postTagLinks.push({ post_id: postRow.id, tag_id: tagId });
    }

    console.log(
      `  ${index + 1}/${postSpecs.length} ${spec.slug} (${spec.status}, ${rendered.wordCount} words, ${rendered.readingMinutes} min, toc=${rendered.toc.length})`,
    );
  }
  writeManifest(manifestPath, manifest);

  if (postTagLinks.length > 0) {
    const { error: linkError } = await supabase.from("post_tags").insert(postTagLinks);
    if (linkError) queryError("insert post_tags", linkError);
    console.log(`  inserted ${postTagLinks.length} post_tags links`);
  }

  console.log("\n[projects]");
  for (const spec of projects()) {
    const rendered = await renderMarkdown(spec.description);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        slug: spec.slug,
        name: spec.name,
        tagline: spec.tagline,
        description_md: spec.description,
        description_html: rendered.html,
        repo_url: spec.repoUrl,
        homepage_url: spec.homepageUrl,
        primary_language: spec.primaryLanguage,
        tech: spec.tech,
        role: spec.role,
        status: spec.status,
        featured: spec.featured,
        sort_order: spec.sortOrder,
        stars: spec.stars,
        forks: spec.forks,
      })
      .select("id")
      .maybeSingle();
    if (error || !data) queryError(`insert project ${spec.slug}`, error);
    manifest.projectIds.push(data.id);
    console.log(`  ${spec.slug} (${spec.status}, featured=${spec.featured})`);
  }
  writeManifest(manifestPath, manifest);
  console.log(`  inserted ${manifest.projectIds.length} projects`);

  console.log("\n[timeline] sort_order >= " + TIMELINE_SORT_MIN);
  for (const spec of timeline()) {
    const rendered = await renderMarkdown(spec.description);
    const { data, error } = await supabase
      .from("timeline_entries")
      .insert({
        kind: spec.kind,
        title: spec.title,
        org: spec.org,
        org_url: spec.orgUrl,
        start_date: spec.startDate,
        end_date: spec.endDate,
        is_current: spec.isCurrent,
        description_md: spec.description,
        description_html: rendered.html,
        highlights: spec.highlights,
        sort_order: spec.sortOrder,
      })
      .select("id")
      .maybeSingle();
    if (error || !data) queryError(`insert timeline ${spec.title}`, error);
    manifest.timelineIds.push(data.id);
    console.log(`  ${spec.sortOrder} ${spec.kind}: ${spec.title}`);
  }
  writeManifest(manifestPath, manifest);
  console.log(`  inserted ${manifest.timelineIds.length} timeline entries`);

  console.log("\n[auth user + comments]");
  if (!flagshipId) fail("Flagship post id missing; cannot attach comments.");

  const password = randomBytes(24).toString("base64url");
  const { data: createdUser, error: userError } =
    await supabase.auth.admin.createUser({
      email: "zzreview.reader@example.com",
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Mira Petrosyan",
        name: "Mira Petrosyan",
        user_name: "zzreview-reader",
      },
    });
  if (userError || !createdUser.user) {
    fail(
      `Failed to create auth user: ${userError?.message ?? "no user returned"}`,
      userError,
    );
  }
  const userId = createdUser.user.id;
  manifest.authUserIds.push(userId);
  writeManifest(manifestPath, manifest);
  console.log(`  created auth user ${userId} <zzreview.reader@example.com>`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, github_username")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) queryError("select profile for new user", profileError);
  if (!profile) {
    console.log("  handle_new_user did not create a profile; inserting explicitly");
    const { error: insertProfileError } = await supabase.from("profiles").insert({
      id: userId,
      display_name: "Mira Petrosyan",
      github_username: "zzreview-reader",
      role: "reader",
    });
    if (insertProfileError) queryError("insert profile", insertProfileError);
  } else {
    console.log(
      `  profile ok display_name=${profile.display_name} github_username=${profile.github_username}`,
    );
  }

  const commentBodies: {
    body: string;
    status: "visible" | "pending" | "hidden";
    parentId?: string;
  }[] = [
    {
      body: "The cost model in the scan section matches what we see: C_meta dominates when the manifest list is cold. Caching on snapshot-id (not a TTL) is the part I wish we had done a year earlier.",
      status: "visible",
    },
    {
      body: "Have you tried setting a max files-per-manifest SLO next to the small-file ratio? We alert at 400 and rewrite_manifests pays for itself on the dashboard cluster.",
      status: "visible",
    },
    {
      body: "Please un-hide this if it looks fine — I think the long SQL example is missing a tenant filter in the IN list, or is that intentional for the scroll test?",
      status: "pending",
    },
    {
      body: "Off-topic moderation fixture: this hidden comment must not render on the public article.",
      status: "hidden",
    },
  ];

  let parentId: string | null = null;
  for (const spec of commentBodies) {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: flagshipId,
        author_id: userId,
        parent_id: spec.parentId ?? null,
        body: spec.body,
        status: spec.status,
      })
      .select("id")
      .maybeSingle();
    if (error || !data) queryError(`insert comment (${spec.status})`, error);
    manifest.commentIds.push(data.id);
    if (spec.status === "visible" && parentId === null) {
      parentId = data.id;
    }
    console.log(`  comment ${data.id} status=${spec.status}`);
  }

  if (!parentId) fail("Expected a visible parent comment to thread a reply.");
  const { data: reply, error: replyError } = await supabase
    .from("comments")
    .insert({
      post_id: flagshipId,
      author_id: userId,
      parent_id: parentId,
      body: "Yes — the residual predicate on the equality-delete file is the part that surprised me. Sequence numbers make it look like a bug until you treat them like xmin.",
      status: "visible",
    })
    .select("id")
    .maybeSingle();
  if (replyError || !reply) queryError("insert threaded reply", replyError);
  manifest.commentIds.push(reply.id);
  writeManifest(manifestPath, manifest);
  console.log(`  reply ${reply.id} parent_id=${parentId} status=visible`);
  console.log(`  inserted ${manifest.commentIds.length} comments (max 5 / author / hour)`);

  console.log("\n[site_settings]");
  const bio = bioMd();
  const bioRendered = await renderMarkdown(bio);
  const { error: settingsWriteError } = await supabase
    .from("site_settings")
    .update({
      display_name: "David Dallakyan",
      tagline:
        "Query engines, lakehouse metadata, and the boring parts of making scans cheap.",
      bio_md: bio,
      bio_html: bioRendered.html,
      social: {
        github: "daviddallakyan2005",
        twitter: "daviddallakyan",
        linkedin: "https://www.linkedin.com/in/daviddallakyan",
        email: "david@daviddallakyan.com",
      } as Json,
      seo_title: "David Dallakyan — data infrastructure notes",
      seo_description:
        "Staff-level notes on Trino, Iceberg, DuckDB, dbt, and the metadata layer that actually plans your scans.",
    })
    .eq("id", 1);
  if (settingsWriteError) queryError("update site_settings", settingsWriteError);
  console.log("  updated site_settings id=1 (original row snapshotted in manifest)");

  writeManifest(manifestPath, manifest);
  console.log("\nSeed complete.");
  console.log(`  posts: ${manifest.postIds.length}`);
  console.log(`  tags: ${manifest.tagIds.length}`);
  console.log(`  projects: ${manifest.projectIds.length}`);
  console.log(`  timeline: ${manifest.timelineIds.length}`);
  console.log(`  comments: ${manifest.commentIds.length}`);
  console.log(`  auth users: ${manifest.authUserIds.length}`);
  console.log(`  manifest: ${manifestPath}`);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
