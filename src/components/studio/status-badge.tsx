import { Badge } from "@/components/ui/badge";
import type { PostStatus } from "@/lib/validations/posts.schema";

const LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized: PostStatus =
    status === "published" || status === "archived" ? status : "draft";

  return (
    <Badge
      variant={
        normalized === "published"
          ? "default"
          : normalized === "archived"
            ? "outline"
            : "secondary"
      }
    >
      {LABEL[normalized]}
    </Badge>
  );
}
