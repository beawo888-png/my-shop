import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("dashboard requires a verified admin session before loading visits", async () => {
  const page = await read("app/admin/ai-visits/page.tsx");
  assert.match(page, /requireAdminSession/);
  assert.match(page, /visitRepository\.listSince/);
  assert.ok(
    page.indexOf("await requireAdminSession()") <
      page.indexOf("await visitRepository.listSince"),
  );
  assert.match(page, /dynamic\s*=\s*["']force-dynamic["']/);
});

test("dashboard renders required KPIs, table, explanations, empty state and logout", async () => {
  const page = await read("app/admin/ai-visits/page.tsx");
  for (const label of [
    "AI 어시스턴트별 방문",
    "전체 AI/크롤러 방문 수",
    "검색 인덱싱 방문 수",
    "학습 방문 수",
    "실시간 인용 방문 수",
    "봇 이름",
    "회사",
    "목적",
    "방문 수",
    "최근 방문 시간",
    "가장 많이 본 페이지",
    "변화",
    "아직 기록된 AI 어시스턴트 방문이 없습니다.",
  ]) {
    assert.ok(page.includes(label), `missing dashboard label: ${label}`);
  }
  assert.match(page, /검색 결과나 AI 검색 결과에 보여줄 후보 페이지를 찾는 방문/);
  assert.match(page, /모델 학습·지식 수집 목적의 방문/);
  assert.match(page, /사용자가 AI에게 질문했을 때 답변·출처 확인을 위해 들어오는 방문/);
  assert.match(page, /action="\/api\/admin\/logout"/);
});

test("login page posts only to the admin login endpoint", async () => {
  const page = await read("app/admin/login/page.tsx");
  assert.match(page, /action="\/api\/admin\/login"/);
  assert.match(page, /type="password"/);
  assert.match(page, /왕징 운영자 로그인/);
});

test("admin cookie is strict, scoped to admin and valid for twelve hours", async () => {
  const route = await read("app/api/admin/login/route.ts");
  assert.match(route, /sameSite:\s*["']strict["']/);
  assert.match(route, /path:\s*["']\/admin["']/);
  assert.match(route, /maxAge:\s*12\s*\*\s*60\s*\*\s*60/);
});

test("Pencil file contains desktop and mobile admin source frames", async () => {
  const sketch = JSON.parse(await read("초안"));
  const names = new Set(sketch.children.map((child: { name?: string }) => child.name));
  for (const name of [
    "관리자 로그인 데스크톱",
    "AI 방문 관리자 대시보드 데스크톱",
    "관리자 로그인 모바일",
    "AI 방문 관리자 대시보드 모바일",
  ]) {
    assert.ok(names.has(name), `missing Pencil frame: ${name}`);
  }
});
