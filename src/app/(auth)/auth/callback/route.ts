import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

function isStudioPath(path: string): boolean {
  return path === "/studio" || path.startsWith("/studio/");
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next") ?? "/studio", origin);

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "owner") {
    return NextResponse.redirect(new URL(next, origin));
  }

  if (isStudioPath(next)) {
    return NextResponse.redirect(new URL("/denied", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
