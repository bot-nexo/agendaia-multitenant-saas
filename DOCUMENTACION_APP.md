# 📖 Manual y Documentación Completa: Plataforma AgendaIA SaaS Multi-Tenant

Bienvenido a la documentación oficial y guía completa de **AgendaIA**, la plataforma SaaS (Software como Servicio) multi-inquilino de gestión de citas, analítica financiera y atención automatizada mediante inteligencia artificial para WhatsApp.

---

## 📌 Tabla de Contenidos

1. [Visión General de la Aplicación](#1-visión-general-de-la-aplicación)
2. [Arquitectura Multi-Inquilino (Multi-Tenant)](#2-arquitectura-multi-inquilino-multi-tenant)
3. [Cuentas Demo e Inicio Rápido](#3-cuentas-demo-e-inicio-rápido)
4. [Módulo de Atención e Inteligencia Artificial (Bot WhatsApp)](#4-módulo-de-atención-e-inteligencia-artificial-bot-whatsapp)
5. [Sistema de Créditos y Recargas con Comprobante de Pago](#5-sistema-de-créditos-y-recargas-con-comprobante-de-pago)
6. [Panel de Rendimiento Financiero (Vista Negocio)](#6-panel-de-rendimiento-financiero-vista-negocio)
7. [Panel de Control SuperAdmin (Ingresos y Gestión Global)](#7-panel-de-control-superadmin-ingresos-y-gestión-global)
8. [Gestión de Citas, Servicios y Directorio de Clientes](#8-gestión-de-citas-servicios-y-directorio-de-clientes)
9. [Privacidad Financiera y Aislamiento de Ganancias entre Colaboradores (v2)](#9-privacidad-financiera-y-aislamiento-de-ganancias-entre-colaboradores-v2)

---

## 1. 🚀 Visión General de la Aplicación

**AgendaIA** está diseñada para automatizar y optimizar la operación diaria de negocios basados en servicios con citas previas (barberías, peluquerías, centros de estética, spas, clínicas odontológicas, consultorios médicos, talleres y asesorías).

### Problemas que resuelve:
* **Pérdida de clientes por respuesta tardía:** Un bot con IA (Gemini 2.5 Flash) atiende mensajes en WhatsApp las 24 horas, cotiza servicios y agenda citas de forma autónoma.
* **Falta de visibilidad de ingresos:** Proporciona un desglose claro de ganancias por día, semana y mes, así como el rendimiento por cada servicio del negocio.
* **Control de costos de IA:** Funciona mediante un modelo de **créditos de IA**, donde cada negocio recarga saldo según su volumen de chats.

> ℹ️ **Nota v1:** En la versión 1, cada negocio es operado por un **único usuario** (propietario/administrador). La funcionalidad de múltiples profesionales/empleados está desactivada y reservada para la v2.

---

## 2. 🔐 Arquitectura Multi-Inquilino (Multi-Tenant)

La plataforma garantiza un **aislamiento absoluto de datos** entre negocios mediante el identificador único `id_negocio`.

* **Negocios (Tenants):** Cada negocio posee su propio catálogo de servicios, agenda de citas, directorio de clientes y configuración de su bot.
* **Roles de Usuario:**
  * `superadmin`: Acceso global para crear negocios, revisar comprobantes de pago de recargas, auditar créditos y ver analítica de ingresos de la plataforma.
  * `admin`: Propietario o administrador del negocio (único usuario activo en v1).
  * `personal`: Empleados autorizados para consultar su agenda. **(Desactivado en v1 — funcionalidad reservada para v2).**

### Simplificación a 1 Usuario por Negocio (V1)

En la **versión 1** de AgendaIA SaaS, cada negocio (tenant) opera con un **único usuario activo**: el dueño o administrador (`rol: admin`). La funcionalidad de múltiples profesionales, empleados o colaboradores (`rol: personal`) está **intencionalmente desactivada** y preparada para la **versión 2 (v2)** del roadmap. Las semillas de perfiles con rol `personal` y la tabla de `empleados` están comentadas en `server/db.ts`, y los endpoints de gestión de empleados retornan error `403 Forbidden` o lista vacía. Esto simplifica la operación y evita la complejidad de privacidad financiera entre colaboradores durante el lanzamiento inicial.

---

## 3. 🔑 Cuentas Demo e Inicio Rápido

Para facilitar las pruebas, la pantalla de inicio de sesión (`/login`) incluye botones de acceso directo a negocios demo preseteados. **En la v1**, solo se muestran las cuentas de negocio (admin) y el SuperAdmin; las cuentas de colaboradores/empleados (`rol: personal`) están **desactivadas y no aparecen** como acceso rápido:

1. **Barbería Deluxe VIP:**
   * *Correo:* `barberia@deluxe.com`
   * *Contraseña:* `barberia123`
   * *Enfoque:* Cortes de cabello, diseño de barba, combos VIP.
2. **Clínica Dental Spa:**
   * *Correo:* `contacto@dentalspa.com`
   * *Contraseña:* `dental123`
   * *Enfoque:* Limpieza dental, blanqueamiento, ortodoncia.
3. **Estética & Spa Bella:**
   * *Correo:* `hola@spabella.com`
   * *Contraseña:* `spabella123`
   * *Enfoque:* Masajes, limpieza facial, manicura.
4. **SuperAdmin de la Plataforma:**
   * *Correo:* `admin@agendaia.com`
   * *Contraseña:* `admin123`
   * *Enfoque:* Control total de inquilinos, aprobación de recargas con comprobante e ingresos globales.

> ℹ️ **Nota v1:** El inicio de sesión para cuentas con rol `personal` (colaboradores/empleados) está bloqueado. Si se intenta acceder con una cuenta de este tipo, el sistema retorna un error `403 Forbidden` indicando que el acceso está desactivado en la v1.

---

## 4. 🤖 Módulo de Atención e Inteligencia Artificial (Bot WhatsApp)

El bot de WhatsApp integrado funciona como un asistente virtual capacitado:

* **IA Generativa (Gemini 2.5 Flash):** Responde a consultas sobre disponibilidad, precios, ubicación y políticas del negocio en tono natural y profesional.
* **Prompt de Personalidad Personalizable:** El administrador de cada negocio puede escribir instrucciones personalizadas en la pestaña "Configuración".
* **Lista Blanca (Bot Whitelist):** Permite registrar números autorizados o clientes VIP que reciben trato diferencial.
* **Intervención Humana (Bandeja de Entrada):** El administrador o recepcionista puede pausar la IA en cualquier chat y responder manualmente desde el panel.
* **Consumo Transparente de Créditos:** Cada interacción de la IA descuenta 1 crédito del saldo del negocio. Si el saldo cae por debajo de 20 créditos, el panel muestra alertas visuales de recarga.

---

## 5. 💳 Sistema de Créditos y Recargas con Comprobante de Pago

Para garantizar la autonomía del negocio y la monetización sostenible de la plataforma:

1. **Selección de Paquete:** El negocio hace clic en **"Recargar Créditos"** e ingresa al modal interactivo con ofertas de paquetes (ej. 50 créditos por $25,000 COP hasta 700 créditos por $200,000 COP).
2. **Instrucciones de Pago:** Se muestran los datos bancarios para transferencia (Nequi, Bancolombia, Daviplata, PSE, Zelle).
3. **Carga de Comprobante:** El usuario adjunta la imagen o PDF del comprobante de pago y el número de referencia.
4. **Revisión y Visor HD para SuperAdmin:** La solicitud llega al panel de SuperAdmin con notificación en tiempo real.
5. **Aprobación/Rechazo:**
   * Al aprobar, el SuperAdmin visualiza el comprobante en alta definición en un visor emergente.
   * La plataforma acredita automáticamente los créditos al negocio e imprime un registro en el historial auditado.

---

## 6. 📊 Panel de Rendimiento Financiero (Vista Negocio)

Ubicado en la pestaña **"Rendimiento & Finanzas"** de cada negocio:

* **Métricas de Ganancias Generales:**
  * **Hoy (Día):** Suma del valor de las citas agendadas o atendidas en la fecha actual.
  * **Esta Semana:** Total ingresado en los últimos 7 días.
  * **Este Mes:** Ingresos del mes en curso.
  * **Total Histórico:** Facturación acumulada desde el registro.
* **Análisis de Ingresos por Servicio:**
  * Tabla con el volumen de veces que cada servicio fue reservado.
  * Total de dinero producido por cada ítem del catálogo de servicios.

> ℹ️ **Nota v1:** En la versión 1, cada negocio es operado por un único usuario (el propietario/administrador). Por ello, **no existe el desglose de ganancias por empleado**. Las secciones de "Rendimiento Individual por Empleado", el "Selector de Filtro de Empleado" y el "Desglose por Empleado" están **ocultas y comentadas** en el código, reservadas para la **v2**. Todas las métricas reflejan el consolidado total del negocio.

### 🚧 Roadmap v2: Privacidad Financiera entre Colaboradores

La funcionalidad de múltiples empleados (`rol: personal`) y el aislamiento de privacidad financiera entre colaboradores están **planificadas para la v2**. El esquema de base de datos y la lógica de roles RLS están preparados para ser activados en el futuro:

#### Lógica de Roles y Filtro de Visibilidad (v2):
1. **Colaborador / Empleado (`rol: personal`):**
   * Cuando un empleado ingresa al sistema con su usuario, el panel detecta automáticamente su perfil y activa el modo **"🔒 Vista Personal Protegida"**.
   * El empleado **únicamente puede ver sus propias métricas** (sus ganancias de Hoy, Semana, Mes, Total, sus citas atendidas y el rendimiento de los servicios prestados por él).
   * La información financiera y las citas de sus demás compañeros quedan **completamente bloqueadas y ocultas**.
2. **Propietario / Dueño del Negocio (`rol: admin`):**
   * El dueño del negocio posee el control maestro. Tiene a su disposición un **Selector de Filtro de Empleado**:
     * `🏢 Consolidado General`: Muestra las finanzas globales del establecimiento y la lista completa de colaboradores.
     * `👤 Filtro por Colaborador`: Le permite seleccionar a un empleado en específico para analizar su desempeño individual.

---

## 7. 🛡️ Panel de Control SuperAdmin (Ingresos y Gestión Global)

Ubicado en la vista de administración principal (`/admin`):

* **Directorio de Negocios Inquilinos:** Permite dar de alta nuevos negocios, asignar planes de suscripción (Básico, Pro, Enterprise), ajustar créditos manualmente y suspender/activar servicios.
* **Módulo de Solicitudes de Recarga con Comprobante:** Bandeja de aprobación de pagos pendiente con visualizador de comprobantes en HD.
* **Consola de Ingresos de la Plataforma:**
  * **Ventas de Hoy:** Dinero ingresado por recargas en el día actual.
  * **Ventas de la Semana / Mes:** Monitoreo del flujo de caja.
  * **MRR Estimado (Ingresos Recurrentes Mensuales):** Estimación de facturación fija por planes de suscripción activos.
  * **Desglose de Aporte por Negocio:** Tabla detalada del total pagado en recargas y tipo de plan para cada tenant.
* **Historial Auditado de Créditos:** Log inmutable de todas las recargas, deducciones por chats y ajustes administrativos.

---

## 8. 📅 Gestión de Citas, Servicios y Directorio de Clientes

* **Gestión de Citas:** Permite programar citas, asignar cliente y servicio. Incluye validación de horarios para evitar solapamientos y filtros por estado (`Todos`, `Confirmados`, `Completados`, `Pendientes`, `Cancelados`).
  > ℹ️ **Nota v1:** En la versión 1, **no se asigna empleado** a las citas. Cada negocio es atendido directamente por su propietario. El campo de selección de empleado está oculto en el formulario de creación de citas.
* **Catálogo de Servicios:** Modales sencillos para agregar o editar la lista de servicios (nombre, duración en minutos, precio).
  > ℹ️ **Nota v1:** La gestión de empleados/personal está desactivada. El sub-tab de "Empleados / Personal" y el botón "Nuevo Empleado" están ocultos y comentados en el código, reservados para la v2.
* **Directorio de Clientes:** Listado de clientes frecuentes con contador automático de visitas realizadas e historial de la última interacción.

---

## 9. 🔒 Privacidad Financiera y Aislamiento de Ganancias entre Colaboradores (v2)

> 🚧 **Estado: Planificado para v2.** En la **v1**, cada negocio opera con un único usuario (propietario/admin), por lo que no existe el escenario de múltiples colaboradores con datos financieros compartidos. Esta sección documenta el esquema de privacidad preparado para la **v2** del roadmap.

En negocios con múltiples empleados (por ejemplo, barberías con 3 o más barberos, o spas con varios esteticistas), **ver las ganancias individuales de un compañero puede generar fricción**. Por ello, AgendaIA incluye un sistema profesional de **Aislamiento de Privacidad Financiera** planeado para la v2:

### 🛡️ Lógica de Roles y Filtro de Visibilidad (v2):
1. **Colaborador / Empleado (`rol: personal`):**
   * Cuando un empleado ingresa al sistema con su usuario, el panel detecta automáticamente su perfil y activa el modo **"🔒 Vista Personal Protegida"**.
   * El empleado **únicamente puede ver sus propias métricas** (sus ganancias de Hoy, Semana, Mes, Total, sus citas atendidas y el rendimiento de los servicios prestados por él).
   * La información financiera y las citas de sus demás compañeros quedan **completamente bloqueadas y ocultas**.
2. **Propietario / Dueño del Negocio (`rol: admin`):**
   * El dueño del negocio posee el control maestro. Tiene a su disposición un **Selector de Filtro de Empleado**:
     * `🏢 Consolidado General`: Muestra las finanzas globales del establecimiento y la lista completa de colaboradores.
     * `👤 Filtro por Colaborador`: Le permite seleccionar a un empleado en específico (ej. "Carlos Gómez") para analizar su desempeño individual sin interferencias.

### 🗄️ Guía para la Base de Datos (PostgreSQL / Supabase Row-Level Security RLS — v2):

Si conectas AgendaIA con Supabase o PostgreSQL directo, la privacidad a nivel de base de datos se garantiza mediante políticas **RLS (Row Level Security)** en la tabla `citas`:

```sql
-- 1. Habilitar RLS en la tabla citas
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- 2. Política para Propietario (Admin): Ve todas las citas de su negocio
CREATE POLICY "Admins ven todas las citas de su negocio" ON citas
FOR SELECT USING (
  id_negocio = (auth.jwt() -> 'user_metadata' ->> 'id_negocio')
  AND (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin'
);

-- 3. Política para Colaborador (Personal): Ve SOLO sus propias citas
CREATE POLICY "Empleados ven solo sus citas propias" ON citas
FOR SELECT USING (
  id_negocio = (auth.jwt() -> 'user_metadata' ->> 'id_negocio')
  AND id_empleado = (auth.jwt() -> 'user_metadata' ->> 'id_empleado')
  AND (auth.jwt() -> 'user_metadata' ->> 'rol') = 'personal'
);
```

---

*Desarrollado con React 18, TypeScript, Tailwind CSS y Gemini AI en arquitectura full-stack.*
