import { cacheLife, cacheTag } from "next/cache";

import { renderCvPdf } from "@/lib/cv/markdown-to-pdf";
import { encodeCvPdfForCache } from "@/lib/cv/pdf-cache";

import { getSiteSettings } from "./settings";

export async function getCvPdf(): Promise<string | null> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");

  const settings = await getSiteSettings();
  const md = settings?.cv_md?.trim() ?? "";
  if (!md) {
    return null;
  }

  return encodeCvPdfForCache(await renderCvPdf(md));
}
