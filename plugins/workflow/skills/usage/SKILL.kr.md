---
name: usage
description: 로컬 기록에서 Claude Code 토큰 사용량을 작업 단계별(탐색, 구현, 검증, 대화, 서브에이전트)로 보여주고, ccusage 로 비용 합계를 더한다. 사용자가 /workflow:usage 하거나 세션에서 토큰·비용을 얼마나 썼는지 물을 때 사용.
argument-hint: "[all] [<N>d]"
disable-model-invocation: true
---

# /workflow:usage — 토큰이 어디에 쓰였나

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [SKILL.md](SKILL.md)이며, 내용이 다르면 영어본이 우선합니다.

## 1. 단계별 표
사용자 인자를 그대로 넘겨 실행한다.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/usage.mjs" $ARGUMENTS
```
- 인자 없음: 현재 프로젝트, 최근 7일. `all`: 모든 프로젝트. `30d`: 최근 30일. 함께 쓸 수 있다 (`all 30d`).
- 출력은 **그대로** 보여준다 (이미 표다). 다시 계산하거나 형식을 바꾸지 않는다.

## 2. 비용 합계 (선택)
표에는 토큰만 있고 금액은 없다. 비용은 같은 일수로 ccusage 를 실행한다.
```bash
npx -y ccusage@latest daily --since <YYYYMMDD>
```
- `<YYYYMMDD>` = 오늘에서 위에서 쓴 일수를 뺀 날짜.
- ccusage 는 **모든 프로젝트**를 센다. 표가 한 프로젝트 기준이었다면 그렇다고 말한다.
- `npx`가 없거나 명령이 실패하면 이 부분은 건너뛰고 이유를 한 줄로 말한다.

## 3. 사용자에게 풀어 주기
사용자의 언어로 두세 문장: 어느 단계가 가장 많이 썼는지, 그리고 구체적인 관찰 하나
(예: 대부분이 긴 세션의 캐시 읽기라서, 새 세션을 열거나 `/compact`를 더 일찍 하면 줄어든다).
단계 구분은 각 응답이 부른 도구로 추정한 값이다 — 사용자가 정확한 숫자에 기대면 그 점을 말한다.
