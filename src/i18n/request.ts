import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : "en";

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
