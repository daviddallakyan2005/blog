import { cacheLife, cacheTag } from "next/cache";

import { renderCvPdf } from "@/lib/cv/markdown-to-pdf";

import { getSiteSettings } from "./settings";

export async function getCvPdf(): Promise<Buffer | null> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");

  const settings = await getSiteSettings();
  const md = settings?.cv_md?.trim() ?? "";
  if (!md) {
    return null;
  }

  return renderCvPdf(md);
}
