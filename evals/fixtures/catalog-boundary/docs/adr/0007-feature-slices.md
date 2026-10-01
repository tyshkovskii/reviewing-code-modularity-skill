# ADR 0007: Feature slices
Status: Accepted
Date: 2026-02-03

## Context
Horizontal controllers/services/repositories scattered each product change across unrelated directories. Each feature now owns its representation and publishes a narrow entry point.

## Decision
Callers outside a feature use its index.mjs public entry point. Internal row encodings remain private. Keep catalog behavior within the catalog feature rather than creating application-wide service and repository layers. Public catalog reads return domain-shaped { id, title } values.

## Consequences
Cross-feature reporting may compose catalog public queries. If that public surface no longer serves a concrete requirement, propose a small catalog API extension. Do not expose internal row formats to save a wrapper.
