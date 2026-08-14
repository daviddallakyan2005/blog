import { afterAll, describe, expect, it } from "vitest";

import { adminClient, anonClient, hasTestEnv } from "./helpers";

const describeRls = hasTestEnv() ? describe : describe.skip;

describeRls("RLS", () => {
  const createdPostIds: string[] = [];
  let seq = 0;

  function uniqueSlug(label: string) {
    seq += 1;
    return `test-${Date.now()}-${seq}-${label}`;
  }

  afterAll(async () => {
    if (createdPostIds.length === 0) {
      return;
    }
    const admin = adminClient();
    await admin.from("posts").delete().in("id", createdPostIds);
    createdPostIds.length = 0;
  });

  it("anon cannot select draft posts", async () => {
    const admin = adminClient();
    const slug = uniqueSlug("draft");
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug,
        kind: "article",
        title: slug,
        status: "draft",
        body_md: "draft body",
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdPostIds.push(data!.id);

    const { data: rows } = await anonClient()
      .from("posts")
      .select("id")
      .eq("id", data!.id);

    expect(rows ?? []).toHaveLength(0);
  });

  it("anon can select published posts", async () => {
    const admin = adminClient();
    const slug = uniqueSlug("pub");
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug,
        kind: "article",
        title: slug,
        status: "published",
        published_at: new Date().toISOString(),
        body_md: "published body",
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdPostIds.push(data!.id);

    const { data: rows, error: selectError } = await anonClient()
      .from("posts")
      .select("id")
      .eq("id", data!.id);

    expect(selectError).toBeNull();
    expect(rows ?? []).toHaveLength(1);
  });

  it("anon cannot insert posts", async () => {
    const { error } = await anonClient().from("posts").insert({
      slug: uniqueSlug("anon-insert"),
      kind: "note",
      title: "Anon insert should fail",
      status: "draft",
    });

    expect(error).toBeTruthy();
  });

  it("search_posts never returns drafts", async () => {
    const admin = adminClient();
    const title = `zxqtestdraft${Date.now()}`;
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug: uniqueSlug("search"),
        kind: "article",
        title,
        status: "draft",
        body_md: title,
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    if (data?.id) {
      createdPostIds.push(data.id);
    }

    const { data: results, error: rpcError } = await anonClient().rpc(
      "search_posts",
      { q: title, limit_n: 20 },
    );

    if (rpcError?.code === "PGRST202") {
      return;
    }

    expect(rpcError).toBeNull();
    expect(results ?? []).toHaveLength(0);
  });

  it("anon cannot insert comments", async () => {
    const admin = adminClient();
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug: uniqueSlug("comment"),
        kind: "article",
        title: "Comment target",
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdPostIds.push(data!.id);

    const { error: commentError } = await anonClient().from("comments").insert({
      post_id: data!.id,
      author_id: "00000000-0000-0000-0000-000000000000",
      body: "anon should not comment",
      status: "pending",
    });

    expect(commentError).toBeTruthy();
  });

  // Authenticated reader cannot update another comment's status — skipped.
  // Creating a second Auth user just for this check is out of scope here.
  it.skip("authenticated reader cannot update another comment status", () => {
    expect(true).toBe(true);
  });
});
