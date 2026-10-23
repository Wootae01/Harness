---
name: deploy
description: 사전 검사 → 사람 확인 → 배포 → 배포 후 검증 순서로 배포한다. 되돌리기 어려운 외부 작업이므로 사용자가 /harness:deploy 로 직접 호출할 때만 실행한다.
argument-hint: "[환경: staging | production]"
disable-model-invocation: true
---

# /harness:deploy

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [SKILL.md](SKILL.md)이며, 내용이 다르면 영어본이 우선합니다.

> 배포는 되돌리기 어려운 외부 작업이다. **모든 사전 검사가 통과하고 사람이 확인해야만** 실행한다.
> 이 스킬은 **절차**만 정의한다. 배포 대상, 명령, 허용 브랜치, 롤백 방법은 프로젝트의 `docs/DEPLOY.md`에서 읽는다.

## 0. 프로젝트 설정 읽기
- `docs/DEPLOY.md`를 읽는다. 없거나 필요한 칸이 `TODO`로 남아 있으면 **배포하지 않고** 무엇이 비어 있는지 보고한다.
  추측해서 명령을 만들지 않는다.

## 1. 대상 확인
- 인자로 받은 환경. 없으면 `staging`으로 간주하고, `production`은 반드시 명시해야 한다.
- 환경이 `docs/DEPLOY.md`의 환경 표에 없으면 중단한다.

## 2. 사전 검사 — 하나라도 실패하면 중단한다
| 검사 | 방법 |
|---|---|
| 작업 트리가 깨끗한가 | `git status --short` 결과가 비어 있어야 함 |
| 허용된 브랜치인가 | `git branch --show-current` ↔ DEPLOY.md 환경 표 |
| 원격과 동기화되었는가 | `git fetch && git status -sb` |
| 지식 베이스 | `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"` |
| 린트 / 타입 / 테스트 | 프로젝트 CLAUDE.md §5 |
| 빌드 | DEPLOY.md §빌드 |
| 필요한 env 키 | `.env.example`의 키 목록을 DEPLOY.md의 설정 위치와 비교 (값은 보지 않는다) |
| 마이그레이션 | 대기 중인 DB 마이그레이션이 있으면 별도로 확인받는다 |

## 3. 사람 확인
다음을 보여주고 **명시적인 "진행" 답을 받은 뒤에만** 다음 단계로 간다.
```
배포 대상: <env>  커밋: <sha> <subject>
지난 배포 이후 변경: <git log --oneline <last-tag>..HEAD>
사전 검사: 전부 ✓
롤백 방법: <DEPLOY.md §롤백>
```

## 4. 배포
- DEPLOY.md §배포 명령을 실행한다.
- 출력을 끝까지 확인한다. 실패하면 재시도하지 말고 로그를 요약해서 보고한다.
- 성공하면 태그를 남긴다: `git tag deploy/<env>/<YYYYMMDD-HHMM>` (push는 확인 후).

## 5. 배포 후 검증
- DEPLOY.md §검증의 헬스 체크와 스모크 테스트를 실행한다.
- `docs/RELIABILITY.md`의 성능 예산을 넘지 않는지 확인한다.
- 문제가 있으면 → DEPLOY.md §롤백 명령을 제시하고 사람에게 묻는다. 자동으로 롤백하지 않는다.

## 6. 기록
- 배포 결과(env, sha, 시각, 검증 결과)를 사용자에게 보고한다.
- 배포 절차에서 막힌 점이 있었다면 DEPLOY.md를 고치자고 제안한다.
