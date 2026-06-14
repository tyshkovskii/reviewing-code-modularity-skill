# Decision Records and Project Context

Before broad architecture recommendations (Mode B, or any recommendation that moves code across modules), check for existing project context. The goal is to avoid recommending against decisions the project already made deliberately.

## Read when present

Inspect these if they exist; do not assume they do:

- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT.md`
- `CONTEXT-MAP.md`
- `CONTRIBUTING.md`
- `docs/adr/` (architecture decision records)
- `docs/architecture/`
- `docs/design/`

Use `rg --files` or a quick `ls` rather than assuming paths. Read only what is relevant to the area under review.

## Do not mutate docs by default

A review does not create or edit these files. Reading is the default; writing happens only when the user asks, or when the narrow ADR condition below is met *and* the user agrees.

## When a recommendation conflicts with an existing decision

Do not silently ignore a documented decision, and do not silently override it.

- Surface the conflict **only if the current friction is real** — if the code is fine, drop the recommendation.
- Mark the recommendation clearly as *conflicting with an existing decision*, and cite which doc.
- Explain what changed since the decision, or what the decision did not anticipate, that makes revisiting it reasonable.
- Leave the choice to the user. The decision's owner gets to overrule the review.

## When to offer an ADR

Offer to record a decision only when **all three** hold:

1. The decision is hard to reverse (data model, public API contract, cross-team boundary).
2. A future maintainer would be confused or re-litigate it without the context.
3. There were real alternatives and a real trade-off — not just "we picked the obvious option."

A good moment: the user *rejects* a structural recommendation for a reason that is load-bearing and likely to be re-suggested later. Recording why it was rejected saves the next reviewer (human or agent) from raising it again.

Offer; do not write unprompted. If the user agrees, keep the ADR short: context, decision, alternatives considered, consequences.
