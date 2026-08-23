# 💧 HydraFlow

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **Tu compañero de hidratación diario — app móvil gamificada + API backend.**

Repositorio monorepo en [**github.com/JBDev23/hydraflow**](https://github.com/JBDev23/hydraflow) con [pnpm workspaces](https://pnpm.io/workspaces): cliente móvil (Expo/React Native) y API REST (Express/Prisma/PostgreSQL).

| Paquete | Ruta | Descripción |
|---------|------|-------------|
| **App** | [`hydraflow-app/`](hydraflow-app/) | Cliente móvil Expo |
| **Backend** | [`hydraflow-backend/`](hydraflow-backend/) | API REST + PostgreSQL |

⚠️ **Nota:** El proyecto se encuentra en **fase de pruebas (Testing)**.

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación en tu teléfono antes del lanzamiento en tiendas y ayudarnos a testear su estabilidad, solicita acceso a la beta privada.

📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

Asunto sugerido: **"Solicitud Beta Hydraflow"** o **"Solicitud Beta Hydraflow App"**.

---

## 📱 Vistazo a la App

| Pantalla Principal | Estadísticas | Logros |
| :--: | :--: | :--: |
| <img width="921" height="2048" alt="Pantalla principal" src="https://github.com/user-attachments/assets/803612be-31c8-49ca-8e39-ac2cbb68ee59" /> | <img width="921" height="2048" alt="Estadísticas" src="https://github.com/user-attachments/assets/e3f8eda3-0586-4380-97f9-a087e9fab2c5" /> | <img width="921" height="2048" alt="Logros" src="https://github.com/user-attachments/assets/ac31cb94-d1cd-4583-a987-840fdfe3a124" /> |
| Tienda | Onboarding | Perfil |
| <img width="921" height="2048" alt="Tienda" src="https://github.com/user-attachments/assets/1868b123-64da-42a5-bfe8-84c58d7a9871" /> | <img width="921" height="2048" alt="Onboarding" src="https://github.com/user-attachments/assets/2fc1629e-0ee5-4600-a9fc-c18ca71e82ea" /> | <img width="921" height="2048" alt="Perfil" src="https://github.com/user-attachments/assets/2224c348-8275-4783-886e-82aceb832880" /> |

---

## 🚀 Características

### App móvil

- **💧 Seguimiento Intuitivo:** Registro rápido de vasos con anillo de progreso visual.
- **🐾 Mascota Interactiva (Hydra):** Progreso vinculado a la mascota; accesorios desbloqueables.
- **📊 Estadísticas:** Gráficos semanales y calendario de hidratación.
- **🔔 Notificaciones:** Recordatorios push locales.
- **🔒 Google Sign-In:** Autenticación nativa + JWT hacia el backend.
- **🌍 Multiidioma:** Catalán, español e inglés (i18next).
- **🌙 Offline y tema oscuro:** Cola de sincronización y modo claro/oscuro.

### Backend

- **🔒 Autenticación:** Google ID token + JWT; login de prueba en dev/CI.
- **🚰 Agua:** Registro, reversión, métricas, rangos, estadísticas y exportación.
- **🏆 Gamificación:** Logros, XP y recompensas.
- **🛍️ Ítems:** Catálogo, compra y equipamiento.
- **👤 Usuario:** Perfil, actualización y borrado de cuenta.
- **🧪 Tests:** Jest + Supertest con Postgres en CI.

---

## 💻 Stack Tecnológico

### App (`hydraflow-app`)

| Área | Tecnología |
|------|------------|
| Framework | React Native 0.86, Expo SDK 57 (dev client + EAS) |
| Enrutamiento | Expo Router |
| Estado | React Context (`Auth`, `User`, `Hydration`, `Offline`, `Theme`, `AppShell`) |
| Animaciones | Reanimated 4, gesture-handler |
| UI | react-native-svg |
| Tests | Jest + jest-expo |

### Backend (`hydraflow-backend`)

| Área | Tecnología |
|------|------------|
| Runtime | Node.js >= 22.13, TypeScript, Express 4 |
| Base de datos | PostgreSQL 15, Prisma 7 |
| Auth | google-auth-library, JWT |
| Contenedores | Docker Compose |
| Tests | Jest, Supertest |

---

## 📖 Estructura del Monorepo

```
hydraflow/
├── hydraflow-app/          # Cliente Expo
│   ├── app/                # Pantallas (app) y (auth)
│   ├── components/         # UI reutilizable
│   ├── context/            # Estado global
│   ├── services/           # API, offline, notificaciones
│   ├── locales/            # ca, en, es
│   └── __tests__/
├── hydraflow-backend/      # API Express
│   ├── src/modules/        # Dominio (auth, water, achievements…)
│   ├── src/routes/         # Endpoints HTTP
│   ├── prisma/             # Esquema, migraciones, seed
│   └── docker-compose.yml  # Postgres local
├── .github/workflows/      # CI por paquete
├── pnpm-workspace.yaml
└── package.json            # Scripts raíz
```

Documentación detallada por paquete:

- [hydraflow-app/README.md](hydraflow-app/README.md)
- [hydraflow-backend/README.md](hydraflow-backend/README.md)

---

## Requisitos

- Node.js >= 22.13
- pnpm 11.22
- Docker (Postgres local del backend)
- Expo CLI / EAS CLI (solo para builds móviles)

---

## Instalación

```bash
git clone https://github.com/JBDev23/hydraflow.git
cd hydraflow
pnpm install
```

---

## Desarrollo local

### Backend (terminal 1)

```bash
cd hydraflow-backend
cp .env.example .env
docker compose up -d
cd ..
pnpm --filter hydraflow-backend prisma:migrate:deploy
pnpm --filter hydraflow-backend prisma:seed
pnpm backend:dev
```

La API responde en `http://localhost:3000`.

### App (terminal 2)

Crea `hydraflow-app/.env` apuntando al backend local:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

```bash
pnpm app:start
```

En dispositivo físico usa la IP de tu máquina en lugar de `localhost`.

---

## Variables de entorno

### Backend (`hydraflow-backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL (pooler en prod) |
| `DIRECT_URL` | Conexión directa para Prisma |
| `PORT` | Puerto HTTP (default `3000`) |
| `JWT_SECRET` | Secreto JWT |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `ALLOW_TEST_LOGIN` | Login de prueba en dev (`true`) |

Plantilla: [`hydraflow-backend/.env.example`](hydraflow-backend/.env.example).

### App (`hydraflow-app/.env`)

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL de la API (default: Railway prod) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID web de Google Sign-In |

Los perfiles EAS en `eas.json` definen estas variables para builds de desarrollo y preview.

---

## 🌐 API (resumen)

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/` | No |
| POST | `/auth/login` | No |
| GET/PUT/DELETE | `/user/profile`, `/user/account` | Sí |
| POST/DELETE | `/water/log` | Sí |
| GET | `/water/metrics`, `/water/range`, `/water/stats`, `/water/export` | Sí |
| GET | `/achievements/catalog` | Sí |
| GET/POST | `/items/catalog`, `/items/buy`, `/items/equip` | Sí |

---

## Scripts raíz

| Script | Descripción |
|--------|-------------|
| `pnpm app:start` | Expo dev server |
| `pnpm app:test` | Tests del frontend |
| `pnpm app:lint` | Lint del frontend |
| `pnpm app:typecheck` | Typecheck del frontend |
| `pnpm backend:dev` | API en modo desarrollo |
| `pnpm backend:test` | Tests del backend |
| `pnpm backend:build` | Build del backend |
| `pnpm test` | Tests de todos los paquetes |
| `pnpm lint` | Lint de todos los paquetes |
| `pnpm format` / `pnpm format:check` | Prettier en todo el monorepo |

---

## CI

GitHub Actions ejecuta checks **filtrados por paquete** en cada push/PR a `main` (solo corre app o backend si hubo cambios en esa carpeta). Ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

**App:** format, lint, typecheck, test.  
**Backend:** migrate, seed, format, lint, build, test (con Postgres 15 en servicio).

Checks locales equivalentes:

```bash
pnpm install
pnpm test
pnpm lint
```

---

## Despliegue

Repositorio: **`JBDev23/hydraflow`**

| Componente | Plataforma | Directorio raíz |
|------------|------------|-----------------|
| App móvil | Expo EAS | `hydraflow-app/` |
| API | Railway | `hydraflow-backend/` |

### Railway (backend)

1. Conecta el servicio al repo `JBDev23/hydraflow`.
2. **Root Directory:** `hydraflow-backend`
3. Build/start: definidos en [`hydraflow-backend/railway.toml`](hydraflow-backend/railway.toml) (`npm run build` / `npm start`). No pongas comandos `pnpm` en el dashboard.
4. Variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, etc.

**Alternativa (pnpm desde raíz del monorepo):** Root Directory vacío + `pnpm install --frozen-lockfile && pnpm --filter hydraflow-backend build` / `pnpm --filter hydraflow-backend start`.

### Expo EAS (app)

1. Reconecta el proyecto EAS al repo `JBDev23/hydraflow`.
2. **Root directory:** `hydraflow-app` (o ejecuta `eas build` desde esa carpeta).
3. Incluye `pnpm-workspace.yaml` y `pnpm-lock.yaml` de la raíz en el build.
4. Tras la migración al monorepo, lanza un build de preview para verificar.

### GitHub Actions

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se activa en el nuevo repo. Recrea secrets y branch protection si los tenías en repos antiguos.

---

## 🤝 Contribución

1. _Fork_ de [JBDev23/hydraflow](https://github.com/JBDev23/hydraflow).
2. Rama feature (`git checkout -b feature/mi-cambio`).
3. Verifica checks locales (`pnpm test`, `pnpm lint`).
4. _Pull Request_ contra `main`.

---

## 📄 Licencia

Proyecto de código abierto. Consulta el archivo `LICENSE` (si aplica) para más detalles.
