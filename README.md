[![skills.sh](https://skills.sh/b/tyshkovskii/reviewing-code-modularity-skill)](https://skills.sh/tyshkovskii/reviewing-code-modularity-skill)

# reviewing-code-modularity-skill

A coding-agent skill for reducing code complexity without architecture cosplay.

Use it when a file, module, route, component, or service is hard to change, hard to test, leaking details, growing fake layers, or forcing the same change across too many places.

It helps an agent reason about module boundaries, coupling, cohesion, public surfaces, naming consistency, information hiding, dependency direction, and testable seams — and decide when an abstraction is actually worth introducing. The stance is pragmatic: reduce real complexity, preserve local conventions, and add structure only when it solves a present problem. It will not turn a small project into Clean Architecture, DDD, SOLID, or DI theater.

## What it produces

Depending on the task, the skill can produce:

- focused modularity findings for a file, diff, or module
- a candidate-based architecture review with a single top recommendation
- before/after structure sketches
- interface alternatives for a selected restructuring
- behavior-preserving implementation guidance
- validation steps after refactoring

It works in four modes — fast review, architecture friction scan, candidate deepening design, and behavior-preserving implementation — and chains them (scan → choose a candidate → design → implement) when the task calls for it.

## Not for

This is not a Clean Architecture generator, DDD generator, SOLID checklist, or dependency-injection template. It should not make small projects look enterprise. It should reduce real complexity.

## Example prompts

- "Review this PR for modularity problems."
- "This route does too much. Help me split it without overengineering."
- "Find shallow layers in this backend."
- "This React component is hard to test. What structure would improve it?"
- "Scan this codebase for refactoring candidates and give me a top recommendation."
- "Explore candidate 2 and design the public API."

## Full workflow example

The skill works in four modes (fast review, architecture friction scan, candidate deepening design, behavior-preserving implementation) and chains them when the task is broad:

1. **"Scan this backend for modularity refactor candidates."**
   → a candidate report: a top recommendation plus 1–4 candidates, each with current friction, why complexity increases, the smallest useful fix, a before/after sketch, testing impact, what not to change, and a recommendation strength.
2. **"Explore candidate 1."**
   → what the module owns and hides, its public surface, example caller code, the tests that should survive, what not to refactor, and — if the decision is nontrivial — 2–4 materially different designs ending in one strong recommendation.
3. **"Implement the smallest safe version."**
   → a behavior-preserving refactor that keeps the public API stable, plus validation (smallest relevant tests, typecheck, lint, import checks) and a summary of changed files and remaining risk.

A small, well-scoped request stops at step 1's fast-review equivalent — concise findings, no candidate cards.

## Project Layout

```txt
reviewing-code-modularity-skill/
  SKILL.md
  references/
    principles.md
    red-flags.md
    examples.md
    language.md
    review-report.md
    interface-design.md
    decision-records.md
  evals/
    trigger-queries.json
    evals.json
```

`SKILL.md` contains the runtime instructions and trigger description. `references/` contains detailed material the agent should load only when needed. `evals/` holds trigger and output-quality evals used during development; it is not part of the installed runtime payload.

## Install

Install with the [skills.sh](https://skills.sh) CLI:

```sh
npx skills add tyshkovskii/reviewing-code-modularity-skill
```

This downloads the runtime payload and records it in `skills-lock.json`.

### Install Manually

Alternatively, copy the runtime skill files into your skills directory:

```txt
~/.agents/skills/reviewing-code-modularity-skill/
```

or inside a repository:

```txt
.agents/skills/reviewing-code-modularity-skill/
```

The installed skill should include only the runtime payload (`SKILL.md` and `references/`, not `evals/`):

```txt
reviewing-code-modularity-skill/
  SKILL.md
  references/
    principles.md
    red-flags.md
    examples.md
    language.md
    review-report.md
    interface-design.md
    decision-records.md
```

## Development Checks

After editing the skill:

- Re-check that `SKILL.md` stays concise and points to references instead of duplicating them.
- Confirm examples do not accidentally teach architecture cosplay, pass-through layers, or speculative abstractions.

## License

MIT
