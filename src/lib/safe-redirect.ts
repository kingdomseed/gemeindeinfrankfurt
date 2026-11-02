// Where to send a coordinator after the sign-in link. Only this site's
// coordinator pages are allowed; anything else, including tricks like
// "/\evil.example" that browsers read as another host, gets the fallback.
export function safeNext(next: string | null, origin: string): URL {
  const fallback = new URL("/de/coordinator", origin);
  const target = next === null ? null : URL.parse(next, origin);
  if (target?.origin !== origin) return fallback;
  return /^\/(de|en|ru)\/coordinator(\/|$)/.test(target.pathname) ? target : fallback;
}
