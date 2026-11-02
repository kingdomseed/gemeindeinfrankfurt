// Claude Code Stop hook: before the agent reports that it is done, run the
// type check, linter, tests and React Doctor. Exit code 2 keeps the agent working with the
// failures in front of it. If it is already continuing because of this hook
// (stop_hook_active), let it stop so an unfixable error cannot loop forever.
import { spawnSync } from "node:child_process";

import { readHookInput } from "./hook-input.mts";

if (readHookInput()["stop_hook_active"] === true) process.exit(0);

const root = process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();
const run = (cmd: string, args: string[]) =>
  spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: process.platform === "win32" });

if (run("git", ["status", "--porcelain"]).stdout.trim() === "") process.exit(0);

const steps: [string, string[]][] = [
  ["npm", ["run", "--silent", "typecheck"]],
  ["npx", ["oxlint", "--deny-warnings", "--format", "agent"]],
  ["npm", ["run", "--silent", "test"]],
  [
    "npx",
    [
      "react-doctor",
      "--no-telemetry",
      "--yes",
      "--blocking",
      "warning",
      "--scope",
      "changed",
      "--include-untracked",
      ".",
    ],
  ],
];
for (const [cmd, args] of steps) {
  const r = run(cmd, args);
  if (r.status !== 0) {
    process.stderr.write(
      `\`${cmd} ${args.join(" ")}\` failed. Fix the cause before finishing; do not weaken types, rules or tests.\n${r.stdout.slice(-6000)}${r.stderr.slice(-2000)}`,
    );
    process.exit(2);
  }
}
