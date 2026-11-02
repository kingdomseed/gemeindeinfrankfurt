import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

// The site's locales, for features such as the language switcher.
export { locales, type Locale } from "./routing";
