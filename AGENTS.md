# Hackathon Backend

NestJS 11 project. Express adapter.

## Build approach

Tracer Bullet (thin end to end slices, one working flow at a time).

## Role

You are a senior NestJS developer. Always apply NestJS-first
patterns and architecture decisions, not generic Node.js approaches.

## Code standards

- Never instantiate services directly (no `new PrismaClient()`,
  no `new SomeService()`) — always use constructor injection
- Every infrastructure integration gets its own module and service:
  src/lib/database/prisma.module.ts + prisma.service.ts
  src/lib/mail/mail.module.ts + mail.service.ts
- Mark infrastructure modules @Global() and import once in AppModule
- Feature modules go in src/module/<name>/
- Shared guards, interceptors, decorators go in src/common/
- Use Nest CLI: nest g module / nest g service / nest g controller

## Commands

- `npm run db:generate` / `db:migrate` / `db:format` / `db:studio` — Prisma generate, migrate dev, format, studio

## Skills

Do not load any skill by default. Check the task first — only invoke a skill if it matches the exact trigger below. Never invoke a skill just because it exists.

- `/architect` — before building something non-trivial with no plan yet
- `/check review` — when a feature is done and needs a senior production code review
- `/debug` — when something is broken and the fix isn't obvious
- `/sync` — at the end of a completed change to update durable project context for future sessions

## Session continuity

REQUIRED — do not skip, do not wait to be asked:

- **First action of every session:** read the existing AGENTS.md and relevant project documentation to restore context before doing anything else.
- **Last action of every session:** run `/sync` after completing a change to update durable project context before closing.

## Agent skills

Installed skill packages, loaded only when the task matches their description:

- [prisma-cli](.agents/skills/prisma-cli/): `prisma/skills`, CLI commands (generate, migrate, db, studio, mcp)
- [prisma-client-api](.agents/skills/prisma-client-api/): `prisma/skills`, Prisma Client queries and CRUD
- [prisma-compute](.agents/skills/prisma-compute/): `prisma/skills`, Prisma Compute deployment and hosting
- [prisma-database-setup](.agents/skills/prisma-database-setup/): `prisma/skills`, configuring databases (PostgreSQL, SQLite, MongoDB)
- [prisma-driver-adapter-implementation](.agents/skills/prisma-driver-adapter-implementation/): `prisma/skills`, Prisma ORM 7 driver adapter internals
- [prisma-mongodb-upgrade](.agents/skills/prisma-mongodb-upgrade/): `prisma/skills`, MongoDB v6 to v7 upgrade decisions
- [prisma-postgres](.agents/skills/prisma-postgres/): `prisma/skills`, Prisma Postgres setup and operations
- [prisma-postgres-setup](.agents/skills/prisma-postgres-setup/): `prisma/skills`, new Prisma Postgres database setup via the Management API
- [prisma-upgrade-v7](.agents/skills/prisma-upgrade-v7/): `prisma/skills`, Prisma v6 to v7 migration guide

## Context files

- [src/module/auth/AGENTS.md](src/module/auth/AGENTS.md): the Better Auth feature, its conventions, and its governing spec
