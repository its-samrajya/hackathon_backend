# Scope: Hackathon backend

A NestJS API for the hackathon product. It serves authenticated routes over HTTP, with participants signing up and signing in, and no frontend in this repo yet.

**Build approach:** Tracer Bullet (thin end to end slices, one working flow at a time).
**Workflow:** Alpha (after a build, run check verify). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Authentication (Better Auth) | Foundation | in-progress |

## Foundations

### 1. Authentication (Better Auth) · in-progress
Email and password sign up, sign in, sessions, sign out, and password reset for the backend API, on Better Auth with the global Arcjet guard intact.
**Done when:** a participant can sign up, sign in, and reach protected routes with a session cookie, can reset a forgotten password, and anonymous callers get 401.
- [x] Design it (spec): `/architect authentication`
- [x] Build it: `/develop authentication`
   - [x] Auth tables and env: generate the Better Auth schema with the role field and the posts relation, apply the migration, set the secret and URL (AC-1, AC-5)
   - [x] Sign up and sign in: the auth instance, the global lib module, and the controller forwarding on `/api/auth` with the body parser scoped off (AC-1, AC-2, AC-6)
   - [x] Protected route: the auth guard with cookie rotation and `GET /auth/me` (AC-4, AC-7)
   - [x] Reset, sign out, and verification: reset parsed from the logged URL, idempotent sign out, tests and curl flows (AC-3, AC-5)
- [ ] Verify it: `/check verify authentication`
Spec [0001](../specs/0001-better-auth-email-password.md) · code in `src/lib/auth/`, `src/module/auth/`, `src/common/guards/auth.guard.ts`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Email verification**: confirm addresses before sign in · from spec 0001
- **Real email sending**: swap the mock sender for a provider such as Resend · from spec 0001
- **Role based access**: enforce the ADMIN and PARTICIPANT role on routes, with admin assignment · from spec 0001
- **Frontend CORS**: cookies with credentials and trusted origins when a frontend appears · from spec 0001
- **Proxy hardening**: behind proxy and trusted origins for a reverse proxy deployment · from spec 0001

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` + 2 to 5 milestones; the tier's closing boxes; any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is; `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Workflow** (header line) is the project default: **Prototype** = nothing; **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
