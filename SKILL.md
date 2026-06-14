---
name: reviewing-code-modularity-skill
description: Use when reviewing or changing code structure so a codebase is easier to understand, change, test, or delete — including when the user uses no structural vocabulary, e.g. "this file does too much", "this is hard to test", "I keep editing the same thing in many places", or "this is a mess". Covers module boundaries, file splits, public APIs/exports, dependency direction, coupling/cohesion, shallow layers, over-abstraction, duplicated structural decisions, hard-to-test handlers/components, scattered error mapping, and refactors that move code across modules. Do not use for ordinary bug fixes, formatting, naming-only cleanup, or local edits that do not affect structure.
---

# Reviewing Code Modularity

## Goal

Reduce complexity by improving module ownership, public surfaces, information hiding, dependency direction, and testable seams — without adding architecture cosplay.

Prefer deep modules with small, stable public surfaces that hide implementation details, point dependencies in a clear direction, and stay testable at their boundaries. Use the smallest restructuring that makes code easier to understand, change, and test.

## Non-negotiables

These hold in every mode. They are the point of this skill — do not dilute them.

- Do not recommend Clean Architecture, DDD, hexagonal architecture, SOLID-heavy layering, repositories, factories, adapters, dependency injection, ports, or interfaces unless they solve present complexity in this codebase.
- Do not split files by line count. Split by responsibility.
- Do not add layers just because the current structure looks informal.
- Do not merge duplicated-looking code when the concepts may diverge. Duplication often beats a wrong abstraction.
- Do not introduce a seam for one implementation unless test pressure or coupling pressure is real.
- Do not propose a broad rewrite when a local restructuring solves the problem.
- Do not propose structure before reading the actual code and nearby patterns. Advice given sight-unseen is usually wrong.

## Core vocabulary

Use a consistent lens when terminology matters or when producing a report: module, public surface, implementation, responsibility, depth, shallow module, seam, leakage, locality, change amplification, architecture cosplay, recommendation strength. Load `references/language.md` for precise definitions. Prefer the repo's own word for a concept when it has one.

## Modes

Pick the mode that matches the task. Modes can chain: B → C → D is the full arc.

### Mode A: Fast modularity review
Use when reviewing a diff, file, or module and returning findings. Inspect the code, identify the structural problems that matter, report them ordered by risk with a minimal fix each. No candidate cards needed unless asked. This is the common case.

### Mode B: Architecture friction scan
Use when the user asks to improve structure, find refactoring opportunities, or review a messy area. Explore the area for friction, then produce candidate cards and a top recommendation using `references/review-report.md`. Check project context first via `references/decision-records.md`. After presenting candidates, ask which one to explore — unless the user already asked for implementation.

### Mode C: Candidate deepening design
Use after the user chooses one candidate. Run the deepening loop below. If the design is nontrivial, compare interface designs using `references/interface-design.md`. End with one strong recommendation.

### Mode D: Behavior-preserving implementation
Use when the user asks the agent to actually refactor. Make the smallest behavior-preserving change that realizes the chosen design. Preserve the candidate's "what not to change" guardrail. Then validate (see Validation).

## Candidate deepening loop

After Mode B presents candidates, ask which candidate the user wants to explore — unless the user already requested implementation.

When a candidate is selected:

1. Restate the candidate in one or two sentences.
2. Identify the constraints (existing conventions, public API stability, project context).
3. Identify what the new/changed module should **own**.
4. Identify what it should **hide**.
5. Identify the **public surface**.
6. Identify the tests that should survive unchanged (behavior contract).
7. Identify what **not** to refactor.
8. Recommend one design. If it is nontrivial, first compare designs via `references/interface-design.md`.

This turns the review from "here are findings" into a design conversation, without committing to a rewrite.

## Exploration checklist

Before proposing structure changes, inspect the current design — do not invent a new architecture until you understand the existing one:

- Folder layout, naming conventions, and import direction
- Nearby examples of similar features
- Existing test style and existing public exports
- Existing route/component/service boundaries
- Existing error-handling, validation, and schema conventions

For each module touched by the change, determine: What responsibility does it own? What should it hide? What is its public surface? Who imports it? What does it import? Can it be tested without booting the whole application?

## Complexity model

Treat complexity as anything that makes future changes harder. Watch for four forms:

- **Change amplification** — a small behavior change forces edits across many unrelated places (routes, services, serializers, tests, UI mappers).
- **Cognitive load** — one unit forces the reader to understand too much at once (a handler doing parsing, validation, business rules, queries, formatting, and error mapping).
- **Unknown unknowns** — hidden behavior or surprising dependencies (importing a module opens a DB connection; a function mutates its input).
- **Obscurity** — names or control flow hide intent (`manager`, `processor`, `helper` standing in for the real concept).

See `references/red-flags.md` and `references/principles.md` for the full catalog.

## Design guidance

The reasoning behind recommendations. Apply pragmatically; load the linked references only when a specific call needs the detail.

- **Module depth.** Prefer deep modules: a simple surface over useful behavior with internals hidden. Distrust shallow modules — pass-through methods, or a layer that exists only because "there should be a layer." A service that only forwards to a repository adds nothing unless it owns rules, orchestration, mapping, authorization, caching, retries, logging, or a test seam. See `references/principles.md` (Deep modules), `references/red-flags.md` (#1, #2).
- **Information hiding.** A design decision should usually live in one place. Hide details likely to change: storage format, external API shape, validation rules, defaults, error mapping, cache/retry behavior, framework request/response objects, query structure, date formatting, permission checks, env config. Red flag: the same constant, format, or transformation repeated across modules. See `references/principles.md` (Information hiding), `references/red-flags.md` (#3, #9).
- **Dependency direction.** Keep important policy depending on details as little as possible. Defaults: `routes -> services -> repositories` (backend), `pages -> feature components -> shared UI` (frontend), `public API -> internal -> low-level helpers` (library). Map these to the project's vocabulary; do not introduce layers just to match them. Watch for reversed direction. See `references/principles.md` (Dependencies).
- **Abstraction discipline.** Create an abstraction only under present pressure: multiple callers need the concept, a leaking detail must be hidden, tests need a seam, a change spreads across unrelated files, or a public surface needs simplifying. Not for "Clean Architecture says so," "SOLID needs an interface," "maybe later," or "the file is long." See `references/principles.md` (Abstractions).
- **File splitting.** Split by responsibility, not length. Good reasons: parts change for different reasons, one part is independently testable, the split hides a decision or shrinks the public surface, or it separates framework code from business logic. See `references/principles.md` (File splitting).
- **Naming and consistency.** Prefer names that reveal the concept. Distrust vague names (`manager`, `helper`, `utils`, `processor`, `handler`, `common`, `data`) unless a module scopes them. Keep operation names consistent and paired (`create/delete`, `add/remove`). See `references/red-flags.md` (#10, #11).
- **Error-handling structure.** Centralize error translation near the boundary; let services throw meaningful domain/application errors. Distinguish validation, not-found, conflict, auth, and unexpected errors; keep one consistent API error shape. Red flag: repeated try/catch and status mapping across routes. See `references/red-flags.md` (#26), `references/examples.md` (Example 10).

## Candidate report

When producing multiple candidates or a visual report (Mode B), use `references/review-report.md`. Markdown candidate cards are the default; an HTML report is opt-in for broad scans. Every candidate names a smallest useful fix, a before/after sketch, recommendation strength, and what not to change — and the report leads with a single top recommendation.

## Interface design

Use `references/interface-design.md` only after a candidate is selected (Mode C) and the design is nontrivial. Compare 2-4 materially different designs and end with one strong recommendation. This is not a license to add interfaces — the minimal surface often wins.

## Project context and ADRs

Before broad architecture recommendations, use `references/decision-records.md` to read existing context (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `CONTRIBUTING.md`, `docs/adr/`, …) when present. Do not mutate these docs by default. Surface a conflict only when the friction is real, mark it as conflicting, and leave the choice to the user. Offer an ADR only for decisions that are hard to reverse, surprising without context, and based on a real trade-off.

## Review output format

For Mode A reviews, lead with findings ordered by risk. For each: severity and file/line reference, why it increases complexity, minimal fix.

- **high** — causes change amplification or hidden bugs now (leaked decisions, reversed dependencies, side-effectful imports).
- **medium** — structure that will bite as the feature grows (shallow layers, mixed responsibilities, weak boundaries).
- **low** — cleanup safe to defer (naming, small duplication, cosmetic splits).

For implementation tasks (Mode D), close with: what changed, why this structure is better, what checks were run, remaining risks. For tiny changes, collapse into a short paragraph with checks.

For Mode B, use the candidate report format from `references/review-report.md`.

## Refactoring rules

When making changes:

- Prefer small structural improvements during feature work.
- Preserve behavior unless the user asks for a behavior change.
- Do not silently change public APIs.
- Do not move code without checking imports.
- Do not introduce new dependencies unless explicitly justified.
- Do not bundle an unrelated refactor into the change.

## Validation

After edits:

1. Run the smallest relevant tests.
2. Run typecheck if available.
3. Run lint if available.
4. Run import or dependency-boundary checks if available.
5. Inspect the final diff; confirm no unrelated refactor was introduced.
6. If validation cannot run, state that clearly.

## Reference loading

Use progressive disclosure. Use `rg` (or the Grep tool / `grep` if `rg` is unavailable); if the relevant section is not obvious, list headings first with `rg '^## ' references/*.md`, then read only the matching ranges. Do not recite references — apply them to the code at hand.

- `references/red-flags.md` — suspected problems; read only the relevant numbered red flags.
- `references/principles.md` — tradeoffs, dependency-direction and file-splitting detail; read only the relevant sections.
- `references/examples.md` — concrete restructuring examples when no nearby project pattern is enough.
- `references/language.md` — shared vocabulary when terminology matters or when producing a report.
- `references/review-report.md` — candidate report output (Mode B).
- `references/interface-design.md` — design exploration for a chosen candidate (Mode C).
- `references/decision-records.md` — project-context and ADR handling before broad recommendations.
