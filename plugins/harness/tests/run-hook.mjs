// 테스트 도우미 — Claude Code 처럼 훅 스크립트에 도구 호출 JSON 을 stdin 으로 넣고 exit 코드를 돌려준다.
// exit 2 = 차단, 0 = 통과.

import path from "node:path";
import { spawnSync } from "node:child_process";

const scripts = path.join(import.meta.dirname, "..", "scripts");

export function runRaw(script, input) {
  const r = spawnSync(process.execPath, [path.join(scripts, script)], { input, encoding: "utf8" });
  return r.status;
}

export const runHook = (script, toolName, toolInput) =>
  runRaw(script, JSON.stringify({ tool_name: toolName, tool_input: toolInput }));
