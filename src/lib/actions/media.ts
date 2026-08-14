"use server";

import { z } from "zod";

import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/validations/posts.schema";

const registerMediaAssetSchema = z.object({
  path: z.string().trim().min(1, "Path is required").max(2000),
  alt: z.string().max(500).optional().nullable(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  byte_size: z.number().int().nonnegative().optional(),
});

export type RegisterMediaAssetInput = z.infer<typeof registerMediaAssetSchema>;

export async function registerMediaAsset(input: RegisterMediaAssetInput) {
  await requireOwner();

  const parsed = registerMediaAssetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      path: parsed.data.path,
      alt: parsed.data.alt ?? null,
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      byte_size: parsed.data.byte_size ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false as const,
      error: error?.message ?? "Could not register media",
    };
  }

  return { success: true as const, id: data.id };
}
