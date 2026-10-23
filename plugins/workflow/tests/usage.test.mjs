import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, parseArgs, projectDirName, readTranscript, summarize, renderTable } from "../scripts/usage.mjs";

// [응답, 단계]
const PHASE_CASES = [
  [{ tools: [] }, "chat"],
  [{ tools: ["Read", "Grep"] }, "explore"],
  [{ tools: ["Bash"], commands: ["git status"] }, "explore"],
  [{ tools: ["Bash"], commands: ["npm test"] }, "verify"],
  [{ tools: ["PowerShell"], commands: ["./gradlew build"] }, "verify"],
  [{ tools: ["Bash"], commands: ["git checkout main"] }, "explore"],
  [{ tools: ["Edit"] }, "implement"],
  [{ tools: ["Read", "Write", "Bash"], commands: ["npm test"] }, "implement"],
  [{ tools: ["Agent"] }, "subagents"],
  [{ tools: ["Read"], sub: true }, "subagents"],
];
for (const [msg, phase] of PHASE_CASES) {
  test(`classify ${JSON.stringify(msg)} = ${phase}`, () => assert.equal(classify(msg), phase));
}

test("parseArgs defaults and options", () => {
  assert.deepEqual(parseArgs([]), { all: false, days: 7 });
  assert.deepEqual(parseArgs(["all", "30d"]), { all: true, days: 30 });
  assert.throws(() => parseArgs(["week"]));
});

test("projectDirName matches Claude Code folder names", () => {
  assert.equal(projectDirName("C:\\study\\harness"), "C--study-harness");
  assert.equal(projectDirName("C:\\study\\mail-plug\\ticketing"), "C--study-mail-plug-ticketing");
});

const line = (id, content, usage = { input_tokens: 1, output_tokens: 10, cache_read_input_tokens: 100, cache_creation_input_tokens: 5 }) =>
  JSON.stringify({ type: "assistant", timestamp: "2026-10-23T00:00:00Z", message: { id, model: "m", usage, content } });

test("readTranscript merges lines of one reply and skips non-replies", () => {
  const text = [
    JSON.stringify({ type: "user", message: { content: "hi" } }),
    line("a", [{ type: "thinking" }]),
    line("a", [{ type: "tool_use", name: "Bash", input: { command: "npm test" } }]),
    line("b", [{ type: "text", text: "done" }]),
    "not json",
    JSON.stringify({ type: "assistant", message: { id: "c", model: "<synthetic>", usage: {}, content: [] } }),
  ].join("\n");
  const msgs = readTranscript(text, false);
  assert.equal(msgs.length, 2);
  assert.deepEqual(msgs[0].tools, ["Bash"]);
  assert.deepEqual(msgs[0].commands, ["npm test"]);
  assert.equal(classify(msgs[0]), "verify");
  assert.equal(classify(msgs[1]), "chat");
});

test("summarize adds tokens per phase and renderTable shows them", () => {
  const msgs = readTranscript([line("a", []), line("b", [{ type: "tool_use", name: "Edit", input: {} }])].join("\n"), false);
  const rows = summarize(msgs);
  assert.equal(rows.chat.calls, 1);
  assert.equal(rows.implement.output, 10);
  const table = renderTable(rows);
  assert.match(table, /구현/);
  assert.match(table, /100%/);
});
