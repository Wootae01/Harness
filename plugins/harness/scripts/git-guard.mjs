#!/usr/bin/env node
// PreToolUse 훅 — 커밋·푸시·되돌리기 어려운 git 작업은 사람이 직접 한다.
// 차단: commit, push, reset --hard, clean -f, filter-branch / filter-repo, checkout/restore 로 작업 내용 버리기
// 허용: status, diff, log, add, show, branch(조회) 등 읽기·스테이징
// 감싼 명령도 본다: `bash -c "..."`, `cmd /c ...`, `powershell -Command ...`, `& git`, `(git ...)`, `$(git ...)`, `sudo/env git`
// 한계: 셸 문자열을 단순 분해한다. git 별칭이나 스크립트 파일 안의 명령까지는 막지 못한다.

const BLOCK = [
  { test: (sub) => sub === "commit", why: "commits are made by the human" },
  { test: (sub) => sub === "push", why: "pushes are made by the human" },
  { test: (sub, args) => sub === "reset" && args.includes("--hard"), why: "reset --hard discards work" },
  { test: (sub, args) => sub === "clean" && args.some((a) => /^-[a-z]*f/.test(a) || a === "--force"), why: "clean -f deletes untracked files" },
  { test: (sub) => sub === "filter-branch" || sub === "filter-repo", why: "history rewrites are irreversible" },
  { test: (sub, args) => sub === "checkout" && (args.includes("--") || args.includes(".")), why: "checkout of paths discards changes" },
  { test: (sub, args) => sub === "restore" && !args.includes("--staged"), why: "restore discards working-tree changes" },
];

// git 전역 옵션 중 값을 하나 더 받는 것
const OPTS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);

// git 앞에 붙어도 결국 git 을 실행하는 것: PowerShell 호출 연산자 & 와 흔한 래퍼
const PREFIXES = new Set(["&", "sudo", "env", "command", "exec", "nohup", "time"]);
// 문자열을 다시 셸로 넘기는 것 — 그 문자열 안을 다시 검사한다
const SHELLS = /^(bash|sh|zsh|dash|cmd|powershell|pwsh)(\.exe)?$/i;
const SHELL_FLAGS = new Set(["-c", "/c", "/k", "-command"]);

const tokens = (segment) => (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ""));

function findBlocked(command, depth = 0) {
  // 괄호·$( )·백틱도 구분자로 본다 → (git push), $(git push) 의 git 이 맨 앞에 온다
  for (const segment of command.split(/&&|\|\||;|\||\n|\$\(|[()`{}]/)) {
    const t = tokens(segment);
    while (t.length && (/^\w+=/.test(t[0]) || PREFIXES.has(t[0]))) t.shift(); // FOO=bar git ..., & git ...
    if (!t.length) continue;
    if (SHELLS.test(t[0]) && depth < 3) {
      const flag = t.findIndex((a) => SHELL_FLAGS.has(a.toLowerCase()));
      const hit = flag > 0 && findBlocked(t.slice(flag + 1).join(" "), depth + 1);
      if (hit) return hit;
      continue;
    }
    if (!/(^|[\\/])git(\.exe)?$/i.test(t[0])) continue;
    let i = 1;
    while (i < t.length && t[i].startsWith("-")) i += OPTS_WITH_VALUE.has(t[i]) ? 2 : 1;
    const sub = t[i];
    const args = t.slice(i + 1);
    const rule = sub && BLOCK.find((r) => r.test(sub, args));
    if (rule) return { cmd: t.join(" "), why: rule.why };
  }
  return null;
}

// 판단할 수 없으면 막는다 (fail closed) — 입력을 못 읽거나 스크립트가 예외로 죽으면 통과가 아니라 차단
function failClosed(reason) {
  process.stderr.write(
    [
      `⛔ [git-guard] could not inspect this command (${reason}), so it was blocked to be safe.`,
      `How to proceed:`,
      `  - Do not retry or work around it. Tell the human the git-guard hook may be broken.`,
      `  - The human can check: node on PATH, the harness plugin version, or disable the plugin temporarily.`,
    ].join("\n") + "\n",
  );
  process.exit(2);
}

function check(input) {
  if (input.tool_name !== "Bash" && input.tool_name !== "PowerShell") process.exit(0);
  const command = input.tool_input?.command;
  if (typeof command !== "string") failClosed("missing command");
  const hit = findBlocked(command);
  if (!hit) process.exit(0);
  process.stderr.write(
    [
      `⛔ [git-guard] blocked: \`${hit.cmd}\` — ${hit.why}.`,
      `Rule: the agent never commits, pushes, or runs irreversible git operations.`,
      `How to proceed:`,
      `  - Stage files with \`git add <path>\` if useful, then show the human the exact command to run.`,
      `  - For commits, use /harness:commit-message — it prepares the commits and hands the commands to the human.`,
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
    failClosed("unreadable input");
  }
  if (!input || typeof input !== "object") failClosed("unreadable input");
  try {
    check(input);
  } catch (e) {
    failClosed(`hook error: ${e.message}`);
  }
});
