"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";

const POLL_MS = 4000;
const versionPayload = z.object({ version: z.string() });

// Keeps an account-free shared screen fresh while visible by polling a tiny
// content-version endpoint and calling router.refresh() only when data changes.
export function LiveScreenSync(props: { token: string; messageNumber: number; version: string }) {
  const { token, messageNumber, version } = props;
  const router = useRouter();

  useEffect(() => {
    const ac = new AbortController();
    let checking = false;

    async function checkForUpdate() {
      if (ac.signal.aborted || checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const res = await fetch(`/api/screen/${encodeURIComponent(token)}/${messageNumber}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) return;
        const parsed = versionPayload.safeParse(await res.json());
        if (parsed.success && parsed.data.version !== version) {
          router.refresh();
        }
      } catch {
        // Ignore transient offline errors or aborted polls; next tick retries.
      } finally {
        checking = false;
      }
    }

    const timer = setInterval(() => {
      void checkForUpdate();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ac.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, token, messageNumber, version]);

  return null;
}
