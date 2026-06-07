# Modularity Red Flags

Use this as a checklist during code review or refactoring.

A red flag does not automatically mean the code is wrong. It means the structure deserves inspection.

Code snippets use TypeScript for concreteness; the red flags are language-agnostic. Map the vocabulary to the project's actual stack.

## Contents

- 1-8: shallow layers, pass-through methods, leakage, deep imports, junk drawers, and mixed framework/storage/UI responsibilities
- 9-17: duplicated decisions, vague names, mixed abstraction levels, side effects, cycles, overexposed APIs, and test-driven design damage
- 18-25: temporal decomposition, premature generalization, architecture cosplay, exposed sequencing, shotgun surgery, inappropriate sharing, unclear ownership, and configuration over code
- 26-30: scattered error handling, low-level modules with high-level knowledge, public row-shaped types, and missing validation boundaries

## 1. Shallow module

A module adds a layer but does not simplify anything.

Signs:

- One function forwards directly to another.
- The interface is almost as complicated as the implementation.
- The module exists only because the architecture diagram says it should.
- Callers still need to understand all internal details.

Example:

```ts
export async function deleteUser(id: string) {
  return userRepository.deleteUser(id)
}
```

This may not need a service unless the service owns meaningful behavior.

## 2. Pass-through method

A method forwards arguments without adding meaning.

Example:

```ts
class UserService {
  constructor(private repo: UserRepository) {}

  getById(id: string) {
    return this.repo.getById(id)
  }

  create(input: CreateUserInput) {
    return this.repo.create(input)
  }
}
```

This can be useful if it is a future seam, but by default it is suspicious.

Prefer removing it or making it own real logic.

## 3. Information leakage

A module exposes details callers should not know.

Signs:

- Callers know database column names.
- Callers know external API response shapes.
- Callers know cache key formats.
- Callers know retry rules.
- Callers manually map internal rows to public DTOs.
- Callers know sequencing of internal steps.

Example:

```ts
const row = await usersRepository.insertUserRow({
  email_normalized: normalizeEmail(input.email),
  created_at_utc: new Date().toISOString(),
})
```

The caller knows too much about storage.

## 4. Deep imports into internals

One module imports another module’s private helper.

Example:

```ts
import { normalizeEmail } from "../users/internal/normalizeEmail"
```

This may indicate that:

- The helper belongs in a shared module, or
- The caller is reaching into another feature’s private implementation, or
- The owning feature needs a better public API.

## 5. Junk drawer module

A module contains unrelated helpers.

Common names:

```txt
utils
helpers
common
shared
misc
lib
tools
```

These are not automatically bad, but they often become dumping grounds.

Signs:

- No clear owner
- Unrelated functions
- Feature-specific logic mixed with generic helpers
- Hard to know where new code belongs

Prefer moving helpers closer to the concept they support.

## 6. Framework leakage into business logic

Business logic imports framework-specific objects.

Examples:

```ts
import type { Context } from "hono"
import type { Request, Response } from "express"
```

inside domain/service logic.

Prefer:

```ts
route/controller -> extracts framework details
service/use-case -> receives plain input
```

## 7. Database leakage into route/controller

Route handlers directly own SQL/storage details.

This is not always wrong in tiny apps, but it becomes problematic when:

- Validation grows
- Permissions grow
- Business rules grow
- Multiple routes need the same operation
- Tests become hard to write
- Database details leak into API behavior

Prefer moving meaningful operations to services/use-cases and hiding storage behind a repository or query module when useful.

## 8. Business logic inside UI components

Frontend components contain too many responsibilities.

Signs:

- Component fetches data
- Mutates data
- Checks permissions
- Formats domain values
- Maps API responses
- Tracks analytics
- Handles complex state transitions
- Renders UI

Prefer separating hooks, services, mappers, or state machines when complexity justifies it.

## 9. Repeated design decisions

The same rule appears in many places.

Examples:

- Email normalization
- Date formatting
- Currency formatting
- Permission checks
- Status transition rules
- Error response shape
- Default pagination
- Cache key generation
- External API field mapping

Repeated decisions create change amplification.

## 10. Vague names

Names do not communicate responsibility.

Weak names:

```txt
manager
processor
handler
helper
utils
common
data
logic
service
stuff
```

Better names describe the concept:

```txt
invoiceCalculator
subscriptionRenewal
userPermissions
reportScheduler
paymentRetryPolicy
```

Some generic names are acceptable when scoped by module:

```txt
users/service.ts
billing/handler.ts
```

The directory gives the name meaning.

## 11. Inconsistent naming pairs

Operations use inconsistent naming.

Bad:

```ts
addItem()
delete()
fetchUsers()
removeUser()
```

Better:

```ts
addItem()
removeItem()
```

or:

```ts
createUser()
deleteUser()
```

Consistency reduces cognitive load.

## 12. Mixed abstraction levels

A function mixes high-level policy with low-level details.

Example:

```ts
async function createUser(input: Input) {
  if (!input.email.includes("@")) throw new Error("invalid")
  const normalized = input.email.trim().toLowerCase()
  await db.query("insert into users ...")
  await fetch("https://email-provider.example/send", ...)
  return { ok: true }
}
```

This function mixes validation, normalization, persistence, external API details, and response shape.

A better structure may separate policy from details.

## 13. Hidden side effects

Importing or calling a function does surprising work.

Examples:

- Importing a module connects to the database.
- Importing a module starts a server.
- Importing a module registers cron jobs.
- A formatter mutates its input.
- A validation function writes logs or updates state.
- A getter performs network requests.

Prefer explicit initialization and explicit side effects.

## 14. Circular dependencies

Two modules depend on each other.

Example:

```txt
users -> billing -> users
```

Circular dependencies often mean boundaries are unclear.

Fix by:

- Extracting shared concepts
- Moving orchestration upward
- Defining a clearer public API
- Reversing an inappropriate dependency

## 15. Overexposed public API

A module exports too many internals.

Signs:

- `index.ts` exports everything.
- Callers can import low-level helpers.
- Internal sequencing is exposed.
- Many functions exist only for tests.

Prefer exporting only stable operations.

## 16. Test-only design damage

Production design is distorted only to satisfy tests.

Signs:

- Public APIs exist only for tests.
- Internals are exported only for tests.
- Tests require mocking deep implementation details.
- The design exposes private steps instead of testing behavior.

Prefer testing through meaningful public boundaries. If testing is hard, consider whether the module does too much.

## 17. Excessive mocking

Tests mock many internals.

This may mean:

- The unit is too coupled
- The boundary is wrong
- Too many implementation details are exposed
- The test knows too much about internals

Prefer testing behavior through stable public APIs.

## 18. Temporal decomposition

Modules are organized by order of execution instead of responsibility.

Weak:

```txt
setup/
process/
finish/
```

Better:

```txt
users/
billing/
notifications/
reports/
```

Use orchestration code to express sequence.

## 19. Premature generalization

The code introduces a generic framework before enough real use cases exist.

Signs:

- Abstract classes with one implementation
- Interfaces with one implementation
- Generic workflow engines for two simple functions
- Configuration-driven code where explicit code would be clearer
- Factories that only instantiate one class

Wait for real pressure before generalizing.

## 20. Architecture cosplay

The code imitates enterprise structure without enterprise complexity.

Signs:

```txt
ports/
adapters/
use-cases/
interactors/
presenters/
repositories/
factories/
entities/
domain/
application/
infrastructure/
```

in a tiny CRUD app with minimal business logic.

These patterns can be valid, but only when they solve actual complexity.

## 21. Public API exposes sequencing

Callers must perform internal steps in the correct order.

Bad:

```ts
const draft = createDraftUser(input)
validateDraftUser(draft)
const saved = saveDraftUser(draft)
sendUserCreatedEvent(saved)
```

Better:

```ts
const user = await createUser(input)
```

Expose a complete operation when callers should not own the sequence.

## 22. Shotgun surgery

One change requires edits everywhere.

Signs:

- Same concept spread across many modules
- No clear owner for a rule
- Public API exposes too many details
- Data shape leaks across boundaries

Fix by finding the design decision and giving it one home.

## 23. Inappropriate shared code

Code is shared only because it looks similar.

Do not merge duplicated-looking code if the concepts may evolve separately.

Bad abstraction:

```ts
function processEntity(entity, type) {
  // handles users, invoices, reports, and subscriptions
}
```

This may hide unrelated concepts behind one generic function.

Duplication is sometimes better than a bad abstraction.

## 24. Feature envy

A function spends most of its time reading or modifying another module’s data.

This may mean the behavior belongs closer to that data or behind that module’s public API.

## 25. Configuration over code

Configuration becomes a hidden programming language.

Signs:

- Huge JSON/YAML config controls complex behavior
- Logic is hard to trace
- Validation is weak
- Errors are discovered at runtime
- Developers need to learn a private mini-framework

Configuration is useful for data, not always for behavior.

## 26. Error handling scattered everywhere

Every caller handles the same errors manually.

Signs:

- Repeated `try/catch`
- Repeated HTTP status mapping
- Repeated fallback logic
- Repeated provider error parsing

Prefer centralizing error translation near the boundary. Give each layer one job:

```txt
route/controller -> maps known errors to HTTP response
service/use-case -> owns business decisions
repository/client -> hides storage/external API details
```

Avoid letting every layer know every other layer's error format. Distinguish
validation, not-found, conflict, auth, and unexpected errors, and keep a
consistent API error response shape.

## 27. Low-level module knows too much

A low-level helper imports application-specific code.

Bad:

```ts
// shared/date.ts
import { currentUser } from "../auth/session"
```

Low-level modules should usually be boring and independent.

## 28. Unclear ownership

Nobody knows where a change belongs.

Signs:

- New code could fit in several places
- Similar behavior exists in different modules
- Naming does not identify ownership
- The module has no clear reason to exist

Fix by naming the concept and giving it a home.

## 29. Public type mirrors database row

API/public types directly mirror database rows.

This can be acceptable for tiny apps, but becomes dangerous when:

- Database schema changes
- Public API must remain stable
- Sensitive fields exist
- Internal representation differs from user-facing representation

Prefer mapping internal storage to public DTOs at a clear boundary.

## 30. No validation boundary

Inputs are validated inconsistently or too late.

Signs:

- Some callers validate, some do not
- Services assume route validation always happened
- Repositories receive untrusted data
- Invalid state can enter the system

Prefer clear validation at system boundaries and invariant checks inside domain/service logic when needed.
