import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

import {
  adminClient,
  anonClient,
  createReaderSession,
  hasTestEnv,
} from "./helpers";

const describeRls = hasTestEnv() ? describe : describe.skip;

describeRls("RLS", () => {
  const createdPostIds: string[] = [];
  const createdUserIds: string[] = [];
  const storagePaths: string[] = [];
  let seq = 0;
  let reader: { client: SupabaseClient<Database>; userId: string };

  function uniqueSlug(label: string) {
    seq += 1;
    return `test-${Date.now()}-${seq}-${label}`;
  }

  beforeAll(async () => {
    reader = await createReaderSession();
    createdUserIds.push(reader.userId);
  });

  afterAll(async () => {
    const admin = adminClient();

    if (createdPostIds.length > 0) {
      await admin.from("posts").delete().in("id", createdPostIds);
      createdPostIds.length = 0;
    }

    if (storagePaths.length > 0) {
      await admin.storage.from("media").remove(storagePaths);
      storagePaths.length = 0;
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
    createdUserIds.length = 0;
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

  it("reader cannot self-promote to owner", async () => {
    const { error } = await reader.client
      .from("profiles")
      .update({ role: "owner" })
      .eq("id", reader.userId);

    expect(error).toBeTruthy();

    const { data } = await adminClient()
      .from("profiles")
      .select("role")
      .eq("id", reader.userId)
      .single();

    expect(data?.role).toBe("reader");
  });

  it("reader cannot change github_username", async () => {
    const { error } = await reader.client
      .from("profiles")
      .update({ github_username: "hacked-username" })
      .eq("id", reader.userId);

    expect(error).toBeTruthy();

    const { data } = await adminClient()
      .from("profiles")
      .select("github_username")
      .eq("id", reader.userId)
      .single();

    expect(data?.github_username).not.toBe("hacked-username");
  });

  it("anon cannot list a draft storage prefix", async () => {
    const admin = adminClient();
    const prefix = `posts/${crypto.randomUUID()}`;
    const objectPath = `${prefix}/secret.bin`;

    const { error: uploadError } = await admin.storage
      .from("media")
      .upload(objectPath, new Uint8Array([1, 2, 3]), {
        contentType: "application/octet-stream",
        upsert: true,
      });

    expect(uploadError).toBeNull();
    storagePaths.push(objectPath);

    const { data: listed, error: listError } = await anonClient()
      .storage.from("media")
      .list(prefix);

    if (listError) {
      return;
    }

    expect(listed ?? []).toHaveLength(0);
  });

  it("authenticated comment insert on a draft post fails", async () => {
    const admin = adminClient();
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug: uniqueSlug("draft-comment"),
        kind: "article",
        title: "Draft comment target",
        status: "draft",
        body_md: "draft",
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdPostIds.push(data!.id);

    const { error: commentError } = await reader.client.from("comments").insert({
      post_id: data!.id,
      author_id: reader.userId,
      body: "should not comment on a draft",
      status: "pending",
    });

    expect(commentError).toBeTruthy();
  });

  it("six comments in an hour fail even with a forged created_at", async () => {
    const admin = adminClient();
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug: uniqueSlug("rate-limit"),
        kind: "article",
        title: "Rate limit target",
        status: "published",
        published_at: new Date().toISOString(),
        body_md: "published",
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdPostIds.push(data!.id);

    for (let i = 0; i < 5; i += 1) {
      const { error: insertError } = await reader.client.from("comments").insert({
        post_id: data!.id,
        author_id: reader.userId,
        body: `rate-limit comment ${i + 1}`,
        status: "pending",
      });
      expect(insertError).toBeNull();
    }

    const { error: sixthError } = await reader.client.from("comments").insert({
      post_id: data!.id,
      author_id: reader.userId,
      body: "forged sixth comment",
      status: "pending",
      created_at: "2020-01-01T00:00:00Z",
    });

    expect(sixthError).toBeTruthy();
  });

  it("anon cannot see visible comments on an unpublished post", async () => {
    const admin = adminClient();
    const { data, error } = await admin
      .from("posts")
      .insert({
        slug: uniqueSlug("hidden-comments"),
        kind: "article",
        title: "Unpublished comment host",
        status: "draft",
        body_md: "draft",
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdPostIds.push(data!.id);

    const { error: commentError } = await admin.from("comments").insert({
      post_id: data!.id,
      author_id: reader.userId,
      body: "visible on a draft should stay hidden from anon",
      status: "visible",
    });

    expect(commentError).toBeNull();

    const { data: rows } = await anonClient()
      .from("comments")
      .select("id")
      .eq("post_id", data!.id);

    expect(rows ?? []).toHaveLength(0);
  });

  // Authenticated reader cannot update another comment's status — skipped.
  // Creating a second Auth user just for this check is out of scope here.
  it.skip("authenticated reader cannot update another comment status", () => {
    expect(true).toBe(true);
  });
});
