# Interface Design

Use only after a modularity candidate is selected, or when the user explicitly asks for public API / interface design. Use it only when the decision is nontrivial — a new public surface, a moved boundary, or a genuine choice between shapes. Do not use this to justify creating interfaces. Most candidates need one obvious design, not a design exploration.

The goal is to compare *materially different* shapes and recommend one. If the alternatives differ only cosmetically, you do not need this file — propose the one shape and move on. Never invent an artificial interface to fill out the comparison.

## Process

For a genuine choice, compare 2 to 4 designs that differ in what the public surface is and what it hides. These are optional shapes, not required slots; skip any whose precondition the code does not meet. One obvious design needs no comparison.

### Design A: Minimal surface
- Hide sequencing and implementation detail behind the operations callers actually need; do not optimize an arbitrary export count.
- Prefer a boring, direct implementation.
- This is usually the right default.

### Design B: Caller-optimized
- Make the most common caller trivial; keep uncommon cases possible but not dominant.
- Optimize the surface for how the code is actually called today, not all callers equally.

### Design C: Extension-friendly
- Only when *multiple real variations already exist* in the codebase.
- Avoid speculative extension points. One variation is not a reason.

### Design D: Seam / adapters
Allowed only with real, present pressure you can point to — at least one of:
- Multiple implementations already exist.
- Existing behavior tests are nondeterministic, prohibitively costly, or cannot run reliably without controlling a dependency; identify the affected tests and cost.
- An external dependency's coupling is actively hurting the code.
- The public API is leaking implementation details that a seam would contain.

A single implementation with no testing pain does not justify this design.

## Output

For each design include:

1. **Public surface** — the exact functions/types a caller sees.
2. **Example caller code** — the smallest realistic call site.
3. **What the implementation hides** — the decisions kept off the surface.
4. **Testing strategy** — what becomes testable and how.
5. **Tradeoffs** — what this shape costs.
6. **Why this might be wrong** — the honest failure mode.

End with one **strong recommendation** and a one-line reason, which may be to keep the current design. Name a missing fact when it prevents a defensible choice instead of manufacturing certainty.

## Optional: change-impact exercise

Use for a costly or disputed boundary decision, not every review. Choose one or two actual planned requirements or recent representative changes from the user, issue, or history; cite their source. If none are available, skip this exercise rather than inventing future needs.

Trace how each change would work under the current design and the proposed one:

| Compare | What to inspect |
| --- | --- |
| Knowledge and ownership | Which callers must understand the changed decision, and which independent owners must coordinate? |
| Contract and verification | Which APIs, behavior tests, and failure paths change? What remains hidden? |
| New cost | Which extra call hops, concepts, adapters, mapping, initialization, or migration does the proposal require? |

Explain the net effect and the assumptions behind it. File count, export count, or shorter methods alone do not measure complexity; moving one decision into five files can still increase indirection. Keep this a reasoning exercise unless implementation or a prototype was requested. Prefer the current design when the improvement does not cover its cost.

## Guardrail

Comparing designs is not a license to add abstraction. If, after the comparison, the minimal surface still wins, that is a successful design exploration — not a failure to be "architectural." Carry the chosen candidate's *what not to change* note through to implementation.
