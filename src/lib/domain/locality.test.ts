import { describe, expect, it } from "vitest";

import { displayLocality, resolveLocalityInput, sortLocalities } from "./locality";
import type { LocalityOption } from "./types";

const frankfurt: LocalityOption = { id: "loc-ffm", name: "Frankfurt am Main", is_home: true };
const mannheim: LocalityOption = { id: "loc-ma", name: "Mannheim", is_home: false };
const saarbruecken: LocalityOption = { id: "loc-sb", name: "Saarbrücken", is_home: false };
const localities = [saarbruecken, mannheim, frankfurt];

describe("sortLocalities", () => {
  it("puts the home locality first and sorts the rest in German order", () => {
    expect(sortLocalities(localities).map((l) => l.name)).toEqual([
      "Frankfurt am Main",
      "Mannheim",
      "Saarbrücken",
    ]);
  });
});

describe("displayLocality", () => {
  it("prefers the linked locality name and falls back to trimmed other_locality", () => {
    expect(displayLocality({ localities: { name: "Mannheim" }, other_locality: "" })).toBe(
      "Mannheim",
    );
    expect(displayLocality({ localities: null, other_locality: "  Mainz  " })).toBe("Mainz");
    expect(displayLocality({ localities: null, other_locality: "   " })).toBeNull();
  });
});

describe("resolveLocalityInput", () => {
  it("accepts a valid curated locality id and clears other_locality", () => {
    expect(resolveLocalityInput(mannheim.id, "", localities)).toEqual({
      locality_id: mannheim.id,
      other_locality: "",
    });
  });

  it("rejects an id belonging to another training", () => {
    expect(resolveLocalityInput("loc-foreign", "", localities)).toBeNull();
  });

  it("stores a new custom city under other_locality", () => {
    expect(resolveLocalityInput(null, "  Mainz  ", localities)).toEqual({
      locality_id: null,
      other_locality: "Mainz",
    });
  });

  it("matches a typed existing city case-insensitively back to its curated row", () => {
    expect(resolveLocalityInput(null, " mannheim ", localities)).toEqual({
      locality_id: mannheim.id,
      other_locality: "",
    });
  });

  it("rejects empty or whitespace-only other_locality", () => {
    expect(resolveLocalityInput(null, "   ", localities)).toBeNull();
  });
});
