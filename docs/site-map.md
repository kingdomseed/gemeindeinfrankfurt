# Site map

Every page exists in German (default), English and Russian under `/de`, `/en` and `/ru`.
`/sitemap.xml` lists the pages marked "yes" in all three languages, with each
language version linked to the others, and `/robots.txt` keeps the rest out of
search engines. Pages added in the CMS join the sitemap on their own.

| Page               | Address (de · en · ru)                                            | In the sitemap |
| ------------------ | ----------------------------------------------------------------- | -------------- |
| Home (Über uns)    | `/de` · `/en` · `/ru`                                             | Yes            |
| Für Besucher       | `/de/fur-besucher` · `/en/for-visitors` · `/ru/dlya-posetiteley`  | Yes            |
| Unser Glaube       | `/de/unser-glaube` · `/en/our-belief` · `/ru/nasha-vera`          | Yes            |
| Video training     | `/[locale]/training`                                              | Yes            |
| Registration form  | `/[locale]/training/register`                                     | Yes            |
| Privacy notice     | `/[locale]/privacy`                                               | Yes            |
| Impressum          | `/[locale]/impressum`                                             | Yes            |
| Training calendar  | `/[locale]/training/calendar.ics`                                 | No             |
| Personal edit link | `/[locale]/training/r/[token]`                                    | No, blocked    |
| Coordinator area   | `/[locale]/training/coordinator`, `/login`, `/registrations/[id]` | No, blocked    |
| CMS admin and API  | `/admin`, `/api`                                                  | No, blocked    |

The CMS page slugs above are the seeded ones (`src/cms/seed/index.ts`); editors can change them in `/admin`.
