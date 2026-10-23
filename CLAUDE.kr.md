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
| `plugins/harness/scripts/` | 훅 스크립트, check-docs, init-project | **설치된 모든 프로젝트 즉시** |
| `plugins/harness/skills/` | 절차(스킬). `/harness:<이름>` | **설치된 모든 프로젝트 즉시** |
| `plugins/harness/templates/` | 프로젝트에 **한 번 복사**되는 뼈대 | 새로 init 하는 프로젝트만 |

## 공통/프로젝트 경계 (이 저장소의 불변식)

- **스킬과 스크립트에는 스택별 값을 넣지 않는다.** 명령·경로·배포 대상은 프로젝트 문서
  (`CLAUDE.md` §5, `ARCHITECTURE.md` §2, `docs/DEPLOY.md`)에서 읽도록 쓴다.
  `skills/`와 `scripts/`에 `TODO(stack)` 자리표시자가 있으면 안 된다.
- **`TODO(stack)`는 `templates/`에만** 둔다. `/harness:init`이 프로젝트마다 채운다.
- 템플릿 날짜는 `{{DATE}}`로 쓴다 (init 시 치환).
- 템플릿이 참조하는 경로는 init 후 프로젝트에 실제로 존재해야 한다 (check-docs 가 검사).
- 훅은 실패해도 작업을 막지 않는다 — 단, protect-env 의 의도된 차단(exit 2)은 예외.

## 언어

- 영어 `*.md`(와 `SKILL.md`)가 에이전트가 읽는 정본이다. `*.kr.md`는 사람을 위한 한국어 번역본이다 — **에이전트는 읽지 않는다**.
- `X.md`를 고칠 때 `X.kr.md`가 있으면 같은 변경에서 함께 고친다. 제목 구조는 1:1로 유지한다 (check-docs 가 제목 개수를 비교).
- 에이전트가 읽는 스크립트 메시지(훅 차단 메시지, check-docs 에러)는 영어로, 사람이 읽는 출력(세션 요약, README)은 한국어로 쓴다.

## 검증

```bash
claude plugin validate .                                   # 마켓플레이스 + 플러그인 매니페스트
grep -rn "TODO(stack)" plugins/harness/skills/*/SKILL.md plugins/harness/scripts   # 언급만 있고 자리표시자는 없어야 함
# init 리허설: 빈 임시 폴더에 설치해 보고 check-docs 통과 확인
node plugins/harness/scripts/init-project.mjs <임시폴더> && node plugins/harness/scripts/check-docs.mjs <임시폴더>
claude --plugin-dir plugins/harness                        # 설치 없이 로컬 플러그인으로 세션 실행
```

## 릴리스

- 스킬·스크립트·템플릿을 바꿔 배포하려면 `plugin.json`의 `version`을 올린다.
  version 이 같으면 사용자 쪽은 업데이트되지 않는다.
- 커밋 메시지: `feat(skills): ...`, `fix(hooks): ...`, `docs(templates): ...`
