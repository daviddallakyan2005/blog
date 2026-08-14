import Image from "next/image";

import { publicMediaUrl } from "@/lib/media";

export function CoverImage({
  path,
  alt,
}: {
  path: string | null | undefined;
  alt: string;
}) {
  const src = publicMediaUrl(path);
  if (!src) {
    return null;
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        sizes="(min-width: 768px) 68ch, 100vw"
        priority
      />
    </div>
  );
}
