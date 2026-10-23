#!/usr/bin/env node
// SessionEnd 훅 — 세션이 끝나면 무엇을 했는지 요약을 남긴다.
// 출력: .claude/session-logs/YYYY-MM-DD_HHMM_<session8>.md  (gitignore 대상, 로컬 기록)
// 다음 세션이 이어받아야 할 내용은 이 로그가 아니라 docs/exec-plans/active/ 의 진행 로그에 남긴다.
// /harness:init 으로 설치된 프로젝트(.claude/harness.json 이 있는 곳)에서만 동작한다.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const checkDocs = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-docs.mjs");
if (!fs.existsSync(path.join(root, ".claude", "harness.json"))) process.exit(0);
const sh = (cmd) => {
  const r = spawnSync(cmd, { shell: true, cwd: root, encoding: "utf8", timeout: 15_000 });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
};
const pad = (n) => String(n).padStart(2, "0");

function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter((b) => b?.type === "text").map((b) => b.text).join("\n");
  return "";
}

function parseTranscript(p) {
  const result = { prompts: [], edited: new Set(), read: new Map(), searches: [], skills: [], commands: [], toolCounts: {} };
  const relOf = (fp) => {
    const r = path.relative(root, fp).replace(/\\/g, "/");
    return r.startsWith("..") ? fp.replace(/\\/g, "/") : r;
  };
  if (!p || !fs.existsSync(p)) return result;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const content = e.message?.content;
    if (e.type === "user" && !e.isMeta) {
      const t = textOf(content).trim();
      // 사용자가 직접 입력한 슬래시 명령 (/review 등)
      for (const [, name] of t.matchAll(/<command-name>\/?([^<]+)<\/command-name>/g)) result.skills.push(`/${name} (사용자)`);
      if (t && !t.startsWith("<")) result.prompts.push(t); // tool_result 블록은 text 가 아니라서 걸러진다
    }
    if (e.type === "assistant" && Array.isArray(content)) {
      for (const b of content) {
        if (b?.type !== "tool_use") continue;
        result.toolCounts[b.name] = (result.toolCounts[b.name] ?? 0) + 1;
        const fp = b.input?.file_path;
        if (fp && ["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(b.name)) {
          result.edited.add(relOf(fp));
        }
        if (fp && b.name === "Read") {
          const r = relOf(fp);
          result.read.set(r, (result.read.get(r) ?? 0) + 1);
        }
        if (b.name === "Grep" || b.name === "Glob") {
          const where = b.input?.path ? ` in ${relOf(b.input.path)}` : "";
          const glob = b.input?.glob ? ` (${b.input.glob})` : "";
          result.searches.push(`${b.name} "${b.input?.pattern ?? ""}"${glob}${where}`);
        }
        if (b.name === "Skill" && b.input?.skill) result.skills.push(`/${b.input.skill} (에이전트)`);
        if ((b.name === "Bash" || b.name === "PowerShell") && b.input?.command) {
          result.commands.push(b.input.command.split("\n")[0].slice(0, 120));
        }
      }
    }
  }
  return result;
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const t = parseTranscript(input.transcript_path);
    const now = new Date();
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const sid = (input.session_id ?? "unknown").slice(0, 8);

    const activeDir = path.join(root, "docs", "exec-plans", "active");
    const activePlans = fs.existsSync(activeDir)
      ? fs.readdirSync(activeDir).filter((f) => f.endsWith(".md") && f !== "README.md")
      : [];
    const touchedPlans = [...t.edited].filter((f) => f.startsWith("docs/exec-plans/active/"));

    const git = sh("git status --short");
    const docs = sh(`node "${checkDocs}" "${root}"`);

    const warnings = [];
    if (activePlans.length && t.edited.size && !touchedPlans.length)
      warnings.push("진행 중인 실행 계획이 있는데 이번 세션에서 진행 로그를 갱신하지 않았습니다.");
    if (!docs.ok) warnings.push("지식 베이스 검사(check-docs) 실패 — 아래 결과 참고.");

    const md = [
      `# 세션 요약 ${stamp} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      ``,
      `- 세션: \`${input.session_id ?? "?"}\` · 종료 사유: \`${input.reason ?? "?"}\``,
      `- 도구 사용: ${Object.entries(t.toolCounts).map(([k, v]) => `${k}×${v}`).join(", ") || "없음"}`,
      ``,
      `## 요청`,
      ...(t.prompts.length ? t.prompts.slice(0, 5).map((p) => `- ${p.replace(/\s+/g, " ").slice(0, 200)}`) : ["- (없음)"]),
      ``,
      `## 호출한 스킬`,
      ...(t.skills.length ? t.skills.map((s) => `- ${s}`) : ["- (없음)"]),
      ``,
      `## 읽은 파일 (${t.read.size}) — CLAUDE.md 는 세션 시작 시 자동 로드되므로 여기 없음`,
      `- 지식 베이스(docs/, ARCHITECTURE.md) 열람: ${[...t.read.keys()].filter((f) => f.startsWith("docs/") || f === "ARCHITECTURE.md").length}개`,
      ...[...t.read].sort(([a], [b]) => a.localeCompare(b)).map(([f, n]) => `- \`${f}\`${n > 1 ? ` ×${n}` : ""}`),
      ``,
      `## 검색 (${t.searches.length})`,
      ...(t.searches.length ? t.searches.slice(-15).map((s) => `- ${s.replace(/`/g, "'")}`) : ["- (없음)"]),
      ``,
      `## 수정한 파일 (${t.edited.size})`,
      ...(t.edited.size ? [...t.edited].sort().map((f) => `- \`${f}\``) : ["- (없음)"]),
      ``,
      `## 실행한 명령 (최근 10개 / 총 ${t.commands.length})`,
      ...(t.commands.length ? t.commands.slice(-10).map((c) => `- \`${c.replace(/`/g, "'")}\``) : ["- (없음)"]),
      ``,
      `## 작업 트리`,
      "```",
      git.ok ? git.out || "(변경 없음)" : "(git 저장소 아님)",
      "```",
      ``,
      `## 진행 중인 실행 계획`,
      ...(activePlans.length ? activePlans.map((f) => `- docs/exec-plans/active/${f}${touchedPlans.some((x) => x.endsWith(f)) ? " ✏️ 갱신됨" : ""}`) : ["- (없음)"]),
      ``,
      `## 확인 필요`,
      ...(warnings.length ? warnings.map((w) => `- ⚠️ ${w}`) : ["- 없음"]),
      ...(!docs.ok ? ["", "```", docs.out.slice(0, 2000), "```"] : []),
      ``,
    ].join("\n");

    const outDir = path.join(root, ".claude", "session-logs");
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${stamp}_${pad(now.getHours())}${pad(now.getMinutes())}_${sid}.md`);
    fs.writeFileSync(file, md, "utf8");
  } catch (err) {
    process.stderr.write(`[session-summary] 요약 실패: ${err?.message}\n`);
  }
});
