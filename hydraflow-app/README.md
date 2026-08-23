# 💧 HydraFlow App (Frontend)

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **📦 Monorepo** — Este paquete forma parte del monorepo [**JBDev23/hydraflow**](https://github.com/JBDev23/hydraflow). Clona el repositorio raíz, instala dependencias con `pnpm install` desde la raíz y usa los scripts `pnpm app:*` documentados en el [README principal](../README.md).

> **Tu compañero de hidratación diario. Una app móvil interactiva y gamificada para que beber agua sea divertido.**

Cliente móvil de HydraFlow desarrollado con **React Native** y **Expo**. Aquí reside la interfaz de usuario, las animaciones de la mascota (Hydra), los gráficos de progreso, el almacenamiento local, las notificaciones y la cola offline.

⚠️ **Nota:** El proyecto se encuentra en **fase de pruebas (Testing)**.  
👉 El backend (API) vive en el mismo monorepo: [`../hydraflow-backend`](../hydraflow-backend).

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación en tu propio teléfono antes de que salga a las tiendas oficiales y ayudarnos a testear su estabilidad, ¡puedes solicitar tu acceso a la beta privada!

Para unirte, envía un correo electrónico a:  
📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

_Te agradecemos que indiques en el asunto **"Solicitud Beta Hydraflow App"** para que podamos procesar tu petición lo más rápido posible._

---

## 📱 Vistazo a la App

| Pantalla Principal | Estadísticas | Logros |
| :--: | :--: | :--: |
| <img width="921" height="2048" alt="Pantalla principal" src="https://github.com/user-attachments/assets/803612be-31c8-49ca-8e39-ac2cbb68ee59" /> | <img width="921" height="2048" alt="Estadísticas" src="https://github.com/user-attachments/assets/e3f8eda3-0586-4380-97f9-a087e9fab2c5" /> | <img width="921" height="2048" alt="Logros" src="https://github.com/user-attachments/assets/ac31cb94-d1cd-4583-a987-840fdfe3a124" /> |
| Tienda | Onboarding | Perfil |
| <img width="921" height="2048" alt="Tienda" src="https://github.com/user-attachments/assets/1868b123-64da-42a5-bfe8-84c58d7a9871" /> | <img width="921" height="2048" alt="Onboarding" src="https://github.com/user-attachments/assets/2fc1629e-0ee5-4600-a9fc-c18ca71e82ea" /> | <img width="921" height="2048" alt="Perfil" src="https://github.com/user-attachments/assets/2224c348-8275-4783-886e-82aceb832880" /> |

---

## 🚀 Características Principales

- **💧 Seguimiento Intuitivo:** Registra tus vasos de agua con un anillo de progreso visual.
- **🐾 Mascota Interactiva (Hydra):** Tu progreso afecta a Hydra. Personalízala con sombreros, gafas y accesorios desbloqueables.
- **📊 Estadísticas Detalladas:** Gráficos semanales y calendarios con historial de hidratación.
- **🔔 Notificaciones Inteligentes:** Recordatorios push locales durante la jornada.
- **🔒 Autenticación con Google:** Google Sign-In nativo + JWT hacia el backend.
- **🌍 Multiidioma:** i18next con catalán, español e inglés (`expo-localization`).
- **🌙 Offline y Tema Oscuro:** Sincronización al recuperar red; modo claro/oscuro.

---

## 💻 Tecnologías

| Área | Stack |
|------|-------|
| Framework | React Native 0.86, Expo SDK 57 (dev client + EAS) |
| Enrutamiento | Expo Router (file-based) |
| Estado global | React Context (`Auth`, `User`, `Hydration`, `Offline`, `Theme`, `AppShell`) |
| Animaciones | Reanimated 4, gesture-handler |
| Gráficos / UI | react-native-svg, componentes personalizados |
| Tests | Jest + jest-expo |
| Gestor de paquetes | pnpm (workspace `hydroflow`) |

---

## 📖 Estructura del Proyecto

```
hydraflow-app/
├── app/              # Pantallas y navegación (rutas (app) y (auth))
├── components/       # UI reutilizable (Hydra, modales, editores…)
├── assets/           # Imágenes, iconos y SVG de accesorios
├── context/          # Estado global + AppProviders
├── services/         # API, notificaciones, audio, cola offline
├── types/            # Tipos TypeScript (perfil, API, tema…)
├── locales/          # Traducciones i18n (ca, en, es)
├── plugins/          # Config plugins de Expo (p. ej. CMake en Windows)
├── utils/            # Helpers (fechas, XP, legal…)
├── constants/        # Tema, claves de almacenamiento…
└── __tests__/        # Tests unitarios e integración ligera
```

Las carpetas nativas `/android` e `/ios` se generan con `pnpm prebuild:android` / `expo prebuild` y no se versionan.

---

## ⚙️ Desarrollo Local

Desde la **raíz del monorepo**:

```bash
pnpm install
pnpm app:start
```

Scripts útiles (raíz o con `--filter hydroflow`):

| Script | Descripción |
|--------|-------------|
| `pnpm app:start` | Expo dev server |
| `pnpm app:test` | Jest |
| `pnpm app:lint` | ESLint (expo lint) |
| `pnpm app:typecheck` | TypeScript `--noEmit` |

Dentro de `hydraflow-app/` también puedes usar `pnpm start`, `pnpm android`, `pnpm ios`, `pnpm prebuild:android`, etc.

### Variables de entorno

Crea un archivo `.env` en `hydraflow-app/` (o exporta las variables antes de `expo start`):

```bash
# Backend local (usa la IP de tu máquina si pruebas en dispositivo físico)
EXPO_PUBLIC_API_URL=http://localhost:3000

# OAuth Google (mismo client ID que el backend)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

Si no defines `EXPO_PUBLIC_API_URL`, la app apunta por defecto al backend de producción en Railway. Los perfiles de EAS (`eas.json`) inyectan estas variables en builds de desarrollo y preview.

### Backend en local

Levanta la API y Postgres desde la raíz (ver [hydraflow-backend/README.md](../hydraflow-backend/README.md)):

```bash
cd hydraflow-backend && docker compose up -d && cd ..
pnpm backend:dev
```

---

## 🤝 Contribución

1. Haz _Fork_ del monorepo [JBDev23/hydraflow](https://github.com/JBDev23/hydraflow).
2. Crea tu rama (`git checkout -b feature/NuevaPantalla`).
3. Haz _Commit_ de tus cambios.
4. Verifica que pasen los checks: `pnpm app:test`, `pnpm app:lint`, `pnpm app:typecheck`.
5. Abre un _Pull Request_ contra `main`.

---

## ✅ Checks de CI (local)

GitHub Actions ejecuta en cada push/PR a `main` los mismos checks filtrados por cambios en `hydraflow-app/`:

```bash
pnpm install
pnpm app:test
# o por paquete:
pnpm --filter hydroflow format:check
pnpm --filter hydroflow lint
pnpm --filter hydroflow typecheck
pnpm --filter hydroflow test
```

---

## 📄 Licencia

Proyecto de código abierto. Consulta el archivo `LICENSE` (si aplica) para más detalles.
