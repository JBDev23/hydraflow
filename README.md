# 💧 Hydraflow App (Frontend)

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **Tu compañero de hidratación diario. Una app móvil interactiva y gamificada para que beber agua sea divertido.**

Este repositorio contiene el código **Frontend** (Aplicación Móvil) de Hydraflow, desarrollado con React Native y Expo. Aquí reside toda la interfaz de usuario, las animaciones de nuestra mascota (Hydra), el sistema de gráficos de progreso, y la gestión del almacenamiento local y notificaciones.

⚠️ **Nota:** Este proyecto se encuentra actualmente en **fase de pruebas (Testing)**. 
👉 *El código del Backend (API) se encuentra en un repositorio separado [Añadir enlace al repo del backend aquí].*

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación en tu propio teléfono antes de que salga a las tiendas oficiales y ayudarnos a testear su estabilidad, ¡puedes solicitar tu acceso a la beta privada! 

Para unirte, envía un correo electrónico a:
📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

*Te agradecemos que indiques en el asunto **"Solicitud Beta Hydraflow App"** para que podamos procesar tu petición lo más rápido posible.*

---

## 📱 Vistazo a la App

| Pantalla Principal | Estadísticas | Logros |
|:---:|:---:|:---:|
| <img width="921" height="2048" alt="WhatsApp Image 2026-05-16 at 11 15 44 (3)" src="https://github.com/user-attachments/assets/803612be-31c8-49ca-8e39-ac2cbb68ee59" /> | <img width="921" height="2048" alt="WhatsApp Image 2026-05-16 at 11 15 44 (2)" src="https://github.com/user-attachments/assets/e3f8eda3-0586-4380-97f9-a087e9fab2c5" /> | <img width="921" height="2048" alt="WhatsApp Image 2026-05-16 at 11 15 44 (1)" src="https://github.com/user-attachments/assets/ac31cb94-d1cd-4583-a987-840fdfe3a124" /> |
| Tienda | Onboarding | Perfil |
| <img width="921" height="2048" alt="WhatsApp Image 2026-05-16 at 11 15 44" src="https://github.com/user-attachments/assets/1868b123-64da-42a5-bfe8-84c58d7a9871" /> | <img width="921" height="2048" alt="WhatsApp Image 2026-05-16 at 11 15 43" src="https://github.com/user-attachments/assets/2fc1629e-0ee5-4600-a9fc-c18ca71e82ea" /> | <img width="921" height="2048" alt="WhatsApp Image 2026-05-16 at 11 22 56" src="https://github.com/user-attachments/assets/2224c348-8275-4783-886e-82aceb832880" /> |

---

## 🚀 Características Principales

* **💧 Seguimiento Intuitivo:** Registra tus vasos de agua rápidamente con una interfaz limpia y un anillo de progreso visual.
* **🐾 Mascota Interactiva (Hydra):** Tu progreso afecta a Hydra. ¡Personalízala con sombreros, gafas y accesorios que desbloqueas al cumplir tus metas!
* **📊 Estadísticas Detaladas:** Gráficos semanales y calendarios para que no pierdas de vista tu historial de hidratación.
* **🔔 Notificaciones Inteligentes:** Recordatorios push locales para que nunca olvides beber agua durante tu jornada.
* **🔒 Autenticación Ampliada:** Inicio de sesión tradicional por correo/contraseña *(y soporte planificado para Login Social con Google/Apple)*.
* **🌍 Preparado para el Mundo:** Estructura base diseñada para añadir soporte multiidioma (i18n) en próximas versiones.
* **🌙 Soporte Offline y Tema Oscuro:** Funciona sin conexión a internet sincronizando los datos cuando vuelve la red, e incluye soporte nativo para Modo Oscuro/Claro.

---

## 💻 Tecnologías Utilizadas

Hydraflow App está construido con las mejores herramientas del ecosistema móvil actual:

* **Framework:** React Native, Expo
* **Enrutamiento:** Expo Router (basado en archivos)
* **Estado Global:** React Context API (`GlobalContext`, `ThemeContext`)
* **Gráficos y UI:** SVG nativo, animaciones personalizadas.

---

## 📖 Estructura del Proyecto

El código fuente está organizado siguiendo el estándar de Expo Router:
* `app/`: Contiene las pantallas y el sistema de navegación (rutas `(app)` para el panel principal y `(auth)` para el inicio de sesión/onboarding).
* `components/`: Componentes reutilizables de la interfaz (modales, barras de progreso, iconos, selectores de tiempo).
* `assets/`: Imágenes, iconos de la app y todos los accesorios SVG de la mascota Hydra.
* `context/`: Gestión del estado global del usuario y del tema de la aplicación.
* `services/`: Lógica de conexión externa (peticiones a la API, gestión de notificaciones y almacenamiento offline).
* `utils/`: Funciones auxiliares (formateadores de fecha, calculadoras de semanas, etc.).

---

## 🤝 Contribución

¡El proyecto es de código abierto y nos encanta recibir ayuda! 

1. Haz un *Fork* del proyecto.
2. Crea tu rama (`git checkout -b feature/NuevaPantalla`).
3. Haz *Commit* de tus cambios (`git commit -m 'Añadir nueva animación para Hydra'`).
4. Asegúrate de que el proyecto compile sin errores.
5. Haz *Push* a la rama (`git push origin feature/NuevaPantalla`).
6. Abre un *Pull Request*.

---

## 📄 Licencia

Este proyecto es de Código Abierto. Consulta el archivo `LICENSE` (si aplica) para más detalles.
