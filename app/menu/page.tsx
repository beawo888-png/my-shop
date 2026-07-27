import type { Metadata } from "next";
import { CategoryMenuPage } from "@/components/menu/category-menu-page";

export const metadata: Metadata = {
  title: "전체 메뉴 | 왕징양다리양꼬치",
  description: "모란본점과 판교점에서 제공하는 왕징 메뉴 44개",
  alternates: { canonical: "/menu" },
};

export default function MenuIndexPage() {
  return <CategoryMenuPage />;
}
