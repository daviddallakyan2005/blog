import { getCvPdf } from "@/lib/data/cv";

export async function GET() {
  const buffer = await getCvPdf();
  if (!buffer) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="David-Dallakyan-CV.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
