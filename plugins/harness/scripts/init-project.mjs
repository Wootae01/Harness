#!/usr/bin/env node
// /harness:init 이 호출하는 결정적 복사 단계. 판단이 필요한 채우기는 스킬이 한다.
//   - templates/ 를 프로젝트로 복사한다. **이미 있는 파일은 절대 덮어쓰지 않는다** (건너뛴 목록을 보고)
//   - templates/_gitignore 는 프로젝트 .gitignore 에 없는 줄만 덧붙인다
//   - {{DATE}} 를 오늘 날짜로 바꾼다
//   - check-docs.mjs 를 scripts/ 에 CI 용 사본으로 둔다 (하네스 소유 — 항상 최신으로 갱신)
//   - .claude/harness.json 마커를 남긴다 (설치된 하네스 버전 기록, 세션 요약 훅의 동작 조건)
// 사용: node init-project.mjs [프로젝트 루트]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(here, "..");
const templates = path.join(pluginRoot, "templates");
const root = path.resolve(process.argv[2] ?? process.cwd());
const today = new Date().toISOString().slice(0, 10);
const version = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8")).version;

const created = [];
const skipped = [];
const rel = (p) => path.relative(root, p).replace(/\\/g, "/");

function copyTree(src, dest) {
  for (const d of fs.readdirSync(src, { withFileTypes: true })) {
    if (d.name === "_gitignore") continue;
    const s = path.join(src, d.name);
    const t = path.join(dest, d.name);
    if (d.isDirectory()) {
      fs.mkdirSync(t, { recursive: true });
      copyTree(s, t);
    } else if (fs.existsSync(t)) {
      skipped.push(rel(t));
    } else {
      const text = fs.readFileSync(s, "utf8").replaceAll("{{DATE}}", today);
      fs.writeFileSync(t, text, "utf8");
      created.push(rel(t));
    }
  }
}

copyTree(templates, root);

// .gitignore 병합
const giSrc = fs.readFileSync(path.join(templates, "_gitignore"), "utf8").split(/\r?\n/);
const giPath = path.join(root, ".gitignore");
const existing = fs.existsSync(giPath) ? fs.readFileSync(giPath, "utf8") : "";
const have = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
const add = giSrc.filter((l) => l.trim() && !l.startsWith("#") && !have.has(l.trim()));
if (add.length) {
  const block = `${existing && !existing.endsWith("\n") ? "\n" : ""}\n# --- harness ---\n${add.join("\n")}\n`;
  fs.writeFileSync(giPath, existing + block, "utf8");
}

// CI 용 check-docs 사본 (하네스 소유이므로 항상 갱신)
fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
fs.copyFileSync(path.join(here, "check-docs.mjs"), path.join(root, "scripts", "check-docs.mjs"));

// 마커
fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
const markerPath = path.join(root, ".claude", "harness.json");
const prev = fs.existsSync(markerPath) ? JSON.parse(fs.readFileSync(markerPath, "utf8")) : {};
fs.writeFileSync(markerPath, JSON.stringify({
  ...prev,
  harnessVersion: version,
  initializedAt: prev.initializedAt ?? today,
  updatedAt: today,
}, null, 2) + "\n", "utf8");

console.log([
  `하네스 v${version} → ${root}`,
  `생성 ${created.length}개`,
  ...created.map((f) => `  + ${f}`),
  `건너뜀(이미 존재, 덮어쓰지 않음) ${skipped.length}개`,
  ...skipped.map((f) => `  = ${f}`),
  `.gitignore: ${add.length ? `${add.length}줄 추가` : "변경 없음"}`,
  `scripts/check-docs.mjs: 갱신`,
  `.claude/harness.json: 기록`,
].join("\n"));
