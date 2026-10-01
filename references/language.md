# Language

Use these terms consistently when reviewing structure or producing a report. They keep a review precise without forcing a project into unfamiliar vocabulary. When the repo already has a word for one of these concepts, prefer the repo's word and note the mapping once.

This vocabulary is a shared lens, not a dogma. Reach for a term when it sharpens a finding, not to sound architectural.

## Module

A unit with a public surface and hidden implementation. A function, class, file, package, feature slice, route group, component, or service can all be modules. The label matters less than the surface/implementation split.

## Public surface

Everything a caller must know to use a module safely: exported functions and types, invariants, error modes, ordering requirements, configuration, side effects, and performance assumptions. The public surface is wider than the export list — an undocumented side effect is still part of the surface callers depend on.

## Implementation

The code hidden behind the public surface. Callers should be able to ignore it.

## Responsibility

The concept or decision a module owns. A module with a clear responsibility has an obvious answer to "where does this change go?"

## Depth

How much useful behavior a module hides behind how small a public surface. Deep is good: small surface, large hidden payoff.

## Shallow module

A module that adds a public surface without hiding a meaningful decision. Pass-through code is a reason to inspect, not proof: an existing compatibility facade can protect callers even when its implementation is one line.

## Seam

A place where behavior can vary or be tested without editing callers. Justify it by real pressure: multiple implementations, nondeterministic or costly tests, or coupling that makes a supported change harder. A single implementation can need a seam; anticipation alone is insufficient.

## Leakage

A design decision escaping from its owner into callers: storage column names, external API shapes, sequencing, retry rules, cache key formats. Leakage is the usual cause of change amplification.

## Locality

The degree to which a change, bug, or test can be handled in one place. High locality means a behavior change touches one module; low locality means it spreads.

## Change amplification

A small behavior change requiring edits in many unrelated files. The most common symptom of leakage and low locality.

## Architecture cosplay

Structure that looks architectural but does not reduce complexity: ports/adapters/use-cases/interactors layered over a small CRUD app, interfaces with one implementation, factories that build one thing. Cosplay adds surface without adding depth.

## Recommendation strength

How worthwhile the proposed action is, distinct from the quality of its evidence:

- **Strong** — the friction is established and the behavior-preserving fix clearly outweighs its migration and indirection costs.
- **Worth exploring** — the friction is established, but the best remedy or its net benefit needs a focused comparison.

Do not promote speculative future growth or unresolved leads into actionable recommendations. Surface a material missing fact as a limitation when useful.

## Evidence

- **Demonstrated** — a reproduction, failing test, actual change history, or directly observed behavior establishes the claim.
- **Supported** — inspected code and callers establish a concrete mechanism and consequence, but the consequence was not reproduced. State the inference.
- **Unresolved** — missing context leaves a material premise unverified. Exclude it from actionable findings and candidates.

## Impact and scope

Impact describes the consequence and cost, not how strongly a pattern resembles a red flag. Scope distinguishes **Introduced/worsened** from **Existing** in a PR review. Neither label implies evidence that has not been gathered.
