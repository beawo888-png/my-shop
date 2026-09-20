import { LocalizedHomepage } from "@/components/home/localized-homepage";
import { buildHomeMetadata } from "@/lib/home-metadata";

export const metadata = buildHomeMetadata("ko");

export default function Home() {
  return <LocalizedHomepage locale="ko" />;
}
