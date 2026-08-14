import { defaultSchema, type Options as Schema } from "rehype-sanitize";

const defaultAttrs = defaultSchema.attributes ?? {};
const globalAttrs = defaultAttrs["*"] ?? [];

const mathMlTags = [
  "annotation",
  "annotation-xml",
  "math",
  "menclose",
  "merror",
  "mfrac",
  "mi",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mprescripts",
  "mroot",
  "mrow",
  "ms",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "semantics",
] as const;

/**
 * Extends GitHub-style sanitation so Shiki, KaTeX, GFM tables, heading ids,
 * and fenced-code `data-language` survive the pipeline. Sanitize runs after
 * pretty-code and KaTeX, so the allowlist must cover their output.
 */
export const sanitizeSchema: Schema = {
  ...defaultSchema,
  // Keep rehype-slug / github-slugger ids so TOC hrefs match heading ids.
  clobberPrefix: "",
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "figure",
    "figcaption",
    "svg",
    "path",
    "line",
    "use",
    ...mathMlTags,
  ],
  attributes: {
    ...defaultAttrs,
    "*": [...globalAttrs, "className", "style", "data*", "ariaHidden", "xmlns"],
    a: [...(defaultAttrs.a ?? []), "ariaHidden"],
    code: [...(defaultAttrs.code ?? []), "className"],
    pre: [...(defaultAttrs.pre ?? []), "className"],
    span: [...(defaultAttrs.span ?? []), "className", "style"],
    div: [...(defaultAttrs.div ?? []), "className", "style"],
    figure: [...(defaultAttrs.figure ?? []), "className"],
    figcaption: [...(defaultAttrs.figcaption ?? []), "className"],
    math: [...(defaultAttrs.math ?? []), "xmlns", "display"],
    annotation: [...(defaultAttrs.annotation ?? []), "encoding"],
    svg: [
      ...(defaultAttrs.svg ?? []),
      "viewBox",
      "preserveAspectRatio",
      "width",
      "height",
      "fill",
      "stroke",
      "focusable",
      "role",
    ],
    path: [...(defaultAttrs.path ?? []), "d", "fill", "stroke", "strokeWidth"],
    line: [
      ...(defaultAttrs.line ?? []),
      "x1",
      "x2",
      "y1",
      "y2",
      "stroke",
      "strokeWidth",
    ],
    use: [...(defaultAttrs.use ?? []), "href", "xlinkHref"],
  },
};
