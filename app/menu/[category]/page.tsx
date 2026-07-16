import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryMenuPage } from "@/components/menu/category-menu-page";
import {
  PANGYO_MENU_GROUP_IDS,
  getPangyoMenuGroup,
} from "@/lib/menu-content";

const siteUrl = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

type MenuCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return PANGYO_MENU_GROUP_IDS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: MenuCategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const group = getPangyoMenuGroup(category);

  if (!group) return {};

  const canonical = `${siteUrl}/menu/${group.id}`;

  return {
    title: `${group.title} | 판교 왕징양다리양꼬치`,
    description: group.description,
    alternates: { canonical },
    openGraph: {
      title: `${group.title} | 판교 왕징양다리양꼬치`,
      description: group.description,
      url: canonical,
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default async function MenuCategoryPage({
  params,
}: MenuCategoryPageProps) {
  const { category } = await params;
  const group = getPangyoMenuGroup(category);

  if (!group) notFound();

  return <CategoryMenuPage group={group} />;
}
