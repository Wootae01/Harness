# ARCHITECTURE

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [ARCHITECTURE.md](ARCHITECTURE.md)이며, 내용이 다르면 영어본이 우선합니다.

> 컨텍스트와 레이어의 최상위 지도, 그리고 **불변식 목록**.
> 이 문서는 "무엇이 허용되는가"를 정의한다. "어떻게 구현하는가"는 정의하지 않는다.

## 1. 컨텍스트 (기능 모듈)

> 비즈니스 단위는 "컨텍스트"라 부른다 (Domain **레이어**와 구분하기 위해).

<!-- TODO: 컨텍스트가 생기면 추가. 컨텍스트 하나 = 디렉터리 하나. -->

| 컨텍스트 | 경로 | 책임 | 스펙 |
|---|---|---|---|
| _(예시)_ settings | `src/settings/` | 앱 설정 | `docs/product-specs/...` |

## 2. 레이어 (각 컨텍스트 내부)

```
Presentation ──→ Application ──→ Domain ←── Infrastructure
                      │                          │
                      └────── 포트(인터페이스) ←─────┘ 구현
```

모든 의존성은 **Domain을 향한다.** Domain은 아무것도 의존하지 않는다.

| 레이어 | 책임 | 의존 가능 대상 | 들어가는 것 |
|---|---|---|---|
| Domain | 비즈니스 규칙, 핵심 모델 | **없음** (언어 표준 라이브러리만) | 엔티티, 값 객체, 도메인 서비스, 리포지터리 **인터페이스** |
| Application | 유스케이스 조립, 트랜잭션 경계 | Domain | 유스케이스, 입출력 DTO, 외부 서비스 **포트(인터페이스)** |
| Infrastructure | 외부 세계와 연결 | Domain, Application | 리포지터리 **구현**, API 클라이언트, DB, 설정·env 로딩, 인증·텔레메트리 어댑터 |
| Presentation | 사용자 입출력 | Application (+ Domain 타입 읽기) | 화면, 컴포넌트, 컨트롤러, 화면 상태 |

- 역방향 import는 금지한다. 특히 **Domain은 프레임워크·DB·HTTP 라이브러리를 import하지 않는다.**
- Presentation은 Infrastructure를 직접 import하지 않는다. 항상 Application 유스케이스를 거친다.
- 교차 관심사(인증, 텔레메트리, 기능 플래그, 외부 API)는 **포트는 안쪽에, 구현은 Infrastructure에** 둔다.
- 구현체 연결(의존성 주입)은 앱 진입점(composition root) 한 곳에서만 한다.
- 컨텍스트 간 직접 import는 금지한다. 필요하면 상대 컨텍스트의 Application 공개 API를 거친다.
- 순수 유틸(`src/shared/`)은 어느 레이어든 쓸 수 있지만, 유틸은 어떤 컨텍스트도 import하지 않는다.

> TODO(stack): 실제 디렉터리 구조가 정해지면 경로를 갱신하고, 구조 테스트로 강제한다.
> 기본 배치: `src/<context>/{domain,application,infrastructure,presentation}/`

## 3. 불변식 (강제됨)

> **불변식은 강제, 구현은 자유.**
> 아래는 *반드시* 지켜야 하는 것이다. 각 항목에는 **무엇이 강제하는지**를 적는다.
> "문서만"인 항목은 아직 승격되지 않은 것이다 → 린트/테스트로 만들어 `강제 수단`을 갱신한다.

| # | 불변식 | 강제 수단 | 상태 |
|---|---|---|---|
| I-1 | `.env*` 파일을 에이전트가 읽기/쓰기/출력하지 않는다 | harness 플러그인 훅 (protect-env) | ✅ 강제 |
| I-2 | CLAUDE.md는 200줄 이내, 모든 문서 링크가 유효하다 | `scripts/check-docs.mjs` | ✅ 강제 |
| I-3 | `design-docs/`, `product-specs/`의 모든 문서가 `index.md`에 등재된다 | `scripts/check-docs.mjs` | ✅ 강제 |
| I-4 | 의존성은 Domain을 향한다, Domain은 외부 의존 없음 (§2) | TODO(stack): 구조 테스트 / import 린트 | 📄 문서만 |
| I-5 | 외부 입력(API 응답, 폼, 파일, env)은 **경계(Infrastructure·Presentation)에서 파싱·검증**한 뒤 안쪽으로 넘긴다 | TODO(stack): 린트 | 📄 문서만 |
| I-6 | 로그는 구조화 로깅만 (`console.log` 같은 자유 문자열 금지) | TODO(stack): 커스텀 린트 | 📄 문서만 |
| I-7 | 파일 크기 상한 (예: 400줄) | TODO(stack): 커스텀 린트 | 📄 문서만 |
| I-8 | 스키마·타입 이름 규칙 (§4) | TODO(stack): 커스텀 린트 | 📄 문서만 |
| I-9 | `docs/generated/`는 생성기만 수정한다 | 문서만 | 📄 문서만 |
| I-10 | 수정한 파일은 포맷터를 통과한다 | harness 플러그인 훅 (format) | ✅ 강제 |
| I-11 | 에이전트는 커밋·푸시·되돌리기 어려운 git 작업(`reset --hard`, `clean -f`, 히스토리 재작성)을 하지 않는다 — 사람이 한다 | harness 플러그인 훅 (git-guard) | ✅ 강제 |

### 커스텀 린트 작성 규칙
- 에러 메시지에 **수정 방법**을 함께 적는다. 이 메시지가 에이전트에게 수정 지침으로 전달된다.
  - 나쁜 예: `Invalid import`
  - 좋은 예: `Presentation은 Infrastructure를 직접 import할 수 없습니다. Application 유스케이스를 통해 접근하세요. (ARCHITECTURE.md §2)`

## 4. 이름 규칙

<!-- TODO: 스택이 정해지면 구체화 -->
- 유스케이스: `<동사><대상>` (예: `UpdateProfile`)
- 리포지터리: 인터페이스 `<Entity>Repository` (Domain) / 구현 `<Tech><Entity>Repository` (Infrastructure, 예: `HttpUserRepository`)
- 포트: `<Capability>Port` / 어댑터: `<Tech><Capability>Adapter`
- 스키마: `<Entity>Schema` (경계에서 파싱용)
- 화면: `<Name>Screen`

## 5. 자유 영역 (강제하지 않는 것)

- 라이브러리 선택(검증, 상태 관리, 스타일링, DI 방식 등). 단, 추가하면 `docs/design-docs/`에 이유를 한 줄 남긴다.
- 레이어 **안에서의** 파일 분해 방식, 내부 코드 스타일(포맷터가 처리하는 것 제외).
- 사람의 문체 취향과 다른 코드: **정확하고, 유지보수 가능하고, 다음 에이전트가 읽을 수 있으면 통과**다.
