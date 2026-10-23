# Harness

에이전트 우선 개발을 위한 개인 공통 하네스 (Claude Code 플러그인).
OpenAI의 [Harness engineering](https://openai.com/index/harness-engineering/) 글의 원칙을 바탕으로 한다.

- **지도를 준다** — 프로젝트의 CLAUDE.md는 짧은 목차이고, 상세 내용은 `docs/`에 둔다
- **불변식은 강제, 구현은 자유** — 꼭 지켜야 할 규칙은 훅과 검사 스크립트로 강제한다
- **공통은 절차, 프로젝트는 지식** — 스킬과 훅은 플러그인이 맡고, 스택·명령·배포 설정은 각 프로젝트 문서가 맡는다

## 설치 (PC당 한 번)

```bash
claude plugin marketplace add Wootae01/Harness
claude plugin install harness@wootae-harness
```

## 프로젝트에 적용

프로젝트 폴더에서 Claude Code 세션을 열고 실행한다.

```
/harness:init
```

`init`이 하는 일:
- `CLAUDE.md`, `ARCHITECTURE.md`, `docs/`, `.env.example`, CI용 `scripts/check-docs.mjs`를 복사한다. **이미 있는 파일은 덮어쓰지 않는다.**
- `.gitignore`에 빠진 줄만 추가한다.
- 프로젝트 스택을 파악해서 `TODO(stack)` 부분을 채운다.

## 포함된 것

| 종류 | 이름 | 설명 |
|---|---|---|
| 스킬 | `/harness:init` | 프로젝트에 하네스 설치 |
| 스킬 | `/harness:new-screen` | 4계층 구조에 맞춰 화면 추가 |
| 스킬 | `/harness:review` | 통과할 때까지 반복하는 자가 검토 |
| 스킬 | `/harness:commit` | 의도 단위로 커밋을 나누고 실행할 명령을 넘겨줌 (실행은 직접) |
| 스킬 | `/harness:cleanup` | 드리프트 정리, 문서 정리, 품질 등급 갱신 |
| 스킬 | `/harness:deploy` | 사전 검사 → 사람 확인 → 배포 (`docs/DEPLOY.md` 기반) |
| 훅 | protect-env | `.env*` 접근 차단 (`.env.example`은 허용) |
| 훅 | git-guard | 에이전트의 `git commit`·`push`·`reset --hard` 등 차단 — **커밋은 사람이 직접** |
| 훅 | format | 수정한 파일을 설치된 포맷터로 정리 |
| 훅 | session-summary | 세션 요약을 `.claude/session-logs/`에 기록 (init된 프로젝트에서만) |

## 업데이트

- **스킬과 훅**: 플러그인을 업데이트하면 모든 프로젝트에 바로 반영된다. 배포하는 쪽에서 `plugin.json`의 `version`을 올려야 한다.
- **템플릿(문서 뼈대)**: 이미 설치한 프로젝트에는 반영되지 않는다. 복사된 뒤에는 프로젝트가 소유한다. 새로 추가된 템플릿 파일만 받으려면 `/harness:init`을 다시 실행한다. 기존 파일은 건드리지 않는다.
