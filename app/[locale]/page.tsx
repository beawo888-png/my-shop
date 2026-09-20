import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedHomepage } from "@/components/home/localized-homepage";
import { isLocalizedLocale, LOCALIZED_LOCALES } from "@/lib/home-i18n";
import { buildHomeMetadata } from "@/lib/home-metadata";

type LocalizedHomePageProps = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALIZED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalizedHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocalizedLocale(locale)) notFound();
  return buildHomeMetadata(locale);
}

export default async function LocalizedHomePage({ params }: LocalizedHomePageProps) {
  const { locale } = await params;
  if (!isLocalizedLocale(locale)) notFound();
  return <LocalizedHomepage locale={locale} />;
}
