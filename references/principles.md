# Principles

These principles are background guidance for reviewing and improving modularity. Apply them pragmatically. Do not recite them unless they help explain a specific recommendation.

## Contents

- Main idea
- Complexity
- Dependencies
- Deep modules
- Information hiding
- Public API discipline
- Cohesion and coupling
- General-purpose design
- Temporal decomposition
- Abstractions
- File splitting
- Strategic refactoring
- Design it twice
- Small and large project bias
- Final design test

## Main idea

Good structure reduces complexity.

A codebase is not better because it has more layers, more patterns, more files, or more abstractions. It is better when future changes are easier to make safely.

Prefer structure that makes code:

- Easier to understand
- Easier to change
- Easier to test
- Easier to delete
- Harder to misuse

## Complexity

Complexity is anything that makes software hard to understand, modify, or reason about.

Complexity usually appears as:

- Change amplification
- Cognitive load
- Unknown unknowns
- Obscurity

### Change amplification

A small change requires edits in many places.

Example:

A user profile field is renamed, and the change requires edits in:

- API route
- Service
- Repository
- Serializer
- Validation schema
- UI mapper
- Tests
- Documentation

Some of this may be necessary, but widespread edits often mean a design decision leaked across boundaries.

### Cognitive load

The reader must hold too much information in their head.

Example:

A route handler requires understanding:

- HTTP details
- Validation rules
- Business rules
- SQL queries
- Error mapping
- Response formatting
- Authorization
- Logging
- Caching

Split responsibilities when doing so reduces what each module requires the reader to know.

### Unknown unknowns

A developer does not know what they need to know.

Example:

- A function mutates input unexpectedly.
- Importing a file opens a database connection.
- A helper depends on hidden global state.
- A low-level utility reads environment variables.
- A module registers routes as a side effect.

Unknown unknowns are worse than visible complexity because they produce surprising bugs.

### Obscurity

The intent is hard to see.

Example:

```ts
processData(data)
handleThing(input)
doWork(payload)
```

These names force the reader to inspect implementation. Prefer names that expose the concept.

## Dependencies

Dependencies are a major source of complexity.

A dependency exists when one part of code must know about another part.

Dependencies are not always bad. Software needs dependencies. But unnecessary or reversed dependencies make changes harder.

Good dependencies are:

- Explicit
- Narrow
- Stable
- Pointing in a sensible direction
- Hidden behind a small public API when possible

Bad dependencies are:

- Hidden
- Circular
- Broad
- Deep internal imports
- Reversed across architecture boundaries
- Based on side effects

### Default direction

Dependency direction should make important policy depend on details as little as possible.

Default backend direction:

```txt
routes/controllers -> services/use-cases -> repositories/db/external clients
```

Default frontend direction:

```txt
pages/routes -> feature components -> shared UI/helpers
```

Default library direction:

```txt
public API -> internal modules -> low-level helpers
```

Avoid reversed direction:

```txt
db -> service
domain/business logic -> route framework
shared utility -> feature-specific module
component -> unrelated feature internals
low-level helper -> application config
```

## Deep modules

A deep module provides a simple interface over useful behavior.

A deep module is good because callers get a lot of value without needing many details.

Example:

```ts
await billing.chargeCustomer(customerId, invoiceId)
```

The caller does not need to know:

- Payment provider API shape
- Retry policy
- Idempotency key format
- Error mapping
- Logging details
- Database update sequence

A shallow module provides little value behind a complicated or unnecessary interface.

Example:

```ts
await billingService.chargeCustomer(customerId, invoiceId)
```

If this only forwards to:

```ts
await billingRepository.chargeCustomer(customerId, invoiceId)
```

then the service layer is probably shallow.

## Information hiding

A module should hide design decisions likely to change.

Good things to hide:

- Database schema
- External API shape
- HTTP framework details
- Validation internals
- Cache implementation
- Retry logic
- Formatting rules
- Timezone handling
- Error mapping
- Permission logic
- Environment-specific configuration

A design decision should usually have one home. When the same decision appears in many places, future changes become risky.

## Public API discipline

A module’s public API should be smaller than its implementation.

Prefer public APIs that describe what the caller wants:

```ts
createUser(input)
getUserProfile(viewerId, userId)
cancelSubscription(subscriptionId)
```

Avoid public APIs that expose implementation steps:

```ts
validateUserInput(input)
insertUserRow(row)
mapUserRowToDto(row)
sendWelcomeEmail(email)
```

Those functions may exist internally, but exposing them can leak sequencing and implementation details to callers.

## Cohesion

A module is cohesive when its parts belong together and change for the same reason.

High cohesion:

```txt
users/
  users.routes.ts
  users.service.ts
  users.repository.ts
  users.schema.ts
```

All files exist around the user feature.

Low cohesion:

```txt
utils/
  userValidation.ts
  invoiceFormatting.ts
  retryPayment.ts
  parseCsv.ts
  authPermissionCheck.ts
```

This is a junk drawer. The files may be individually useful, but the module itself owns no clear concept.

## Coupling

Coupling is the degree to which modules know about each other.

Low coupling does not mean “no dependencies.” It means modules depend on small, stable interfaces.

Tight coupling signs:

- Many imports across feature internals
- Circular dependencies
- Tests require unrelated modules
- A simple change breaks distant features
- Internal helpers are used outside their owner module
- Business logic knows transport or storage details

## General-purpose design

Prefer modules that are general enough for the current problem, not speculative frameworks.

Too special-purpose:

```ts
createUserFromSignupFormAndSendEmailAndTrackAnalytics()
```

This function is hard to reuse and hard to test.

Too general-purpose:

```ts
executeWorkflow<TInput, TContext, TResult>()
```

This may be flexible but can hide simple intent behind a framework.

Balanced:

```ts
createUser(input)
sendWelcomeEmail(user)
trackSignup(user)
```

Then an orchestration function can compose them when needed.

## Temporal decomposition

Avoid grouping code only by execution order.

Weak structure:

```txt
init/
process/
finish/
```

This often hides domain concepts.

Better structure groups code by responsibility:

```txt
users/
billing/
notifications/
reports/
```

Execution order can be represented by orchestration code, not by making every module a phase.

## Abstractions

An abstraction is useful when it removes complexity from callers.

An abstraction is harmful when it only moves complexity around or hides important behavior.

Ask:

- Does this abstraction simplify the caller?
- Does it hide a real design decision?
- Does it create a stable boundary?
- Does it reduce duplication of knowledge?
- Does it make tests easier?
- Does it have more than one real use case?

If the answer is no, avoid it.

Good reasons to create an abstraction:

- Multiple callers need the same concept
- External implementation detail is leaking
- Tests need a clean seam
- A change currently spreads across unrelated files
- A public API is too complicated and needs a simpler interface
- The same decision is duplicated in multiple places
- The module hides a detail that is likely to change

Bad reasons to create an abstraction:

- "Clean Architecture says so"
- "SOLID says we need an interface"
- "Maybe we need it later"
- "The file is long"
- "This looks more professional"
- "Every class needs a repository/service/factory"
- "We need more layers"
- "This project might become big someday"

Do not create abstractions for imaginary future requirements.

## File splitting

Do not split files by length alone. Split by responsibility.

Good split reasons:

- Different parts change for different reasons
- One part can be tested independently
- One part hides a meaningful design decision
- Public API becomes smaller
- The caller no longer needs internal details
- The file contains multiple concepts
- The file mixes framework code with business logic
- The file mixes orchestration with low-level details

Bad split reasons:

- File is over an arbitrary line count
- Every function needs its own file
- The structure looks more "professional"
- You are copying a pattern from a larger project
- The agent wants to make the diff look architectural

## Strategic refactoring

Do not rewrite everything.

Improve structure where you are already making a change.

Good refactoring moments:

- You are adding a similar feature and duplication appears.
- You are changing behavior and the current structure makes it hard.
- You need tests but the current code is too coupled.
- A design decision is repeated in multiple places.
- A public API is causing caller complexity.

Bad refactoring moments:

- You are bored.
- The code “doesn’t look professional.”
- You want to apply a pattern.
- You want to make the folder tree impressive.
- You are changing code unrelated to the task.

## Design it twice

For nontrivial structure changes, compare at least two designs before choosing.

Example:

Option A: Keep route + service + repository.

Option B: Introduce a use-case module.

Option C: Move only validation and serialization out of the route.

Usually choose the smallest option that solves the actual complexity.

## Small project bias

For small projects, prefer boring structure.

Good small API structure:

```txt
src/
  server.ts
  db/
  routes/
  services/
  schemas/
  tests/
```

Do not start with:

```txt
src/
  domain/
  application/
  infrastructure/
  adapters/
  ports/
  use-cases/
  interactors/
  presenters/
  factories/
```

Use more structure when the project earns it.

## Large project bias

For larger projects, boundaries become more valuable.

Consider stronger boundaries when:

- Many developers work in the same area
- Features have clear ownership
- Tests are slow because everything is coupled
- Many modules import deep internals
- External services leak across the codebase
- Business rules are duplicated
- API behavior changes cause broad breakage

## Final design test

A modular design is probably better if:

- The caller knows less
- The public API is smaller
- The implementation can change behind the boundary
- Tests are easier to write
- Similar changes touch fewer files
- Names better match domain concepts
- Fewer modules know about framework/storage details
- The design has fewer surprising side effects
