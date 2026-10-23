---
name: commit
description: 검토를 통과한 변경을 커밋할 수 있게 준비한다 — 의도 단위로 나누고, Conventional Commits 메시지를 쓰고, 실행할 git 명령을 사람에게 넘긴다. 에이전트는 git commit 이나 push 를 직접 실행하지 않는다. 사용자가 /harness:commit 하거나 커밋·커밋 메시지를 요청할 때 사용.
argument-hint: "[메시지 힌트]"
---

# /harness:commit — 커밋은 준비만, 실행은 사람이

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [SKILL.md](SKILL.md)이며, 내용이 다르면 영어본이 우선합니다.

> 불변식 I-11: **에이전트는 커밋하거나 푸시하지 않는다.** git-guard 훅이 막는다.
> 이 스킬은 그 직전까지 모든 것을 하고, 사람이 복사해서 실행할 명령을 넘긴다.

## 0. 전제 조건
- git 저장소가 아니면 멈추고 알린다 (`git init`은 사람이 실행한다).
- 이번 변경에 대해 `/harness:review`가 통과하지 않았다면 먼저 `/harness:review`를 실행한다.
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-docs.mjs"`와 프로젝트 CLAUDE.md §5의 lint / test가 통과해야 한다.

## 1. 비밀값 차단 (불변식 I-1)
- `git status --short`에 `.env`(`.env.example` 제외), `*.pem`, `*.key`, `credentials*`가 보이면 **멈추고** 알린다.
- diff에 토큰처럼 보이는 문자열(`sk-`, `AKIA`, `-----BEGIN`, `password=`)이 있으면 멈추고 알린다.

## 2. 의도 단위로 나누기
- 한 커밋에는 한 가지 의도만 담는다. 기능과 리팩터링과 문서 정리가 섞여 있으면 별도 커밋으로 계획한다.
- 커밋마다 포함할 파일을 나열한다. 문서 변경은 그 문서를 필요하게 만든 코드와 **같은 커밋**에 넣는다 (G-5).
- 사용자가 요청하지 않으면 아무것도 스테이징하지 않는다 — 무엇을 넣을지는 사람이 정한다.

## 3. 메시지 형식
```
<type>(<scope>): <무엇을, 명령형, 50자 이내>

<왜 — 맥락과 이유. 무엇을 했는지는 diff가 말해준다>

Refs: docs/exec-plans/active/<plan>.md   (해당 시)
```
- type: `feat` `fix` `refactor` `docs` `test` `chore` `perf` `build` `ci`
- scope: 컨텍스트 이름 또는 `harness`, `docs`
- 언어: TODO — 팀 규칙을 `docs/design-docs/core-beliefs.md`에 정한다 (기본값: 한국어 본문)
- 시스템 리마인더가 지정한 attribution 줄이 있으면 메시지 마지막에 넣는다.

## 4. 넘겨주기
계획한 커밋마다 바로 실행할 수 있는 블록을 순서대로 출력한다.
```bash
git add <file> <file>
git commit -m "<제목>" -m "<본문>"
```
- 모든 명령은 그대로 복사해 실행할 수 있어야 한다. 사용자 셸에 맞게 메시지를 안전하게 따옴표 처리한다.
- 마지막에 한 줄 요약: 커밋 몇 개인지, 일부러 커밋하지 않고 남긴 것은 무엇인지.
- 실행 계획이 있으면 진행 로그에 한 줄 추가한다 (그것도 사람이 커밋한다).
- **push는 절대 하지 않고**, `--force`도 제안하지 않는다.
