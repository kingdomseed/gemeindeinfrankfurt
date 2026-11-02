import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-redirect";

const origin = "https://training.example";

describe("safeNext", () => {
  it.each(["/de/coordinator", "/ru/coordinator/", "/en/coordinator/groups?x=1"])(
    "allows %s",
    (next) => {
      expect(safeNext(next, origin).href).toBe(new URL(next, origin).href);
    },
  );

  it.each([
    null,
    "",
    "https://evil.example/de/coordinator",
    "//evil.example/de/coordinator",
    "/\\evil.example/de/coordinator",
    "/de/register",
    "/de/coordinatorx",
    "javascript:alert(1)",
  ])("falls back for %s", (next) => {
    expect(safeNext(next, origin).href).toBe(`${origin}/de/coordinator`);
  });
});
