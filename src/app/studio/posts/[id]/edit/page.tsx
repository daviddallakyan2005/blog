import { notFound } from "next/navigation";

import { PostEditor } from "@/components/studio/post-editor";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { publishPostSchema } from "@/lib/validations/posts.schema";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireOwner();
  const { id } = await params;

  if (!publishPostSchema.safeParse({ id }).success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  const { data: rows } = await supabase
    .from("post_tags")
    .select("tags(slug, name)")
    .eq("post_id", id);

  const tags = (rows ?? []).flatMap((row) => {
    const tag = row.tags;
    if (!tag) {
      return [];
    }
    return Array.isArray(tag) ? tag : [tag];
  });

  return (
    <main className="space-y-6">
      <h1 className="sr-only">Edit {post.title}</h1>
      <PostEditor post={post} tags={tags} />
    </main>
  );
}
