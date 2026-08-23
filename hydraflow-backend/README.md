# 💧 Hydraflow Backend

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **El motor detrás de tu hidratación diaria. Una API robusta y de código abierto para el registro de agua y gamificación.**

Este repositorio contiene exclusivamente el **Backend** del proyecto Hydraflow. Se encarga de gestionar la lógica de negocio, la base de datos, la autenticación de usuarios, el registro de consumo de agua y el sistema de logros (gamificación).

⚠️ **Nota:** Este proyecto se encuentra actualmente en **fase de pruebas (Testing)**.  
👉 _El código del Frontend vive en el mismo monorepo: [`../hydraflow-app`](../hydraflow-app)._

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación antes que nadie y ayudarnos a testear su estabilidad, ¡puedes solicitar tu acceso a la beta privada!

Para unirte, envía un correo electrónico a:
📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

_Te agradecemos que indiques en el asunto **"Solicitud Beta Hydraflow"** para que podamos procesar tu petición lo más rápido posible._

---

## 🚀 Características Principales

- **🔒 Autenticación Segura:** Login social con Google (verificación de ID token) + JWT. Login de prueba disponible fuera de producción.
- **🚰 Registro de Agua:** Endpoints para añadir, editar y consultar el historial de hidratación diario.
- **🏆 Sistema de Gamificación:** Logros, experiencia y recompensas al cumplir metas de hidratación.
- **🛍️ Gestión de Ítems:** Inventario y recompensas para personalizar la mascota.
- **🧪 Cobertura de Pruebas:** Tests con Jest y Supertest.

---

## 💻 Tecnologías Utilizadas

- **Entorno & Lenguaje:** Node.js 22+, TypeScript, Express
- **Base de Datos & ORM:** PostgreSQL, Prisma 7 (`@prisma/adapter-pg`)
- **Auth:** `google-auth-library`, JWT
- **Testing:** Jest, Supertest
- **Despliegue & Contenedores:** Docker, Docker Compose
- **Gestor de paquetes:** pnpm

La estructura de `modules/` está preparada para una migración futura a Nest (ver `NEST_MIGRATION.md`).

---

## 📖 Estructura del Proyecto

- `src/modules/`: Lógica de dominio (auth, water, achievements, items, user).
- `src/controllers/`: Adaptadores HTTP delgados sobre los modules.
- `src/routes/`: Definición de los endpoints de la API.
- `src/middleware/`: Middlewares de Express (auth, rate limit, etc.).
- `src/prisma/`: Cliente Prisma y `PrismaService`.
- `src/lib/`: Utilidades compartidas (JWT, gamificación, preferencias, rangos de día).
- `src/tests/`: Pruebas de integración (Jest).
- `prisma/`: Esquema, migraciones y seed.

---

## 🤝 Contribución

¡El proyecto es de código abierto y me encanta recibir ayuda!

1. Haz un _Fork_ del proyecto.
2. Crea tu rama (`git checkout -b feature/NuevaRuta`).
3. Haz _Commit_ de tus cambios (`git commit -m 'Añadir nueva ruta para X'`).
4. Asegúrate de que los tests pasen (`pnpm test`).
5. Haz _Push_ a la rama (`git push origin feature/NuevaRuta`).
6. Abre un _Pull Request_.

---

## 📄 Licencia

Este proyecto es de Código Abierto. Consulta el archivo `LICENSE` (si aplica) para más detalles.

---

## Checks de CI (local)

GitHub Actions ejecuta en cada push/PR a `main`/`master` los mismos checks que puedes correr localmente desde la raíz del monorepo. Usa las variables de `.env.example` (Postgres local con Docker; no uses `.env.production` ni credenciales de Neon):

```bash
cd hydraflow-backend
docker compose up -d
cd ..
pnpm install
pnpm backend:test
# o por paquete:
pnpm --filter hydraflow-backend prisma:migrate:deploy
pnpm --filter hydraflow-backend format:check && pnpm --filter hydraflow-backend lint && pnpm --filter hydraflow-backend build && pnpm --filter hydraflow-backend test
```
