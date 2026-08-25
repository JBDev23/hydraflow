# hydraflow-backend

API NestJS + Prisma/PostgreSQL del monorepo [HydraFlow](../README.md). Producto, arranque conjunto, Railway y CI están documentados ahí.

Contrato HTTP con la app: JWT Bearer y cuerpos `{ success, ... }` / `{ error }`. Puerto por defecto `3000`.

## Estructura

```
hydraflow-backend/
├── src/
│   ├── main.ts          # Bootstrap Nest
│   ├── nest-app.ts      # Factory (prod + tests)
│   ├── app.module.ts
│   ├── modules/         # auth, user, water, shop, achievements
│   ├── prisma/          # PrismaModule / PrismaService
│   ├── lib/             # JWT, gamificación, dayRange…
│   └── tests/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed*.ts
├── docker-compose.yml   # Postgres 15 local
├── railway.toml
└── .env.example
```

## Entorno local

```bash
cp .env.example .env
docker compose up -d
```

Postgres: `localhost:5432`, usuario `admin`, contraseña `password123`, BD `hydraflow`.

| Variable           | Descripción                  |
| ------------------ | ---------------------------- |
| `DATABASE_URL`     | PostgreSQL (pooler en prod)  |
| `DIRECT_URL`       | Conexión directa para Prisma |
| `PORT`             | HTTP (default `3000`)        |
| `JWT_SECRET`       | Secreto JWT                  |
| `GOOGLE_CLIENT_ID` | OAuth Google                 |
| `ALLOW_TEST_LOGIN` | Login de prueba en dev/CI    |

No commitees `.env.production` ni secretos reales. Plantilla: [`.env.example`](.env.example).

Migraciones y seed (desde la raíz del monorepo):

```bash
pnpm --filter hydraflow-backend prisma:migrate:deploy
pnpm --filter hydraflow-backend prisma:seed
```

En desarrollo de esquema: `pnpm --filter hydraflow-backend prisma:migrate`.

## Scripts

Desde la **raíz**: `pnpm backend:dev`, `pnpm backend:test`, `pnpm backend:build`.

En este paquete (`pnpm --filter hydraflow-backend <script>` o `pnpm <script>` aquí):

| Script                           | Descripción           |
| -------------------------------- | --------------------- |
| `dev`                            | Nest watch            |
| `build` / `start`                | Compilar y ejecutar   |
| `prisma:migrate`                 | Migración interactiva |
| `prisma:migrate:deploy`          | Aplicar migraciones   |
| `prisma:seed`                    | Datos de desarrollo   |
| `test` / `lint` / `format:check` | Calidad               |

## API

| Método | Ruta                    | Auth | Descripción              |
| ------ | ----------------------- | ---- | ------------------------ |
| GET    | `/`                     | No   | Health check             |
| POST   | `/auth/login`           | No   | Login Google / test      |
| GET    | `/user/profile`         | Sí   | Perfil                   |
| PUT    | `/user/profile`         | Sí   | Actualizar perfil        |
| DELETE | `/user/account`         | Sí   | Eliminar cuenta          |
| POST   | `/water/log`            | Sí   | Registrar consumo        |
| DELETE | `/water/log`            | Sí   | Revertir último registro |
| GET    | `/water/metrics`        | Sí   | Métricas diarias         |
| GET    | `/water/range`          | Sí   | Rango de fechas          |
| GET    | `/water/stats`          | Sí   | Datos para gráficos      |
| GET    | `/water/export`         | Sí   | Exportar datos           |
| GET    | `/achievements/catalog` | Sí   | Catálogo de logros       |
| GET    | `/shop/catalog`         | Sí   | Catálogo de ítems        |
| POST   | `/shop/buy`             | Sí   | Comprar ítem             |
| POST   | `/shop/equip`           | Sí   | Equipar ítem             |
