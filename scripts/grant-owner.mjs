#!/usr/bin/env node
/**
 * Grant the owner role to an existing profile.
 *
 *   node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
 *   node --env-file=.env scripts/grant-owner.mjs <github_username_or_uuid>
 *   node scripts/grant-owner.mjs <github_username_or_uuid>
 *
 * The profile row is created on first GitHub sign-in. Run this after that.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return false;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  return true;
}

function loadEnv() {
  const root = process.cwd();
  const localEnv = resolve(root, ".env.local");
  if (existsSync(localEnv)) {
    loadEnvFile(localEnv);
    return;
  }
  loadEnvFile(resolve(root, ".env"));
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing ${name}. Set it in .env.local (or .env) and retry:\n` +
        `  node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>`,
    );
    process.exit(1);
  }
  return value;
}

loadEnv();

const identifier = process.argv[2];
if (!identifier) {
  console.error(
    "Usage: node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>",
  );
  process.exit(1);
}

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const isUuid = UUID_RE.test(identifier);
const query = supabase.from("profiles").update({ role: "owner" });
const filtered = isUuid
  ? query.eq("id", identifier)
  : query.eq("github_username", identifier);

const { data, error } = await filtered.select("id, github_username, role");

if (error) {
  console.error(`Failed to grant owner: ${error.message}`);
  process.exit(1);
}

if (!data?.length) {
  const hint = isUuid
    ? `No profile with id ${identifier}. Sign in with GitHub first so a profile row is created.`
    : `No profile with github_username "${identifier}". Sign in with GitHub first so a profile row is created.`;
  console.error(hint);
  process.exit(1);
}

for (const row of data) {
  console.log(`Granted owner to ${row.github_username ?? row.id} (${row.id}).`);
}
