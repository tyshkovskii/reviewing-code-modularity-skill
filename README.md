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
- an explicit no-change recommendation when the evidence does not justify a refactor

Findings must identify an affected operation or concrete change, trace the relevant callers and shared knowledge, and survive a reasonable counter-explanation. The report separates impact, evidence, and whether the problem was introduced by the change. A pattern name, file length, or speculative future requirement is not enough.

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
   → a recommendation plus up to four supported candidates, each with code evidence, current friction, the smallest useful fix and its cost, testing impact, and what not to change. Zero candidates is valid.
2. **"Explore candidate 1."**
   → what the module owns and hides, its public surface, example caller code, the tests that should survive, what not to refactor, and — if the decision is nontrivial — 2–4 materially different designs ending in one strong recommendation.
3. **"Implement the smallest safe version."**
   → a refactor grounded in a pre-edit behavior contract and test baseline, followed by relevant validation and a summary of changed files and remaining risk.

A small, well-scoped request stops at step 1's fast-review equivalent — concise findings, no candidate cards.

For a costly design decision, the optional change-impact exercise compares how an actual planned requirement would work under the current and proposed boundaries. It includes migration and indirection costs. It does not manufacture future requirements or treat fewer files as proof of improvement. See [interface-design.md](references/interface-design.md).

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
    rubric.json
    fixtures.json
    fixtures/
    prepare-run.mjs
    check-run.mjs
    verify.mjs
    README.md
```

`SKILL.md` contains the runtime instructions and trigger description. `references/` contains detailed material the agent should load only when needed. `evals/` is development-only: actual code fixtures, behavior contracts, task preparation, and separate grading expectations. Do not load it while using the skill to review another project.

## Install

Install with the [skills.sh](https://skills.sh) CLI:

```sh
npx skills add tyshkovskii/reviewing-code-modularity-skill
```

Installation behavior depends on the CLI version. Keep evaluation data out of the agent's runtime context; the runtime files are `SKILL.md` and `references/`.

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

- Run `node evals/verify.mjs` to check the evaluation manifest, fixture paths, and executable behavior contracts (Node.js 22+; no dependencies).
- Follow [evals/README.md](evals/README.md) for isolated **no-skill / current / candidate** runs, held-out cases, and blind grading. Test activation separately from review quality.
- Compare useful findings, missed problems, false positives, preservation of behavior, and runtime cost. Do not reward particular filenames or architectural vocabulary.
- Re-check that examples preserve their stated contracts and that conditional references agree with the main workflow.

Passing the deterministic checks proves the fixtures work. It does **not** establish that the skill improves agent performance. Report model/harness, repetitions, held-out results, and limitations when publishing comparisons.

## License

MIT
