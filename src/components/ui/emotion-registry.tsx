"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

// Collects the CSS Emotion generates while the server renders and writes it
// into the streamed HTML, so server and client markup match on hydration.
// This is the setup Chakra's Next.js App Router guide gives for streaming.
function createRegistry() {
  const cache = createCache({ key: "css" });
  cache.compat = true;
  const insert = cache.insert;
  let inserted: string[] = [];
  cache.insert = (...args) => {
    const serialized = args[1];
    if (cache.inserted[serialized.name] === undefined) inserted.push(serialized.name);
    return insert(...args);
  };
  const flush = () => {
    const names = inserted;
    inserted = [];
    return names;
  };
  return { cache, flush };
}

export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(createRegistry);

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    const styles = names.map((name) => cache.inserted[name]).join("");
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        // oxlint-disable-next-line react/no-danger -- CSS that Emotion generated from our own theme, not user input
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
