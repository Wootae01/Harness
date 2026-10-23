# CLAUDE.md — 이 리포지터리의 지도

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [CLAUDE.md](CLAUDE.md)이며, 내용이 다르면 영어본이 우선합니다.

> 이 파일은 **백과사전이 아니라 목차**다. 여기엔 "어디를 봐야 하는지"만 있다.
> 상세 내용은 링크된 문서에 있고, 필요할 때만 열어본다 (progressive disclosure).
> 규칙: 이 파일은 **200줄 이내**를 유지한다 — `scripts/check-docs.mjs`가 강제한다.

## 0. 작업 시작 전 30초 체크

1. 이 작업이 **진행 중인 실행 계획**에 속하는가? → `docs/exec-plans/active/`
2. 건드릴 영역의 **불변식**은? → `ARCHITECTURE.md` §3
3. 제품 의도는? → `docs/product-specs/index.md`
4. 끝나면: `/harness:review` → `/harness:commit-message`

## 1. 핵심 원칙 (상세: `docs/design-docs/core-beliefs.md`)

- **불변식은 강제, 구현은 자유.** 경계·정확성·재현성은 기계적으로 강제한다.
  그 안에서 *어떻게* 구현할지는 자유다. (예: "경계에서 파싱한다"는 강제, 어떤 라이브러리로 할지는 자유)
- **리포지터리가 기록 시스템이다.** 채팅·머릿속·외부 문서에만 있는 지식은 존재하지 않는 것과 같다.
  결정이 생기면 `docs/`에 남긴다.
- **문서로 부족하면 코드로 승격한다.** 같은 리뷰 지적이 두 번 나오면 린트/테스트/훅으로 만든다.
- **에이전트가 막히면 그것은 신호다.** "더 열심히"가 아니라 무엇이(도구·가드레일·문서) 빠졌는지 찾아 리포에 추가한다.
- **지루한 기술을 선호한다.** 안정적이고 리포 안에서 추론 가능한 의존성을 고른다.
- **기술 부채는 매일 조금씩 갚는다.** → `/harness:cleanup`

## 2. 지도 — 무엇이 어디에 있나

| 알고 싶은 것 | 문서 |
|---|---|
| 컨텍스트·레이어 구조(4계층), 의존성 방향, **불변식 목록** | `ARCHITECTURE.md` |
| 기술 스택과 선택 이유 | `docs/design-docs/tech-stack.md` |
| 핵심 신념 / 황금 원칙 | `docs/design-docs/core-beliefs.md` |
| 설계 결정 기록(색인) | `docs/design-docs/index.md` |
| 제품 스펙(색인) | `docs/product-specs/index.md` |
| 제품 감각 — 무엇이 "좋은" 결과인가 | `docs/PRODUCT_SENSE.md` |
| 계획 작성법 | `docs/PLANS.md` |
| 진행 중 / 완료된 실행 계획 | `docs/exec-plans/active/`, `docs/exec-plans/completed/` |
| 알려진 기술 부채 | `docs/exec-plans/tech-debt-tracker.md` |
| 컨텍스트·레이어별 품질 등급 | `docs/QUALITY_SCORE.md` |
| UI·디자인 시스템 | `docs/DESIGN.md`, `docs/FRONTEND.md` |
| 신뢰성(성능 예산, 관측 가능성) | `docs/RELIABILITY.md` |
| 보안(비밀값, 권한) | `docs/SECURITY.md` |
| 배포 대상·명령·롤백 | `docs/DEPLOY.md` |
| 자동 생성 문서(DB 스키마 등) — 직접 수정 금지 | `docs/generated/` |
| 외부 라이브러리 레퍼런스(llms.txt) | `docs/references/` |

## 3. 스킬 (harness 플러그인)

| 명령 | 언제 |
|---|---|
| `/harness:new-screen <이름>` | 새 화면 추가 |
| `/harness:review` | 커밋 전 자가 검토 (통과할 때까지 반복) |
| `/harness:commit-message` | 검토 통과 후: 커밋을 나누고 실행할 git 명령을 넘겨줌 (실행은 사람이) |
| `/harness:cleanup` | 드리프트 정리, 품질 등급·부채 갱신 |
| `/harness:deploy` | 배포 (사람이 직접 호출할 때만, 설정은 `docs/DEPLOY.md`) |

## 4. 자동으로 강제되는 것 (harness 플러그인 훅)

| 시점 | 동작 |
|---|---|
| 도구 실행 전 | `.env*` 읽기/쓰기/셸 접근 차단 (`.env.example`은 허용) |
| 셸 명령 실행 전 | `git commit`, `push`, `reset --hard`, `clean -f`, 히스토리 재작성 차단 — **커밋은 사람이 한다** |
| 파일 수정 후 | 설치된 포맷터로 자동 포맷 |
| 세션 종료 | 요약을 .claude/session-logs/ 에 기록 (gitignore) |

훅이 막으면 우회하지 말고 메시지의 수정 지침을 따른다.

## 5. 명령어

```bash
node scripts/check-docs.mjs    # 지식 베이스 검사: 깨진 링크, 색인 누락, CLAUDE.md 길이
# TODO(stack): 아래를 실제 명령으로 교체
# <install>   의존성 설치
# <dev>       로컬 실행
# <test>      테스트
# <lint>      린트 + 구조 테스트 (불변식)
# <typecheck> 타입 검사
```

## 6. 작업 방식

- **작은 변경**: 바로 구현 → `/harness:review` → `/harness:commit-message`.
- **큰 변경**(여러 파일·여러 세션·설계 판단 포함): 먼저 `docs/exec-plans/active/`에 계획을 쓴다 (`docs/PLANS.md`).
  진행 상황과 결정 로그를 계획에 계속 갱신하고, 끝나면 `completed/`로 옮긴다.
- **검증은 직접 한다.** 앱을 실행하고 로그·화면으로 확인한다. "아마 될 것"은 완료가 아니다.
- **사람에게 넘기는 경우**: 제품 판단, 되돌리기 어려운 작업(배포, 데이터 삭제, 외부 전송), 불변식 변경.
- **PR은 작고 수명이 짧게.** 한 PR = 한 가지 의도.

## 7. 금지

- `.env` 및 비밀값을 읽거나 출력하거나 커밋하기 → `docs/SECURITY.md`
- `docs/generated/` 직접 수정하기 (생성기를 고친다)
- 레이어 의존성 방향 역행 → `ARCHITECTURE.md`
- 경계에서 검증하지 않은 데이터를 "이런 모양이겠지" 하고 사용하기
- 테스트·린트를 끄거나 건너뛰어서 통과시키기

## 8. 이 지도를 고칠 때

- 새 문서를 만들면 해당 `index.md`와 이 표에 링크한다. 링크가 없는 문서는 발견되지 않는다.
- 상세 내용을 여기에 쓰지 않는다. 여기에는 **한 줄 + 링크**만 쓴다.
- **언어**: 영어 `*.md`가 정본이다. `*.kr.md`는 사람을 위한 한국어 번역본이므로 **에이전트는 읽지 않는다**.
  `X.md`를 고칠 때 `X.kr.md`가 있으면 같은 변경에서 함께 고친다.
