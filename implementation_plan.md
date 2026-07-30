# Plan de Refactorización para Simplificación de un Solo Usuario por Negocio (V1)

Este plan detalla las modificaciones necesarias para lanzar la versión **v1** de AgendaIA SaaS sin la funcionalidad de múltiples profesionales/empleados por negocio (tenant). Cada negocio tendrá exclusivamente un único usuario (el dueño o administrador). La funcionalidad de profesionales quedará aislada y preparada para la **v2**.

## Cambios Propuestos

### Componente Base de Datos y Semillas (Backend)

#### [MODIFY] [db.ts](file:///c:/Users/Juanda/Desktop/agendaia-multitenant-saas/server/db.ts)
* Comentar la siembra (seed) de perfiles con rol `personal` (Santiago Silva y Javier Ramírez) para que no estén disponibles en el sistema en la v1.
* Comentar la siembra de la lista de `empleados` (tabla opcional/vacía en v1).
* Modificar las semillas de `servicios` y `citas` para que no tengan referencia a `id_empleado` (establecer en `null` o eliminar de la semilla).
* Añadir comentarios aclaratorios marcando la futura habilitación de profesionales para la v2.

---

### Componente de Controladores (Backend)

#### [MODIFY] [auth.controller.ts](file:///c:/Users/Juanda/Desktop/agendaia-multitenant-saas/server/controllers/auth.controller.ts)
* Ajustar la autenticación para que los perfiles con rol `personal` no puedan iniciar sesión en la v1, retornando un error descriptivo.
* Añadir comentarios de preparación para v2 en la lógica de autenticación y registro.

#### [MODIFY] [tenant.controller.ts](file:///c:/Users/Juanda/Desktop/agendaia-multitenant-saas/server/controllers/tenant.controller.ts)
* Desactivar los endpoints CRUD de empleados en la v1 (retornar lista vacía en `getEmpleados`, denegar creación y eliminación con error `403 Forbidden`).
* En `triggerAiBotReply`, simplificar el prompt de personalidad de Gemini para omitir la lista de profesionales.
* En `getTenantDashboardSummary`, establecer la cuenta de empleados en `0`.

---

### Componente de Interfaz de Usuario (Frontend)

#### [MODIFY] [TenantDashboard.tsx](file:///c:/Users/Juanda/Desktop/agendaia-multitenant-saas/src/pages/TenantDashboard.tsx)
* Ocultar el selector de "Filtro de Agenda" en la vista principal (Overview) ya que solo hay un usuario y no hay necesidad de filtrar citas.
* Desactivar o comentar el sub-tab de "Empleados / Personal" en la pestaña de Servicios.
* En el formulario de agendamiento de citas, remover/ocultar el campo de selección de Empleado/Personal.
* En la pestaña de "Rendimiento & Finanzas", ocultar el selector de reporte individual y la sección de "Desglose por Empleado".
* Añadir comentarios en el código marcando claramente que las secciones ocultas corresponden a la versión v2.

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/Juanda/Desktop/agendaia-multitenant-saas/src/pages/LoginPage.tsx)
* Quitar o comentar la contraseña por defecto para cuentas de empleados en los helpers y botones rápidos de acceso demo para evitar confusión en v1.

---

### Documentación Interna

#### [MODIFY] [DOCUMENTACION_APP.md](file:///c:/Users/Juanda/Desktop/agendaia-multitenant-saas/DOCUMENTACION_APP.md)
* Actualizar las secciones correspondientes en la documentación del proyecto para reflejar la simplificación a 1 usuario por negocio para la v1 y documentar el esquema de privacidad como parte del roadmap de la v2.

## Plan de Verificación

### Pruebas Manuales
1. Iniciar el servidor de desarrollo y verificar que el dashboard cargue sin errores de base de datos vacía o nula.
2. Iniciar sesión con la cuenta de Barbería Deluxe VIP (Admin) y verificar que no aparezcan referencias a empleados, ni selectores de reporte financiero por empleado.
3. Intentar acceder/cargar credenciales de empleados en el login y verificar que no estén disponibles o su acceso sea denegado.
4. Crear un nuevo servicio y una cita desde el panel y confirmar que funcionen sin requerir la selección de un empleado.
