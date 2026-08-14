"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await createProject({ name });
    if (!result.success) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    router.push(`/studio/projects/${result.id}/edit`);
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <div className="grid gap-2">
        <Label htmlFor="new-project-name">Name</Label>
        <Input
          id="new-project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoFocus
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={pending || name.trim() === ""}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
