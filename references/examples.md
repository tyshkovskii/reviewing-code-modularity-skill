# Examples

These examples show how to apply modularity principles. They are not mandatory patterns. Choose the smallest structure that reduces complexity in the current codebase.

Examples use TypeScript (with Hono/React) for concreteness. The principles are language-agnostic: translate the vocabulary (`routes -> services -> repositories`, `index.ts`, framework `Context`) to the project's actual stack and conventions.

## Contents

- Examples 1-5: route ownership, pass-through services, deep imports, junk drawers, and framework leakage
- Examples 6-10: public sequencing, premature interfaces, React components, shared abstractions, and error mapping
- Examples 11-15: file splitting, small and larger project structure, explicit initialization, and public feature APIs
- Examples 16-18: duplication versus abstraction, long files, and design-review output

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
  const input = createUserSchema.parse(await c.req.json())
  const user = await usersService.createUser(input)

  return c.json({ user }, 201)
})
```

```ts
export async function createUser(input: CreateUserInput) {
  const email = normalizeEmail(input.email)

  const existing = await usersRepository.findByEmail(email)
  if (existing) {
    throw new ConflictError("User already exists")
  }

  const user = await usersRepository.create({
    email,
    name: input.name,
  })

  await welcomeEmailSender.send(user)

  return toUserDto(user)
}
```

### Why better

The route handles transport. The service owns the operation. The repository hides storage. The email sender hides provider details. The caller gets a simple operation.

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

The service layer adds no behavior. It is shallow.

### Better option A: remove the layer

```ts
const user = await usersRepository.getUser(id)
```

This is fine for small apps.

### Better option B: make the service own real behavior

```ts
export async function deleteUser(actorId: string, userId: string) {
  await permissions.assertCanDeleteUser(actorId, userId)

  const user = await usersRepository.getUser(userId)
  if (!user) {
    throw new NotFoundError("User not found")
  }

  await usersRepository.deleteUser(userId)
  await auditLog.recordUserDeleted({ actorId, userId })
}
```

### Why better

Now the service owns authorization, existence checks, deletion, and audit behavior.

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
  const user = await users.findByEmail(email)
  // ...
}
```

Use this if the team feature should not know how users normalize email.

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
  const user = await usersRepository.create(body)

  return c.json({ user }, 201)
}
```

### Problem

The service knows Hono. It cannot be easily tested without framework objects. It also mixes transport and business logic.

### Better

```ts
app.post("/users", async (c) => {
  const input = createUserSchema.parse(await c.req.json())
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

  const user = await usersRepository.create(input)

  return toUserDto(user)
}
```

### Why better

Framework details stay at the route boundary. The service receives plain input, owns the user-creation rule, and can be tested directly.

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

The page coordinates state. Mapping lives separately. Rendering is simpler. Tests can target mapping and UI separately.

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
    if (error.message === "USER_EXISTS") {
      return c.json({ error: "User exists" }, 409)
    }

    return c.json({ error: "Internal error" }, 500)
  }
})

app.post("/teams", async (c) => {
  try {
    const team = await createTeam(await c.req.json())
    return c.json({ team })
  } catch (error) {
    if (error.message === "TEAM_EXISTS") {
      return c.json({ error: "Team exists" }, 409)
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

  if (error instanceof NotFoundError) {
    return c.json({ error: error.message }, 404)
  }

  if (error instanceof ValidationError) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ error: "Internal error" }, 500)
})
```

Routes can stay focused:

```ts
app.post("/users", async (c) => {
  const input = createUserSchema.parse(await c.req.json())
  const user = await createUser(input)

  return c.json({ user }, 201)
})
```

### Why better

The boundary owns HTTP error translation. Services can throw meaningful domain/application errors.

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

### Good starting point

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

Simple, understandable, and enough separation for many small APIs.

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

When reviewing a codebase, produce something like:

```txt
1. Biggest modularity issue

The users route owns validation, database access, response mapping, and welcome-email behavior.

2. Why it increases complexity

Every change to user creation requires editing transport code. Tests must go through HTTP even when testing business rules. Database details also leak into response mapping.

3. Minimal fix

Move create-user orchestration into `users.service.ts`. Keep HTTP parsing and response status in the route. Keep SQL in `users.repository.ts`.

4. Better long-term structure

If user-related behavior grows, expose a public `users/index.ts` and prevent other features from importing user internals directly.

5. What not to change

Do not introduce interfaces, factories, or dependency injection yet. One implementation exists and the immediate problem is mixed responsibility, not implementation swapping.

6. Validation steps

Run route tests, service tests if added, typecheck, and inspect imports for deep internal references.
```
