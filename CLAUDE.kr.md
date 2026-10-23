# CLAUDE.md — harness 저장소 (공통 하네스 개발용)

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [CLAUDE.md](CLAUDE.md)이며, 내용이 다르면 영어본이 우선합니다.

> 이 저장소는 **프로젝트가 아니라 하네스 자체**다. Claude Code 플러그인 마켓플레이스이며,
> 플러그인 `harness`를 각 프로젝트에 설치해 쓴다. 사용법은 `README.md`.

## 구조

| 경로 | 무엇 | 바꾸면 영향 |
|---|---|---|
| `.claude-plugin/marketplace.json` | 마켓플레이스 정의 | 설치 주소 |
| `plugins/harness/.claude-plugin/plugin.json` | 플러그인 정의, **version** | 사용자 업데이트 |
| `plugins/harness/hooks/hooks.json` | 훅 등록 | **설치된 모든 프로젝트 즉시** |
| `plugins/harness/scripts/` | 훅 스크립트 (protect-env, git-guard, format) | **설치된 모든 프로젝트 즉시** |
| `plugins/harness/skills/` | 절차(스킬). `/harness:<이름>` | **설치된 모든 프로젝트 즉시** |

## 공통/프로젝트 경계 (이 저장소의 불변식)

- **하네스는 안전 장치만 담는다.** 피해를 막는 훅(비밀값, 되돌릴 수 없는 git)과 `/harness:commit`.
  작업 흐름 편의 기능은 여기가 아니라 별도 플러그인에 둔다. 규칙은 실제로 문제가 생겨 필요성이 확인된 뒤에만 추가한다.
- **스킬과 스크립트에는 스택별 값을 넣지 않는다.** 명령은 프로젝트 자신의 CLAUDE.md에서 읽고,
  포맷터 같은 도구는 프로젝트에 이미 설치된 경우에만 쓴다.
- 훅 메시지는 없을 수도 있는 프로젝트 문서(`ARCHITECTURE.md`, `docs/...`)를 가리키지 않는다.
- **안전 훅은 판단할 수 없으면 막는다 (fail closed).** protect-env 나 git-guard 가 호출을 검사하지 못하면(입력을 못 읽음, 필드 누락, 예외)
  차단(exit 2)하고 훅이 고장 났을 수 있다고 알린다. 안전 검사가 아닌 훅(format)은 절대 막지 않는다.
- 훅을 고치거나 훅이 놓치는 명령을 발견하면, 먼저 `plugins/harness/tests/`에 그 사례를 추가한다.

## 언어

- 영어 `*.md`(와 `SKILL.md`)가 에이전트가 읽는 정본이다. `*.kr.md`는 사람을 위한 한국어 번역본이다 — **에이전트는 읽지 않는다**.
- `X.md`를 고칠 때 `X.kr.md`가 있으면 같은 변경에서 함께 고친다. 제목 구조는 1:1로 유지한다.
- 에이전트가 읽는 스크립트 메시지(훅 차단 메시지)는 영어로, 사람이 읽는 출력(README)은 한국어로 쓴다.

## 검증

```bash
claude plugin validate .                                   # 마켓플레이스 + 플러그인 매니페스트
node --test "plugins/harness/tests/*.test.mjs"             # 훅 회귀 테스트 (차단 = exit 2, 통과 = exit 0)
claude --plugin-dir plugins/harness                        # 설치 없이 로컬 플러그인으로 세션 실행
```

## 릴리스

- 스킬·스크립트를 바꿔 배포하려면 `plugin.json`의 `version`을 올린다.
  version 이 같으면 사용자 쪽은 업데이트되지 않는다.
- 커밋 메시지: `feat(skills): ...`, `fix(hooks): ...`, `docs: ...`
