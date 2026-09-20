export {
  HOME_HASHES,
  HOME_LOCALES,
  LOCALIZED_LOCALES,
  LOCALE_CONFIG,
  buildLocaleHref,
  getHomePath,
  isLocale,
  isLocalizedLocale,
} from "./config";
export type { BranchId, HomeCopy, HomeNavItem, Locale, LocalizedLocale } from "./types";

import { enHomeCopy } from "./en";
import { jaHomeCopy } from "./ja";
import { koHomeCopy } from "./ko";
import type { HomeCopy, Locale } from "./types";
import { zhHomeCopy } from "./zh";

export const HOME_COPY = {
  ko: koHomeCopy,
  en: enHomeCopy,
  zh: zhHomeCopy,
  ja: jaHomeCopy,
} as const satisfies Record<Locale, HomeCopy>;

export const getHomeCopy = (locale: Locale): HomeCopy => HOME_COPY[locale];
