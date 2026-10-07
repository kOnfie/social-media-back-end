## Project overview

NestJS (v11) REST API for a social media app. Postgres via TypeORM, Redis cache (verification / reset codes), custom cookie-based session auth (no JWT), Resend for email.

## Commands

- `npm run lint` auto-fixes.
- Single test: `npx jest path/to/file.spec.ts`.
- Redis is required: `docker-compose up -d redis`.

## Environment variables

Read from `.env` (not in git): `PORT`, `NODE_ENV` (`dev` enables Swagger at `/api/docs`), `REDIS_PASSWORD`, `RESEND_API_KEY`, `SALT_ROUNDS`.

## Architecture

Module-per-domain under `src/modules/` (`auth`, `user`, `session`, `follow`); cross-cutting code in `src/common/`.

- **DTOs are the strict contract** for every request body (global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`).
- **Auth is cookie sessions, not JWT.** Protected controllers use `@UseGuards(AuthGuard)` at class level; handlers get the user via `@CurrentUser()` (optionally `@CurrentUser('id')`).
- **Atomic password/session mutations** (change/reset password + invalidate sessions + issue new one) go through `DataSource.transaction` in `AuthService`, not repository methods.
- **Mail is behind an interface:** inject `@Inject(MAIL_PROVIDER_KEY) private mailProvider: IMailProvider`, never the Resend provider directly.
- **Never return raw `User` or `Follow` entities from a controller.** Go through `UserPresenter` / `FollowPresenter` (response DTOs with `@Expose()`); nested `follower`/`followee` need `@Type(() => UserResponseDto)` for `class-transformer` to recurse.
- **Swagger:** document new endpoints with the per-status-code DTO pattern (`dto/error-response/*`, `dto/signup/signup-conflict-response.dto.ts`), not inline schemas.
- **`synchronize: true`, no migrations** — entity changes alter the local DB schema on boot.
- **Follow** uses an explicit join entity (not `@ManyToMany`). The `@Unique(['followee', 'follower'])` constraint is the real duplicate guard; app-level checks only give a nicer error and are still racy. In `confirmSubscription`, ownership checks run *before* the status check and throw 403 (not 409), so a non-owner can't infer the request's state. `getMyFollowers`/`getMyFollowees` filter `ACCEPTED`; only `getPendingFollowRequests` returns `PENDING`.

## Conventions to follow

- DTOs live under each module's `dto/`, split by concern (e.g. `dto/signup/`, `dto/response/`, `dto/error-response/`) — mirror this when adding endpoints rather than flattening into one file.
- Service methods generally return `null` (not throw) when a lookup misses (e.g. `UserService.findById`), and it's the controller/calling service's job to throw the appropriate `HttpException`.
- Use the existing param decorators/guards (`@CurrentUser()`, `AuthGuard`) instead of reaching into `request` directly in new handlers.
