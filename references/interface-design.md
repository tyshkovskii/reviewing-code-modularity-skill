# Interface Design

Use only after a modularity candidate is selected and the design is nontrivial — a new public surface, a moved boundary, or a genuine choice between shapes. Do not use this to justify creating interfaces. Most candidates need one obvious design, not a design exploration.

The goal is to compare *materially different* shapes and recommend one. If the alternatives differ only cosmetically, you do not need this file — propose the one shape and move on.

## Process

Generate 2 to 4 designs that differ in what the public surface is and what it hides. Skip any design whose precondition the code does not meet.

### Design A: Minimal surface
- 1-3 public entry points; hide sequencing and implementation detail behind them.
- Prefer a boring, direct implementation.
- This is usually the right default.

### Design B: Caller-optimized
- Make the most common caller trivial; keep uncommon cases possible but not dominant.
- Optimize the surface for how the code is actually called today, not all callers equally.

### Design C: Extension-friendly
- Only when *multiple real variations already exist* in the codebase.
- Avoid speculative extension points. One variation is not a reason.

### Design D: Seam / adapters
- Only when there are two or more real implementations, or a test seam is justified by real coupling pressure you can point to.
- A single implementation with no testing pain does not justify this design.

## Output

For each design include:

1. **Public surface** — the exact functions/types a caller sees.
2. **Example caller code** — the smallest realistic call site.
3. **What the implementation hides** — the decisions kept off the surface.
4. **Testing strategy** — what becomes testable and how.
5. **Tradeoffs** — what this shape costs.
6. **Why this might be wrong** — the honest failure mode.

End with one **strong recommendation** and a one-line reason. Do not hedge across all designs equally; pick one and say why the others lose for this code.

## Guardrail

Comparing designs is not a license to add abstraction. If, after the comparison, the minimal surface still wins, that is a successful design exploration — not a failure to be "architectural." Carry the chosen candidate's *what not to change* note through to implementation.
