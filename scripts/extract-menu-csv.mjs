// 기존 lib/menu-content.ts -> data/menu.csv 추출기 (1회용 마이그레이션)
// 사용법: node scripts/extract-menu-csv.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "data", "menu.csv");

// 기존 모듈을 그대로 import (런타임에는 타입 무시, 데이터만 사용)
const mod = await import(join(ROOT, "lib", "menu-content.ts"));
const groups = mod.PANGYO_MENU_GROUPS;

const header =
  "groupId,groupTitle,groupDescription,groupFallback,itemName,price,description,imageFile,imageFit,subsection";
const lines = [header];

for (const g of groups) {
  let first = true;
  for (const it of g.items) {
    const imageFile = it.imageSrc.replace("/images/wangjing/menu/", "");
    const row = [
      first ? g.id : "",
      first ? g.title : "",
      first ? g.description : "",
      first ? g.fallbackImageSrc : "",
      it.name,
      it.price,
      it.description,
      imageFile,
      it.imageFit || "cover",
      it.subsection || "",
    ];
    // CSV 이스케이프: 따옴표/쉼표 포함 시 큰따옴표로 감싸기
    const esc = (s) =>
      String(s).includes(",") || String(s).includes('"')
        ? '"' + String(s).replace(/"/g, '""') + '"'
        : String(s);
    lines.push(row.map(esc).join(","));
    first = false;
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(`✓ ${OUT} 생성 완료 (${lines.length - 1}개 메뉴)`);
