#!/usr/bin/env node
// 지식 베이스 린터 — 문서가 최신이고, 교차 연결되어 있고, 구조가 올바른지 기계적으로 검사한다.
//   I-2: CLAUDE.md ≤ 200줄, 문서 안 링크가 유효
//   I-3: design-docs/, product-specs/ 의 모든 문서가 index.md 에 등재
//   번역: X.kr.md 는 X.md(정본)가 있어야 하고, 제목(#) 개수가 같아야 한다 (드리프트 신호)
// 에러 메시지는 에이전트가 읽으므로 영어로, 항상 수정 방법을 함께 적는다 (ARCHITECTURE.md §3).
// 사용: node check-docs.mjs [프로젝트 루트]   (기본값: 현재 디렉터리, 실패 시 exit 1)
// 하네스 플러그인이 원본이고, 프로젝트의 scripts/check-docs.mjs 는 CI 용 사본이다.

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const MAX_CLAUDE_MD_LINES = 200;
const errors = [];
const err = (file, msg, fix) => errors.push(`✗ ${file}: ${msg}\n    → fix: ${fix}`);
const rel = (p) => path.relative(root, p).replace(/\\/g, "/");
const isKr = (p) => p.endsWith(".kr.md");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
}

// 코드 블록(```) 안의 내용은 템플릿/예시이므로 검사에서 제외
const stripCode = (s) => s.replace(/```[\s\S]*?```/g, "");
const headingCount = (s) => stripCode(s).split("\n").filter((l) => /^#{1,6}\s/.test(l)).length;

// 1) CLAUDE.md 길이
const claudeMd = path.join(root, "CLAUDE.md");
if (!fs.existsSync(claudeMd)) {
  err("CLAUDE.md", "file is missing", "create a table-of-contents style CLAUDE.md at the repo root.");
} else {
  const lines = fs.readFileSync(claudeMd, "utf8").split("\n").length;
  if (lines > MAX_CLAUDE_MD_LINES)
    err("CLAUDE.md", `${lines} lines (limit ${MAX_CLAUDE_MD_LINES})`,
      "move details into docs/ and keep only one line + a link in CLAUDE.md.");

  // 2) CLAUDE.md 의 백틱 경로(지도 항목)가 실제로 존재하는지
  const text = stripCode(fs.readFileSync(claudeMd, "utf8"));
  for (const [, token] of text.matchAll(/`([^`\s]+)`/g)) {
    if (!/^(docs\/|\.claude\/|scripts\/|ARCHITECTURE\.md|CLAUDE\.md)/.test(token)) continue;
    if (/[<>*]/.test(token)) continue;
    if (!fs.existsSync(path.join(root, token)))
      err("CLAUDE.md", `the map points to a path that does not exist: ${token}`,
        "fix the path, create the target document, or remove the entry from the map.");
  }
}

// 3) 모든 문서의 상대 마크다운 링크 유효성
const rootDocs = ["CLAUDE.md", "CLAUDE.kr.md", "ARCHITECTURE.md", "ARCHITECTURE.kr.md"].map((f) => path.join(root, f));
const docs = [...rootDocs, ...walk(path.join(root, "docs"))].filter((p) => fs.existsSync(p));
for (const file of docs) {
  const text = stripCode(fs.readFileSync(file, "utf8"));
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const clean = decodeURIComponent(target.split("#")[0]);
    if (!fs.existsSync(path.resolve(path.dirname(file), clean)))
      err(rel(file), `broken link: ${target}`, "fix the link path, or update it to the target's new location.");
  }
}

// 4) 색인 커버리지 (번역본 *.kr.md 는 정본의 등재로 갈음)
for (const folder of ["docs/design-docs", "docs/product-specs"]) {
  const dir = path.join(root, folder);
  const index = path.join(dir, "index.md");
  if (!fs.existsSync(index)) {
    err(folder, "index.md is missing", `create ${folder}/index.md and list every document in its table.`);
    continue;
  }
  const indexText = fs.readFileSync(index, "utf8");
  for (const f of walk(dir)) {
    if (f === index || isKr(f)) continue;
    const r = path.relative(dir, f).replace(/\\/g, "/");
    if (!indexText.includes(`](${r})`))
      err(`${folder}/index.md`, `document not in the index: ${r}`, `add a [${r}](${r}) row to the index.md table. Unindexed documents are never found.`);
  }
}

// 5) 번역 쌍: X.kr.md 는 정본 X.md 가 있어야 하고, 제목 구조가 같아야 한다
for (const kr of docs.filter(isKr)) {
  const en = kr.replace(/\.kr\.md$/, ".md");
  if (!fs.existsSync(en)) {
    err(rel(kr), "Korean translation without an English source", `create ${rel(en)} (the English source of truth), or delete the orphaned translation.`);
    continue;
  }
  const a = headingCount(fs.readFileSync(en, "utf8"));
  const b = headingCount(fs.readFileSync(kr, "utf8"));
  if (a !== b)
    err(rel(kr), `heading count differs from ${rel(en)} (${b} vs ${a}) — the translation has likely drifted`,
      `update ${rel(kr)} so its sections match ${rel(en)} 1:1.`);
}

if (errors.length) {
  console.error(`Knowledge-base check failed (${errors.length})\n\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`✓ Knowledge-base check passed (${docs.length} documents)`);
