import { test } from "node:test";
import assert from "node:assert/strict";
import { runHook, runRaw } from "./run-hook.mjs";

const run = (tool, input) => runHook("protect-env.mjs", tool, input);

// [도구, 입력]
const BLOCKED = [
  ["Read", { file_path: ".env" }],
  ["Read", { file_path: "C:\\proj\\.env" }],
  ["Read", { file_path: "/proj/.env.local" }],
  ["Read", { file_path: "/proj/.env.production" }],
  ["Edit", { file_path: "/proj/.env" }],
  ["Write", { file_path: "/proj/.env.development.local" }],
  ["NotebookEdit", { notebook_path: "/proj/.env" }],
  ["Grep", { pattern: "KEY", path: "/proj/.env" }],
  ["Grep", { pattern: "KEY", glob: ".env*" }],
  ["Glob", { pattern: "**/.env.local" }],
  ["Bash", { command: "cat .env" }],
  ["Bash", { command: "cat ./.env.local" }],
  ["Bash", { command: "grep KEY .env" }],
  ["Bash", { command: "source .env && npm start" }],
  ["Bash", { command: "cp .env /tmp/x" }],
  ["Bash", { command: "echo \"$(cat .env)\"" }],
  ["PowerShell", { command: "Get-Content .env" }],
  ["PowerShell", { command: "type C:\\proj\\.env" }],
];

const ALLOWED = [
  ["Read", { file_path: "/proj/.env.example" }],
  ["Read", { file_path: "/proj/.env.sample" }],
  ["Read", { file_path: "/proj/.env.template" }],
  ["Read", { file_path: "/proj/src/env.ts" }],
  ["Read", { file_path: "/proj/.envrc.md" }],
  ["Edit", { file_path: "/proj/.env.example" }],
  ["Grep", { pattern: "dotenv", path: "/proj/src" }],
  ["Bash", { command: "cat .env.example" }],
  ["Bash", { command: "npm test" }],
  ["Bash", { command: "node -e \"process.env.HOME\"" }],
  ["PowerShell", { command: "Get-ChildItem" }],
];

for (const [tool, input] of BLOCKED) {
  test(`blocks: ${tool} ${JSON.stringify(input)}`, () => assert.equal(run(tool, input), 2));
}
for (const [tool, input] of ALLOWED) {
  test(`allows: ${tool} ${JSON.stringify(input)}`, () => assert.equal(run(tool, input), 0));
}

test("broken input never blocks", () => assert.equal(runRaw("protect-env.mjs", "not json"), 0));
test("missing input never blocks", () => assert.equal(run("Read", undefined), 0));
