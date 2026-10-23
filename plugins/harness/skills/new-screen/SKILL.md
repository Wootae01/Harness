---
name: new-screen
description: Builds a new screen following the 4-layer architecture (Presentation→Application→Domain←Infrastructure), from spec to scaffold to verification. Use when the user runs /harness:new-screen or asks to add a new screen/page. (KR: 화면 추가, 새 화면, 페이지 추가)
argument-hint: "<ScreenName> [context]"
---

# /harness:new-screen <ScreenName> [context]

> **Enforced**: layer placement, the 4 states, boundary validation, naming, link to a spec.
> **Free**: component breakdown, state management approach, styling method.

## 1. Confirm intent (spec first)
- Find this screen's spec in `docs/product-specs/`.
- If there is none, **write a draft spec first** using the template (`docs/product-specs/index.md`) and list it in the index.
  If the acceptance criteria are unclear, ask the user. Do not build on guesses.
- If no context was given, pick one from `ARCHITECTURE.md` §1; if none fits, ask.

## 2. Check existing assets (G-1)
- Look at the shared components in `docs/DESIGN.md` and at similar existing screens first. Reuse them if they exist.
- Use similar screens as a reference, but if their pattern is bad, do not copy it — record it as debt (G-4).

## 3. Build from the inside (Domain) outward — only what is needed
> Actual paths, extensions and file shapes follow the project's `ARCHITECTURE.md` §2 and `docs/FRONTEND.md`.
> The table below only shows the shape. If the docs do not define paths, use the default `src/<context>/{domain,application,infrastructure,presentation}/` and record that decision in the docs.

| Layer | Output | Required |
|---|---|---|
| Domain | Entities / value objects, business rules, `<Entity>Repository` interface | If there is a new concept or rule |
| Application | The use case the screen calls (`<Verb><Target>`), input/output DTOs | ✅ |
| Infrastructure | Repository implementation, API client — **parse** responses with `<Entity>Schema` before passing them inward (I-5) | If there is remote/stored data |
| Presentation | `<ScreenName>Screen` + screen state (loading / empty / error / ready) — calls use cases only | ✅ |
| Wiring | Register implementations in the composition root, register the route (`docs/FRONTEND.md`) | ✅ |
| Tests | Domain / Application unit tests (with a fake repository) + render tests for the 4 screen states | ✅ |

Rules:
- Presentation never imports Infrastructure directly. Domain imports nothing (I-4).
- A screen handles all 4 states: **loading / empty / error / ready** (`docs/DESIGN.md`).
- Auth, telemetry and feature flags come in through ports (interfaces); implementations live in Infrastructure.

## 4. Verify — run it yourself
- lint / typecheck / test from the project's CLAUDE.md §5.
- Run the app, navigate to the screen and check all 4 states (leave screenshots if possible). How: `docs/FRONTEND.md` § How the agent verifies.

## 5. Finish
- Tick the acceptance-criteria checkboxes in the spec.
- If you created a new shared component, add it to `docs/DESIGN.md`.
- `/harness:review` → `/harness:commit-message` (`feat(<context>): add <ScreenName> screen`).
