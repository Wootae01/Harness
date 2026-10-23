#!/usr/bin/env node
// PostToolUse 훅 — 불변식 I-10: 수정한 파일은 포맷터를 통과한다.
// 스택 중립: 프로젝트에 설치된 포맷터만 사용한다 (설치되어 있지 않으면 조용히 넘어간다).
// 포맷 실패가 작업을 막지는 않는다 (항상 exit 0). 구현은 자유, 포맷은 강제.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const q = (s) => `"${s}"`;

// Windows 는 .cmd 래퍼, 그 외는 확장자 없는 실행 파일 — 있는 쪽을 쓴다
function localBin(name) {
  const dir = path.join(root, "node_modules", ".bin");
  return [`${name}.cmd`, name].map((n) => path.join(dir, n)).find((p) => fs.existsSync(p)) ?? null;
}

function run(cmd) {
  const r = spawnSync(cmd, { shell: true, cwd: root, stdio: "pipe", timeout: 25_000 });
  return r.status === 0;
}

// 확장자 → 시도할 포맷터 목록 (앞에서부터 처음 성공한 것 하나만)
const FORMATTERS = {
  prettier: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".css", ".scss", ".html", ".md", ".yaml", ".yml", ".vue", ".svelte"],
};

function candidates(file) {
  const ext = path.extname(file).toLowerCase();
  const list = [];
  if (FORMATTERS.prettier.includes(ext)) {
    const bin = localBin("prettier");
    if (bin) list.push(`${q(bin)} --write --log-level warn ${q(file)}`);
  }
  if (ext === ".py") list.push(`ruff format ${q(file)}`, `black -q ${q(file)}`);
  if (ext === ".dart") list.push(`dart format ${q(file)}`);
  if (ext === ".go") list.push(`gofmt -w ${q(file)}`);
  if (ext === ".rs") list.push(`rustfmt ${q(file)}`);
  if (ext === ".kt" || ext === ".kts") list.push(`ktlint -F ${q(file)}`);
  return list;
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw);
    const file = input.tool_input?.file_path;
    if (!file || !fs.existsSync(file)) return;
    const rel = path.relative(root, file).replace(/\\/g, "/");
    if (rel.startsWith("..") || rel.startsWith("docs/generated/") || /(^|\/)\.env/.test(rel)) return;
    for (const cmd of candidates(file)) {
      if (run(cmd)) return;
    }
  } catch {
    // 포맷 훅은 절대 작업을 막지 않는다
  }
});
