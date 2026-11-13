import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-redirect";

const origin = "https://training.example";

describe("safeNext", () => {
  it.each([
    "/de/training/coordinator",
    "/ru/training/coordinator/",
    "/en/training/coordinator/groups?x=1",
  ])("allows %s", (next) => {
    expect(safeNext(next, origin).href).toBe(new URL(next, origin).href);
  });

  it.each([
    null,
    "",
    "https://evil.example/de/training/coordinator",
    "//evil.example/de/training/coordinator",
    "/\\evil.example/de/training/coordinator",
    "/de/training/register",
    "/de/coordinator",
    "/de/training/coordinatorx",
    "javascript:alert(1)",
  ])("falls back for %s", (next) => {
    expect(safeNext(next, origin).href).toBe(`${origin}/de/training/coordinator`);
  });
});
