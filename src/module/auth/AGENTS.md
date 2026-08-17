# Auth module (Better Auth)

Email and password authentication for the backend, governed by spec [0001](../../../docs/specs/0001-better-auth-email-password.md).

## Layout

- `src/lib/auth/auth.ts` — `authOptions(prisma)`, `createAuth`, and the `Auth` / `Session` types
- `src/lib/auth/auth.constants.ts` — the `AUTH` injection token, kept in its own file to break a circular import
- `src/lib/auth/auth.module.ts` — `@Global` module providing the auth instance and `AuthService`
- `src/lib/auth/auth.service.ts` — `handler` (the Node handler for `/api/auth`) and `getSession(headers)` with cookie rotation
- `src/module/auth/auth.controller.ts` — `@All("api/auth/{*splat}")` forwarded to the handler, plus `GET /auth/me` behind `AuthGuard`
- `src/common/guards/auth.guard.ts` — `AuthGuard` (CanActivate) and the `AuthenticatedRequest` type

## Conventions

- No `new` on services: inject `PrismaService` and the `AUTH` token through constructors.
- The JSON body parser is scoped off `/api/auth` in `src/main.ts`; the auth controller never reads `@Body()`.
- Regenerate the auth tables with the CLI: `npx --yes @better-auth/cli generate --config auth.config.ts --output prisma/schema.prisma --y` (the `--y` answers the overwrite prompt).
- `auth.config.ts` at the repo root exists only for the CLI and is excluded from the build (`tsconfig.build.json`).
- Env: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in `.env`, read through factory providers so env has loaded.
- One route decorator per method: stacked `@All()` decorators overwrite each other.
- `sendResetPassword` must return `Promise<void>`; the mock sender logs the reset URL as JSON.

## Skills

- [better-auth-best-practices](../../../.agents/skills/better-auth-best-practices/): `better-auth/skills`, Better Auth server and client configuration
- [create-auth](../../../.agents/skills/create-auth/): `better-auth/skills`, scaffolding Better Auth in TypeScript apps

_Drafted by /sync from the introducing change, worth a quick human pass._
