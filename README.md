# Harness

에이전트와 함께 개발할 때 쓰는 개인용 Claude Code 플러그인 모음. 플러그인은 두 개다.

- **harness** — 안전 장치. 되돌리기 어려운 실수(비밀값 노출, 커밋·푸시, 작업 내용 날리기)만 막는다. 규칙은 실제로 문제가 생겼을 때만 추가한다.
- **workflow** — 편의 기능. 세션을 열면 브랜치의 이슈와 지난 세션 메모를 불러오고, 인수인계 메모와 토큰 사용량을 다룬다.

## 설치 (PC당 한 번)

```bash
claude plugin marketplace add Wootae01/Harness
claude plugin install harness@wootae-harness
claude plugin install workflow@wootae-harness     # 선택
```

설치하면 모든 프로젝트에서 바로 동작한다. 프로젝트별 설정은 필요 없다.

## harness

| 종류 | 이름 | 설명 |
|---|---|---|
| 스킬 | `/harness:commit` | 의도 단위로 커밋을 나누고 실행할 명령을 넘겨줌 (실행은 직접). 브랜치 `feat/12-...`면 `Closes #12` 추가 |
| 훅 | protect-env | `.env*` 접근 차단 (`.env.example`은 허용) |
| 훅 | git-guard | 에이전트의 `git commit`·`push`·`reset --hard` 등 차단 — **커밋은 사람이 직접** |
| 훅 | format | 수정한 파일을 프로젝트에 설치된 포맷터로 정리 (없으면 건너뜀) |

protect-env 와 git-guard 는 **검사를 못 하면 막는다**. 훅이 고장 나서 모든 명령이 막히면,
`claude plugin disable harness@wootae-harness` 로 잠시 끄고 고친 뒤 다시 켠다 (`enable`).

## workflow

| 종류 | 이름 | 설명 |
|---|---|---|
| 훅 | session-context | 세션 시작 시 브랜치 `feat/12-...`의 GitHub 이슈 #12 와 `.handoffs/<브랜치>.md` 를 맥락에 넣음 |
| 스킬 | `/workflow:handoff [다음 할 일]` | 지금 대화를 `.handoffs/<브랜치>.md` 로 저장 (덮어씀). `.gitignore`에 `.handoffs/` 자동 추가 |
| 스킬 | `/workflow:usage [all] [30d]` | 단계별(탐색·구현·검증·대화·서브에이전트) 토큰 사용량 표 + ccusage 비용 합계 |

- 브랜치 규칙: `<type>/<이슈번호>-<설명>` (예: `feat/12-context-detail`). 번호가 없으면 이슈는 건너뛴다.
- 이슈를 불러오려면 [GitHub CLI](https://cli.github.com/)(`gh`)가 설치·로그인되어 있어야 한다. 없으면 조용히 건너뛴다.
- handoff 스킬은 [mattpocock/skills](https://github.com/mattpocock/skills)의 `handoff`를 바탕으로 했다 (MIT, `plugins/workflow/LICENSE.mattpocock`).

## 업데이트

플러그인을 업데이트하면 모든 프로젝트에 바로 반영된다. 배포하는 쪽에서 해당 플러그인 `plugin.json`의 `version`을 올려야 한다.

## 라이선스

MIT (`LICENSE`). handoff 스킬은 원저작자의 MIT 라이선스를 따른다.
