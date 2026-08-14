#!/usr/bin/env bash
set -euo pipefail

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

supabase gen types typescript --local > "$tmp"
grep -q "export type Database" "$tmp"

mv "$tmp" src/lib/database.types.ts
trap - EXIT
