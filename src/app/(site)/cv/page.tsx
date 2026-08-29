import type { Metadata } from "next";

import { RenderedHtml } from "@/components/prose/rendered-html";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "CV",
  description: "Curriculum vitae.",
};

export default async function CvPage() {
  const settings = await getSiteSettings();
  const cvHtml = settings?.cv_html?.trim() ?? "";

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">CV</h1>
      {cvHtml ? (
        <>
          <div className="mt-6">
            <RenderedHtml html={cvHtml} />
          </div>
          <div className="mt-10">
            <Button asChild>
              <a href="/cv.pdf" download>
                Download PDF
              </a>
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-10 text-muted-foreground">No CV published yet.</p>
      )}
    </div>
  );
}
