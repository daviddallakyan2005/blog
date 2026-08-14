import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
});

export const requireOwner = cache(async (): Promise<Profile> => {
  const profile = await getCurrentProfile();
  if (profile?.role === "owner") {
    return profile;
  }

  if (profile || (await getCurrentUser())) {
    redirect("/denied");
  }

  redirect("/login");
});
