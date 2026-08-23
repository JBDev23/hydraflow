# 💧 HydraFlow

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **Tu compañero de hidratación diario — app móvil gamificada + API backend.**

Monorepo con [pnpm workspaces](https://pnpm.io/workspaces) que contiene el frontend (Expo/React Native) y el backend (Express/Prisma).

| Paquete | Ruta | Descripción |
|---------|------|-------------|
| **App** | [`hydraflow-app/`](hydraflow-app/) | Cliente móvil Expo |
| **Backend** | [`hydraflow-backend/`](hydraflow-backend/) | API REST + PostgreSQL |

---

## Requisitos

- Node.js >= 22.13
- pnpm 11.22
- Docker (solo para Postgres local del backend)

---

## Instalación

```bash
pnpm install
```

---

## Desarrollo local

**Backend** (terminal 1):

```bash
cd hydraflow-backend
docker compose up -d
cd ..
pnpm backend:dev
```

**App** (terminal 2):

```bash
pnpm app:start
```

Consulta los README de cada paquete para variables de entorno y detalles específicos:

- [hydraflow-app/README.md](hydraflow-app/README.md)
- [hydraflow-backend/README.md](hydraflow-backend/README.md)

---

## Scripts raíz

| Script | Descripción |
|--------|-------------|
| `pnpm app:start` | Inicia Expo dev server |
| `pnpm app:test` | Tests del frontend |
| `pnpm backend:dev` | API en modo desarrollo |
| `pnpm backend:test` | Tests del backend |
| `pnpm test` | Tests de todos los paquetes |
| `pnpm lint` | Lint de todos los paquetes |

---

## CI

GitHub Actions ejecuta checks filtrados por paquete en cada push/PR a `main`. Ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Despliegue

Repositorio monorepo: **`JBDev23/hydraflow`**

| Componente | Plataforma | Directorio raíz |
|------------|------------|-----------------|
| App móvil | Expo EAS | `hydraflow-app/` |
| API | Railway | `hydraflow-backend/` |

### Railway (backend)

1. En el dashboard del servicio, cambia el repo conectado a `JBDev23/hydraflow`.
2. **Root Directory:** `hydraflow-backend`
3. **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
4. **Start Command:** `pnpm start`
5. Variables de entorno sin cambios: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, etc.

pnpm detectará el workspace padre (`pnpm-workspace.yaml` en la raíz del repo clonado).

### Expo EAS (app)

1. Reconecta el proyecto EAS al repo `JBDev23/hydraflow`.
2. **Root directory:** `hydraflow-app` (o ejecuta `eas build` desde esa carpeta).
3. Asegúrate de que el build incluye `pnpm-workspace.yaml` y `pnpm-lock.yaml` de la raíz.
4. Tras la migración, lanza un build de preview para verificar.

### GitHub Actions

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se activa automáticamente en el nuevo repo. Recrea los secrets y branch protection rules si los tenías en los repos antiguos.
