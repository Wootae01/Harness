#!/usr/bin/env node
// /workflow:usage — Claude Code 기록(~/.claude/projects/**/*.jsonl)에서 단계별 토큰 사용량을 표로 보여준다.
// 단계: 탐색(explore) · 구현(implement) · 검증(verify) · 대화(chat) · 서브에이전트(subagents)
// 사용: node usage.mjs [all] [<N>d]   기본값: 현재 프로젝트, 최근 7일
// 한계: 단계는 그 응답이 부른 도구로 추정한다. 한 응답이 여러 도구를 부르면 구현 > 검증 > 탐색 순으로 하나만 고른다.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PHASES = ["explore", "implement", "verify", "chat", "subagents"];
const LABEL = { explore: "탐색", implement: "구현", verify: "검증", chat: "대화", subagents: "서브에이전트" };

const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);
const AGENT_TOOLS = new Set(["Agent", "Task"]);
const VERIFY_CMD = /\b(test|tests|jest|vitest|pytest|lint|eslint|ruff|tsc|typecheck|build|gradlew?|mvn|validate|check|clippy)\b/i;

// 응답 하나(tools: 도구 이름 목록, commands: 셸 명령 목록, sub: 서브에이전트 기록인지) → 단계
export function classify({ tools = [], commands = [], sub = false }) {
  if (sub || tools.some((t) => AGENT_TOOLS.has(t))) return "subagents";
  if (tools.some((t) => EDIT_TOOLS.has(t))) return "implement";
  if (commands.some((c) => VERIFY_CMD.test(c))) return "verify";
  if (tools.length) return "explore";
  return "chat";
}

// C:\study\harness → C--study-harness (Claude Code 가 프로젝트 폴더 이름을 만드는 방식)
export const projectDirName = (cwd) => cwd.replace(/[^A-Za-z0-9]/g, "-");

export function parseArgs(argv) {
  const opts = { all: false, days: 7 };
  for (const a of argv) {
    if (a === "all") opts.all = true;
    else if (/^\d+d$/.test(a)) opts.days = Number(a.slice(0, -1));
    else throw new Error(`unknown argument '${a}' — use: [all] [<N>d]`);
  }
  return opts;
}

// 기록 파일 하나 → 응답 목록. 한 응답이 내용 블록마다 줄로 나뉘어 있어서 message.id 로 합친다.
export function readTranscript(text, sub) {
  const byId = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.type !== "assistant" || !e.message?.usage || e.message.model === "<synthetic>") continue;
    const id = e.message.id ?? e.uuid;
    const m = byId.get(id) ?? { tools: [], commands: [], sub, ts: e.timestamp };
    m.usage = e.message.usage; // 같은 응답의 줄들은 usage 가 같거나 뒤로 갈수록 갱신된다 → 마지막 것
    for (const c of e.message.content ?? []) {
      if (c.type !== "tool_use") continue;
      m.tools.push(c.name);
      if (SHELL_TOOLS.has(c.name) && typeof c.input?.command === "string") m.commands.push(c.input.command);
    }
    byId.set(id, m);
  }
  return [...byId.values()];
}

function transcriptFiles(projectDir) {
  const files = [];
  for (const entry of fs.readdirSync(projectDir, { withFileTypes: true })) {
    const p = path.join(projectDir, entry.name);
    if (entry.isFile() && entry.name.endsWith(".jsonl")) files.push({ file: p, sub: false });
    const subDir = path.join(p, "subagents");
    if (entry.isDirectory() && fs.existsSync(subDir)) {
      for (const f of fs.readdirSync(subDir)) if (f.endsWith(".jsonl")) files.push({ file: path.join(subDir, f), sub: true });
    }
  }
  return files;
}

export function summarize(messages) {
  const rows = Object.fromEntries(PHASES.map((p) => [p, { calls: 0, input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }]));
  for (const m of messages) {
    const r = rows[classify(m)];
    const u = m.usage;
    r.calls += 1;
    r.input += u.input_tokens ?? 0;
    r.cacheWrite += u.cache_creation_input_tokens ?? 0;
    r.cacheRead += u.cache_read_input_tokens ?? 0;
    r.output += u.output_tokens ?? 0;
  }
  return rows;
}

// 터미널 표 — 한글은 두 칸을 차지하므로 폭을 따로 센다
const width = (s) => [...s].reduce((w, ch) => w + (ch.codePointAt(0) >= 0x1100 ? 2 : 1), 0);
const pad = (s, n, right) => (right ? " ".repeat(Math.max(0, n - width(s))) + s : s + " ".repeat(Math.max(0, n - width(s))));
const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));

export function renderTable(rows) {
  const total = (r) => r.input + r.cacheWrite + r.cacheRead + r.output;
  const grand = PHASES.reduce((s, p) => s + total(rows[p]), 0) || 1;
  const head = ["단계", "호출", "입력", "캐시쓰기", "캐시읽기", "출력", "합계", "비율"];
  const body = PHASES.map((p) => {
    const r = rows[p];
    return [LABEL[p], String(r.calls), fmt(r.input), fmt(r.cacheWrite), fmt(r.cacheRead), fmt(r.output), fmt(total(r)), `${((total(r) / grand) * 100).toFixed(1)}%`];
  });
  const sum = PHASES.reduce((a, p) => a.map((v, i) => v + [rows[p].calls, rows[p].input, rows[p].cacheWrite, rows[p].cacheRead, rows[p].output][i]), [0, 0, 0, 0, 0]);
  const foot = ["합계", String(sum[0]), ...sum.slice(1).map(fmt), fmt(sum.slice(1).reduce((a, b) => a + b, 0)), "100%"];
  const all = [head, ...body, foot];
  const w = head.map((_, i) => Math.max(...all.map((r) => width(r[i]))));
  const line = (r) => r.map((c, i) => pad(c, w[i], i > 0)).join("  ");
  const rule = w.map((n) => "─".repeat(n)).join("  ");
  return [line(head), rule, ...body.map(line), rule, line(foot)].join("\n");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const base = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"), "projects");
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const want = projectDirName(cwd).toLowerCase();
  const dirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && (opts.all || d.name.toLowerCase() === want))
    .map((d) => path.join(base, d.name));
  if (!dirs.length) {
    console.log(`이 프로젝트의 기록이 없습니다 (${path.join(base, projectDirName(cwd))}). 전체를 보려면: all`);
    return;
  }

  const since = Date.now() - opts.days * 86_400_000;
  const messages = [];
  const sessions = new Set();
  for (const dir of dirs) {
    for (const { file, sub } of transcriptFiles(dir)) {
      if (fs.statSync(file).mtimeMs < since) continue; // 기간 전에 끝난 파일은 열지 않는다
      for (const m of readTranscript(fs.readFileSync(file, "utf8"), sub)) {
        if (Date.parse(m.ts) < since) continue;
        messages.push(m);
        if (!sub) sessions.add(file);
      }
    }
  }

  const scope = opts.all ? `전체 프로젝트 ${dirs.length}개` : `현재 프로젝트 (${path.basename(dirs[0])})`;
  console.log(`범위: ${scope} · 최근 ${opts.days}일 · 세션 ${sessions.size}개 · 응답 ${messages.length}개\n`);
  console.log(renderTable(summarize(messages)));
  console.log(`\n단계는 응답이 부른 도구로 추정한 값이다 (구현=Edit/Write, 검증=test·lint·build 류 명령, 탐색=그 밖의 도구, 대화=도구 없음).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(`usage: ${e.message}`);
    process.exit(1);
  }
}
