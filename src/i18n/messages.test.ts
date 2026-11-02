import { describe, expect, it } from "vitest";

import de from "../../messages/de.json";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";

// Every language must have exactly the same message keys, so no page shows a
// raw key or falls back to another language.
function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("messages", () => {
  const english = keys(en).toSorted();
  it.each([
    ["de", de],
    ["ru", ru],
  ])("%s has the same keys as en", (_name, messages) => {
    expect(keys(messages).toSorted()).toEqual(english);
  });
});
