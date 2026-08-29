/**
 * Remove the throwaway review seed from the target Supabase project.
 *
 *   pnpm dlx tsx --env-file=.env.production scripts/teardown-review.ts
 *
 * This package is not `"type": "module"`, so tsx emits CJS — do not use
 * top-level await. Pair with scripts/seed-review.ts.
 *
 * Timeline marker: sort_order >= 9000 (no slug column).
 * Posts/tags/projects: slug prefix `zzreview-`.
 * Never touches github_pull_requests. Every delete is id- or marker-scoped.
 */
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../src/lib/database.types";

const MANIFEST_REL = "content/drafts/review-seed-manifest.json";
const MARKER = "zzreview";
const TIMELINE_SORT_MIN = 9000;

type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

export type ReviewSeedManifest = {
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

type Db = SupabaseClient<Database>;

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
      `Missing ${name}. Run with:\n  pnpm dlx tsx --env-file=.env.production scripts/teardown-review.ts`,
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

function asStringIds(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    fail(`Manifest field ${field} must be an array of ids.`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.length === 0) {
      fail(`Manifest field ${field}[${index}] is not a non-empty string.`);
    }
    return item;
  });
}

function readManifest(path: string): ReviewSeedManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (err) {
    fail(`Could not parse manifest at ${path}.`, err);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("Manifest root must be an object.");
  }

  const row = parsed as Record<string, unknown>;
  if (!row.originalSiteSettings || typeof row.originalSiteSettings !== "object") {
    fail("Manifest is missing originalSiteSettings.");
  }

  return {
    seededAt: typeof row.seededAt === "string" ? row.seededAt : "",
    projectRef: typeof row.projectRef === "string" ? row.projectRef : "",
    originalSiteSettings: row.originalSiteSettings as SiteSettingsRow,
    postIds: asStringIds(row.postIds, "postIds"),
    tagIds: asStringIds(row.tagIds, "tagIds"),
    projectIds: asStringIds(row.projectIds, "projectIds"),
    timelineIds: asStringIds(row.timelineIds, "timelineIds"),
    commentIds: asStringIds(row.commentIds, "commentIds"),
    authUserIds: asStringIds(row.authUserIds, "authUserIds"),
  };
}

async function deleteByColumn(
  supabase: Db,
  table: "comments" | "posts" | "tags" | "projects" | "timeline_entries",
  column: "id",
  ids: string[],
): Promise<number> {
  if (ids.length === 0) {
    console.log(`  skip ${table}: no ids in manifest`);
    return 0;
  }

  const { data, error } = await supabase
    .from(table)
    .delete()
    .in(column, ids)
    .select("id");

  if (error) {
    queryError(`delete ${table} by ${column}`, error);
  }

  const count = data?.length ?? 0;
  console.log(`  deleted ${count} ${table} row(s) by ${column}`);
  return count;
}

async function deletePostTags(
  supabase: Db,
  postIds: string[],
  tagIds: string[],
): Promise<number> {
  let total = 0;

  if (postIds.length > 0) {
    const { data, error } = await supabase
      .from("post_tags")
      .delete()
      .in("post_id", postIds)
      .select("post_id, tag_id");
    if (error) queryError("delete post_tags by post_id", error);
    total += data?.length ?? 0;
  }

  if (tagIds.length > 0) {
    const { data, error } = await supabase
      .from("post_tags")
      .delete()
      .in("tag_id", tagIds)
      .select("post_id, tag_id");
    if (error) queryError("delete post_tags by tag_id", error);
    total += data?.length ?? 0;
  }

  if (postIds.length === 0 && tagIds.length === 0) {
    console.log("  skip post_tags: no ids in manifest");
    return 0;
  }

  console.log(`  deleted ${total} post_tags row(s)`);
  return total;
}

async function deleteRevisions(supabase: Db, postIds: string[]): Promise<number> {
  if (postIds.length === 0) {
    console.log("  skip post_revisions: no post ids in manifest");
    return 0;
  }

  const { data, error } = await supabase
    .from("post_revisions")
    .delete()
    .in("post_id", postIds)
    .select("id");

  if (error) queryError("delete post_revisions by post_id", error);
  const count = data?.length ?? 0;
  console.log(`  deleted ${count} post_revisions row(s)`);
  return count;
}

async function deleteAuthUsers(supabase: Db, ids: string[]): Promise<number> {
  if (ids.length === 0) {
    console.log("  skip auth users: no ids in manifest");
    return 0;
  }

  let deleted = 0;
  for (const id of ids) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      const alreadyGone =
        /not found|user not found/i.test(error.message) || error.status === 404;
      if (alreadyGone) {
        console.log(`  auth user ${id} already gone`);
        continue;
      }
      fail(`Failed to delete auth user ${id}: ${error.message}`, error);
    }
    deleted += 1;
    console.log(`  deleted auth user ${id}`);
  }
  return deleted;
}

async function sweepSlugTable(
  supabase: Db,
  table: "posts" | "tags" | "projects",
): Promise<string[]> {
  const { data, error } = await supabase
    .from(table)
    .select("id, slug")
    .like("slug", `${MARKER}-%`);

  if (error) queryError(`marker sweep select ${table}`, error);
  const rows = data ?? [];
  if (rows.length === 0) {
    console.log(`  sweep ${table}: none`);
    return [];
  }

  const ids = rows.map((row) => row.id);
  console.log(
    `  sweep ${table}: ${rows.length} orphan(s): ${rows.map((row) => row.slug).join(", ")}`,
  );

  const { error: delError } = await supabase.from(table).delete().in("id", ids);
  if (delError) queryError(`marker sweep delete ${table}`, delError);
  return ids;
}

async function sweepTimeline(supabase: Db): Promise<string[]> {
  const { data, error } = await supabase
    .from("timeline_entries")
    .select("id, title, sort_order")
    .gte("sort_order", TIMELINE_SORT_MIN);

  if (error) queryError("marker sweep select timeline_entries", error);
  const rows = data ?? [];
  if (rows.length === 0) {
    console.log("  sweep timeline_entries: none");
    return [];
  }

  const ids = rows.map((row) => row.id);
  console.log(
    `  sweep timeline_entries: ${rows.length} orphan(s) sort_order>=${TIMELINE_SORT_MIN}: ${rows
      .map((row) => `${row.title} (${row.sort_order})`)
      .join("; ")}`,
  );

  const { error: delError } = await supabase
    .from("timeline_entries")
    .delete()
    .in("id", ids);
  if (delError) queryError("marker sweep delete timeline_entries", delError);
  return ids;
}

async function sweepAuthUsers(supabase: Db): Promise<string[]> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    fail(`marker sweep listUsers failed: ${error.message}`, error);
  }

  const orphans = (data.users ?? []).filter((user) => {
    const email = user.email ?? "";
    const userName =
      typeof user.user_metadata?.user_name === "string"
        ? user.user_metadata.user_name
        : "";
    return email.includes(MARKER) || userName.includes(MARKER);
  });

  if (orphans.length === 0) {
    console.log("  sweep auth users: none");
    return [];
  }

  const ids: string[] = [];
  for (const user of orphans) {
    console.log(`  sweep auth user: ${user.email ?? user.id}`);
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      fail(`Failed to sweep auth user ${user.id}: ${delError.message}`, delError);
    }
    ids.push(user.id);
  }
  return ids;
}

async function countRows(
  supabase: Db,
  table:
    | "posts"
    | "tags"
    | "projects"
    | "timeline_entries"
    | "comments"
    | "profiles"
    | "github_pull_requests",
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) queryError(`count ${table}`, error);
  return count ?? 0;
}

async function main(): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const projectRef =
    process.env.SUPABASE_PROJECT_ID ??
    new URL(url).hostname.split(".")[0] ??
    "unknown";

  const manifestPath = resolve(process.cwd(), MANIFEST_REL);
  if (!existsSync(manifestPath)) {
    fail(
      `Manifest not found at ${manifestPath}.\n` +
        `Refusing to tear down without it (no unqualified deletes).\n` +
        `If you already ran teardown, there is nothing to do — seed writes this file, teardown deletes it.`,
    );
  }

  const manifest = readManifest(manifestPath);
  console.log(`Teardown review seed`);
  console.log(`  target: ${projectRef}`);
  console.log(`  seeded at: ${manifest.seededAt || "(missing)"}`);
  console.log(`  manifest project: ${manifest.projectRef || "(missing)"}`);
  if (manifest.projectRef && manifest.projectRef !== projectRef) {
    fail(
      `Manifest project ref ${manifest.projectRef} does not match current target ${projectRef}. Aborting.`,
    );
  }

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("\n[1] Delete by exact manifest ids (FK-safe order)");
  await deleteByColumn(supabase, "comments", "id", manifest.commentIds);
  await deletePostTags(supabase, manifest.postIds, manifest.tagIds);
  await deleteRevisions(supabase, manifest.postIds);
  await deleteByColumn(supabase, "posts", "id", manifest.postIds);
  await deleteByColumn(supabase, "tags", "id", manifest.tagIds);
  await deleteByColumn(supabase, "projects", "id", manifest.projectIds);
  await deleteByColumn(supabase, "timeline_entries", "id", manifest.timelineIds);
  await deleteAuthUsers(supabase, manifest.authUserIds);

  console.log("\n[2] Restore site_settings id=1 from snapshot");
  const snapshot = manifest.originalSiteSettings;
  const { error: restoreError } = await supabase
    .from("site_settings")
    .update({
      display_name: snapshot.display_name,
      tagline: snapshot.tagline,
      bio_md: snapshot.bio_md,
      bio_html: snapshot.bio_html,
      avatar_path: snapshot.avatar_path,
      social: snapshot.social as Json,
      seo_title: snapshot.seo_title,
      seo_description: snapshot.seo_description,
    })
    .eq("id", 1);
  if (restoreError) queryError("restore site_settings", restoreError);
  console.log("  restored site_settings id=1");

  console.log(`\n[3] Marker sweep (${MARKER} / sort_order>=${TIMELINE_SORT_MIN})`);
  const sweptPosts = await sweepSlugTable(supabase, "posts");
  const sweptTags = await sweepSlugTable(supabase, "tags");
  const sweptProjects = await sweepSlugTable(supabase, "projects");
  const sweptTimeline = await sweepTimeline(supabase);
  const sweptUsers = await sweepAuthUsers(supabase);
  const sweptCount =
    sweptPosts.length +
    sweptTags.length +
    sweptProjects.length +
    sweptTimeline.length +
    sweptUsers.length;
  if (sweptCount === 0) {
    console.log("  no orphans found");
  } else {
    console.log(`  removed ${sweptCount} orphan row(s)/user(s)`);
  }

  console.log("\n[4] Verification");
  const posts = await countRows(supabase, "posts");
  const tags = await countRows(supabase, "tags");
  const projects = await countRows(supabase, "projects");
  const timeline = await countRows(supabase, "timeline_entries");
  const comments = await countRows(supabase, "comments");
  const profiles = await countRows(supabase, "profiles");
  const prs = await countRows(supabase, "github_pull_requests");

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (usersError) {
    fail(`listUsers for verification failed: ${usersError.message}`, usersError);
  }
  const authUsers = usersPage.users?.length ?? 0;

  const { data: settings, error: settingsError } = await supabase
    .from("site_settings")
    .select(
      "id, display_name, tagline, bio_md, bio_html, avatar_path, social, seo_title, seo_description",
    )
    .eq("id", 1)
    .maybeSingle();
  if (settingsError) queryError("select site_settings", settingsError);

  console.log(`  posts: ${posts}`);
  console.log(`  tags: ${tags}`);
  console.log(`  projects: ${projects}`);
  console.log(`  timeline_entries: ${timeline}`);
  console.log(`  comments: ${comments}`);
  console.log(`  profiles: ${profiles}`);
  console.log(`  auth users: ${authUsers}`);
  console.log(`  github_pull_requests: ${prs} (untouched)`);
  console.log(`  site_settings: ${JSON.stringify(settings)}`);

  const contentLeftovers = posts + tags + projects + timeline + comments;
  if (contentLeftovers !== 0) {
    fail(
      `Expected content tables to be empty after teardown; leftover rows: posts=${posts} tags=${tags} projects=${projects} timeline=${timeline} comments=${comments}`,
    );
  }

  unlinkSync(manifestPath);
  console.log(`\nRemoved manifest ${manifestPath}`);
  console.log("Teardown complete.");
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
