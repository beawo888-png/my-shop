/**
 * 키워드 분석 결과를 바탕화면 엑셀 한 파일로 만든다.
 *   요약            지점별 30일 합계, 판정별 개수, 검색 많이 되는 키워드 TOP 10
 *   <지점> 키워드    넣어 둔 키워드 전부 (광고비 많은 순)
 *   <지점> 새 후보   아직 안 넣은, 동네 + 왕징 관련 연관 검색어 (집중 메뉴 먼저, 검색수 많은 순)
 *   <지점> 광고그룹  캠페인·광고그룹별 성과 (플레이스처럼 키워드가 없는 광고도 여기서 본다)
 */

import path from "node:path";

import { desktopDir } from "../smartplace/bookings.mjs";

export const REPORT_FILE = "왕징 검색광고 키워드 분석.xlsx";
export const reportPath = () => path.join(desktopDir(), REPORT_FILE);

export const VERDICT_ORDER = ["잘 되는 키워드", "보통", "클릭률 낮음", "비싼 키워드", "검색 거의 없음", "노출 안 됨", "꺼져 있음"];
const VERDICT_FILL = {
  "잘 되는 키워드": "FFDFF3E7",
  "비싼 키워드": "FFFBE0DC",
  "클릭률 낮음": "FFFDF0D5",
  "노출 안 됨": "FFEDEDED",
  "검색 거의 없음": "FFEDEDED",
  "꺼져 있음": "FFEDEDED",
};

const searchText = (s) => (s.text ? s.text : s.total);

export function countVerdicts(rows) {
  const counts = Object.fromEntries(VERDICT_ORDER.map((v) => [v, 0]));
  for (const row of rows) counts[row.verdict] = (counts[row.verdict] ?? 0) + 1;
  return counts;
}

/** 넣어 둔 키워드 중 월간 검색수 많은 순 TOP n */
export function topSearched(rows, n = 10) {
  return [...rows].filter((r) => r.searches.found).sort((a, b) => b.searches.total - a.searches.total).slice(0, n);
}

function header(sheet, columns) {
  sheet.columns = columns;
  const row = sheet.getRow(1);
  row.font = { bold: true };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5EBE1" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

/**
 * @param {Array<{name: string, range: {since: string, until: string}, analysis: object, groups: object[], candidates: object[], warnings: string[]}>} branches
 */
export async function writeKeywordReport(filePath, branches) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const summary = workbook.addWorksheet("요약");
  summary.columns = [{ width: 26 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
  summary.addRow(["왕징 검색광고 키워드 분석"]).font = { bold: true, size: 14 };
  summary.addRow([`만든 날: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}  ·  광고 설정은 아무것도 바꾸지 않았습니다.`]);
  for (const branch of branches) {
    const { analysis, groups } = branch;
    const groupCost = groups.reduce((sum, g) => sum + g.cost, 0);
    summary.addRow([]);
    summary.addRow([`${branch.name}  (${branch.range.since} ~ ${branch.range.until})`]).font = { bold: true, size: 12 };
    summary.addRow(["전체 광고비(광고그룹 합계)", `${groupCost.toLocaleString()}원`]);
    summary.addRow(["키워드 광고비", `${analysis.baseline.totalCost.toLocaleString()}원`]);
    summary.addRow(["키워드 클릭", analysis.totalClicks]);
    summary.addRow(["키워드 평균 클릭당 비용", `${analysis.baseline.avgCpc.toLocaleString()}원`]);
    summary.addRow(["키워드 평균 클릭률", `${analysis.baseline.avgCtr.toFixed(2)}%`]);
    summary.addRow(["넣어 둔 키워드 수", analysis.rows.length]);
    for (const [verdict, count] of Object.entries(countVerdicts(analysis.rows))) {
      if (count) summary.addRow([`  ${verdict}`, `${count}개`]);
    }
    summary.addRow(["새 키워드 후보", `${branch.candidates.length}개 ('${branch.name} 새 후보' 시트)`]);
    summary.addRow([]);
    const top = summary.addRow(["검색 많이 되는 키워드 TOP 10", "월 검색수", "30일 클릭", "30일 광고비", "판정"]);
    top.font = { bold: true };
    for (const row of topSearched(analysis.rows)) {
      summary.addRow([row.keyword, searchText(row.searches), row.clicks, `${row.cost.toLocaleString()}원`, row.verdict]);
    }
    for (const warning of branch.warnings) summary.addRow([`⚠ ${warning}`]);
  }

  for (const branch of branches) {
    const short = branch.name.replace(/(본)?점$/, "");

    const sheet = workbook.addWorksheet(`${short} 키워드`);
    header(sheet, [
      { header: "키워드", key: "keyword", width: 22 },
      { header: "판정", key: "verdict", width: 14 },
      { header: "이유", key: "reason", width: 44 },
      { header: "집중 메뉴", key: "focus", width: 10 },
      { header: "월 검색수(PC+모바일)", key: "searches", width: 14 },
      { header: "모바일 검색수", key: "mobile", width: 12 },
      { header: "경쟁 정도", key: "competition", width: 10 },
      { header: "30일 노출", key: "impressions", width: 11 },
      { header: "30일 클릭", key: "clicks", width: 10 },
      { header: "클릭률(%)", key: "ctr", width: 10 },
      { header: "30일 광고비(원)", key: "cost", width: 14 },
      { header: "클릭당 비용(원)", key: "cpc", width: 13 },
      { header: "평균 순위", key: "avgRank", width: 9 },
      { header: "입찰가(원)", key: "bid", width: 10 },
      { header: "상태", key: "status", width: 10 },
      { header: "광고 종류", key: "campaignType", width: 11 },
      { header: "캠페인", key: "campaign", width: 18 },
      { header: "광고그룹", key: "adgroup", width: 18 },
    ]);
    for (const row of branch.analysis.rows) {
      const added = sheet.addRow({
        ...row,
        searches: searchText(row.searches),
        mobile: row.searches.mobile,
        ctr: Number(row.ctr.toFixed(2)),
        avgRank: row.avgRank ? Number(row.avgRank.toFixed(1)) : "",
      });
      const fill = VERDICT_FILL[row.verdict];
      if (fill) added.getCell("verdict").fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      for (const key of ["cost", "cpc", "bid", "impressions", "searches", "mobile"]) added.getCell(key).numFmt = "#,##0";
    }
    sheet.autoFilter = { from: "A1", to: "R1" };

    const candidates = workbook.addWorksheet(`${short} 새 후보`);
    header(candidates, [
      { header: "새 키워드 후보", key: "keyword", width: 24 },
      { header: "집중 메뉴", key: "focus", width: 10 },
      { header: "월 검색수(PC+모바일)", key: "searches", width: 14 },
      { header: "모바일 검색수", key: "mobile", width: 12 },
      { header: "PC 검색수", key: "pc", width: 10 },
      { header: "경쟁 정도", key: "competition", width: 10 },
      { header: "광고 노출 평균 개수", key: "avgDepth", width: 14 },
    ]);
    for (const row of branch.candidates) {
      const added = candidates.addRow({ ...row, searches: row.searches.total, mobile: row.searches.mobile, pc: row.searches.pc });
      for (const key of ["searches", "mobile", "pc"]) added.getCell(key).numFmt = "#,##0";
    }
    candidates.autoFilter = { from: "A1", to: "G1" };

    const groups = workbook.addWorksheet(`${short} 광고그룹`);
    header(groups, [
      { header: "광고 종류", key: "campaignType", width: 11 },
      { header: "캠페인", key: "campaign", width: 20 },
      { header: "캠페인 상태", key: "campaignStatus", width: 11 },
      { header: "캠페인 하루 예산(원)", key: "campaignBudget", width: 15 },
      { header: "광고그룹", key: "adgroup", width: 22 },
      { header: "그룹 상태", key: "status", width: 10 },
      { header: "그룹 입찰가(원)", key: "bid", width: 12 },
      { header: "그룹 하루 예산(원)", key: "groupBudget", width: 14 },
      { header: "30일 노출", key: "impressions", width: 11 },
      { header: "30일 클릭", key: "clicks", width: 10 },
      { header: "클릭률(%)", key: "ctr", width: 10 },
      { header: "30일 광고비(원)", key: "cost", width: 14 },
      { header: "클릭당 비용(원)", key: "cpc", width: 13 },
    ]);
    for (const row of branch.groups) {
      const added = groups.addRow({ ...row, ctr: Number(row.ctr.toFixed(2)), campaignBudget: row.campaignBudget || "제한 없음", groupBudget: row.groupBudget || "제한 없음" });
      for (const key of ["cost", "cpc", "bid", "impressions", "campaignBudget", "groupBudget"]) added.getCell(key).numFmt = "#,##0";
    }
    groups.autoFilter = { from: "A1", to: "M1" };
  }

  await workbook.xlsx.writeFile(filePath);
}
