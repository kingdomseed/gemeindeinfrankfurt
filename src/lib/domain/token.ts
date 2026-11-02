import { createHash, randomBytes } from "node:crypto";

// The raw token only ever lives in the registrant's email link.
// The database stores its SHA-256 hash.
export function newEditToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
