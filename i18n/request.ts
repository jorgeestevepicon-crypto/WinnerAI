import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, DEFAULT_LOCALE, isSupportedLocale } from "@/i18n/config";

// Not using next-intl's path-based routing ([locale] segments) — every URL
// stays exactly as it is (/dashboard, /winning-products, ...), and the
// language is purely a per-browser display preference read from a cookie,
// the same way next-themes already handles the light/dark preference.
export default getRequestConfig(async () => {
  const stored = cookies().get(LOCALE_COOKIE)?.value;
  const locale = isSupportedLocale(stored) ? stored : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
