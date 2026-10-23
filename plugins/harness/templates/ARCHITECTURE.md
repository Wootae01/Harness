# ARCHITECTURE

> Top-level map of contexts and layers, plus the **list of invariants**.
> This document defines "what is allowed". It does not define "how to implement it".

## 1. Contexts (feature modules)

> A business unit is called a "context" (to keep it distinct from the Domain **layer**).

<!-- TODO: add contexts as they appear. One context = one directory. -->

| Context | Path | Responsibility | Spec |
|---|---|---|---|
| _(example)_ settings | `src/settings/` | App settings | `docs/product-specs/...` |

## 2. Layers (inside each context)

```
Presentation ──→ Application ──→ Domain ←── Infrastructure
                      │                          │
                      └──────── port (interface) ←──┘ implements
```

Every dependency **points toward Domain**. Domain depends on nothing.

| Layer | Responsibility | May depend on | Contains |
|---|---|---|---|
| Domain | Business rules, core model | **Nothing** (language standard library only) | Entities, value objects, domain services, repository **interfaces** |
| Application | Orchestrates use cases, transaction boundary | Domain | Use cases, input/output DTOs, **ports (interfaces)** for external services |
| Infrastructure | Connects to the outside world | Domain, Application | Repository **implementations**, API clients, DB, config/env loading, auth/telemetry adapters |
| Presentation | User input/output | Application (+ reading Domain types) | Screens, components, controllers, screen state |

- No reverse imports. In particular, **Domain never imports frameworks, DB or HTTP libraries.**
- Presentation never imports Infrastructure directly; it always goes through an Application use case.
- Cross-cutting concerns (auth, telemetry, feature flags, external APIs): **port inside, implementation in Infrastructure.**
- Wiring implementations (dependency injection) happens in exactly one place: the app entry point (composition root).
- No direct imports between contexts. Go through the other context's public Application API.
- Pure utilities (`src/shared/`) may be used by any layer, but utilities never import a context.

> TODO(stack): once the real directory layout is decided, update the paths and enforce them with structural tests.
> Default layout: `src/<context>/{domain,application,infrastructure,presentation}/`

## 3. Invariants (enforced)

> **Enforce invariants, leave implementation free.**
> These are things that *must* hold. Each row states **what enforces it**.
> Rows marked "docs only" have not been promoted yet → turn them into lint/tests and update the enforcement column.

| # | Invariant | Enforced by | Status |
|---|---|---|---|
| I-1 | The agent never reads, writes or prints `.env*` files | harness plugin hook (protect-env) | ✅ enforced |
| I-2 | CLAUDE.md stays under 200 lines; every doc link resolves | `scripts/check-docs.mjs` | ✅ enforced |
| I-3 | Every doc in `design-docs/` and `product-specs/` is listed in its `index.md` | `scripts/check-docs.mjs` | ✅ enforced |
| I-4 | Dependencies point toward Domain; Domain has no external dependencies (§2) | TODO(stack): structural test / import lint | 📄 docs only |
| I-5 | External input (API responses, forms, files, env) is **parsed and validated at the boundary (Infrastructure / Presentation)** before it moves inward | TODO(stack): lint | 📄 docs only |
| I-6 | Structured logging only (no free-form strings like `console.log`) | TODO(stack): custom lint | 📄 docs only |
| I-7 | File size limit (e.g. 400 lines) | TODO(stack): custom lint | 📄 docs only |
| I-8 | Schema and type naming rules (§4) | TODO(stack): custom lint | 📄 docs only |
| I-9 | `docs/generated/` is modified only by its generator | docs only | 📄 docs only |
| I-10 | Edited files pass the formatter | harness plugin hook (format) | ✅ enforced |
| I-11 | The agent never commits, pushes, or runs irreversible git operations (`reset --hard`, `clean -f`, history rewrites) — the human does | harness plugin hook (git-guard) | ✅ enforced |

### Rules for writing custom lints
- Every error message includes **how to fix it**. That message is what the agent receives as its fix instruction.
  - Bad: `Invalid import`
  - Good: `Presentation must not import Infrastructure directly. Go through an Application use case. (ARCHITECTURE.md §2)`

## 4. Naming

<!-- TODO: make concrete once the stack is decided -->
- Use case: `<Verb><Target>` (e.g. `UpdateProfile`)
- Repository: interface `<Entity>Repository` (Domain) / implementation `<Tech><Entity>Repository` (Infrastructure, e.g. `HttpUserRepository`)
- Port: `<Capability>Port` / adapter: `<Tech><Capability>Adapter`
- Schema: `<Entity>Schema` (for parsing at the boundary)
- Screen: `<Name>Screen`

## 5. Free zone (not enforced)

- Library choices (validation, state management, styling, DI approach, ...). When you add one, leave a one-line reason in `docs/design-docs/`.
- How files are split **within** a layer; internal code style (except what the formatter handles).
- Code that differs from human stylistic taste: if it is **correct, maintainable and readable by the next agent**, it passes.
