"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateSettings } from "@/lib/actions/settings";
import type { SiteSocial } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SettingsFormValues = {
  display_name: string | null;
  tagline: string | null;
  bio_md: string | null;
  seo_title: string | null;
  seo_description: string | null;
  social: SiteSocial;
};

export function SettingsForm({ settings }: { settings: SettingsFormValues }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(settings.display_name ?? "");
  const [tagline, setTagline] = useState(settings.tagline ?? "");
  const [bioMd, setBioMd] = useState(settings.bio_md ?? "");
  const [seoTitle, setSeoTitle] = useState(settings.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    settings.seo_description ?? "",
  );
  const [github, setGithub] = useState(settings.social.github ?? "");
  const [twitter, setTwitter] = useState(settings.social.twitter ?? "");
  const [linkedin, setLinkedin] = useState(settings.social.linkedin ?? "");
  const [email, setEmail] = useState(settings.social.email ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await updateSettings({
      display_name: displayName,
      tagline,
      bio_md: bioMd,
      seo_title: seoTitle,
      seo_description: seoDescription,
      social: { github, twitter, linkedin, email },
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="settings-name">Display name</Label>
        <Input
          id="settings-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="settings-tagline">Tagline</Label>
        <Input
          id="settings-tagline"
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="settings-bio">Bio (markdown)</Label>
        <Textarea
          id="settings-bio"
          value={bioMd}
          onChange={(event) => setBioMd(event.target.value)}
          className="min-h-40 font-mono text-[13px]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="settings-github">GitHub</Label>
          <Input
            id="settings-github"
            value={github}
            onChange={(event) => setGithub(event.target.value)}
            placeholder="username or URL"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="settings-twitter">Twitter / X</Label>
          <Input
            id="settings-twitter"
            value={twitter}
            onChange={(event) => setTwitter(event.target.value)}
            placeholder="handle or URL"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="settings-linkedin">LinkedIn</Label>
          <Input
            id="settings-linkedin"
            value={linkedin}
            onChange={(event) => setLinkedin(event.target.value)}
            placeholder="username or URL"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            id="settings-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="settings-seo-title">SEO title</Label>
        <Input
          id="settings-seo-title"
          value={seoTitle}
          onChange={(event) => setSeoTitle(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="settings-seo-description">SEO description</Label>
        <Textarea
          id="settings-seo-description"
          value={seoDescription}
          onChange={(event) => setSeoDescription(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
