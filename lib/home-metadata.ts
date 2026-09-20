import type { Metadata } from "next";
import { getHomeCopy, getHomePath, LOCALE_CONFIG, type Locale } from "@/lib/home-i18n";

const languages = {
  "ko-KR": "/",
  en: "/en",
  "zh-CN": "/zh",
  ja: "/ja",
  "x-default": "/",
} as const;

export function buildHomeMetadata(locale: Locale): Metadata {
  const copy = getHomeCopy(locale);
  const path = getHomePath(locale);

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: { canonical: path, languages },
    openGraph: {
      title: copy.metadata.title,
      description: copy.metadata.ogDescription,
      locale: LOCALE_CONFIG[locale].openGraphLocale,
      type: "website",
      url: path,
    },
  };
}
