import { describe, expect, it } from "vitest";

import { peersOnPath } from "./presence";

describe("peersOnPath", () => {
  it("excludes self and other routes, deduplicates tabs, and combines editing flags", () => {
    const raw = {
      self: [{ userId: "u1", name: "Jason", path: "/training/coordinator/report", editing: true }],
      max1: [
        { userId: "u2", name: "Max", path: "/training/coordinator/report", editing: false },
        { userId: "u2", name: "Max", path: "/training/coordinator/report", editing: true },
      ],
      anna: [{ userId: "u3", name: "Anna", path: "/training/coordinator/outlines", editing: true }],
      invalid: [{ foo: "bar" }],
    };

    expect(peersOnPath(raw, "u1", "/training/coordinator/report")).toEqual([
      {
        userId: "u2",
        name: "Max",
        path: "/training/coordinator/report",
        section: null,
        editing: true,
      },
    ]);
  });
});
