#!/usr/bin/env node
// PreToolUse 훅 — 에이전트는 .env* 를 읽거나/쓰거나/출력하지 않는다.
// 허용: .env.example / .env.sample / .env.template / .env.dist
// 차단 시 exit 2 + stderr → 메시지가 에이전트에게 수정 지침으로 전달된다.

import path from "node:path";

const ALLOWED_SUFFIX = /\.(example|sample|template|dist)$/i;
const ENV_NAME = /^\.env(\.[\w.-]+)?$/i;
// 셸 명령·glob 안에서 .env 토큰 찾기: 앞은 경계 문자, 뒤는 공백/구분자/glob 문자/끝
const ENV_IN_CMD = /(?:^|[\s"'`=/\\<>|;&(:{,])(\.env(?:\.[\w-]+)*)(?=$|[\s"'`;|&)<>,}*?[])/g;

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
      `Rule: the agent never reads, writes or prints .env* files.`,
      `How to proceed:`,
      `  - Read .env.example for the required key names (keys only, no values).`,
      `  - If a new key is needed, add the key to .env.example and ask the human for the real value.`,
      `  - In code, read secrets through the project's config/env module, never by opening .env directly.`,
    ].join("\n") + "\n",
  );
  process.exit(2);
}

// 판단할 수 없으면 막는다 (fail closed) — 입력을 못 읽거나 스크립트가 예외로 죽으면 통과가 아니라 차단
function failClosed(reason) {
  process.stderr.write(
    [
      `⛔ [protect-env] could not inspect this tool call (${reason}), so it was blocked to be safe.`,
      `How to proceed:`,
      `  - Do not retry or work around it. Tell the human the protect-env hook may be broken.`,
      `  - The human can check: node on PATH, the harness plugin version, or disable the plugin temporarily.`,
    ].join("\n") + "\n",
  );
  process.exit(2);
}

function check(input) {
  const tool = input.tool_name ?? "";
  const ti = input.tool_input;
  if (!ti || typeof ti !== "object") failClosed("missing tool_input");

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
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    failClosed("unreadable input");
  }
  if (!input || typeof input !== "object") failClosed("unreadable input");
  try {
    check(input);
  } catch (e) {
    failClosed(`hook error: ${e.message}`);
  }
});
