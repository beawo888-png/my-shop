import type { Locale, LocalizedLocale } from "./types";

export const HOME_LOCALES = ["ko", "en", "zh", "ja"] as const satisfies readonly Locale[];
export const LOCALIZED_LOCALES = ["en", "zh", "ja"] as const satisfies readonly LocalizedLocale[];
export const HOME_HASHES = [
  "#top", "#story", "#menu", "#location", "#group",
  "#reviews", "#faq", "#reservation",
] as const;

export const LOCALE_CONFIG = {
  ko: { label: "한국어", path: "/", htmlLang: "ko", hrefLang: "ko-KR", openGraphLocale: "ko_KR" },
  en: { label: "English", path: "/en", htmlLang: "en", hrefLang: "en", openGraphLocale: "en_US" },
  zh: { label: "简体中文", path: "/zh", htmlLang: "zh-CN", hrefLang: "zh-CN", openGraphLocale: "zh_CN" },
  ja: { label: "日本語", path: "/ja", htmlLang: "ja", hrefLang: "ja", openGraphLocale: "ja_JP" },
} as const satisfies Record<Locale, {
  label: string;
  path: string;
  htmlLang: string;
  hrefLang: string;
  openGraphLocale: string;
}>;

export const getHomePath = (locale: Locale) => LOCALE_CONFIG[locale].path;
export const isLocale = (value: string): value is Locale =>
  HOME_LOCALES.includes(value as Locale);
export const isLocalizedLocale = (value: string): value is LocalizedLocale =>
  LOCALIZED_LOCALES.includes(value as LocalizedLocale);
export function buildLocaleHref(locale: Locale, hash = "") {
  const safeHash = HOME_HASHES.includes(hash as (typeof HOME_HASHES)[number]) ? hash : "";
  return `${getHomePath(locale)}${safeHash}`;
}
