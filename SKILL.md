---
name: reviewing-code-modularity-skill
description: Review module boundaries, coupling, public APIs, and refactors for concrete complexity and unnecessary abstraction. Use for structural reviews or requests such as "this file does too much", "hard to test", "split this file", or "the same change touches many places". Exclude ordinary bug fixes, formatting, and naming-only edits that do not affect structure.
---

# Reviewing Code Modularity

## Goal

Reduce code complexity without architecture cosplay.

Improve module ownership, public surfaces, information hiding, dependency direction, and testable seams. Prefer deep modules with small, stable public surfaces and clear dependency direction. Use the smallest restructuring that makes code easier to understand, change, and test — never more.

## Non-negotiables

These hold in every mode. They are the point of this skill — do not dilute them.

1. Inspect the actual code and nearby conventions before recommending structure. Advice given sight-unseen is usually wrong.
2. Do not split files by line count. Split by responsibility, or not at all.
3. Do not create Clean Architecture, DDD, hexagonal layering, SOLID-heavy layering, repositories, factories, adapters, dependency injection, ports, or interfaces unless they solve present complexity in this codebase.
4. Do not introduce interfaces, factories, or DI for a single implementation unless there is real test-seam or coupling pressure.
5. Do not merge duplicated-looking code if the concepts may evolve separately. Duplication often beats a wrong abstraction.
6. Do not propose a broad rewrite when a local restructuring solves the problem.
7. Preserve behavior unless the user explicitly asks for a behavior change.
8. Do not create architecture/report artifacts or rewrite ADRs unless requested. Keep existing API or usage documentation accurate when an authorized code change affects it.

## Core vocabulary

When terminology matters or you produce a report, use a consistent lens: module, public surface, implementation, responsibility, depth, shallow module, seam, leakage, locality, change amplification, architecture cosplay, recommendation strength. Definitions in `references/language.md`. Prefer the repo's own word for a concept when it has one.

## Establish scope

1. Follow applicable project instructions. Inspect the code, nearby conventions, public exports, and relevant tests. Read architecture decisions when a recommendation is broad or moves a boundary — see `references/decision-records.md`.
2. For a PR/diff, establish the supplied comparison or base/head and read the actual diff. Verify that the range represents the requested change; an empty or unavailable diff is a coverage limitation, not a clean review. Distinguish introduced/worsened problems from existing debt. For an area scan, identify the area inspected and material gaps.
3. Trace the relevant callers and dependencies around a suspected boundary. Ask what the module owns and hides, which decisions callers must know, and what its tests require. Expand inspection to resolve a named uncertainty, not to map the entire repository by default.
4. Keep review and design work read-only unless the user requests edits. Produce report files only when requested; HTML requires an explicit HTML or visual-report request. Broad scope alone is not permission to create an artifact.

## Admit findings on evidence

Treat a smell as a lead, not a verdict. Before reporting a finding:

- Identify the affected operation, current maintenance problem, or concrete planned change. Trace the dependency or duplicated knowledge causing the cost; cite inspected code and relevant callers.
- Check the strongest reasonable counter-explanation: a compatibility contract, intentional duplication, framework convention, or documented decision. A wrapper may protect a real boundary without adding business logic.
- Compare the smallest useful intervention with leaving the code alone. Include new indirection, migration, and testing costs; fewer files or exports alone do not establish improvement.
- Separate **impact** (consequence), **evidence** (Demonstrated | Supported | Unresolved), and **scope** (Introduced/worsened | Existing). Missing evidence means unresolved, not disproven. Keep unresolved leads out of actionable findings; mention a material coverage gap when useful.

Do not report cosmetic preferences or hypothetical growth as defects. Zero actionable findings is a successful result. These are reasoning checks, not a required report template. Load relevant sections of `references/red-flags.md` or `references/principles.md` only when they help resolve the decision.

## Mode selection

| Mode | Use when | Output |
| --- | --- | --- |
| **A — Fast review** | Review a file, diff, PR, module, route, component, or small area. | Findings ordered by risk. No candidate cards. |
| **B — Friction scan** | Scan a codebase or area for refactoring candidates, improve structure, find boundaries, or ask for a top recommendation. | Up to four supported candidates, or no change recommended. |
| **C — Candidate deepening** | A candidate is chosen, or the user asks to design a public surface/interface. | Owns/hides/surface + design comparison. |
| **D — Implementation** | The user asks the agent to actually refactor. | Smallest behavior-preserving change + validation. |

Default to the smallest mode that fits. Chain B → C → D when the user requests that work; breadth alone does not authorize implementation. A direct refactor request may enter D without a report or design ceremony.

### Mode A: Fast modularity review

Apply the evidence checks and report actionable findings ordered by impact. For each finding:

- **Impact** — high for substantial demonstrated change amplification or a supported correctness risk; medium for a concrete recurring maintenance or testing burden; low for a real but local, low-cost issue. Explain the consequence; pattern names do not set severity.
- **Evidence and location** — cite file/line or an exact symbol in inspected code, and distinguish demonstrated behavior from an inference. State whether the PR introduced/worsened the issue; keep existing debt separate.
- **Why it increases complexity** — name the affected operation and mechanism.
- **Smallest useful fix** — behavior-preserving.
- **What not to change** — only when there is a real over-refactor risk to head off.

If none qualify, say so with a brief coverage note. Do not use candidate cards unless asked. Concise findings are the product.

### Mode B: Architecture friction scan

Explore the area for friction, then produce a candidate report using `references/review-report.md`:

- A single **top recommendation** first, which may be to leave the structure alone.
- **0–4 candidates** that meet the evidence checks, each with: current friction and locations, impact/evidence/scope, smallest useful fix and its cost, a useful before/after sketch, testing impact, what not to change, and recommendation strength. Do not fill a quota or promote unresolved leads into candidates.

Return Markdown in the conversation by default. If further design or implementation was requested, continue within that scope; otherwise finish the review. Ask for a choice only when materially different options need the user's judgment.

### Mode C: Candidate deepening design

Use after the user selects a candidate or asks to design a public surface. Produce:

1. What the module **owns**.
2. What it **hides**.
3. The **public surface**.
4. **Example caller code** — the smallest realistic call site.
5. The **tests that should survive** unchanged (the behavior contract).
6. What **not** to refactor.
7. **2–4 materially different designs**, only when the decision is nontrivial.
8. **One recommendation**, with a reason and any material uncertainty. Keeping the current boundary may win.

Load `references/interface-design.md` for a nontrivial comparison. One obvious design is enough. For costly boundary decisions, its optional change-impact exercise compares an actual planned requirement under the current and proposed structures. Do not invent speculative requirements to justify a refactor.

### Mode D: Behavior-preserving implementation

Use when asked to actually refactor. Before editing:

- Identify the affected behavior contract from callers and tests: outputs, errors, public signatures, and relevant side effects, ordering, transactions, or initialization.
- Establish a baseline with the focused existing checks. Record pre-existing failures. If important behavior affected by the move is uncovered, add a small characterization check with expectations derived from the existing contract; do not freeze an acknowledged bug as intended behavior.
- If checks cannot run, state the limitation and use available evidence without claiming verified equivalence.

Then:

- Make the **smallest behavior-preserving change** that realizes the chosen design.
- Preserve public APIs and caller-visible semantics except for contract changes the user explicitly requested; update affected callers, tests, and usage documentation for those changes. Do not invent auth, auditing, retries, validation, or error behavior to give a new layer a purpose. Separate any requested behavior change from the structural move.
- Update imports carefully; do not move code without checking callers.
- Keep unrelated cleanup out of the change.
- Carry the candidate's "what not to change" guardrail through.
- Then validate.

Close with: what changed, why the structure is better, what checks were run, and remaining risk. For tiny changes, collapse this into a short paragraph.

## Validation

After edits:

1. Re-run the baseline checks and affected behavior tests, including caller tests where the boundary changed.
2. Use the project's relevant typecheck, lint, and import/dependency-boundary checks. Broaden validation for a concrete remaining risk or a required project gate, not merely because another command exists.
3. Inspect the final diff; confirm no unrelated refactor crept in.
4. If validation cannot run, state that clearly.

## Reference loading

Use progressive disclosure. Resolve these paths relative to this skill's directory, not the project being reviewed. If the right section is unclear, list reference headings with `rg '^## ' <skill-directory>/references/*.md` (or an equivalent file reader), then read the relevant section. Apply references; do not recite them. Evaluation fixtures and rubrics are development material, not runtime references.

- `references/principles.md` — design tradeoffs: deep modules, information hiding, dependency direction, abstraction discipline, file splitting.
- `references/red-flags.md` — suspected problems; read only the relevant numbered red flags.
- `references/examples.md` — concrete restructurings when no nearby project pattern is enough.
- `references/language.md` — shared vocabulary when terminology matters or when producing a report.
- `references/review-report.md` — candidate report format (Mode B); not for Mode A fast reviews unless asked.
- `references/interface-design.md` — design exploration for a chosen candidate (Mode C).
- `references/decision-records.md` — project-context and ADR handling before broad recommendations.
