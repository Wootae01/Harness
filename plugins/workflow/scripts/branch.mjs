// 브랜치 이름 규칙 — session-context 훅과 handoff 스킬이 같은 규칙을 쓴다.
// 브랜치: <type>/<이슈번호>-<설명>  예) feat/12-context-detail → 이슈 #12
// handoff 파일: .handoffs/<브랜치, / 는 - 로>.md  예) .handoffs/feat-12-context-detail.md

export function issueNumber(branch) {
  const m = /^[\w.-]+\/(\d+)(?:-|$)/.exec(branch ?? "");
  return m ? Number(m[1]) : null;
}

export function handoffFile(branch) {
  const name = (branch ?? "").trim().replace(/[\\/]+/g, "-").replace(/[^\w.-]/g, "_") || "detached";
  return `.handoffs/${name}.md`;
}
