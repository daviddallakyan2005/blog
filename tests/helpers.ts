import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvTest() {
  const filePath = resolve(process.cwd(), ".env.test");
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvTest();

const REQUIRED = [
  "TEST_SUPABASE_URL",
  "TEST_SUPABASE_ANON_KEY",
  "TEST_SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function hasTestEnv(): boolean {
  return REQUIRED.every((key) => Boolean(process.env[key]));
}

function requireTestEnv() {
  if (!hasTestEnv()) {
    throw new Error(
      "Missing TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, or TEST_SUPABASE_SERVICE_ROLE_KEY",
    );
  }
}

export function anonClient(): SupabaseClient<Database> {
  requireTestEnv();
  return createClient<Database>(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function adminClient(): SupabaseClient<Database> {
  requireTestEnv();
  return createClient<Database>(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
