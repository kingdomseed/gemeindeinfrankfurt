"use client";

import createCache, { type EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

type Registry = {
  cache: EmotionCache;
  flush: () => string[];
};

// Collects the CSS Emotion generates while the server renders and writes it
// into the streamed HTML, so server and client markup match on hydration.
function createServerRegistry(): Registry {
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

let clientRegistry: Registry | undefined;

// Reuse one Emotion cache and Emotion-owned clones of SSR <style> tags on the
// client so remounting [locale]/layout.tsx across DE/EN/RU navigation never
// drops hydrated styles or inserts @layer reset after @layer recipes.
function getClientRegistry(): Registry {
  if (clientRegistry) return clientRegistry;

  for (const node of document.querySelectorAll('style[data-emotion^="css "]')) {
    const attr = node.getAttribute("data-emotion");
    if (!attr) continue;
    const clone = document.createElement("style");
    clone.setAttribute("data-emotion", attr);
    clone.textContent = node.textContent;
    document.head.appendChild(clone);
    node.removeAttribute("data-emotion");
    if (node instanceof HTMLStyleElement && node.sheet) {
      node.sheet.disabled = true;
    }
  }

  const cache = createCache({ key: "css" });
  cache.compat = true;
  clientRegistry = { cache, flush: () => [] };
  return clientRegistry;
}

function getRegistry(): Registry {
  return typeof document === "undefined" ? createServerRegistry() : getClientRegistry();
}

export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(getRegistry);

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    const styles = names
      .map((name) => {
        const value = cache.inserted[name];
        return typeof value === "string" ? value : "";
      })
      .join("");
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
