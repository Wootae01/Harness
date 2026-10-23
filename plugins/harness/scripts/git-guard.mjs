#!/usr/bin/env node
// PreToolUse 훅 — 불변식 I-11: 커밋·푸시·되돌리기 어려운 git 작업은 사람이 직접 한다.
// 차단: commit, push, reset --hard, clean -f, filter-branch / filter-repo, checkout/restore 로 작업 내용 버리기
// 허용: status, diff, log, add, show, branch(조회) 등 읽기·스테이징
// 한계: 셸 문자열을 단순 분해한다. `bash -c "..."` 처럼 감싼 명령이나 별칭까지 완벽히 막지는 못한다.

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

const tokens = (segment) => (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ""));

function findBlocked(command) {
  for (const segment of command.split(/&&|\|\||;|\||\n/)) {
    const t = tokens(segment);
    while (t.length && /^\w+=/.test(t[0])) t.shift(); // FOO=bar git ...
    if (!t.length || !/(^|[\\/])git(\.exe)?$/i.test(t[0])) continue;
    let i = 1;
    while (i < t.length && t[i].startsWith("-")) i += OPTS_WITH_VALUE.has(t[i]) ? 2 : 1;
    const sub = t[i];
    const args = t.slice(i + 1);
    const rule = sub && BLOCK.find((r) => r.test(sub, args));
    if (rule) return { cmd: t.join(" "), why: rule.why };
  }
  return null;
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
  if (input.tool_name !== "Bash" && input.tool_name !== "PowerShell") process.exit(0);
  const hit = findBlocked(input.tool_input?.command ?? "");
  if (!hit) process.exit(0);
  process.stderr.write(
    [
      `⛔ [git-guard] blocked: \`${hit.cmd}\` — ${hit.why}.`,
      `Invariant I-11 (ARCHITECTURE.md §3): the agent never commits, pushes, or runs irreversible git operations.`,
      `How to proceed:`,
      `  - Stage files with \`git add <path>\` if useful, then show the human the exact command to run.`,
      `  - For commits, use /harness:commit — it prepares the commits and hands the commands to the human.`,
    ].join("\n") + "\n",
  );
  process.exit(2);
});
