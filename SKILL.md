---
name: reviewing-code-modularity
description: Use when reviewing or changing code structure so a codebase is easier to understand, change, test, or delete — including when the user uses no structural vocabulary, e.g. "this file does too much", "this is hard to test", "I keep editing the same thing in many places", or "this is a mess". Covers module boundaries, file splits, public APIs/exports, dependency direction, coupling/cohesion, shallow layers, over-abstraction, duplicated structural decisions, hard-to-test handlers/components, scattered error mapping, and refactors that move code across modules. Do not use for ordinary bug fixes, formatting, naming-only cleanup, or local edits that do not affect structure.
---

# Reviewing Code Modularity

## Goal

Improve code structure by reducing complexity.

Prefer deep modules with small, stable public APIs that hide implementation details, point dependencies in a clear direction, and stay testable at their boundaries.

Avoid architecture cosplay. Do not add layers, interfaces, factories, dependency injection, repositories, adapters, or design patterns unless they reduce real complexity in the current codebase.

## Core rule

Before changing structure, inspect the existing code.

Preserve local conventions unless they are clearly causing complexity. Use the smallest restructuring that makes the code easier to understand, change, and test.

Do not force every project into Clean Architecture, hexagonal architecture, DDD, SOLID-heavy structure, or enterprise layering.

## Gotchas

Concrete corrections to mistakes that are easy to make here:

- Do not propose a restructuring before reading the actual code and nearby patterns. Generic layer advice given sight-unseen is usually wrong.
- Do not treat file length as a reason to split. Split by responsibility, not line count.
- Do not add service/repository/use-case layers just to match the example dependency directions below. Map those directions to the project's existing vocabulary.
- Do not merge duplicated-looking code when the concepts may diverge. Duplication often beats a wrong abstraction.
- Do not introduce interfaces, factories, or dependency injection for a single implementation with no test-seam or coupling pressure.
- When unsure whether a structure is actually a problem, search `references/red-flags.md` before flagging it.
- Do not bundle an unrelated refactor into the change, and preserve behavior unless a change is requested.

## Workflow

1. Understand the requested behavior or problem.
2. Inspect the current project structure and nearby code.
3. Identify the modules touched by the change.
4. For each touched module, determine:
   - What responsibility does it own?
   - What should it hide?
   - What is its public API?
   - Who imports it?
   - What does it import?
   - Can it be tested without booting the whole application?
5. Look for complexity red flags.
6. Propose the smallest useful restructuring.
7. Avoid speculative abstractions.
8. Match the action to the task type: for review/design tasks, report recommendations only; for implementation tasks, make the smallest behavior-preserving change.
9. If edits were made, validate the change (see Validation below).
10. Summarize tradeoffs and remaining risks.

## First inspection checklist

Before proposing structure changes, inspect:

- Existing folder layout
- Existing naming conventions
- Existing import direction
- Nearby examples of similar features
- Existing test style
- Existing public exports
- Existing route/component/service boundaries
- Existing error-handling conventions
- Existing validation and schema conventions

Do not invent a new architecture until you understand the current one.

## Complexity model

Treat complexity as anything that makes future changes harder. Watch for four forms:

- **Change amplification** — a small behavior change forces edits across many unrelated places (routes, services, serializers, tests, UI mappers).
- **Cognitive load** — one unit forces the reader to understand too much at once (a handler doing parsing, validation, business rules, queries, formatting, and error mapping).
- **Unknown unknowns** — hidden behavior or surprising dependencies (importing a module opens a DB connection; a function mutates its input).
- **Obscurity** — names or control flow hide intent (`manager`, `processor`, `helper` standing in for the real concept).

See `references/red-flags.md` and `references/principles.md` for the full catalog.

## Module depth

Prefer deep modules: a simple interface over useful behavior with internals hidden, so callers carry little burden.

Distrust shallow modules: an interface almost as complicated as the implementation, pass-through methods, or layers that exist only because "there should be a layer." A service that only forwards to a repository adds nothing unless it owns rules, orchestration, mapping, authorization, caching, retries, logging, or a test seam.

See `references/principles.md` (Deep modules) and `references/red-flags.md` (#1, #2).

## Information hiding

A design decision should usually live in one place. Hide details likely to change: storage format, external API shape, validation rules, defaults, error mapping, cache/retry behavior, framework request/response objects, query structure, date formatting, permission checks, and environment config.

Red flag: the same constant, format, default, validation, or transformation repeated across modules, or callers that know storage or internal-sequencing details.

See `references/principles.md` (Information hiding) and `references/red-flags.md` (#3, #9).

## Dependency direction

Keep dependencies pointing so that important policy depends on details as little as possible. Defaults: `routes -> services -> repositories` (backend), `pages -> feature components -> shared UI` (frontend), `public API -> internal -> low-level helpers` (library). Map these directions to the project's existing vocabulary; do not introduce service/repository layers just to match these examples.

Watch for reversed direction: db importing services, business logic importing the route framework, shared utilities importing feature code, low-level helpers importing app config.

See `references/principles.md` (Dependencies) for the direction diagrams.

## Abstraction discipline

Create an abstraction only when it solves present pressure: multiple callers need the concept, a leaking detail must be hidden, tests need a seam, a change spreads across unrelated files, or a public API needs simplifying. Do not abstract for "Clean Architecture says so," "SOLID needs an interface," "maybe later," or "the file is long."

See `references/principles.md` (Abstractions) for the good/bad reasons lists.

## File splitting

Split by responsibility, not by length. Good reasons: parts change for different reasons, one part is independently testable, the split hides a design decision or shrinks the public API, or the file mixes framework code with business logic. Bad reasons: an arbitrary line count, one-function-per-file, or making the diff look architectural.

See `references/principles.md` (File splitting).

## Naming and consistency

Prefer names that reveal the concept, not implementation mechanics. Distrust vague names (`manager`, `helper`, `utils`, `processor`, `handler`, `common`, `data`) unless a module scopes them precisely. Keep operation names consistent and pair them deliberately (`create/delete`, `add/remove`, `start/stop`); do not mix domain naming with database naming in public APIs.

See `references/red-flags.md` (#10, #11).

## Error-handling structure

Prefer simple, consistent error semantics. Centralize error translation near the boundary; let services throw meaningful domain/application errors and let lower layers hide recoverable details. Distinguish validation, not-found, conflict, auth, and unexpected errors, and keep one consistent API error shape.

Red flag: repeated try/catch and status mapping scattered across routes.

See `references/red-flags.md` (#26) and `references/examples.md` (Example 10).

## Review output format

When reviewing code structure, lead with findings ordered by risk. For each finding, include:

```txt
- Severity and file/line reference
- Why it increases complexity
- Minimal fix
```

Use this severity scale:

- **high** — causes change amplification or hidden bugs now (leaked decisions, reversed dependencies, side-effectful imports).
- **medium** — structure that will bite as the feature grows (shallow layers, mixed responsibilities, weak boundaries).
- **low** — cleanup that is safe to defer (naming, small duplication, cosmetic splits).

Add better long-term structure, what not to change, and validation steps only when useful.

For implementation tasks, usually use this final-response format. For tiny changes, collapse it into a short paragraph with checks.

```txt
1. What changed
2. Why this structure is better
3. What checks were run
4. Remaining risks or tradeoffs
```

For design-only tasks, use this format:

```txt
Recommended structure
Why this structure works
Where each responsibility lives
What to avoid
When to introduce more structure later
```

## Refactoring rules

Quick-reference checklist for when you are making changes (the sections above give the reasoning; the anti-enterprise and anti-premature-abstraction rules live in Goal, Core rule, and Abstraction discipline):

- Prefer small structural improvements during feature work.
- Preserve behavior unless the user asks for a behavior change.
- Do not silently change public APIs.
- Do not move code without checking imports.
- Do not introduce new dependencies unless explicitly justified.
- Do not merge duplicated-looking code if the concepts may evolve separately.
- Do not split by technical category if feature ownership is clearer, nor by feature if it duplicates shared policy or invariants.

## Validation

After edits:

1. Run the smallest relevant tests.
2. Run typecheck if available.
3. Run lint if available.
4. Run import or dependency-boundary checks if available.
5. Inspect the final diff.
6. Confirm no unrelated refactor was introduced.
7. If validation cannot run, state that clearly.

## Use references when needed

Use the files in `references/` only when they are needed (use `rg`, or `grep`/the Grep tool if `rg` is unavailable). If the relevant section is not obvious, list headings first with `rg '^## ' references/*.md`, then read only the matching section ranges.

- Search `references/red-flags.md` for focused review concerns; read only the relevant numbered red flags.
- Search `references/examples.md` when proposing a restructuring and no nearby project pattern is enough; read only the relevant example.
- Search `references/principles.md` for design-only discussions, dependency-direction and file-splitting detail, or non-obvious tradeoffs; read only the relevant principle sections.
- Read a full reference file only as a last resort after inspecting the code and confirming the whole catalog is needed.

Do not recite the references unless useful. Apply them to the code at hand.
