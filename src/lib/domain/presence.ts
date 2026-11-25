export type PresencePeer = {
  userId: string;
  name: string;
  path: string;
  section: string | null;
  editing: boolean;
};

function readPeer(entry: unknown): PresencePeer | null {
  if (typeof entry !== "object" || entry === null) return null;
  const userId = "userId" in entry && typeof entry.userId === "string" ? entry.userId : "";
  const name = "name" in entry && typeof entry.name === "string" ? entry.name : "";
  const path = "path" in entry && typeof entry.path === "string" ? entry.path : "";
  const section = "section" in entry && typeof entry.section === "string" ? entry.section : null;
  const editing = "editing" in entry && typeof entry.editing === "boolean" ? entry.editing : false;
  if (!userId || !name || !path) return null;
  return { userId, name, path, section, editing };
}

// Extracts other coordinators currently viewing `currentPath`, deduplicating
// multiple browser tabs per person (editing = true if any tab is editing).
export function peersOnPath(
  rawState: Record<string, readonly unknown[]>,
  selfUserId: string,
  currentPath: string,
): PresencePeer[] {
  const byUser = new Map<string, PresencePeer>();
  for (const entries of Object.values(rawState)) {
    for (const raw of entries) {
      const peer = readPeer(raw);
      if (!peer || peer.userId === selfUserId || peer.path !== currentPath) continue;
      const prev = byUser.get(peer.userId);
      byUser.set(peer.userId, {
        ...peer,
        editing: peer.editing || prev?.editing === true,
      });
    }
  }
  return [...byUser.values()].toSorted((a, b) => a.name.localeCompare(b.name, "de"));
}
