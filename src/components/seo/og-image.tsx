import { ImageResponse } from "next/og";

import { formatPostDate } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo/site";

export const ogSize = {
  width: 1200,
  height: 630,
};

export const ogContentType = "image/png";

export function createOgImage({
  title,
  date,
}: {
  title: string;
  date?: string | null;
}) {
  const formatted = formatPostDate(date);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#faf6ef",
        color: "#3a3228",
        padding: "72px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 72,
          height: 6,
          backgroundColor: "#2d5a9e",
          borderRadius: 999,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          fontSize: 24,
          color: "#7a6f64",
        }}
      >
        <span>{SITE_NAME}</span>
        {formatted ? <span>{formatted}</span> : null}
      </div>
    </div>,
    ogSize,
  );
}
