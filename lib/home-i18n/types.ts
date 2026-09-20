import type { FaqEntry } from "@/lib/faq-content";

export type Locale = "ko" | "en" | "zh" | "ja";
export type LocalizedLocale = Exclude<Locale, "ko">;
export type BranchId = "moran" | "pangyo";
export type HomeNavItem = {
  label: string;
  href: "#story" | "/menu" | "#location" | "#group" | "#faq";
  newTab?: boolean;
};
export type PromiseCopy = {
  number: string;
  title: string;
  description: string;
  points: readonly string[];
};
export type BranchCopy = {
  shortName: string;
  name: string;
  imageAlt: string;
  transit: string;
  parking: string;
  groupTitle: string;
  groupOccasions: string;
  groupMenu: string;
  groupImageAlt: string;
  recommendationTitle: string;
  recommendation: string;
};
export type HomeCopy = {
  metadata: { title: string; description: string; ogDescription: string };
  header: {
    homeAria: string;
    desktopNavAria: string;
    mobileNavAria: string;
    openMenuAria: string;
    closeMenuAria: string;
    languageMenuAria: string;
    languageGroupLabel: string;
    bookingGroupLabel: string;
    bookingLabels: Record<BranchId, string>;
    nav: readonly HomeNavItem[];
  };
  hero: { eyebrow: string; titleLine1: string; titleLine2: string; leadLine1: string; leadLine2: string; imageAlt: string };
  signature: { eyebrow: string; title: string; description: string; allMenu: string; videoLabels: readonly [string, string, string, string] };
  story: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    imageAlt: string;
    paragraphs: readonly string[];
    closingLead: string;
    closingStrong: string;
    closingTail: string;
    promiseEyebrow: string;
    promiseTitle: string;
    promiseDescription: string;
    promises: readonly [PromiseCopy, PromiseCopy, PromiseCopy, PromiseCopy];
    promiseLine: string;
  };
  group: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    occasionsAria: string;
    occasions: readonly { label: string; icon: string }[];
    detailLabels: readonly [string, string, string, string];
    reserveLabel: string;
    directionsLabel: string;
    principle: string;
    featureAria: string;
    features: readonly { value: string; detail: string; icon: string }[];
  };
  reviews: { eyebrow: string; title: string; description: string; action: string };
  locations: {
    eyebrow: string;
    cardEyebrow: string;
    title: string;
    description: string;
    jumpAria: string;
    placeAria: string;
    labels: { address: string; transit: string; phone: string; parking: string };
    naverDirections: string;
    googleDirections: string;
    naverDirectionsAria: string;
    googleDirectionsAria: string;
  };
  branches: Record<BranchId, BranchCopy>;
  faq: { eyebrow: string; title: string; items: readonly FaqEntry[] };
  reservation: { eyebrow: string; title: string; description: string; naver: string; phone: string; imageAlt: string };
  mobileBooking: { aria: string; linkAria: string; label: string };
  footer: {
    brandName: string;
    tagline: string;
    channelAria: string;
    newWindowAria: string;
    navAria: string;
    navTitle: string;
    menu: string;
    group: string;
    reservation: string;
    legal: string;
    socialLabels: Record<"instagram" | "youtube" | "kakao" | "tiktok", string>;
  };
  structuredData: {
    description: Record<BranchId, string>;
    addressLocality: string;
    addressRegion: string;
    cuisines: readonly string[];
  };
};
