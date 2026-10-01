# Review Report

Use this for Mode B architecture friction scans or an explicit candidate request. Mode A uses concise findings, not candidate cards. Return Markdown in the conversation by default; create a report file only when requested.

Apply the evidence checks in `SKILL.md` before formatting the result. Report **0–4 supported candidates**, not a quota. A no-change recommendation is useful. Do not confuse a limited inspection with proof that the whole codebase is sound.

## Scope and top recommendation

Start with the single most useful action, which may be to leave the structure alone. State the area or PR comparison inspected and material coverage gaps briefly. For a PR, distinguish introduced/worsened issues from existing debt.

If no candidate meets the evidence checks, stop after the no-change recommendation and coverage note. Do not produce empty cards or fill space with speculative ideas. If friction is established but no remedy clearly wins, say what limited design comparison would resolve it.

## Candidate contents

Use only the detail needed to assess the recommendation; short candidates can be one paragraph. For a substantial candidate, this shape is useful:

```md
### [Short title]

**Impact:** high | medium | low — [concrete consequence]
**Evidence:** Demonstrated | Supported
**Scope:** Introduced/worsened | Existing [for a PR]
**Strength:** Strong | Worth exploring
**Locations:** [inspected files/symbols and relevant callers]

[Current friction, the affected operation or actual planned change, and the
dependency or duplicated knowledge causing the cost. Distinguish observation
from inference and explain why the strongest counter-explanation does not fit.]

**Smallest useful fix:** [Behavior-preserving change and what it costs,
including migration and added indirection.]

**Testing impact:** [Which behavior checks remain valid or become practical.]
**What not to change:** [The specific over-refactor risk to avoid.]
```

Add a small before/after call or dependency sketch only when it clarifies the changed boundary. Do not include full diffs or repeat the prose in diagram form. Do not force a field into a report when it is inapplicable; the reasoning matters more than the template.

Unresolved leads are not candidates. Mention a missing caller, inaccessible dependency, or unavailable comparison as a limitation only when it materially limits the conclusion. Do not turn a lack of evidence into a confident clean bill of health.

## Optional: HTML report

Use HTML only after an explicit HTML or visual-report request. A broad scan, a request for a thorough review, or the availability of a renderer does not authorize an HTML artifact.

- Keep the same evidence, impact, scope, and recommendation content; visual polish is secondary.
- Create a self-contained file at the user-requested destination or the host's designated artifact location. Keep generated reports out of the reviewed repository unless requested there.
- Use simple inline styling. Do not require a frontend framework or a build step just to show findings.
- Present the actual artifact location or link supported by the host. Do not create a report file merely to store an otherwise conversational review.
