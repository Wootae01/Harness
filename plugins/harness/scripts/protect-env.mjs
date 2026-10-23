#!/usr/bin/env node
// PreToolUse 훅 — 불변식 I-1: 에이전트는 .env* 를 읽거나/쓰거나/출력하지 않는다.
// 허용: .env.example / .env.sample / .env.template / .env.dist
// 차단 시 exit 2 + stderr → 메시지가 에이전트에게 수정 지침으로 전달된다.

import path from "node:path";

const ALLOWED_SUFFIX = /\.(example|sample|template|dist)$/i;
const ENV_NAME = /^\.env(\.[\w.-]+)?$/i;
// 셸 명령 안에서 .env 토큰 찾기: 앞은 경계 문자, 뒤는 공백/구분자/끝
const ENV_IN_CMD = /(?:^|[\s"'`=/\\<>|;&(:])(\.env(?:\.[\w-]+)*)(?=$|[\s"'`;|&)<>,])/g;

function isProtectedPath(p) {
  if (!p || typeof p !== "string") return false;
  const base = path.basename(p.replace(/\\/g, "/"));
  return ENV_NAME.test(base) && !ALLOWED_SUFFIX.test(base);
}

function protectedInCommand(cmd) {
  if (!cmd || typeof cmd !== "string") return null;
  for (const m of cmd.matchAll(ENV_IN_CMD)) {
    if (!ALLOWED_SUFFIX.test(m[1])) return m[1];
  }
  return null;
}

function block(target, tool) {
  process.stderr.write(
    [
      `⛔ [protect-env] ${tool} tried to access the protected secrets file '${target}'.`,
      `Invariant I-1 (ARCHITECTURE.md §3): the agent never reads, writes or prints .env* files.`,
      `How to proceed:`,
      `  - Read .env.example for the required key names (keys only, no values).`,
      `  - If a new key is needed, add the key to .env.example and ask the human for the real value.`,
      `  - In code, go through the config module that parses and validates env at startup (docs/SECURITY.md).`,
    ].join("\n") + "\n",
  );
  process.exit(2);
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // 입력을 못 읽으면 막지 않는다 (훅 고장이 작업을 멈추지 않도록)
  }
  const tool = input.tool_name ?? "";
  const ti = input.tool_input ?? {};

  for (const p of [ti.file_path, ti.notebook_path, ti.path]) {
    if (isProtectedPath(p)) block(p, tool);
  }
  // Glob/Grep 패턴으로 .env 를 노리는 경우
  for (const pat of [ti.pattern, ti.glob]) {
    if (typeof pat === "string" && (tool === "Glob" || tool === "Grep")) {
      const hit = protectedInCommand(pat);
      if (hit) block(pat, tool);
    }
  }
  if (tool === "Bash" || tool === "PowerShell") {
    const hit = protectedInCommand(ti.command);
    if (hit) block(hit, tool);
  }
  process.exit(0);
});
