---
name: new-screen
description: 새 화면을 4계층 아키텍처(Presentation→Application→Domain←Infrastructure)에 맞춰 스펙·스캐폴드·검증까지 만든다. 사용자가 /harness:new-screen 하거나 새 화면/페이지 추가를 요청할 때 사용.
argument-hint: "<ScreenName> [context]"
---

# /harness:new-screen <ScreenName> [context]

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [SKILL.md](SKILL.md)이며, 내용이 다르면 영어본이 우선합니다.

> **강제**: 레이어 배치, 4가지 상태, 경계 검증, 이름 규칙, 스펙 연결.
> **자유**: 컴포넌트 분해, 상태 관리 방식, 스타일링 방법.

## 1. 의도 확인 (스펙 우선)
- `docs/product-specs/`에서 이 화면의 스펙을 찾는다.
- 스펙이 없으면 템플릿(`docs/product-specs/index.md`)으로 **먼저 스펙 초안을 쓰고** 색인에 등재한다.
  수용 기준이 불분명하면 사용자에게 질문한다. 추측해서 만들지 않는다.
- 컨텍스트가 지정되지 않았으면 `ARCHITECTURE.md` §1에서 고르고, 맞는 컨텍스트가 없으면 묻는다.

## 2. 기존 자산 확인 (G-1)
- `docs/DESIGN.md`의 공용 컴포넌트와 비슷한 기존 화면을 먼저 찾아본다. 있으면 재사용한다.
- 비슷한 화면의 구조를 참고하되, 나쁜 패턴이면 복제하지 않고 부채로 기록한다 (G-4).

## 3. 안쪽(Domain)부터 바깥쪽으로, 필요한 것만 만든다
> 실제 경로·확장자·파일 형태는 프로젝트의 `ARCHITECTURE.md` §2와 `docs/FRONTEND.md`를 따른다.
> 아래는 형태만 보여준다. 문서에 경로가 정해져 있지 않으면 기본값 `src/<context>/{domain,application,infrastructure,presentation}/`을 쓰고, 그 결정을 문서에 기록한다.

| 레이어 | 생성물 | 필수 여부 |
|---|---|---|
| Domain | 엔티티·값 객체, 비즈니스 규칙, `<Entity>Repository` 인터페이스 | 새 개념/규칙이 있으면 |
| Application | 화면이 호출할 유스케이스 (`<동사><대상>`), 입출력 DTO | ✅ |
| Infrastructure | 리포지터리 구현, API 클라이언트 — 응답을 `<Entity>Schema`로 **파싱한 뒤** 안쪽으로 넘김 (I-5) | 원격/저장 데이터가 있으면 |
| Presentation | `<ScreenName>Screen` + 화면 상태(loading / empty / error / ready) — 유스케이스만 호출 | ✅ |
| 연결 | 구현체를 composition root에 등록, 라우트 등록 (`docs/FRONTEND.md`) | ✅ |
| 테스트 | Domain·Application 단위 테스트(가짜 리포지터리로) + 화면 4가지 상태 렌더 테스트 | ✅ |

규칙:
- Presentation은 Infrastructure를 직접 import하지 않는다. Domain은 아무것도 import하지 않는다 (I-4).
- 화면은 **로딩 / 빈 상태 / 에러 / 정상** 4가지 상태를 모두 처리한다 (`docs/DESIGN.md`).
- 인증, 텔레메트리, 기능 플래그는 포트(인터페이스)로 받고, 구현은 Infrastructure에 둔다.

## 4. 검증 — 직접 실행해서 확인한다
- 프로젝트 CLAUDE.md §5의 lint / typecheck / test.
- 앱을 실행하고 화면으로 가서 4가지 상태를 확인한다 (가능하면 스크린샷을 남긴다). 방법은 `docs/FRONTEND.md` §에이전트 검증 방법.

## 5. 마무리
- 스펙의 수용 기준 체크박스를 갱신한다.
- 새 공용 컴포넌트를 만들었다면 `docs/DESIGN.md`에 추가한다.
- `/harness:review` → `/harness:commit` (`feat(<context>): add <ScreenName> screen`).
