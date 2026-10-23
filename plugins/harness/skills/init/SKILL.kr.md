---
name: init
description: 현재 프로젝트에 하네스를 설치한다 — CLAUDE.md, ARCHITECTURE.md, docs/ 뼈대, CI용 check-docs를 복사하고 프로젝트 스택에 맞게 채운다. 사용자가 /harness:init 으로 직접 호출할 때만 실행.
argument-hint: "[스택 설명 — 생략하면 프로젝트 파일에서 추론하거나 질문]"
disable-model-invocation: true
---

# /harness:init — 프로젝트에 하네스 설치

> 🇰🇷 한국어 번역본입니다. 정본(에이전트가 읽는 문서)은 [SKILL.md](SKILL.md)이며, 내용이 다르면 영어본이 우선합니다.

> 공통(이 플러그인)은 **절차와 강제 수단**이고, 프로젝트에 복사되는 것은 **그 프로젝트가 소유하는 지식**이다.
> 복사된 뒤에는 프로젝트 파일이 정본이다. 플러그인 템플릿이 바뀌어도 기존 프로젝트 문서는 자동으로 바뀌지 않는다.

## 1. 현재 상태 확인
- 프로젝트 루트(git 루트, 없으면 현재 디렉터리)를 정한다.
- `.claude/harness.json`이 이미 있으면 → 이미 설치된 프로젝트다. 버전을 보여주고 "누락된 파일만 보충할지" 묻는다.
- 기존 `CLAUDE.md`가 있으면 → 복사 단계에서 건너뛰어진다. 4단계에서 병합을 제안한다.

## 2. 뼈대 복사 (결정적 단계 — 스크립트로)
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/init-project.mjs" "<프로젝트 루트>"
```
- 이미 있는 파일은 덮어쓰지 않는다. 출력의 "건너뜀" 목록을 사용자에게 보여준다.

## 3. 스택 파악
- 인자로 받은 설명이 있으면 그것을 쓴다.
- 없으면 매니페스트에서 추론한다: `package.json`, `pnpm-lock.yaml`, `build.gradle(.kts)`, `pom.xml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`.
- 그래도 모르면 질문한다: 플랫폼(웹/모바일/서버), 언어·프레임워크, 백엔드, 배포 대상. **추측해서 채우지 않는다.**

## 4. 프로젝트 문서 채우기
`TODO(stack)` 표시를 찾아(`grep -rn "TODO(stack)"`) 아는 것만 채운다.
영어 `X.md`(정본)와 한국어 `X.kr.md`(번역본)를 **둘 다** 채운다.

| 파일 | 채울 것 |
|---|---|
| `CLAUDE.md` §5 | install / dev / test / lint / typecheck 실제 명령 |
| `docs/design-docs/tech-stack.md` | 선택한 스택, 버전, 선택 이유, 기각한 대안 |
| `ARCHITECTURE.md` §2 | 실제 디렉터리 배치. I-4 를 강제할 도구 후보(예: dependency-cruiser, eslint-plugin-boundaries, ArchUnit, import-linter) |
| `docs/FRONTEND.md` | 프레임워크, 라우팅, 에이전트 검증 방법 |
| `docs/DEPLOY.md` | 아는 경우에만. 모르면 TODO 로 둔다 (`/harness:deploy`는 TODO 가 남아 있으면 배포하지 않는다) |
| `.gitignore` | 스택의 빌드 산출물 폴더 |

- 기존 CLAUDE.md 가 있었다면: 그 내용 중 지도에 맞는 것은 한 줄 + 링크로, 상세한 것은 `docs/`의 알맞은 문서로 옮기는 병합안을 **제안**한다 (사용자 확인 후 적용).
- `docs/PRODUCT_SENSE.md`와 `core-beliefs.md`의 팀 취향은 사람이 채울 부분이다. 비워 두고 안내만 한다.

## 5. (선택) 팀원 자동 안내
팀원이 이 프로젝트를 열 때 하네스 설치를 안내받게 하려면, 사용자에게 확인한 뒤 프로젝트 `.claude/settings.json`에 다음을 병합한다:
```json
{
  "extraKnownMarketplaces": {
    "wootae-harness": { "source": { "source": "github", "repo": "Wootae01/Harness" } }
  },
  "enabledPlugins": { "harness@wootae-harness": true }
}
```

## 6. 검증과 보고
```bash
node scripts/check-docs.mjs
grep -rn "TODO(stack)" CLAUDE.md ARCHITECTURE.md docs/ || true
```
```
하네스 v<버전> 설치 완료
- 생성 N개 / 건너뜀 M개
- 채운 것: ...
- 남은 TODO(stack): <파일:줄 목록>
- 사람이 채울 것: PRODUCT_SENSE.md, core-beliefs.md 팀 취향
- 다음: 변경사항 확인 후 /harness:commit-message
```
