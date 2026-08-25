# hydraflow-app

Cliente móvil Expo/React Native del monorepo [HydraFlow](../README.md). Producto, arranque conjunto y CI están documentados ahí.

El nombre del paquete en pnpm es `hydroflow` (`pnpm --filter hydroflow …`).

## Estructura

```
hydraflow-app/
├── app/              # Rutas Expo Router: (app) y (auth)
├── components/       # UI (Hydra, modales, editores…)
├── assets/           # Imágenes, iconos y SVG de accesorios
├── context/          # Auth, User, Hydration, Offline, Theme, AppShell
├── services/         # API, notificaciones, audio, cola offline
├── types/
├── locales/          # ca, en, es
├── plugins/          # Config plugins de Expo
├── utils/
├── constants/
├── eas.json          # Perfiles EAS (inyectan env en builds)
└── __tests__/
```

`/android` e `/ios` se generan con `pnpm prebuild:android` / `expo prebuild` y no se versionan.

## Variables de entorno

Crea `hydraflow-app/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

Si no defines `EXPO_PUBLIC_API_URL`, la app usa el backend de producción en Railway. En dispositivo físico usa la IP de tu máquina, no `localhost`. Los perfiles de `eas.json` definen estas variables en builds de desarrollo y preview.

## Scripts

Desde la **raíz del monorepo**:

| Script               | Descripción           |
| -------------------- | --------------------- |
| `pnpm app:start`     | Expo dev server       |
| `pnpm app:test`      | Jest                  |
| `pnpm app:lint`      | ESLint                |
| `pnpm app:typecheck` | TypeScript `--noEmit` |

Dentro de este directorio: `pnpm start`, `pnpm android`, `pnpm ios`, `pnpm prebuild:android`, `pnpm web`.
