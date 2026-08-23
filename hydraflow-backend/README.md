# 💧 HydraFlow Backend

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **📦 Monorepo** — Este paquete forma parte del monorepo [**JBDev23/hydraflow**](https://github.com/JBDev23/hydraflow). Clona el repositorio raíz, instala dependencias con `pnpm install` desde la raíz y usa los scripts `pnpm backend:*` documentados en el [README principal](../README.md).

> **El motor detrás de tu hidratación diaria. API REST para registro de agua, autenticación y gamificación.**

Backend de HydraFlow: lógica de negocio, PostgreSQL, autenticación JWT, registro de consumo de agua, logros e inventario de ítems.

⚠️ **Nota:** El proyecto se encuentra en **fase de pruebas (Testing)**.  
👉 El frontend (app móvil) vive en el mismo monorepo: [`../hydraflow-app`](../hydraflow-app).

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación antes que nadie y ayudarnos a testear su estabilidad, ¡puedes solicitar tu acceso a la beta privada!

Para unirte, envía un correo electrónico a:  
📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

_Te agradecemos que indiques en el asunto **"Solicitud Beta Hydraflow"** para que podamos procesar tu petición lo más rápido posible._

---

## 🚀 Características Principales

- **🔒 Autenticación Segura:** Login social con Google (verificación de ID token) + JWT. Login de prueba disponible fuera de producción (`ALLOW_TEST_LOGIN`).
- **🚰 Registro de Agua:** Endpoints para registrar, revertir y consultar métricas, rangos y estadísticas.
- **🏆 Gamificación:** Logros, experiencia y recompensas al cumplir metas.
- **🛍️ Ítems:** Catálogo, compra y equipamiento de accesorios para la mascota.
- **👤 Perfil de Usuario:** CRUD de perfil y exportación/borrado de cuenta.
- **🧪 Tests:** Jest + Supertest con Postgres en CI.

---

## 💻 Tecnologías

| Área | Stack |
|------|-------|
| Runtime | Node.js >= 22.13, TypeScript, Express 4 |
| Base de datos | PostgreSQL 15, Prisma 7 (`@prisma/adapter-pg`) |
| Auth | `google-auth-library`, JWT |
| Infra local | Docker Compose |
| Tests | Jest, Supertest |
| Gestor de paquetes | pnpm (workspace `hydraflow-backend`) |

La estructura de `modules/` está preparada para una migración futura a Nest (ver [`NEST_MIGRATION.md`](NEST_MIGRATION.md)).

---

## 📖 Estructura del Proyecto

```
hydraflow-backend/
├── src/
│   ├── modules/       # Lógica de dominio (auth, water, achievements, items, user)
│   ├── controllers/   # Adaptadores HTTP delgados
│   ├── routes/        # Definición de endpoints
│   ├── middleware/    # Auth, rate limit…
│   ├── prisma/        # Cliente Prisma y PrismaService
│   ├── lib/           # JWT, gamificación, preferencias, dayRange…
│   └── tests/         # Pruebas de integración
├── prisma/
│   ├── schema.prisma  # Modelo de datos
│   ├── migrations/    # Migraciones SQL
│   └── seed*.ts       # Datos iniciales (logros, agua de demo…)
├── docker-compose.yml # Postgres local
└── .env.example       # Plantilla de variables de entorno
```

---

## 🌐 API (resumen)

Prefijo base: `/` en el puerto configurado (`PORT`, por defecto `3000`).

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/auth/login` | No | Login Google / test |
| GET | `/user/profile` | Sí | Obtener perfil |
| PUT | `/user/profile` | Sí | Actualizar perfil |
| DELETE | `/user/account` | Sí | Eliminar cuenta |
| POST | `/water/log` | Sí | Registrar consumo |
| DELETE | `/water/log` | Sí | Revertir último registro |
| GET | `/water/metrics` | Sí | Métricas diarias |
| GET | `/water/range` | Sí | Métricas por rango de fechas |
| GET | `/water/stats` | Sí | Datos para gráficos |
| GET | `/water/export` | Sí | Exportar datos del usuario |
| GET | `/achievements/catalog` | Sí | Catálogo de logros |
| GET | `/items/catalog` | Sí | Catálogo de ítems |
| POST | `/items/buy` | Sí | Comprar ítem |
| POST | `/items/equip` | Sí | Equipar ítem |

---

## ⚙️ Desarrollo Local

### 1. Instalar dependencias (raíz del monorepo)

```bash
pnpm install
```

### 2. Base de datos con Docker

```bash
cd hydraflow-backend
docker compose up -d
```

Postgres queda en `localhost:5432` (usuario `admin`, contraseña `password123`, BD `hydraflow`).

### 3. Variables de entorno

```bash
cp .env.example .env
```

Variables principales (`.env.example`):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión PostgreSQL (pooler en prod) |
| `DIRECT_URL` | Conexión directa (migraciones Prisma) |
| `PORT` | Puerto HTTP (default `3000`) |
| `JWT_SECRET` | Secreto para firmar tokens |
| `GOOGLE_CLIENT_ID` | Client ID OAuth de Google |
| `ALLOW_TEST_LOGIN` | `true` en dev/CI para login de prueba |

Para producción (Neon, Railway…) usa `.env.production` — **nunca** commitees secretos reales.

### 4. Migraciones y seed

```bash
pnpm --filter hydraflow-backend prisma:migrate:deploy
pnpm --filter hydraflow-backend prisma:seed
```

En desarrollo activo de esquema: `pnpm --filter hydraflow-backend prisma:migrate`.

### 5. Arrancar la API

Desde la raíz:

```bash
pnpm backend:dev
```

O dentro de `hydraflow-backend/`: `pnpm dev` (nodemon + ts-node).

---

## 📜 Scripts

Desde la raíz del monorepo:

| Script | Descripción |
|--------|-------------|
| `pnpm backend:dev` | API en modo desarrollo |
| `pnpm backend:test` | Jest |
| `pnpm backend:build` | `prisma generate` + `tsc` |

Scripts del paquete (`pnpm --filter hydraflow-backend <script>`):

| Script | Descripción |
|--------|-------------|
| `dev` | Servidor con recarga en caliente |
| `build` / `start` | Compilar y ejecutar producción |
| `prisma:migrate` | Migración interactiva en dev |
| `prisma:migrate:deploy` | Aplicar migraciones (CI/prod) |
| `prisma:seed` | Poblar BD de desarrollo |
| `test` | Suite de tests |
| `lint` / `format:check` | Calidad de código |

---

## 🤝 Contribución

1. Haz _Fork_ del monorepo [JBDev23/hydraflow](https://github.com/JBDev23/hydraflow).
2. Crea tu rama (`git checkout -b feature/NuevaRuta`).
3. Asegúrate de que pasen los tests (`pnpm backend:test`).
4. Abre un _Pull Request_ contra `main`.

---

## ✅ Checks de CI (local)

GitHub Actions ejecuta en cada push/PR a `main` los mismos checks filtrados por cambios en `hydraflow-backend/`. Usa las variables de `.env.example` (Postgres local con Docker; no uses `.env.production` ni credenciales de Neon):

```bash
cd hydraflow-backend
docker compose up -d
cd ..
pnpm install
pnpm backend:test
# o por paquete:
pnpm --filter hydraflow-backend prisma:migrate:deploy
pnpm --filter hydraflow-backend prisma:seed
pnpm --filter hydraflow-backend format:check
pnpm --filter hydraflow-backend lint
pnpm --filter hydraflow-backend build
pnpm --filter hydraflow-backend test
```

---

## 📄 Licencia

Proyecto de código abierto. Consulta el archivo `LICENSE` (si aplica) para más detalles.
