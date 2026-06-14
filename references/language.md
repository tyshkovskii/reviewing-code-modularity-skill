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

A module whose public surface is almost as complicated as its implementation. Pass-through layers, wrappers that only rename, and "services" that forward to a repository without owning rules are shallow.

## Seam

A place where behavior can vary or be tested without editing callers. A seam is justified by real pressure (two real implementations, or coupling that makes a unit untestable), not by anticipation.

## Leakage

A design decision escaping from its owner into callers: storage column names, external API shapes, sequencing, retry rules, cache key formats. Leakage is the usual cause of change amplification.

## Locality

The degree to which a change, bug, or test can be handled in one place. High locality means a behavior change touches one module; low locality means it spreads.

## Change amplification

A small behavior change requiring edits in many unrelated files. The most common symptom of leakage and low locality.

## Architecture cosplay

Structure that looks architectural but does not reduce complexity: ports/adapters/use-cases/interactors layered over a small CRUD app, interfaces with one implementation, factories that build one thing. Cosplay adds surface without adding depth.

## Recommendation strength

How confident a recommendation is, used in reports:

- **Strong** — the friction is real now, the fix is behavior-preserving and clearly reduces complexity.
- **Worth exploring** — plausible improvement, but it depends on direction the code may take or on facts you could not confirm.
- **Speculative** — only pays off under a future that has not arrived. Name it, do not push it.
