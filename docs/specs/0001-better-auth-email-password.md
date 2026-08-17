# 0001. Adopt Better Auth for email and password authentication

**Date**: 2026-08-16
**Status**: In Progress

## Summary

We are adding sign up, sign in, sessions, and password reset to the backend using Better Auth, a self hosted TypeScript auth library. Better Auth writes its own tables into the Prisma database we already use and handles the security details for us. It mounts on a single route and we write a small NestJS guard to protect the API. This spec records the choices and the build order.

## Context

The backend has no authentication yet. It is a NestJS 11 app on Express with Prisma Postgres freshly wired in and a global Arcjet guard that applies Shield and rate limiting to every route. The hackathon product needs users who sign up with email and password, keep a session, and access protected endpoints. Password reset is needed too.

The load bearing tension is how Better Auth mounts into NestJS. The official NestJS integration page points to a community module, but that module requires turning off the app body parser, which would mute Arcjet Shield's body analysis on the rest of the API. Rolling our own password and session code is a known failure pattern: token expiry, refresh rotation, cookie flags, and CSRF are each a potential breach, and the team has days, not quarters.

The project conventions push a clear shape: infrastructure integrations live in `src/lib/<name>/` as their own module and service, feature modules live in `src/module/<name>/`, and shared guards live in `src/common/guards/`. Two Better Auth agent skills are already installed in this project and are authoritative for how the library wants to be used. The build approach is not recorded anywhere, so this spec defaults to thin end to end slices, one working flow at a time.

## Requirements

**User stories**:
- As a participant, I want to sign up with email and password so that I can use the protected API.
- As a participant, I want to sign in so that my requests are recognized by the API.
- As a participant, I want to sign out so that my session ends.
- As a participant, I want to reset my password when I forget it so that I can get back in.
- As the API, I want protected endpoints to accept only signed in requests so that anonymous users cannot use them.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: A user can sign up with email and password. The account is created with role PARTICIPANT and the sign up request cannot set the role.
- **AC-2**: A signed up user can sign in and receives a session cookie that authenticates subsequent requests.
- **AC-3**: Signing out invalidates the session and the signed out cookie no longer authenticates.
- **AC-4**: `GET /auth/me` returns the signed in user's profile. An anonymous caller receives 401.
- **AC-5**: A signed in user can request a password reset, receives a reset link, and can set a new password with it. The reset email content is written to the console by the mock sender.
- **AC-6**: The auth endpoints remain behind the global Arcjet rate limit and Shield.
- **AC-7**: Any route protected by the auth guard returns 401 when no valid session is present.

## Options considered

### Option 1: Better Auth self hosted, mounted through a Node handler in a controller

Better Auth runs as a library inside the NestJS app. A small controller forwards the `/api/auth/*` path to the library's handler, the app body parser stays on, and we write our own `AuthGuard` in `src/common/guards/` that reads the session cookie and rejects anonymous callers.

**Pros**:
- The body parser stays on, so Arcjet Shield keeps seeing request bodies on the whole API.
- Standard Better Auth API, no community dependency, easy to upgrade.
- Uses the Prisma database already wired in; no separate store.

**Cons**:
- We own a thin layer of NestJS glue (the controller and guard) and its edge cases.
- Cookie based sessions mean CORS with credentials later when a frontend arrives.

### Option 2: Better Auth via the community module @thallesp/nestjs-better-auth

The official integration page recommends this package. It ships a global guard and a `Session` decorator.

**Pros**:
- The documented path, less glue to write.
- Ships a global auth guard out of the box.

**Cons**:
- Requires `bodyParser: false` in `main.ts`, which mutes Arcjet Shield on the REST API and forces manual JSON handling.
- Community maintained, so upgrade cadence and support lag the library.
- A global guard is the wrong default here: at launch only one route is protected.

### Option 3: A hosted provider such as Clerk or Auth0

A managed identity service with a hosted sign in page.

**Pros**:
- No server auth code, no sessions to run, strong defaults.
- Forgot password and email flows handled.

**Cons**:
- Another external account and an SDK to integrate.
- User data lives in the provider, not in the Prisma database, which fragments the data model.
- Overkill for a hackathon product with one sign in method and no compliance driver.

### Option 4: Custom auth built directly on Prisma

Hand written passwords, sessions, and reset tokens.

**Pros**:
- Zero new dependencies, full control.

**Cons**:
- Password hashing, session rotation, cookie security, and CSRF are exactly the failure pattern the project's standards warn about.
- The most implementation and review time, which a hackathon does not have.

## Decision

**Chosen option**: Option 1: Better Auth self hosted, mounted through a Node handler in a controller.

Better Auth runs inside the NestJS app with email and password enabled, cookie sessions, a mock email sender, a role field on the user that defaults to PARTICIPANT and is not settable at sign up, and our own `AuthGuard` protecting `/auth/me` and any future route. The global Arcjet guard stays untouched.

**Implementation skills**: `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`) · `create-auth` (`better-auth/skills`, `.agents/skills/create-auth/`)

## Rationale

The team is small and time is short, so the library that carries the security burden is the right trade. Better Auth is the current best fit for this stack: it is TypeScript first, its adapter writes directly into the Prisma database already wired in, and it is self hosted, so no new account or data silo. That is a strong fit against the forces in Context.

The mounting decision is what separates the options. Keeping the app body parser on preserves the global Arcjet protection that is already live, and writing our own guard matches the project's NestJS first convention of shared guards in `src/common/`. The community module is the documented path, but it costs the body parser and with it a working security layer, which is the bigger loss for a feature whose whole job is security (basis: the Arcjet guard already running on every route, per AGENTS.md and `src/app.module.ts`).

Rolling our own auth on Prisma was never a real contender: the known failure pattern of hand built password and session code is exactly what this feature is about avoiding (basis: the reinventing auth failure pattern). A hosted provider solves the problem but moves user data out of the project's own database and adds an external account for a product with one sign in method (basis: the hackathon scope and the existing Prisma integration).

## Feature design

**Data model sketch**:

Generated by `npx @better-auth/cli generate --output prisma/schema.prisma` after the existing hand written `User` model is removed, then adjusted:

- `user`: id String @id @default(cuid()), name String?, email String @unique, emailVerified Boolean @default(false), image String?, createdAt DateTime, updatedAt DateTime, `role Role @default(PARTICIPANT)`, sessions Session[], accounts Account[]
- `session`: id String @id, token String @unique, userId String, expiresAt DateTime, ipAddress String?, userAgent String?, createdAt DateTime, updatedAt DateTime
- `account`: id String @id, accountId String, providerId String, userId String, accessToken String?, refreshToken String?, idToken String?, accessTokenExpiresAt DateTime?, refreshTokenExpiresAt DateTime?, scope String?, password String?, createdAt DateTime, updatedAt DateTime
- `verification`: id String @id, identifier String, value String, expiresAt DateTime, createdAt DateTime, updatedAt DateTime
- `enum Role`: PARTICIPANT, ADMIN
- `post`: `authorId` changes from Int to String, the relation reattaches to the new `user` model, and `user.posts Post[]` returns

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/auth/sign-up/email | POST | email (req), password (req), name (opt) | user, session cookie | public | 422 invalid, 409 email taken |
| /api/auth/sign-in/email | POST | email (req), password (req) | session cookie | public | 401 invalid credentials |
| /api/auth/sign-out | POST | cookie | ok, 200 even with no session | public | none (idempotent) |
| /api/auth/get-session | GET | cookie | session or null | public | none |
| /api/auth/request-password-reset | POST | email (req) | ok, always 200 | public | none |
| /api/auth/reset-password | POST | newPassword (req), token (req) | ok | public | 400 invalid or expired token |
| /auth/me | GET | cookie | user (id, name, email, role, image) | signed in | 401 no session |

**Value sourcing** (every value each action produces, computes, or displays, and its named source):

| Action | Value produced / displayed | Source |
|---|---|---|
| Sign up | user.role | DB default PARTICIPANT, never an input |
| Sign in | session cookie | Better Auth session token, signed with BETTER_AUTH_SECRET |
| get-session and /auth/me | session user profile | DB user row looked up by session token |
| get-session on an aging session | rotated session cookie | Better Auth updateAge refresh, propagated to the client by the auth guard |
| request-password-reset | reset link and email body | Better Auth generated URL from BETTER_AUTH_URL plus a token stored in the verification table |
| reset-password | new password hash | Better Auth password hashing |
| /auth/me | user.role displayed | DB column user.role |

**Key invariants**:
- `user.email` is unique.
- `user.role` is always PARTICIPANT or ADMIN, enforced by the DB enum, defaults to PARTICIPANT, and is never accepted from the sign up request (`input: false`).
- A session token is unique and expires; sessions refresh on activity.
- Passwords are never stored in plaintext; Better Auth hashes them, with a minimum of 8 characters.
- The JSON body parser applies to every route except `/api/auth`; the auth controller never reads `@Body()`, and Arcjet Shield reads the request body itself.
- Every auth request still passes through the global Arcjet guard.

**Security model**:
- Public (but Arcjet rate limited and Shield protected): all `/api/auth/*` endpoints.
- Authenticated: `/auth/me` and any route annotated with the auth guard.
- No role based access at launch; the role column is reserved for a future admin rule. Admin assignment happens in the database.
- The session cookie uses Better Auth defaults: httpOnly, sameSite lax, and secure when the app runs on HTTPS.
- The auth guard propagates any rotated session cookie that `getSession` returns, so active sessions stay fresh.
- Behind a reverse proxy or TLS terminator, set `behindProxy` and `trustedOrigins` so cookie flags and generated URLs resolve correctly.

**Configuration required**:
- `BETTER_AUTH_SECRET`: a random string of at least 32 characters used to sign cookies and tokens, added to `.env`
- `BETTER_AUTH_URL`: the public base URL of the app, e.g. `http://localhost:3000`, added to `.env`
- No email provider at launch; the password reset sender writes the full reset URL to the console as JSON.
- Code config, not env: `basePath` set to `/api/auth`, `session.expiresIn` 7 days, `session.updateAge` 1 day, `password.minLength` 8.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: sign up, sign in, call `/auth/me`, sign out, and confirm the signed out cookie no longer authenticates, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**
- Failure case: request a password reset, parse the token from the reset URL logged by the mock sender, set a new password, then sign in with it, verifies **AC-5**
- Auth/permission: under the Arcjet limit, an anonymous call to `/auth/me` and to a guard protected route returns 401, and a fabricated or expired session cookie also returns 401, verifies **AC-4**, **AC-7**
- Rate limit: lower `ARCJET_RATE_LIMIT_MAX` in the test env, burst the sign in endpoint past the window, and confirm a 403, verifies **AC-6**

## Build plan

Build approach is not recorded in this project, so this spec assumes thin end to end slices (a tracer bullet), each slice leaving a working flow behind. The data model is the coherent target and lands as one migration sized to the feature.

1. Install `better-auth` and `@better-auth/cli`, delete the existing hand written `User` model, generate the auth tables into `prisma/schema.prisma`, then adjust the generated schema: add the `Role` enum, set `user.role` to it with a PARTICIPANT default, and reattach the `post` relation with `authorId` as String. Run `npx prisma migrate dev`, satisfies **AC-1**, **AC-5**
2. Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `.env`, satisfies **AC-2**
3. Create `src/lib/auth/auth.ts` with the `betterAuth()` config: email and password enabled, `basePath` set to `/api/auth`, the secret and URL from env read through a factory provider so env has loaded, the Prisma adapter built on the injected `PrismaService` with the postgresql provider, `session.expiresIn` 7 days and `updateAge` 1 day, `password.minLength` 8, the role field with `input: false` and a PARTICIPANT default, and a mock `sendResetPassword` callback that logs the full reset URL as JSON, satisfies **AC-1**, **AC-5**
4. Create `src/lib/auth/auth.module.ts` as a global module providing the auth instance and `src/lib/auth/auth.service.ts` with a `getSession` helper, satisfies **AC-2**, **AC-7**
5. Create `src/module/auth/` with an `AuthController` that forwards `GET` and `POST` on `/api/auth/*` to the Better Auth handler, and scope the JSON body parser off the auth path in `main.ts` so the REST API keeps it. Gate for this task: a real sign up round trip posts a non empty body, satisfies **AC-6**
6. Create `src/common/guards/auth.guard.ts` that resolves the session from the cookie, propagates any rotated session cookie, and throws 401 when absent, and add `GET /auth/me` to the auth controller, protected by that guard, returning the session user, satisfies **AC-4**, **AC-7**
7. Verify the full flows with curl and a test suite: sign up, sign in, `/auth/me`, sign out (idempotent 200), password reset parsed from the logged URL, role asserted through the injected `PrismaService`, auth guard cases run under the rate limit, and an Arcjet burst with a lowered `ARCJET_RATE_LIMIT_MAX`, satisfies **AC-1** through **AC-7**

## Consequences

**Positive**:
- Passwords, sessions, and reset tokens are handled by a proven library instead of hand written security code.
- The global Arcjet guard and the app body parser stay untouched.
- The data model lives entirely in the existing Prisma database, no new store or external account.

**Negative / tradeoffs**:
- A new dependency and its generated schema shape (cuid string ids) that the team must learn.
- The thin NestJS glue, the controller and the guard, is ours to maintain.
- Cookie sessions mean CORS with credentials becomes necessary once a frontend on another origin appears.

**Neutral**:
- New tables appear: user, session, account, verification.
- `post.authorId` changes type from Int to String.
- The email sender is a mock until a real provider is added.
- Two new environment variables in `.env`.

## Follow-up

- [ ] The two installed Better Auth skills (`better-auth-best-practices`, `create-auth`) are not yet referenced in AGENTS.md. The auth area's `AGENTS.md` (e.g. `src/module/auth/AGENTS.md`) should capture their conventions before implementation begins, with a one line pointer added in root AGENTS.md (do not add area conventions to root AGENTS.md)
- [ ] Consider installing the `email-and-password-best-practices` and `better-auth-security-best-practices` skills from the `better-auth/skills` pack for stronger implementation guidance
- [ ] Optional for agent convenience, not required for the build: the Better Auth docs MCP server (https://better-auth.com/docs/ai-resources/mcp) and the Prisma MCP server (built into `npx prisma mcp`)
- [ ] When a frontend lands, enable CORS with credentials and set `trustedOrigins` for the frontend origin
- [ ] Deployment note: when the app sits behind a reverse proxy or TLS terminator, set `behindProxy` and `trustedOrigins` so cookie flags and generated URLs resolve correctly
- [ ] Future work outside this spec: email verification (note: enabling it flips `requireEmailVerification` and blocks sign in until verified, so decide deliberately), real email sending via a provider such as Resend, and role based access once an admin rule exists

## References

**Project sources**:
- `AGENTS.md`, the infrastructure module and shared guard conventions
- Installed community skills `better-auth-best-practices` and `create-auth` (`.agents/skills/`)
- Existing stack: NestJS 11 on Express, Prisma 7.9.1 with the `PrismaPg` adapter, the global Arcjet guard in `src/common/guards/arcjet.guard.ts`
- Spec 0001 (this decision) is the first spec in `docs/specs/`

**Practices & standards**:
- The reinventing auth failure pattern: use a proven auth library, do not hand build password and session code
- Rate limit any public endpoint, with no MVP exceptions
- OWASP session management guidance: httpOnly, sameSite, and secure cookie flags

**Links** (web verified during the tool discovery check):
- Better Auth NestJS integration: https://better-auth.com/docs/integrations/nestjs
- Better Auth agent skills: https://better-auth.com/docs/ai-resources/skills
- Better Auth MCP server: https://better-auth.com/docs/ai-resources/mcp
- Prisma MCP server: https://www.prisma.io/docs/ai/tools/mcp-server
