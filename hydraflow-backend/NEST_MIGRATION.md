# NestJS cutover (post Prisma 7)

This backend is structured so Nest can reuse the ORM and domain layers with minimal rewrites.

## Preserve for the mobile app

| Contract    | Detail                                                               |
| ----------- | -------------------------------------------------------------------- |
| Routes      | `/auth`, `/user`, `/water`, `/achievements`, `/shop`                 |
| Auth        | `Authorization: Bearer <JWT>` with payload `{ userId, email }` (30d) |
| Login       | `POST /auth/login` — Google ID token or non-prod `provider: "test"`  |
| JSON shapes | Keep existing `{ success, ... }` / `{ error }` responses             |

## Map Express → Nest

| Today (Express)                                                          | Nest                                                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`src/prisma/prisma.service.ts`](src/prisma/prisma.service.ts)           | `@Injectable()` `PrismaService` + `OnModuleInit` / `OnModuleDestroy` calling `$connect` / `disconnect()` |
| [`src/modules/*/`](src/modules) services                                 | Same classes with `@Injectable()`; inject `PrismaService` instead of importing the singleton             |
| [`src/middleware/auth.middleware.ts`](src/middleware/auth.middleware.ts) | `AuthGuard` (JWT) setting `userId` on the request                                                        |
| Controllers                                                              | Nest controllers; HTTP status mapping for `DomainError` stays the same                                   |
| `getTzOffsetFromRequest`                                                 | Pass offset from headers via a Nest decorator/pipe (decouple from Express `Request`)                     |

## Suggested Nest modules

- `PrismaModule` (global) — exports `PrismaService`
- `AuthModule` — login + guard
- `UserModule` — profile CRUD / delete / export
- `WaterModule` — log, revert, metrics, graphs
- `ShopModule` — items catalog, buy, equip
- `AchievementsModule` — catalog (+ unlock helpers already in `lib/achievements`)

## Env (unchanged)

- `DATABASE_URL` — pooled (runtime adapter)
- `DIRECT_URL` — direct (Prisma CLI / `prisma.config.ts`)
- `JWT_SECRET`, `GOOGLE_CLIENT_ID`

## Cutover steps

1. Scaffold Nest (`nest new` or migrate this package).
2. Register `PrismaModule` globally; generate client via existing `prisma generate` / `postinstall`.
3. Port each domain service with constructor injection of `PrismaService`.
4. Port routes 1:1; run [`src/tests/api.test.ts`](src/tests/api.test.ts) against the Nest app (swap `app` export).
5. Point the Expo app at the Nest base URL when parity is green.
