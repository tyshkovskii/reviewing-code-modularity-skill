# Examples

These examples show how to apply modularity principles. They are not mandatory patterns. Choose the smallest structure that reduces complexity in the current codebase.

Examples use TypeScript (with Hono/React) for concreteness. Translate them to the project's actual stack and conventions; the filenames and layers are not requirements. Snippets omit unchanged dependencies. Preserve their existing contracts when moving them; adding validation, permissions, error mapping, or side effects is a separate behavior change.

## Contents

- Examples 1-5: route ownership, pass-through services, deep imports, junk drawers, and framework leakage
- Examples 6-10: public sequencing, premature interfaces, React components, shared abstractions, and error mapping
- Examples 11-15: file splitting, small and larger project structure, explicit initialization, and public feature APIs
- Examples 16-18: duplication versus abstraction, long files, and design-review output
- Examples 19-20: a tiny route worth keeping and a justified single-implementation seam

## Example 1: Route owns everything

### Bad

```ts
app.post("/users", async (c) => {
  const body = await c.req.json()

  if (!body.email || !body.email.includes("@")) {
    return c.json({ error: "Invalid email" }, 400)
  }

  const email = body.email.trim().toLowerCase()

  const existing = await db.query(
    "select id from users where email = ?",
    [email]
  )

  if (existing.length > 0) {
    return c.json({ error: "User already exists" }, 409)
  }

  const user = await db.query(
    "insert into users (email, name) values (?, ?) returning *",
    [email, body.name]
  )

  await emailClient.send({
    to: email,
    template: "welcome",
  })

  return c.json({ user }, 201)
})
```

### Problem

The route owns:

- HTTP parsing
- Validation
- Normalization
- Database access
- Conflict checking
- External email behavior
- Response formatting
- Error semantics

This increases cognitive load and makes testing harder.

### Better

```ts
app.post("/users", async (c) => {
  const body = await c.req.json()
  if (!body.email || !body.email.includes("@")) {
    return c.json({ error: "Invalid email" }, 400)
  }

  const result = await createUser(body)
  if (result.kind === "conflict") {
    return c.json({ error: "User already exists" }, 409)
  }
  return c.json({ user: result.user }, 201)
})
```

```ts
export async function createUser(input: CreateUserInput) {
  const email = input.email.trim().toLowerCase()

  const existing = await db.query(
    "select id from users where email = ?",
    [email]
  )
  if (existing.length > 0) {
    return { kind: "conflict" as const }
  }

  const user = await db.query(
    "insert into users (email, name) values (?, ?) returning *",
    [email, input.name]
  )

  await emailClient.send({ to: email, template: "welcome" })

  return { kind: "created" as const, user }
}
```

### Why better

The route retains HTTP parsing, validation, and the same 400/409/201 responses. One operation module owns the database/email sequence; no repository or provider wrapper is needed just to perform this extraction. The query result shape, normalization, awaited email, and unexpected-error propagation stay unchanged. Check these contracts before and after the move; do not add a schema or DTO conversion as incidental cleanup.

## Example 2: Pass-through service

### Bad

```ts
export const usersService = {
  getUser(id: string) {
    return usersRepository.getUser(id)
  },

  deleteUser(id: string) {
    return usersRepository.deleteUser(id)
  },
}
```

### Problem

The service layer adds no behavior. Inspect its callers and contract before deciding that it adds no value: forwarding can still preserve a deliberate public boundary.

### Better option A: remove the layer

```ts
const user = await usersRepository.getUser(id)
```

This is useful when the wrapper is internal, every caller is known, and direct use does not expose a previously hidden implementation contract. Preserve the existing arguments, results, errors, and side effects.

### Valid counterexample: keep a compatibility facade

Suppose `usersService.deleteUser(id)` is an already-published package API, the repository is private, and supported consumers still use that API. Keep the forwarding method: removing it breaks an existing contract or exposes storage details. Cite the exports and consumers that establish this responsibility.

Do not invent authorization, not-found checks, audit events, or new arguments to make a shallow layer look useful. If those operations already live in callers, moving them may be a separate, justified candidate; preserve their existing order and behavior.

The criterion is the decision hidden from callers, not how many lines the wrapper executes. A hypothetical future implementation is not enough.

## Example 3: Deep import into another feature

### Bad

```ts
import { normalizeEmail } from "../users/internal/normalizeEmail"

export async function inviteMember(email: string) {
  const normalized = normalizeEmail(email)
  // ...
}
```

### Problem

The team feature imports a private helper from the users feature. This leaks internals and couples two features.

### Better option A: move generic behavior to shared module

```ts
import { normalizeEmail } from "../shared/email"
```

Use this if email normalization is a general concept.

### Better option B: expose a public users API

```ts
import { users } from "../users"

export async function inviteMember(email: string) {
  const normalized = users.normalizeEmail(email)
  // ...
}
```

Use this only if user-email normalization is an intentionally supported public operation. Preserve the same normalization behavior; replacing it with a database lookup would be a behavior change. If neither ownership model fits, do not force a shared API.

## Example 4: Junk drawer utilities

### Bad

```txt
src/
  utils/
    formatCurrency.ts
    normalizeUserEmail.ts
    assertCanDeleteInvoice.ts
    parseCsv.ts
    retryPayment.ts
    truncateString.ts
```

### Problem

The `utils` module has no clear concept. It mixes user logic, invoice permissions, CSV parsing, payment retry behavior, and generic string formatting.

### Better

```txt
src/
  users/
    normalizeUserEmail.ts
  invoices/
    assertCanDeleteInvoice.ts
  payments/
    retryPayment.ts
  csv/
    parseCsv.ts
  formatting/
    formatCurrency.ts
    truncateString.ts
```

### Why better

Ownership is clearer. Feature-specific behavior lives near the feature. Generic formatting has a generic home.

## Example 5: Framework leakage into service

### Bad

```ts
import type { Context } from "hono"

export async function createUserFromRequest(c: Context) {
  const body = await c.req.json()
  const existing = await usersRepository.findByEmail(body.email)
  if (existing) {
    throw new ConflictError("User already exists")
  }
  const user = await usersRepository.create(body)

  return c.json({ user }, 201)
}
```

### Problem

The service knows Hono. It cannot be easily tested without framework objects. It also mixes transport and business logic.

### Better

```ts
app.post("/users", async (c) => {
  const input = await c.req.json()
  const user = await createUser(input)

  return c.json({ user }, 201)
})
```

```ts
export async function createUser(input: CreateUserInput) {
  const existing = await usersRepository.findByEmail(input.email)
  if (existing) {
    throw new ConflictError("User already exists")
  }

  return usersRepository.create(input)
}
```

### Why better

Framework details stay at the route boundary. The operation retains the existing conflict check, returned value, and failure behavior; the application's existing error handler stays unchanged. Do not introduce new schema validation or DTO mapping during this move.

## Example 6: Public API exposes sequencing

### Bad

```ts
const draft = createDraftInvoice(input)
validateInvoiceDraft(draft)
const totals = calculateInvoiceTotals(draft)
const invoice = await saveInvoice(draft, totals)
await sendInvoiceCreatedEvent(invoice)
```

### Problem

Every caller must know the correct sequence. This leaks internal workflow.

### Better

```ts
const invoice = await createInvoice(input)
```

```ts
export async function createInvoice(input: CreateInvoiceInput) {
  const draft = createDraftInvoice(input)
  validateInvoiceDraft(draft)

  const totals = calculateInvoiceTotals(draft)
  const invoice = await invoicesRepository.save(draft, totals)

  await events.publishInvoiceCreated(invoice)

  return invoice
}
```

### Why better

The public API exposes the user intent: create an invoice. Internal sequencing is hidden.

## Example 7: Premature interface

### Bad

```ts
interface UserRepositoryInterface {
  getById(id: string): Promise<User | null>
}

class PostgresUserRepository implements UserRepositoryInterface {
  getById(id: string) {
    return db.user.findById(id)
  }
}
```

If there is only one implementation and no test seam problem, this may be unnecessary.

### Better for small projects

```ts
export async function getUserById(id: string) {
  return db.user.findById(id)
}
```

### Better when there is real pressure

```ts
export interface UserReader {
  getById(id: string): Promise<User | null>
}

export async function getUserProfile(
  users: UserReader,
  viewerId: string,
  userId: string
) {
  const user = await users.getById(userId)
  // ...
}
```

### Why better

Interfaces are useful when they create a needed seam. They are noise when they only mirror one implementation.

## Example 8: React component doing too much

### Bad

```tsx
export function UserProfilePage({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.user.email.includes("@")) {
          throw new Error("Invalid email")
        }

        setUser({
          ...data.user,
          displayName: `${data.user.first_name} ${data.user.last_name}`,
        })
      })
      .catch((err) => setError(err.message))
  }, [userId])

  if (error) return <div>{error}</div>
  if (!user) return <div>Loading...</div>

  return (
    <section>
      <h1>{user.displayName}</h1>
      <p>{user.email}</p>
    </section>
  )
}
```

### Problem

The component owns fetching, API mapping, validation, state management, error handling, and rendering.

### Better

```tsx
export function UserProfilePage({ userId }: { userId: string }) {
  const { user, error, isLoading } = useUserProfile(userId)

  if (error) return <ErrorMessage error={error} />
  if (isLoading) return <Loading />

  return <UserProfile user={user} />
}
```

```ts
export function toUserProfile(dto: UserDto): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    displayName: `${dto.first_name} ${dto.last_name}`,
  }
}
```

### Why better

The page coordinates state. Mapping lives separately. Rendering is simpler. The omitted hook must retain the existing fetch, validation, state transitions, and error behavior; the replacement UI must preserve rendered output and interactions. Separately propose any change to cancellation or stale responses. Tests can target mapping and UI separately.

## Example 9: Bad shared abstraction

### Bad

```ts
function processEntity(entity: unknown, type: "user" | "invoice" | "report") {
  if (type === "user") {
    // user-specific logic
  }

  if (type === "invoice") {
    // invoice-specific logic
  }

  if (type === "report") {
    // report-specific logic
  }
}
```

### Problem

Unrelated concepts are forced into one generic function because the code looked similar.

### Better

```ts
processUser(user)
processInvoice(invoice)
processReport(report)
```

If real shared behavior emerges later, extract only that behavior.

### Why better

Duplication is sometimes cheaper than a bad abstraction. Do not merge concepts that may evolve separately.

## Example 10: Error mapping scattered across routes

### Bad

```ts
app.post("/users", async (c) => {
  try {
    const user = await createUser(await c.req.json())
    return c.json({ user })
  } catch (error) {
    if (error instanceof ConflictError) {
      return c.json({ error: error.message }, 409)
    }

    return c.json({ error: "Internal error" }, 500)
  }
})

app.post("/teams", async (c) => {
  try {
    const team = await createTeam(await c.req.json())
    return c.json({ team })
  } catch (error) {
    if (error instanceof ConflictError) {
      return c.json({ error: error.message }, 409)
    }

    return c.json({ error: "Internal error" }, 500)
  }
})
```

### Problem

Error mapping is duplicated and inconsistent.

### Better

```ts
app.onError((error, c) => {
  if (error instanceof ConflictError) {
    return c.json({ error: error.message }, 409)
  }

  return c.json({ error: "Internal error" }, 500)
})
```

Routes can stay focused:

```ts
app.post("/users", async (c) => {
  const user = await createUser(await c.req.json())

  return c.json({ user })
})
```

### Why better

The boundary owns the existing HTTP error translation: the same conflict message and 409, otherwise the same generic 500. Apply this only where the affected routes already share that policy. Check other routes before installing a global handler; use a scoped handler when their policies differ. Adding new 400/404 mappings or changing error types requires a separate behavior change.

## Example 11: Over-splitting by file length

### Bad

```txt
users/
  getUserInput.ts
  validateUserInput.ts
  normalizeUserEmail.ts
  createUserObject.ts
  saveUser.ts
  sendWelcomeEmail.ts
  createUser.ts
```

This may be too fragmented if each file has one tiny function and the operation is simple.

### Better

```txt
users/
  users.service.ts
  users.repository.ts
  users.schema.ts
  users.email.ts
```

### Why better

Files should represent meaningful responsibilities, not arbitrary function count.

## Example 12: Small project structure

### One option when these responsibilities already exist

```txt
src/
  server.ts
  db/
    connection.ts
    migrations/
  routes/
    users.routes.ts
    invoices.routes.ts
  services/
    users.service.ts
    invoices.service.ts
  schemas/
    users.schema.ts
    invoices.schema.ts
  tests/
```

### Why good

Simple, understandable, and enough separation for many small APIs. Do not create every directory up front; a smaller app may need only a route and a database binding. This is an example, not a target folder tree.

Do not start with heavy architecture unless the project needs it.

## Example 13: Larger project feature structure

### Good when features grow

```txt
src/
  features/
    users/
      index.ts
      users.routes.ts
      users.service.ts
      users.repository.ts
      users.schema.ts
      users.types.ts
      users.test.ts
    billing/
      index.ts
      billing.routes.ts
      billing.service.ts
      billing.repository.ts
      billing.schema.ts
      billing.types.ts
      billing.test.ts
  shared/
    errors/
    db/
    logging/
    http/
```

### Rule

Other features should import from the feature public API:

```ts
import { getUserProfile } from "../users"
```

Avoid importing internals:

```ts
import { mapUserRow } from "../users/users.repository"
```

## Example 14: Explicit initialization instead of import side effect

### Bad

```ts
// db.ts
export const db = connect(process.env.DATABASE_URL)
```

Any import connects to the database.

### Better

```ts
// db.ts
export function createDb(databaseUrl: string) {
  return connect(databaseUrl)
}
```

```ts
// server.ts
const db = createDb(env.DATABASE_URL)
const app = createApp({ db })

serve(app)
```

### Why better

Initialization is explicit. Tests can pass their own DB. Importing a module does not create hidden side effects.

## Example 15: Better public API through index file

### Good

```txt
users/
  index.ts
  internal/
    normalizeEmail.ts
    mapUserRow.ts
  users.service.ts
  users.repository.ts
```

```ts
// users/index.ts
export { createUser, getUserProfile } from "./users.service"
export type { UserProfile } from "./users.types"
```

Callers use:

```ts
import { createUser } from "../users"
```

They do not use:

```ts
import { normalizeEmail } from "../users/internal/normalizeEmail"
```

### Why better

The feature controls what it exposes. Internal design can change without breaking callers.

## Example 16: Choosing between duplication and abstraction

### Situation

Two modules both format labels:

```ts
function formatUserLabel(user: User) {
  return `${user.firstName} ${user.lastName}`
}
```

```ts
function formatEmployeeLabel(employee: Employee) {
  return `${employee.firstName} ${employee.lastName}`
}
```

### Do not immediately create:

```ts
function formatPersonLikeThing(entity: { firstName: string; lastName: string }) {
  return `${entity.firstName} ${entity.lastName}`
}
```

### Ask first

- Are `User` and `Employee` the same concept?
- Will their labels evolve together?
- Is the duplication a shared design decision or just similar code?
- Would a shared abstraction create coupling between concepts?

If they may evolve separately, keep the duplication.

## Example 17: Long file that should not be split yet

### Acceptable

```ts
// report-generator.ts
export function generateReport(input: ReportInput) {
  // 250 lines of tightly related report generation logic
}
```

A long file is not automatically bad if:

- It owns one clear concept
- It has a clear public API
- Internal helpers are easy to follow
- Splitting would scatter the algorithm
- Tests cover behavior

### Split only when responsibilities separate

```txt
reports/
  report-generator.ts
  report-query.ts
  report-formatting.ts
  report-permissions.ts
```

Use this when those parts change independently or are useful boundaries.

## Example 18: Design review output

For an observed mixed-responsibility problem, a concise finding could be:

```txt
Medium impact, Supported, Existing: the signup and admin-create handlers each
own the same normalization and conflict decision. Cite both handlers and their
callers. Explain which current or planned change must coordinate the two copies.

Extract that shared operation while preserving each route's response contract.
Check that the rules really must evolve together; otherwise keep them separate.
Retain the existing database/client bindings. Do not add repositories or interfaces
unless the inspected coupling makes them useful. Re-run both routes' behavior tests.
```

Use actual locations and evidence, never these example facts by default. If no concrete cost survives inspection, report no actionable findings rather than writing an architecture plan. Use the Mode B report only for a scan or candidate request.

## Example 19: Tiny direct SQL route worth keeping

```ts
app.get("/countries", async (c) => {
  const countries = await db.query("select code, name from countries order by name")
  return c.json({ countries })
})
```

Keep this when it is the only caller, the returned shape is the intended contract, and existing tests cover that behavior without a burdensome setup. A service that only forwards this query adds a hop without hiding a decision. If storage details later cause a demonstrated problem, review that evidence then; do not add a repository solely because SQL appears in a route.

## Example 20: One implementation, justified test seam

Suppose existing renewal tests sleep around a clock boundary and fail intermittently. The app has only one production clock, but exact boundary behavior needs deterministic tests.

```ts
// Existing operation
export function canRenew(subscription: Subscription) {
  return subscription.renewableUntil > Date.now()
}
```

```ts
// Small seam; existing one-argument calls preserve their behavior.
export function canRenew(subscription: Subscription, now = Date.now()) {
  return subscription.renewableUntil > now
}
```

Now test timestamps just before, at, and after the existing deadline without sleeping or mocking a global. The comparison and default clock stay unchanged. The optional argument adds a small public-surface cost; justify it with the observed test problem and the operation's meaningful time input. No clock interface, factory, or second production implementation is required. Preserve visibility: do not export a private helper solely to test it.
