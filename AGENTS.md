# Hackathon Backend

NestJS 11 project. Express adapter.

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
