# Review Report

Two output levels for a modularity review. Markdown is the default. HTML is opt-in for broad architecture scans. Use the vocabulary in `language.md` (public surface, leakage, shallow module, locality, change amplification, recommendation strength).

A report is only as good as its restraint. A "Top recommendation" plus one or two strong candidates beats a long list of speculative ones. Do not pad the report to look thorough.

## Default: Markdown candidate report

Use this for any review, structure-advice, or friction-scan response. Present candidates ordered by strength, with the single most important action surfaced first.

````md
# Modularity Review

## Top recommendation
[One direct, behavior-preserving action. The single highest-leverage change. If nothing rises to "Strong," say so plainly and explain why the area is fine.]

## Candidate 1: [short title]
**Strength:** Strong | Worth exploring | Speculative
**Files:** `path/one`, `path/two`

**Current friction:**
[What hurts today, grounded in the actual code. Not a generic concern.]

**Why it increases complexity:**
[Name the mechanism using shared vocabulary: change amplification, leakage, shallow module, low locality, reversed dependency.]

**Smallest useful fix:**
[The minimal behavior-preserving change that removes the friction. Not a rewrite.]

**Before**
```txt
[small dependency / call sketch of the current shape]
```

**After**
```txt
[small sketch of the proposed shape]
```

**Testing impact:**
[How tests get simpler, more meaningful, or possible at all.]

**What not to change:**
[Explicit guardrail against over-refactor — the layers/interfaces/abstractions NOT to add.]

## Candidate 2: [short title]
[...same structure...]
````

Guidance:

- Cap candidates at what is genuinely worth raising — usually 1 to 4. Quality over count.
- The before/after sketches are dependency or call-shape sketches, not full diffs. Keep them small enough to read at a glance.
- Every candidate must name *what not to change*. This is where this skill differs from generic architecture tools.
- If a candidate's only justification is a hypothetical future, mark it Speculative and keep it short.

## Optional: HTML report

Use only when the user asks for a full/visual architecture report, or when the task is a broad architecture scan across many modules and a memorable artifact helps.

Rules:

- Markdown stays the default. HTML is never the default for a normal review.
- Write a single self-contained `.html` file to a temp directory (e.g. `/tmp` or the OS temp dir), **not** into the repo. Report the path.
- Reuse the candidate-card structure above: top recommendation, then cards with strength, files, friction, before/after, testing impact, and what-not-to-change.
- Before/after diagrams can be simple boxes-and-arrows. Do not require Tailwind, Mermaid, or a build step. Inline minimal CSS is enough.
- Do not let visual polish become the work. The findings are the product; the HTML is a wrapper.

Minimal skeleton:

```html
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Modularity Review</title>
<style>
  body{font:16px/1.5 system-ui;margin:2rem auto;max-width:60rem;padding:0 1rem}
  .card{border:1px solid #ddd;border-radius:8px;padding:1rem 1.25rem;margin:1rem 0}
  .strong{color:#1a7f37}.exploring{color:#9a6700}.speculative{color:#6e7781}
  pre{background:#f6f8fa;padding:.75rem;border-radius:6px;overflow:auto}
</style></head>
<body>
  <h1>Modularity Review</h1>
  <section><h2>Top recommendation</h2><p>...</p></section>
  <section class="card">
    <h2>Candidate 1: ...</h2>
    <p><strong class="strong">Strong</strong> · <code>files</code></p>
    <!-- friction, why, smallest fix, before/after, testing impact, what not to change -->
  </section>
</body>
</html>
```
