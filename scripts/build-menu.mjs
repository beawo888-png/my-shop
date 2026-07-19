// CSV -> lib/menu-content.ts 자동 생성기
// 사용법: node scripts/build-menu.mjs
// CSV 형식(data/menu.csv):
//   groupId,groupTitle,groupDescription,groupFallback,itemName,price,description,imageFile,imageFit,subsection
//   - 첫 줄은 헤더(무시)
//   - group* 컬럼은 그룹의 첫 번째 아이템 행에만 채움. 이후 행은 비워도 됨(이전 그룹 유지)
//   - 값에 쉼표가 들어가면 큰따옴표로 감싸야 함 (예: "90,000원")

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "data", "menu.csv");
const OUT_PATH = join(ROOT, "lib", "menu-content.ts");

// 견고한 CSV 파서: 인용된 필드 내 쉼표/줄바꿈 보존, 빈 필드(,,)도 보존
function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        fields.push(field);
        field = "";
      } else {
        field += c;
      }
    }
  }
  fields.push(field);
  return fields;
}

function parseCsvFile(path) {
  const raw = readFileSync(path, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("CSV가 비어있습니다.");
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name) => header.indexOf(name);
  const iGroupId = idx("groupId");
  const iGroupTitle = idx("groupTitle");
  const iGroupDesc = idx("groupDescription");
  const iGroupFallback = idx("groupFallback");
  const iItemName = idx("itemName");
  const iPrice = idx("price");
  const iDesc = idx("description");
  const iImage = idx("imageFile");
  const iFit = idx("imageFit");
  const iSub = idx("subsection");

  const groups = [];
  let current = null;
  for (let r = 1; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    const get = (i) => (i >= 0 && row[i] != null ? row[i].trim() : "");
    const gId = get(iGroupId);
    if (gId) {
      current = {
        id: gId,
        title: get(iGroupTitle),
        description: get(iGroupDesc),
        fallbackImageSrc: get(iGroupFallback),
        items: [],
      };
      groups.push(current);
    }
    if (!current) continue;
    const name = get(iItemName);
    if (!name) continue;
    current.items.push({
      name,
      price: get(iPrice),
      description: get(iDesc),
      imageFile: get(iImage),
      imageFit: get(iFit) || "cover",
      subsection: get(iSub) || "",
    });
  }
  return groups;
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildTs(groups, sourceUrl, checkedAt, count) {
  const groupIdType = groups.map((g) => `"${g.id}"`).join("\n    | ");
  const groupBlocks = groups
    .map((g) => {
      const items = g.items
        .map((it) => {
          const fit = it.imageFit === "contain" ? ', "contain"' : "";
          const sub = it.subsection ? `, "${it.subsection}"` : "";
          return `      menuItem("${esc(it.name)}", "${esc(it.price)}", "${esc(
            it.description,
          )}", "${esc(it.imageFile)}"${fit}${sub}),`;
        })
        .join("\n");
      return `  {\n    id: "${g.id}",\n    title: "${esc(g.title)}",\n    description: "${esc(
        g.description,
      )}",\n    fallbackImageSrc: "${esc(g.fallbackImageSrc)}",\n    items: [\n${items}\n    ],\n  },`;
    })
    .join("\n");

  return `export type MenuImageFit = "cover" | "contain";
export type MenuSubsection = "highball";

export type FullMenuItem = {
  name: string;
  price: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFit: MenuImageFit;
  subsection?: MenuSubsection;
};

export type FullMenuGroup = {
  id:
    | ${groupIdType};
  title: string;
  description: string;
  fallbackImageSrc: string;
  items: FullMenuItem[];
};

const menuItem = (
  name: string,
  price: string,
  description: string,
  imageFile: string,
  imageFit: MenuImageFit = "cover",
  subsection?: MenuSubsection,
): FullMenuItem => ({
  name,
  price,
  description,
  imageSrc: \`/images/wangjing/menu/\${imageFile}\`,
  imageAlt: \`\${name} 메뉴 사진\`,
  imageFit,
  subsection,
});

export const PANGYO_MENU_SOURCE_URL =
  "${sourceUrl}";
export const PANGYO_MENU_CHECKED_AT = "${checkedAt}";
export const PANGYO_MENU_COUNT = ${count};

export const PANGYO_MENU_GROUPS: FullMenuGroup[] = [
${groupBlocks}
];

export type PangyoMenuGroupId = FullMenuGroup["id"];

export const PANGYO_MENU_GROUP_IDS = PANGYO_MENU_GROUPS.map(
  (group) => group.id,
) satisfies PangyoMenuGroupId[];

export function getPangyoMenuGroup(id: string) {
  return PANGYO_MENU_GROUPS.find((group) => group.id === id);
}
`;
}

const groups = parseCsvFile(CSV_PATH);
if (groups.length === 0) throw new Error("그룹이 하나도 파싱되지 않았습니다.");

// 기존 소스에서 메타 정보 유지
const existing = readFileSync(OUT_PATH, "utf8");
const mUrl = existing.match(/PANGYO_MENU_SOURCE_URL\s*=\s*"([^"]+)"/);
const mChecked = existing.match(/PANGYO_MENU_CHECKED_AT\s*=\s*"([^"]+)"/);
const sourceUrl = mUrl ? mUrl[1] : "";
const checkedAt = mChecked ? mChecked[1] : "";
const count = groups.reduce((n, g) => n + g.items.length, 0);

const ts = buildTs(groups, sourceUrl, checkedAt, count);
writeFileSync(OUT_PATH, ts.replace(/\n/g, "\r\n"), "utf8");
console.log(
  `✓ menu-content.ts 생성 완료: 그룹 ${groups.length}개, 메뉴 ${count}개`,
);
