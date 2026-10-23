import { test } from "node:test";
import assert from "node:assert/strict";
import { runHook, runRaw } from "./run-hook.mjs";

const run = (command, tool = "Bash") => runHook("git-guard.mjs", tool, { command });

const BLOCKED = [
  "git commit -m \"x\"",
  "git push",
  "git push origin main --force",
  "git reset --hard HEAD~1",
  "git clean -fd",
  "git clean --force",
  "git filter-branch --tree-filter x",
  "git filter-repo --path x",
  "git checkout -- src/app.js",
  "git checkout .",
  "git restore src/app.js",
  // 위치·옵션 변형
  "git -C ../other commit -m x",
  "git -c user.name=x commit -m x",
  "FOO=bar git push",
  "\"C:/Program Files/Git/bin/git.exe\" push",
  "git.exe push",
  // 다른 명령과 연결
  "git add . && git commit -m x",
  "npm test; git push",
  "git status || git push",
  "echo hi\ngit push",
  // 감싼 명령 (알려진 빈틈이었던 것)
  "bash -c \"git push\"",
  "sh -c 'git commit -m x'",
  "cmd /c git push",
  "powershell -Command \"git push\"",
  "pwsh -c \"git reset --hard\"",
  "& git push",
  "(git push)",
  "echo $(git push)",
  "sudo git push",
  "env FOO=1 git push",
];

const ALLOWED = [
  "git status",
  "git diff --staged",
  "git log --oneline -5",
  "git add src/app.js",
  "git show HEAD",
  "git branch --show-current",
  "git restore --staged src/app.js",
  "git checkout main",
  "git checkout -b feat/12-x",
  "git reset HEAD src/app.js",
  "git clean -n",
  "git fetch",
  "npm test",
  "echo \"git push is blocked\"",
  "gh issue view 12",
];

for (const cmd of BLOCKED) {
  test(`blocks: ${cmd}`, () => assert.equal(run(cmd), 2));
}
for (const cmd of ALLOWED) {
  test(`allows: ${cmd}`, () => assert.equal(run(cmd), 0));
}

test("PowerShell tool is guarded too", () => assert.equal(run("git push", "PowerShell"), 2));
test("other tools are ignored", () => assert.equal(runHook("git-guard.mjs", "Read", { file_path: "x" }), 0));
// 판단할 수 없으면 막는다 (fail closed)
test("broken input blocks", () => assert.equal(runRaw("git-guard.mjs", "not json"), 2));
test("null input blocks", () => assert.equal(runRaw("git-guard.mjs", "null"), 2));
test("missing command blocks", () => assert.equal(runHook("git-guard.mjs", "Bash", undefined), 2));
test("non-string command blocks", () => assert.equal(runHook("git-guard.mjs", "Bash", { command: 123 }), 2));
