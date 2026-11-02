import { readFileSync } from "node:fs";

// Claude Code passes the hook event as JSON on stdin.
export function readHookInput(): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(0, "utf8"));
  return typeof parsed === "object" && parsed !== null ? { ...parsed } : {};
}
