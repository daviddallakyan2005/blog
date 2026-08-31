import {
  createOgImage,
  ogContentType,
  ogSize,
} from "@/components/seo/og-image";
import { SITE_NAME } from "@/lib/seo/site";

export const alt = SITE_NAME;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return createOgImage({ title: SITE_NAME });
}
