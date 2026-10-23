# 프론트엔드

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [FRONTEND.md](FRONTEND.md)이며, 내용이 다르면 영어본이 우선합니다.

> TODO(stack): 프레임워크가 정해지면 채운다.

## 화면 구조
- 화면 하나 = `src/<context>/presentation/<Name>Screen.*` _(경로는 스택에 맞게 조정)_
- 화면은 **Presentation 레이어**다. Application 유스케이스를 통해서만 데이터에 접근한다 (ARCHITECTURE.md §2).
- 새 화면은 `/harness:new-screen`으로 만든다.

## 라우팅
<!-- TODO: 라우트 등록 위치와 방식 -->

## 상태 관리
<!-- TODO: 무엇을 쓰든 자유 (ARCHITECTURE.md §5), 단 선택한 것을 여기에 기록 -->

## 에이전트 검증 방법
<!-- TODO: 에이전트가 앱을 실행하고 화면을 확인하는 방법 (dev 서버 명령, 브라우저 자동화, 스크린샷) -->
