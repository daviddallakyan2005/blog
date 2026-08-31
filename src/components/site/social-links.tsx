import type { ReactNode } from "react";

import type { SiteSocial } from "@/lib/data/types";

const LABELS: Record<keyof SiteSocial, string> = {
  github: "GitHub",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  email: "Email",
};

const ORDER: (keyof SiteSocial)[] = [
  "github",
  "twitter",
  "linkedin",
  "email",
];

function socialHref(kind: keyof SiteSocial, value: string): string {
  if (kind === "email") {
    return value.startsWith("mailto:") ? value : `mailto:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const handle = value.replace(/^@/, "");
  if (kind === "github") {
    return `https://github.com/${handle}`;
  }
  if (kind === "twitter") {
    return `https://x.com/${handle}`;
  }
  return `https://www.linkedin.com/in/${handle}`;
}

export function SocialLinks({
  social,
  trailing,
}: {
  social: SiteSocial;
  trailing?: ReactNode;
}) {
  const links = ORDER.flatMap((kind) => {
    const value = social[kind]?.trim();
    if (!value) {
      return [];
    }
    return [{ kind, href: socialHref(kind, value), label: LABELS[kind] }];
  });

  if (links.length === 0 && !trailing) {
    return null;
  }

  return (
    <ul className="mt-6 flex flex-wrap gap-4 text-sm">
      {links.map((link) => (
        <li key={link.kind}>
          <a
            href={link.href}
            target={link.kind === "email" ? undefined : "_blank"}
            rel={link.kind === "email" ? undefined : "noreferrer"}
            className="text-accent underline-offset-4 hover:underline"
          >
            {link.label}
          </a>
        </li>
      ))}
      {trailing}
    </ul>
  );
}
