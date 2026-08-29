/**
 * `'use cache'` and Next prerender workers structured-clone values.
 * Node Buffers from react-pdf sit on pooled, non-detachable ArrayBuffers.
 */
export function encodeCvPdfForCache(pdf: Buffer): string {
  return Buffer.from(pdf).toString("base64");
}

export function decodeCvPdfFromCache(encoded: string): Uint8Array<ArrayBuffer> {
  const node = Buffer.from(encoded, "base64");
  const copy = new ArrayBuffer(node.byteLength);
  const bytes = new Uint8Array(copy);
  bytes.set(node);
  return bytes;
}
