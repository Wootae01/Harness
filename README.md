# Harness

에이전트와 함께 개발할 때 쓰는 개인용 안전 장치 (Claude Code 플러그인).
되돌리기 어려운 실수(비밀값 노출, 커밋·푸시, 작업 내용 날리기)만 막고, 나머지는 자유롭게 둔다.
규칙은 실제로 문제가 생겼을 때만 추가한다.

## 설치 (PC당 한 번)

```bash
claude plugin marketplace add Wootae01/Harness
claude plugin install harness@wootae-harness
```

설치하면 모든 프로젝트에서 바로 동작한다. 프로젝트별 설정은 필요 없다.

## 포함된 것

| 종류 | 이름 | 설명 |
|---|---|---|
| 스킬 | `/harness:commit` | 의도 단위로 커밋을 나누고 실행할 명령을 넘겨줌 (실행은 직접). 브랜치 `feat/12-...`면 `Closes #12` 추가 |
| 훅 | protect-env | `.env*` 접근 차단 (`.env.example`은 허용) |
| 훅 | git-guard | 에이전트의 `git commit`·`push`·`reset --hard` 등 차단 — **커밋은 사람이 직접** |
| 훅 | format | 수정한 파일을 프로젝트에 설치된 포맷터로 정리 (없으면 건너뜀) |

## 업데이트

플러그인을 업데이트하면 모든 프로젝트에 바로 반영된다. 배포하는 쪽에서 `plugin.json`의 `version`을 올려야 한다.
