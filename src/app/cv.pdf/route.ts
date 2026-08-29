import { connection } from "next/server";

import { decodeCvPdfFromCache } from "@/lib/cv/pdf-cache";
import { getCvPdf } from "@/lib/data/cv";

export async function GET() {
  await connection();

  const encoded = await getCvPdf();
  if (!encoded) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(decodeCvPdfFromCache(encoded), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="David-Dallakyan-CV.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
