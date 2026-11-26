import { describe, expect, it } from "vitest";

import {
  hymnsFingerprint,
  initialListSync,
  listSyncReducer,
  scheduleFingerprint,
  versesFingerprint,
} from "./list-sync";
import type { Hymn, Verse } from "./messages";

describe("fingerprints", () => {
  it("normalizes empty/whitespace differences in hymns and verses", () => {
    const a: Hymn[] = [{ en: " 501 ", de: "", ru: null }];
    const b: Hymn[] = [{ en: "501", de: null, ru: null }];
    expect(hymnsFingerprint(a)).toBe(hymnsFingerprint(b));

    const va: Verse[] = [{ ref: " Rom. 8:1 ", text: { en: "There is now", de: "" } }];
    const vb: Verse[] = [{ ref: "Rom. 8:1", text: { en: "There is now" } }];
    expect(versesFingerprint(va)).toBe(versesFingerprint(vb));

    const lf: Verse[] = [{ ref: "Eph. 3:16", text: { en: "Line one\nLine two" } }];
    const crlf: Verse[] = [{ ref: "Eph. 3:16", text: { en: "Line one\r\nLine two" } }];
    expect(versesFingerprint(lf)).toBe(versesFingerprint(crlf));
  });

  it("changes scheduleFingerprint when is_online toggles", () => {
    const onlineSession = {
      id: "s1",
      starts_at: "2027-01-12T18:00:00Z",
      ends_at: "2027-01-12T20:00:00Z",
      is_tested: false,
      is_online: true,
    };
    expect(scheduleFingerprint([onlineSession])).not.toBe(
      scheduleFingerprint([{ ...onlineSession, is_online: false }]),
    );
  });
});

describe("listSyncReducer", () => {
  const initial: Hymn[] = [{ en: "501", de: "214", ru: null }];
  const remote: Hymn[] = [
    { en: "501", de: "214", ru: null },
    { en: "300", de: null, ru: null },
  ];

  it("adopts server updates automatically while clean", () => {
    const s0 = initialListSync(initial, hymnsFingerprint(initial));
    const s1 = listSyncReducer(s0, {
      type: "server_updated",
      items: remote,
      version: hymnsFingerprint(remote),
    });
    expect(s1.items).toEqual(remote);
    expect(s1.status).toBe("remote_updated");
  });

  it("preserves local edits on remote collision and lets user accept or keep", () => {
    let s = initialListSync(initial, hymnsFingerprint(initial));
    const mine: Hymn[] = [{ en: "888", de: null, ru: null }];
    s = listSyncReducer(s, { type: "edit", items: mine });
    s = listSyncReducer(s, {
      type: "server_updated",
      items: remote,
      version: hymnsFingerprint(remote),
    });
    expect(s.status).toBe("conflict");
    expect(s.items).toEqual(mine);

    const accepted = listSyncReducer(s, { type: "accept_server" });
    expect(accepted.items).toEqual(remote);
    expect(accepted.status).toBe("clean");

    const kept = listSyncReducer(s, { type: "keep_local" });
    expect(kept.items).toEqual(mine);
    expect(kept.baseVersion).toBe(hymnsFingerprint(remote));
    expect(kept.status).toBe("dirty");
  });
});
