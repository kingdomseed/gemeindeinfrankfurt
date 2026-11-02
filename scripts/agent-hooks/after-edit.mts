// Claude Code PostToolUse hook: formats and lints each file right after the
// agent edits it. Exit code 2 sends the lint output back to the agent so it
// fixes the problem before moving on.
import { spawnSync } from "node:child_process";
import { extname, relative } from "node:path";

import { readHookInput } from "./hook-input.mts";

const toolInput = readHookInput()["tool_input"];
const filePath =
  typeof toolInput === "object" && toolInput !== null && "file_path" in toolInput
    ? toolInput.file_path
    : undefined;
if (typeof filePath !== "string") process.exit(0);

const root = process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();
const file = relative(root, filePath);
if (file.startsWith("..") || file.startsWith(".agents/") || file.startsWith("node_modules/")) {
  process.exit(0);
}

const run = (args: string[]) =>
  spawnSync("npx", args, { cwd: root, encoding: "utf8", shell: process.platform === "win32" });

const ext = extname(file);
const formattable = [
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".jsonc",
  ".md",
  ".css",
  ".yml",
  ".yaml",
];
if (formattable.includes(ext)) run(["oxfmt", "--no-error-on-unmatched-pattern", file]);

if ([".ts", ".tsx", ".js", ".mjs"].includes(ext)) {
  const lint = run(["oxlint", "--deny-warnings", "--format", "agent", file]);
  if (lint.status !== 0) {
    process.stderr.write(
      `oxlint found problems in ${file}. Fix the code; do not disable the rule.\n${lint.stdout}${lint.stderr}`,
    );
    process.exit(2);
  }
}
