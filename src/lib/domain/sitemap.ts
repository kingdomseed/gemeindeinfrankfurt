// The public pages of the site for sitemap.xml: one entry per page and
// language, each listing the same page in every language so search engines
// show visitors the version in their own language.

export type SitemapPage = {
  isHome: boolean;
  // A page's slug in each language. A language without one uses the default language's slug.
  slugs: Partial<Record<string, string | undefined>>;
};

export type SitemapEntry = { url: string; languages: Record<string, string> };

export function sitemapEntries(
  siteUrl: string,
  locales: readonly string[],
  defaultLocale: string,
  pages: SitemapPage[],
  fixedPaths: readonly string[],
): SitemapEntry[] {
  const base = siteUrl.replace(/\/+$/, "");
  // The default language has no prefix: its home page is the bare domain.
  const prefix = (locale: string) => (locale === defaultLocale ? "" : `/${locale}`);
  const addresses: ((locale: string) => string)[] = [
    ...pages.map((page) => (locale: string) => {
      if (page.isHome) return `${base}${prefix(locale) || "/"}`;
      return `${base}${prefix(locale)}/${page.slugs[locale] ?? page.slugs[defaultLocale] ?? ""}`;
    }),
    ...fixedPaths.map((path) => (locale: string) => `${base}${prefix(locale)}/${path}`),
  ];
  return addresses.flatMap((address) => {
    const languages: Record<string, string> = { "x-default": address(defaultLocale) };
    for (const locale of locales) languages[locale] = address(locale);
    return locales.map((locale) => ({ url: address(locale), languages }));
  });
}
