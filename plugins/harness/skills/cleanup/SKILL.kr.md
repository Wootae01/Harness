---
name: cleanup
description: 가비지 컬렉션. 황금 원칙 대비 드리프트를 찾아 작은 정리 변경을 만들고, 오래된 문서를 고치고(doc-gardening), 품질 등급과 기술 부채 트래커를 갱신한다. 사용자가 /harness:cleanup 하거나 정기 정리를 요청할 때 사용.
argument-hint: "[범위: 컨텍스트/경로 | docs | all]"
---

# /harness:cleanup — 기술 부채를 매일 조금씩 갚기

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [SKILL.md](SKILL.md)이며, 내용이 다르면 영어본이 우선합니다.

원칙: 한 번에 크게 정리하지 않는다. **1분 안에 검토할 수 있는 작은 변경** 여러 개로 나눈다.

## 1. 기준 읽기
- `docs/design-docs/core-beliefs.md`의 황금 원칙 (G-*)
- `ARCHITECTURE.md` §3의 불변식
- `docs/exec-plans/tech-debt-tracker.md`의 미해결 항목

## 2. 드리프트 찾기
범위(인자: 컨텍스트/경로, 기본값은 최근 변경이 많은 영역)에서 다음을 찾는다.
| 찾을 것 | 근거 |
|---|---|
| 공유 유틸이 있는데 따로 만든 중복 헬퍼 | G-1 |
| 검증 없이 외부 데이터를 쓰는 곳 | G-2, I-5 |
| 레이어 역방향 import, Domain의 외부 의존, 컨텍스트 간 직접 import | I-4 |
| 비구조화 로그, 상한을 넘는 큰 파일 | I-6, I-7 |
| 같은 일을 하는 서로 다른 패턴 2개 이상 | G-4 — 하나로 통일 |
| 죽은 코드, 쓰이지 않는 export와 의존성 | |

## 3. Doc-gardening (문서 정원 가꾸기)
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"`를 실행하고 실패하면 고친다.
- 문서 내용이 **실제 코드 동작과 다르면** 문서를 코드에 맞춘다. 코드가 틀렸다면 부채로 기록한다.
- 영어 문서가 바뀌었다면 `.kr.md` 번역본도 같은 내용인지 확인한다.
- `exec-plans/active/`에 있는데 실제로는 끝난 계획은 `completed/`로 옮긴다.
- `design-docs/index.md`에서 "마지막 검토"가 오래된 문서를 다시 확인한다.

## 4. 고치거나 기록하기
- **작고 안전한 것**(동작 변화 없음): 바로 고친다. 하나의 의도 = 하나의 커밋 (`/harness:commit-message`, type `refactor` 또는 `docs`).
- **크거나 동작이 바뀌는 것**: 고치지 말고 `tech-debt-tracker.md`에 행을 추가한다.
- **같은 드리프트를 두 번째로 발견하면**: 린트나 구조 테스트로 승격하자고 제안하고, `ARCHITECTURE.md` 불변식 표에 행을 추가한다.

## 5. 등급 갱신
- `docs/QUALITY_SCORE.md`의 해당 컨텍스트와 레이어 등급, 격차, 평가일을 갱신한다.

## 6. 보고
```
정리: N건 커밋 / 부채 등록 M건 / 승격 제안 K건
등급 변화: <컨텍스트> B → A ...
다음 정리 후보: ...
```
