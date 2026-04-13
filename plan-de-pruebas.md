# Plan de Pruebas - Creditia

> **Proyecto:** Creditia - Plataforma de Análisis Crediticio
> **Fecha:** 2026-04-13
> **Versión:** 1.0
> **Locale:** es-CO

---

## Resumen

| Módulo | Casos | P0 | P1 | P2 | P3 |
|--------|------:|---:|---:|---:|---:|
| M1 - Autenticación y Registro | 28 | 16 | 8 | 4 | 0 |
| M2 - Onboarding | 18 | 10 | 5 | 3 | 0 |
| M3 - Clientes | 30 | 12 | 12 | 4 | 2 |
| M4 - Estudios de Crédito | 38 | 18 | 12 | 6 | 2 |
| M5 - Dashboard | 16 | 4 | 6 | 4 | 2 |
| M6 - Administración | 28 | 8 | 12 | 6 | 2 |
| T - Transversales | 24 | 8 | 10 | 4 | 2 |
| **Total** | **182** | **76** | **65** | **31** | **10** |

### Convenciones

| Campo | Descripción |
|-------|-------------|
| **ID** | Identificador único: `{Módulo}-TC-{###}` |
| **Prioridad** | P0 = Crítico, P1 = Alto, P2 = Medio, P3 = Bajo |
| **Estado** | Not Run / Passed / Failed / Blocked / Skipped |

---

## M1 - Autenticación y Registro

### Login (Email/Password)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M1-TC-001 | Login exitoso con credenciales válidas | Usuario registrado con email confirmado y suscripción activa | 1. Ir a `/auth/iniciar-sesion` 2. Ingresar email válido 3. Ingresar contraseña válida (≥6 chars) 4. Click "Iniciar sesión" | Redirige a `/app` (dashboard). Se carga el perfil del usuario. | P0 | Not Run |
| M1-TC-002 | Login con email inválido | Ninguna | 1. Ir a `/auth/iniciar-sesion` 2. Ingresar email con formato inválido (ej: "test@") 3. Tocar campo y salir | Muestra mensaje: "Ingresa un correo electrónico válido." Botón "Iniciar sesión" deshabilitado. | P0 | Not Run |
| M1-TC-003 | Login con email vacío | Ninguna | 1. Ir a `/auth/iniciar-sesion` 2. Dejar email vacío 3. Tocar campo y salir | Campo marcado como inválido. Botón "Iniciar sesión" deshabilitado. | P0 | Not Run |
| M1-TC-004 | Login con contraseña menor a 6 caracteres | Ninguna | 1. Ir a `/auth/iniciar-sesion` 2. Ingresar email válido 3. Ingresar contraseña de 5 caracteres 4. Tocar campo y salir | Muestra mensaje: "La contraseña debe tener al menos 6 caracteres." Botón deshabilitado. | P0 | Not Run |
| M1-TC-005 | Login con contraseña vacía | Ninguna | 1. Ir a `/auth/iniciar-sesion` 2. Ingresar email válido 3. Dejar contraseña vacía | Botón "Iniciar sesión" deshabilitado. | P0 | Not Run |
| M1-TC-006 | Login con credenciales incorrectas | Usuario registrado | 1. Ir a `/auth/iniciar-sesion` 2. Ingresar email correcto 3. Ingresar contraseña incorrecta 4. Click "Iniciar sesión" | Muestra mensaje: "Correo o contraseña incorrectos." No redirige. | P0 | Not Run |
| M1-TC-007 | Login con usuario no registrado | Ninguna | 1. Ir a `/auth/iniciar-sesion` 2. Ingresar email no registrado 3. Ingresar cualquier contraseña 4. Click "Iniciar sesión" | Muestra mensaje de error. No redirige. | P0 | Not Run |
| M1-TC-008 | Botón "Iniciar sesión" muestra loading | Usuario registrado | 1. Ingresar credenciales válidas 2. Click "Iniciar sesión" | Botón muestra estado de carga (spinner/disabled) mientras procesa. | P1 | Not Run |
| M1-TC-009 | Login redirige con returnUrl | Usuario registrado | 1. Intentar acceder a `/app/clientes` sin auth 2. Ser redirigido a login con `?returnUrl=/app/clientes` 3. Hacer login exitoso | Redirige a `/app/clientes` (la URL original) en lugar de `/app`. | P1 | Not Run |
| M1-TC-010 | Link "¿No tienes cuenta? Regístrate" | Ninguna | 1. Ir a `/auth/iniciar-sesion` 2. Click en "¿No tienes cuenta? Regístrate" | Navega a `/auth/registro`. | P2 | Not Run |

### Login con Google

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M1-TC-011 | Login exitoso con Google OAuth | Cuenta Google válida | 1. Ir a `/auth/iniciar-sesion` 2. Click "Continuar con Google" 3. Completar flujo de Google | Redirige a `/app`. Se carga perfil del usuario. | P0 | Not Run |
| M1-TC-012 | Login con Google - error en autenticación | Cuenta Google inválida o cancelada | 1. Ir a `/auth/iniciar-sesion` 2. Click "Continuar con Google" 3. Cancelar o fallar en flujo de Google | Muestra: "Error al iniciar sesión con Google. Intenta de nuevo." | P0 | Not Run |
| M1-TC-013 | Botón Google muestra loading | Ninguna | 1. Click "Continuar con Google" | Botón muestra estado de carga mientras procesa OAuth. | P2 | Not Run |

### Registro

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M1-TC-014 | Registro exitoso | Ninguna | 1. Ir a `/auth/registro` 2. Ingresar email válido 3. Ingresar contraseña (≥6 chars) 4. Confirmar contraseña 5. Click "Crear cuenta" | Muestra: "Cuenta creada exitosamente. Debes confirmar tu correo electrónico antes de iniciar sesión." Después de 4s redirige a `/auth/iniciar-sesion`. | P0 | Not Run |
| M1-TC-015 | Registro con email ya registrado | Usuario con ese email existe | 1. Ir a `/auth/registro` 2. Ingresar email ya registrado 3. Completar contraseñas 4. Click "Crear cuenta" | Muestra: "Este correo electrónico ya está registrado." | P0 | Not Run |
| M1-TC-016 | Registro con contraseñas que no coinciden | Ninguna | 1. Ir a `/auth/registro` 2. Ingresar email válido 3. Ingresar contraseña "123456" 4. Ingresar confirmación "654321" 5. Tocar y salir del campo | Muestra: "Las contraseñas no coinciden." Botón deshabilitado. | P0 | Not Run |
| M1-TC-017 | Registro con email inválido | Ninguna | 1. Ir a `/auth/registro` 2. Ingresar email inválido 3. Tocar y salir | Muestra: "Ingresa un correo electrónico válido." | P0 | Not Run |
| M1-TC-018 | Registro con contraseña menor a 6 chars | Ninguna | 1. Ir a `/auth/registro` 2. Ingresar contraseña de 5 chars | Muestra: "La contraseña debe tener al menos 6 caracteres." | P0 | Not Run |
| M1-TC-019 | Registro con campos vacíos | Ninguna | 1. Ir a `/auth/registro` 2. No completar ningún campo 3. Intentar enviar | Botón "Crear cuenta" deshabilitado. | P1 | Not Run |

### Registro por Invitación

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M1-TC-020 | Registro desde link de invitación | Invitación enviada con query params: `invitation`, `email`, `token` | 1. Abrir URL con params de invitación 2. Verificar email pre-llenado y deshabilitado 3. Ingresar contraseña y confirmación 4. Click "Crear cuenta" | Email pre-llenado y disabled. Al registrar se acepta la invitación y se asocia a la empresa. Redirige a login. | P0 | Not Run |
| M1-TC-021 | Registro por invitación - fallo al asociar empresa | Invitación con token inválido/expirado | 1. Abrir URL de invitación con token inválido 2. Completar registro | Muestra: "Tu cuenta fue creada, pero no se pudo asociar a la empresa. Contacta al administrador que te invitó." Redirige a login con error. | P1 | Not Run |

### Cierre de sesión

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M1-TC-022 | Cerrar sesión exitosamente | Usuario autenticado | 1. Click en "Cerrar sesión" | Sesión eliminada. Redirige a `/auth/iniciar-sesion`. No se puede acceder a rutas protegidas. | P0 | Not Run |
| M1-TC-023 | Sesión limpiada tras logout | Usuario autenticado | 1. Cerrar sesión 2. Presionar botón atrás del navegador | No se muestra contenido protegido. Redirige a login. | P1 | Not Run |

### Páginas de Auth estáticas

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M1-TC-024 | Página de acceso denegado | Ninguna | 1. Navegar a `/auth/access-denied` | Muestra "ACCESS DENIED" con mensaje y botón "Go to Dashboard" que lleva a `/app`. | P2 | Not Run |
| M1-TC-025 | Forgot password - muestra formulario | Ninguna | 1. Navegar a `/auth/forgot-password` | Muestra campo de email y botón "Send Recovery Mail". (Funcionalidad placeholder) | P2 | Not Run |
| M1-TC-026 | Página de verificación | Ninguna | 1. Navegar a `/auth/verificacion` | Muestra input de 4 dígitos y botón "Verify". (Funcionalidad placeholder) | P1 | Not Run |
| M1-TC-027 | Componente OTP - ingreso de 6 dígitos | Componente OTP renderizado | 1. Ingresar 6 dígitos uno por uno 2. Verificar auto-focus al siguiente campo | Al completar 6 dígitos emite evento `otpComplete` con el código. Auto-focus funciona correctamente. | P1 | Not Run |
| M1-TC-028 | Componente OTP - pegado de código | Componente OTP renderizado | 1. Copiar código de 6 dígitos 2. Pegar en el primer campo | Los 6 campos se llenan automáticamente. Emite evento `otpComplete`. | P1 | Not Run |

---

## M2 - Onboarding (Suscripción)

> **Nota:** Los pagos con Wompi están excluidos de este plan de pruebas.

### Determinación del paso inicial

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M2-TC-001 | Usuario sin perfil inicia en paso 1 | Usuario autenticado, sin perfil creado | 1. Navegar a `/suscripcion/registro` | Muestra Step 1 (Perfil) activo. | P0 | Not Run |
| M2-TC-002 | Usuario con perfil sin empresa inicia en paso 2 | Usuario con perfil creado, sin empresa | 1. Navegar a `/suscripcion/registro` | Muestra Step 2 (Empresa) activo. | P0 | Not Run |
| M2-TC-003 | Usuario con empresa sin suscripción inicia en paso 3 | Usuario con perfil y empresa, sin suscripción | 1. Navegar a `/suscripcion/registro` | Muestra Step 3 (Plan) activo. | P0 | Not Run |
| M2-TC-004 | Usuario con suscripción activa redirige a app | Usuario con todo completo | 1. Navegar a `/suscripcion/registro` | Redirige automáticamente a `/app`. | P0 | Not Run |

### Paso 1: Perfil

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M2-TC-005 | Guardar perfil exitosamente | Paso 1 activo | 1. Email se muestra disabled (pre-llenado) 2. Ingresar nombre (requerido) 3. Ingresar apellido (requerido) 4. Ingresar teléfono (opcional) 5. Ingresar cargo (opcional) 6. Click "Guardar y continuar" | Perfil creado. Avanza a Step 2. | P0 | Not Run |
| M2-TC-006 | Validación de campos requeridos paso 1 | Paso 1 activo | 1. Dejar nombre y apellido vacíos 2. Click "Guardar y continuar" | Muestra "Este campo es obligatorio" en nombre y apellido. No avanza. | P0 | Not Run |
| M2-TC-007 | Email deshabilitado en paso 1 | Paso 1 activo | 1. Verificar campo email | Email pre-llenado desde Supabase y campo deshabilitado (no editable). | P1 | Not Run |

### Paso 2: Empresa

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M2-TC-008 | Crear empresa exitosamente | Paso 2 activo | 1. Ingresar nombre de empresa (requerido) 2. Ingresar NIT (requerido) 3. Seleccionar sector (requerido) 4. Seleccionar departamento (requerido) 5. Seleccionar ciudad (requerido) 6. Ingresar dirección (requerido) 7. Click "Guardar y continuar" | Empresa creada. Avanza a Step 3. | P0 | Not Run |
| M2-TC-009 | Validación campos requeridos paso 2 | Paso 2 activo | 1. Dejar todos los campos vacíos 2. Click "Guardar y continuar" | Muestra "Este campo es obligatorio" en todos los campos requeridos. No avanza. | P0 | Not Run |
| M2-TC-010 | Cascada departamento → ciudad | Paso 2 activo | 1. Seleccionar un departamento 2. Verificar opciones de ciudad | Ciudades se cargan dinámicamente según departamento seleccionado. Si se cambia departamento, ciudad se resetea. | P1 | Not Run |
| M2-TC-011 | Ciudad deshabilitada sin departamento | Paso 2 activo | 1. No seleccionar departamento 2. Intentar seleccionar ciudad | Control de ciudad deshabilitado hasta seleccionar departamento. | P1 | Not Run |

### Paso 3: Selección de Plan

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M2-TC-012 | Ver planes disponibles | Paso 3 activo | 1. Verificar que se muestran los planes | Se muestran cards de planes con: nombre, descripción, precio, límites (usuarios, empresas, clientes, estudios/mes) y features (dashboard level, reportes, soporte). | P0 | Not Run |
| M2-TC-013 | Seleccionar plan gratuito | Paso 3 activo, plan con precio = 0 | 1. Click "Comenzar gratis" en plan gratuito | Se crea suscripción. Recarga perfil. Redirige a `/app`. | P0 | Not Run |
| M2-TC-014 | Badge "Recomendado" en plan destacado | Paso 3 activo | 1. Verificar badges en planes | El segundo plan (o primero si solo hay uno) muestra badge "Recomendado". | P2 | Not Run |
| M2-TC-015 | Campaña con descuento muestra precio original tachado | Paso 3 activo, campaña activa | 1. Verificar precios en planes | Precio original tachado, nuevo precio con descuento visible. Banner de campaña con nombre, descripción, % descuento y fecha fin. | P2 | Not Run |
| M2-TC-016 | Labels de features correctos | Paso 3 activo | 1. Verificar labels en features de planes | Dashboard: "Básico"/"Avanzado"/"Completo". Soporte: "Correo electrónico"/"Prioritario"/"Dedicado". Límites "ilimitados" si null. | P2 | Not Run |

### Cierre de sesión desde onboarding

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M2-TC-017 | Cerrar sesión desde onboarding | En cualquier paso del onboarding | 1. Click "Cerrar sesión" (footer) | Sesión cerrada. Redirige a `/auth/iniciar-sesion`. | P1 | Not Run |

### Confirmación de pago (sin Wompi)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M2-TC-018 | Página de confirmación - estado aprobado | Transacción con estado `activa` | 1. Navegar a `/suscripcion/confirmacion?ref={paymentId}` | Muestra icono verde de éxito, nombre del plan, referencia de pago, fecha de expiración. Botón "Ir al panel" → `/app`. | P1 | Not Run |

---

## M3 - Clientes

### Listado de clientes

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-001 | Ver listado de clientes | Usuario autenticado con clientes registrados | 1. Navegar a `/app/clientes` | Tabla muestra columnas: Razón Social, Identificación, Teléfono, Email, Ciudad. Título "Gestión de Clientes". | P0 | Not Run |
| M3-TC-002 | Listado vacío | Usuario sin clientes | 1. Navegar a `/app/clientes` | Muestra mensaje: "No se encontraron clientes." | P1 | Not Run |
| M3-TC-003 | Paginación del listado | Más de 10 clientes | 1. Navegar a `/app/clientes` 2. Verificar paginación | Se muestran 10 filas por defecto. Paginador funcional con opciones 10, 25, 50. | P1 | Not Run |
| M3-TC-004 | Búsqueda de clientes | Clientes registrados | 1. Escribir en campo "Buscar clientes..." 2. Ingresar nombre parcial | Tabla filtra resultados. Paginación se resetea a página 1. | P1 | Not Run |
| M3-TC-005 | Botón "Agregar Cliente" | Usuario autenticado | 1. Click en "Agregar Cliente" (icono pi-plus, verde) | Navega a `/app/clientes/detalle-cliente` (modo creación). | P0 | Not Run |
| M3-TC-006 | Acción editar cliente | Cliente existente en tabla | 1. Click en icono de lápiz (pi-pencil) en una fila | Navega a `/app/clientes/detalle-cliente/{id}` (modo edición). | P0 | Not Run |
| M3-TC-007 | Acción eliminar cliente | Cliente existente en tabla | 1. Click en icono de basura (pi-trash) en una fila | Cliente eliminado. Lista se recarga. | P1 | Not Run |
| M3-TC-008 | Loading state en tabla | Cargando datos | 1. Navegar a `/app/clientes` durante carga | Tabla muestra estado de carga (skeleton/spinner). | P2 | Not Run |

### Crear cliente - Información General

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-009 | Crear cliente persona natural exitosamente | En `/app/clientes/detalle-cliente` | 1. Seleccionar Tipo de Persona: "Persona Natural" 2. Seleccionar Tipo de Identificación 3. Ingresar Razón Social/Nombre 4. Ingresar Nro. Identificación 5. Seleccionar Actividad Económica 6. Ingresar Antigüedad (≥0) 7. Completar contacto (email, teléfono, depto, ciudad, dirección) 8. Click "Guardar" | Cliente creado. Notificación: "Cliente creado correctamente". Navega a modo edición con el ID del nuevo cliente. | P0 | Not Run |
| M3-TC-010 | Crear cliente persona jurídica exitosamente | En `/app/clientes/detalle-cliente` | 1. Seleccionar Tipo de Persona: "Persona Jurídica" 2. Completar info general 3. Completar sección Representante Legal (todos los campos obligatorios) 4. Completar contacto 5. Click "Guardar" | Cliente creado con datos de representante legal. Notificación: "Cliente creado correctamente". | P0 | Not Run |
| M3-TC-011 | Validación campos requeridos info general | Formulario vacío | 1. Click "Guardar" sin completar campos | Marca todos los campos como touched. Muestra "Este campo es obligatorio" en: Tipo Persona, Tipo ID, Razón Social, Nro ID, Actividad Económica, Antigüedad. | P0 | Not Run |
| M3-TC-012 | Antigüedad no acepta negativos | Formulario activo | 1. Ingresar -1 en Antigüedad | Muestra: "El valor debe ser mayor o igual a 0". | P1 | Not Run |

### Crear cliente - Representante Legal (Persona Jurídica)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-013 | Sección Rep. Legal visible solo para persona jurídica | Formulario activo | 1. Seleccionar "Persona Natural" → verificar 2. Cambiar a "Persona Jurídica" → verificar | Con Persona Natural: sección oculta. Con Persona Jurídica: sección visible con campos obligatorios (*). | P0 | Not Run |
| M3-TC-014 | Validación Rep. Legal en persona jurídica | Tipo Persona = Jurídica | 1. Dejar campos de Rep. Legal vacíos 2. Click "Guardar" | Muestra "Este campo es obligatorio" en: Nombre Rep., Tipo ID Rep., Nro ID Rep., Email Rep., Teléfono Rep. | P0 | Not Run |
| M3-TC-015 | Email Rep. Legal con formato inválido | Tipo Persona = Jurídica | 1. Ingresar email inválido en Rep. Legal | Muestra: "Ingrese un email válido". | P1 | Not Run |
| M3-TC-016 | Cambiar de jurídica a natural limpia validaciones | Tipo Persona = Jurídica con datos | 1. Seleccionar "Persona Jurídica" 2. Completar algunos campos de Rep. Legal 3. Cambiar a "Persona Natural" | Sección Rep. Legal se oculta. Validadores removed. Formulario puede guardarse sin datos de Rep. Legal. | P1 | Not Run |

### Crear cliente - Información de Contacto

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-017 | Validación campos de contacto requeridos | Formulario activo | 1. Dejar campos de contacto vacíos 2. Click "Guardar" | Muestra error en: Email, Teléfono Principal, Departamento, Ciudad, Dirección. | P0 | Not Run |
| M3-TC-018 | Email contacto con formato inválido | Formulario activo | 1. Ingresar email inválido en contacto | Muestra: "Ingrese un email válido". | P1 | Not Run |
| M3-TC-019 | Cascada Departamento → Ciudad | Formulario activo | 1. Seleccionar departamento 2. Verificar ciudades disponibles 3. Cambiar departamento | Ciudades se cargan según departamento. Al cambiar departamento, ciudad se resetea a null. | P1 | Not Run |
| M3-TC-020 | Ciudad deshabilitada sin departamento | Formulario activo | 1. No seleccionar departamento | Control de ciudad deshabilitado. | P1 | Not Run |
| M3-TC-021 | Teléfono secundario es opcional | Formulario activo | 1. Completar todos los requeridos 2. Dejar teléfono secundario vacío 3. Click "Guardar" | Cliente se crea exitosamente sin teléfono secundario. | P2 | Not Run |

### Crear cliente - Referencias Comerciales y Observaciones

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-022 | Referencias comerciales son opcionales | Formulario activo | 1. No completar ninguna referencia 2. Click "Guardar" (con campos requeridos completos) | Cliente se crea exitosamente sin referencias comerciales. | P1 | Not Run |
| M3-TC-023 | Completar ambas referencias comerciales | Formulario activo | 1. Llenar Ref 1: Nombre, Contacto, Teléfono 2. Llenar Ref 2: Nombre, Contacto, Teléfono 3. Guardar | Datos de ambas referencias guardados correctamente. | P2 | Not Run |
| M3-TC-024 | Observaciones es opcional (textarea) | Formulario activo | 1. Ingresar texto en observaciones (textarea, 4 filas, auto-resize) 2. Guardar | Observaciones guardadas correctamente. Campo tiene auto-resize. | P3 | Not Run |

### Editar cliente

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-025 | Cargar datos del cliente en modo edición | Cliente existente | 1. Navegar a `/app/clientes/detalle-cliente/{id}` | Formulario se llena con datos del cliente. Título: "Editar Cliente" con icono pi-user-edit. Departamento y ciudad cargados correctamente. | P0 | Not Run |
| M3-TC-026 | Actualizar cliente exitosamente | Modo edición | 1. Modificar uno o más campos 2. Click "Guardar" | Notificación: "Cliente actualizado correctamente". Datos recargados. | P0 | Not Run |
| M3-TC-027 | Botón Guardar deshabilitado sin cambios | Modo edición | 1. Cargar cliente 2. No modificar nada | Botón "Guardar" deshabilitado (form no dirty). | P2 | Not Run |
| M3-TC-028 | Botón Cancelar en creación | Modo creación | 1. Click "Cancelar" (o flecha atrás) | Navega a `/app/clientes`. | P1 | Not Run |

### Loading y skeleton

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M3-TC-029 | Skeleton al cargar detalle | Modo edición | 1. Navegar a detalle de un cliente | Mientras carga, se muestran skeletons en cada sección del formulario. | P3 | Not Run |
| M3-TC-030 | Header diferente en creación vs edición | Ambos modos | 1. Ir a creación → verificar header 2. Ir a edición → verificar header | Creación: "Nuevo Cliente" con pi-user-plus y flecha atrás. Edición: "Editar Cliente" con pi-user-edit. | P1 | Not Run |

---

## M4 - Estudios de Crédito

### Listado de estudios

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-001 | Ver listado de estudios de crédito | Estudios existentes | 1. Navegar a `/app/estudio-credito` | Tabla con columnas: Cliente, Línea de Crédito Solicitada (COP), Plazo (meses), Fecha Estudio, Estado. Título: "Gestión de Estudios de Crédito". | P0 | Not Run |
| M4-TC-002 | Badge de estado correcto | Estudios con diferentes estados | 1. Verificar badges en columna Estado | "En Revisión" → badge info (azul). "Estudio Realizado" → badge success (verde). | P0 | Not Run |
| M4-TC-003 | Búsqueda en estudios | Estudios existentes | 1. Buscar por nombre de cliente | Tabla filtra resultados. Paginación resetea a página 1. | P1 | Not Run |
| M4-TC-004 | Paginación de estudios | Más de 10 estudios | 1. Verificar paginación | 10 filas por defecto. Opciones: 10, 25, 50. | P1 | Not Run |
| M4-TC-005 | Botón agregar nuevo estudio | Usuario autenticado | 1. Click botón "Agregar" | Navega a `/app/estudio-credito/detalle-estudio` (modo creación). | P0 | Not Run |
| M4-TC-006 | Acción editar estudio | Estudio existente | 1. Click icono editar en fila | Navega a `/app/estudio-credito/detalle-estudio/{id}`. | P0 | Not Run |

### Step 1: Información del Cupo

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-007 | Completar paso 1 en modo creación | En detalle-estudio sin ID | 1. Buscar cliente en autocomplete (requerido) 2. Seleccionar fecha de estudio (requerida) 3. Ingresar plazo solicitado (requerido) 4. Ingresar línea de crédito (COP, requerida) 5. Ingresar notas (opcional) 6. Click "Siguiente" | Valida formulario. Avanza a Step 2. | P0 | Not Run |
| M4-TC-008 | Validación campos requeridos paso 1 | Step 1 activo | 1. No completar campos 2. Click "Siguiente" | Muestra errores de validación en: cliente, fecha, plazo, línea de crédito. | P0 | Not Run |
| M4-TC-009 | Autocomplete de cliente funciona | Step 1, modo creación | 1. Escribir nombre parcial en campo cliente | Muestra sugerencias de clientes existentes. Al seleccionar, se llena customerId. | P1 | Not Run |
| M4-TC-010 | Paso 1 en modo edición - cliente readonly | Step 1, modo edición | 1. Abrir estudio existente | Campo cliente muestra nombre (disabled). Fecha de estudio disabled. customerId sin validador required. | P1 | Not Run |
| M4-TC-011 | Pre-llenado desde detalle de cliente | Navegando desde customer-detail con query params | 1. Desde detalle de cliente, click "Nuevo Estudio" | customerId y customerName pre-llenados desde query params. | P1 | Not Run |

### Step 2: Datos Financieros

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-012 | Completar datos financieros manualmente | Step 2 activo | 1. Completar Activos Corrientes (efectivo, cuentas por cobrar 1 y 2, inventarios 1 y 2, total activos corrientes) 2. Completar Activos No Corrientes (activos fijos, total) 3. Fecha balance general 4. Completar Pasivos Corrientes (obligaciones CP, proveedores 1 y 2, total) 5. Completar Pasivos No Corrientes (obligaciones LP, total) 6. Completar Patrimonio (ganancias acumuladas, utilidad neta) 7. Completar Estado de Resultados (período, ingresos, costo ventas, gastos admin, gastos ventas, depreciación, amortización, gastos financieros, impuestos) 8. Click "Siguiente" | Todos los campos en COP (es-CO, 0 decimales). Avanza a Step 3. | P0 | Not Run |
| M4-TC-013 | Validación campos financieros requeridos | Step 2 activo | 1. Dejar campos vacíos 2. Click "Siguiente" | Todos los campos financieros marcados como inválidos. No avanza. | P0 | Not Run |
| M4-TC-014 | Botón "Volver" regresa a paso 1 | Step 2 activo | 1. Click "Volver" | Regresa a Step 1 con datos preservados. | P2 | Not Run |

### Step 2: Extracción PDF

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-015 | Botón "Cargar Estados Financieros" visible según suscripción | Suscripción con maxPdfExtractionsPerMonth > 0 | 1. Verificar visibilidad del botón | Botón visible solo si la suscripción permite extracciones PDF. | P0 | Not Run |
| M4-TC-016 | Subir PDF exitosamente | Step 2 activo, PDF válido | 1. Click "Cargar Estados Financieros" 2. Confirmar requisitos en diálogo 3. Seleccionar archivo PDF (≤10MB) | Modal con spinner durante extracción. Al completar, muestra tabla con 24 campos financieros extraídos. Campos del formulario se auto-llenan. | P0 | Not Run |
| M4-TC-017 | Validación tipo de archivo | Step 2 activo | 1. Intentar subir archivo no-PDF (ej: .docx, .jpg) | Error de validación. No se envía al servidor. | P1 | Not Run |
| M4-TC-018 | Validación tamaño de archivo (>10MB) | Step 2 activo | 1. Intentar subir PDF mayor a 10MB | Error de validación: archivo excede límite. No se envía. | P1 | Not Run |
| M4-TC-019 | PDF con campos no encontrados | Step 2 activo, PDF incompleto | 1. Subir PDF que no contiene todos los datos | Tabla muestra "No encontrado" para campos null. Campos del formulario quedan vacíos donde no hay dato. | P1 | Not Run |
| M4-TC-020 | Error en extracción de PDF | Step 2 activo, error de servidor | 1. Subir PDF 2. Servidor retorna error | Notificación de error con mensaje del backend. Formulario no se modifica. | P2 | Not Run |

### Step 3: Estudio de Crédito (Resumen)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-021 | Ver indicadores calculados en paso 3 | Step 3 activo con datos financieros | 1. Verificar indicadores | Muestra read-only: Total Activos, Total Pasivos, Patrimonio, Utilidad Bruta. Calculados: totalAssets = currentAssets + nonCurrentAssets, equity = totalAssets - totalLiabilities, grossProfit = revenue - costOfSales. | P0 | Not Run |
| M4-TC-022 | Botón "Realizar Estudio" visible según condiciones | Step 3, modo edición, suscripción con AI | 1. Verificar visibilidad | Botón visible solo en modo edición + AI habilitado (maxAiAnalysisPerMonth > 0) + formulario válido. | P0 | Not Run |
| M4-TC-023 | Realizar estudio de crédito (AI) | Step 3, condiciones cumplidas | 1. Click "Realizar Estudio" 2. Confirmar en diálogo: "¿Está seguro de que desea iniciar el proceso de estudio de crédito? Esta acción no se puede deshacer." 3. Click "Sí, realizar estudio" | Análisis AI ejecutado. Resultado cargado. Auto-avanza a Step 4. Notificación de éxito. studyCompleted = true. | P0 | Not Run |
| M4-TC-024 | Cancelar diálogo de confirmación de estudio | Step 3 | 1. Click "Realizar Estudio" 2. Click "Cancelar" en diálogo | No se ejecuta el análisis. Permanece en Step 3. | P1 | Not Run |
| M4-TC-025 | Guardar estudio en modo creación (sin AI) | Step 3, modo creación | 1. Click "Guardar" | Estudio guardado. Navega a modo edición con el nuevo ID. | P0 | Not Run |
| M4-TC-026 | Botón "Volver" regresa a paso 2 | Step 3 activo | 1. Click "Volver" | Regresa a Step 2 con datos preservados. | P2 | Not Run |

### Step 4: Resultado del Estudio

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-027 | Ver resultado del estudio | Step 4 activo, estudio completado | 1. Verificar datos mostrados | Componente `app-study-result` muestra datos del estudio, cliente, empresa, nombre de suscripción. | P0 | Not Run |
| M4-TC-028 | Botón "Volver" regresa a paso 3 | Step 4 activo | 1. Click "Volver" | Regresa a Step 3. | P2 | Not Run |

### Pagaré (Promissory Note)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-029 | Botón "Aprobar Crédito" visible post-estudio | Estudio completado con resultado | 1. Verificar botón en header | Botón "Aprobar Crédito" visible cuando studyCompleted = true y studyResult existe. No visible si isReadOnly. | P0 | Not Run |
| M4-TC-030 | Previsualizar pagaré | Post-estudio | 1. Click "Aprobar Crédito" | Modal muestra preview HTML del pagaré con advertencia de revisión. Botón "Aprobar y Enviar". | P0 | Not Run |
| M4-TC-031 | Aprobar y enviar pagaré | Preview del pagaré visible | 1. Click "Aprobar y Enviar" en modal | Notificación: "Crédito aprobado. Se ha enviado el pagaré al cliente para su firma." Datos del estudio actualizados. | P0 | Not Run |
| M4-TC-032 | Estado PENDING_SIGNATURE - UI correcta | Pagaré enviado, esperando firma | 1. Verificar UI | Alerta amber. Botón "Cancelar Firma" visible. Formulario en modo read-only. | P1 | Not Run |
| M4-TC-033 | Cancelar firma del pagaré | Estado PENDING_SIGNATURE | 1. Click "Cancelar Firma" 2. Confirmar: "¿Está seguro de que desea cancelar la firma del pagaré? El documento dejará de estar disponible para el cliente." | Pagaré cancelado. Estudio recargado. Estado cambia. | P1 | Not Run |
| M4-TC-034 | Estado SIGNED - UI correcta | Pagaré firmado | 1. Verificar UI | Alerta verde. Botón "Descargar Pagaré" visible (link a signedDocumentUrl). Formulario read-only. | P1 | Not Run |
| M4-TC-035 | Descargar pagaré firmado | Estado SIGNED con signedDocumentUrl | 1. Click "Descargar Pagaré" | Descarga el documento PDF firmado. | P1 | Not Run |

### Modo Read-Only

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-036 | Formularios disabled en read-only | Estudio completado o pagaré pendiente/firmado | 1. Verificar formularios Steps 1 y 2 | Todos los campos deshabilitados. Botones "Cargar Estados Financieros" y "Realizar Estudio" ocultos. | P0 | Not Run |

### Navegación y acciones del header

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M4-TC-037 | Botón "Cancelar" navega atrás | Detalle de estudio | 1. Click "Cancelar" | Navega al listado de estudios o al detalle del cliente (según contexto). | P2 | Not Run |
| M4-TC-038 | Botón "Ver Cliente" en modo edición | Modo edición | 1. Click "Ver Cliente" | Navega al detalle del cliente asociado. | P3 | Not Run |

---

## M5 - Dashboard

### Dashboard Básico

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M5-TC-001 | KPIs principales visibles | Usuario autenticado con datos | 1. Navegar a `/app` | Muestra 4 KPI cards: Total Clientes (pi-users azul), Total Estudios (pi-file-edit morado), Estudios Este Mes (pi-calendar verde), Usuarios Activos (pi-user-plus naranja). | P0 | Not Run |
| M5-TC-002 | KPIs de crédito visibles | Datos de estudios existentes | 1. Verificar sección credit summary | Muestra: Cupo Total Solicitado (COP, pi-dollar teal), Cupo Promedio (COP, pi-chart-bar cyan), Plazo Promedio (meses, pi-clock pink). | P0 | Not Run |
| M5-TC-003 | Gráfico "Estudios por Estado" (Doughnut) | Estudios con diferentes estados | 1. Verificar gráfico | Doughnut chart con distribución por estado. Colores: amarillo, azul, verde, rojo. Leyenda abajo. | P1 | Not Run |
| M5-TC-004 | Gráfico "Estudios por Mes" (Barras) | Estudios en diferentes meses | 1. Verificar gráfico | Bar chart con meses formateados (Ene 2025, Feb 2025...). Barras azules. | P1 | Not Run |
| M5-TC-005 | Gráfico "Clientes por Tipo de Persona" (Pie) | Clientes natural y jurídica | 1. Verificar gráfico | Pie chart con 2 segmentos. Colores: indigo, teal. | P1 | Not Run |
| M5-TC-006 | Tabla "Estudios Recientes" | Estudios existentes | 1. Verificar tabla | Muestra últimos 5 estudios con: Cliente, Fecha, Estado (badge), Cupo solicitado. | P0 | Not Run |
| M5-TC-007 | Dashboard sin datos | Usuario nuevo sin datos | 1. Navegar a `/app` | KPIs muestran 0. Gráficos vacíos o con mensaje. Tabla de recientes vacía. | P2 | Not Run |

### Dashboard Avanzado

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M5-TC-008 | Dashboard avanzado visible según suscripción | Suscripción con dashboardLevel = 'advanced' | 1. Navegar a `/app` | Muestra sección avanzada adicional con KPIs y gráficos extra. | P0 | Not Run |
| M5-TC-009 | Dashboard avanzado NO visible en plan básico | dashboardLevel = 'basic' | 1. Navegar a `/app` | Solo se muestra dashboard básico. No hay sección avanzada. | P1 | Not Run |
| M5-TC-010 | KPIs avanzados | Dashboard avanzado activo | 1. Verificar KPIs adicionales | Muestra: EBITDA Promedio (compacto), Cap. Pago Mensual Prom. (compacto), Factor Estabilidad Prom. (1-2 decimales), Plazo Máx. Pago Prom. (días). | P1 | Not Run |
| M5-TC-011 | Gráfico "Distribución Factor de Estabilidad" | Dashboard avanzado | 1. Verificar gráfico | Doughnut con bandas Altman Z-Score: alto riesgo ≤1.8 (rojo), medio 1.8-3.0 (amarillo), bajo >3.0 (verde). | P2 | Not Run |
| M5-TC-012 | Gráfico "Evolución Capacidad de Pago" | Dashboard avanzado | 1. Verificar gráfico | Línea con últimos 12 meses. Tension 0.4, point radius 4. Formato moneda en eje Y. | P2 | Not Run |
| M5-TC-013 | Gráfico "Indicadores de Rotación" | Dashboard avanzado | 1. Verificar gráfico | Barras horizontales: Cartera días, Inventario días, Proveedores días, Plazo máx. días. | P2 | Not Run |
| M5-TC-014 | Gráfico "Top 10 Clientes por Cupo" | Dashboard avanzado | 1. Verificar gráfico | Barras horizontales con nombre de cliente y total crédito. | P1 | Not Run |
| M5-TC-015 | Gráficos restantes avanzados | Dashboard avanzado | 1. Verificar: Ingresos vs Utilidad Neta, Estructura Endeudamiento, Estudios por Analista, Clientes por Actividad Económica | Todos los gráficos renderizan correctamente con datos y leyendas. Formato moneda compacto (B, M, K) donde aplique. | P2 | Not Run |
| M5-TC-016 | Formato moneda compacto | Dashboard avanzado con valores altos | 1. Verificar formateo en KPIs y ejes | $1,200,000,000 → "$1.2B", $1,500,000 → "$1.5M", $2,500 → "$2.5K", $123 → "$123". | P3 | Not Run |

---

## M6 - Administración

### Navegación por tabs

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-001 | Tabs visibles según rol - Administrador | Rol = Administrador | 1. Navegar a `/app/administracion` | Muestra 3 tabs: Perfil, Empresa, Plan y Facturación. | P0 | Not Run |
| M6-TC-002 | Tabs visibles según rol - Auxiliar | Rol = Auxiliar | 1. Navegar a `/app/administracion` | Solo muestra tab: Perfil. Empresa y Plan y Facturación no visibles. | P0 | Not Run |
| M6-TC-003 | Navegación entre tabs | Rol Administrador | 1. Click tab "Perfil" → `/app/administracion/perfil` 2. Click tab "Empresa" → `/app/administracion/empresa` 3. Click tab "Plan y Facturación" → `/app/administracion/plan-facturacion` | Cada tab carga el componente correcto. URL actualizada. | P1 | Not Run |

### Perfil

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-004 | Ver perfil cargado | Perfil existente | 1. Navegar a `/app/administracion/perfil` | Muestra: email (disabled), nombre, apellido, teléfono, cargo, rol (disabled). Avatar con iniciales. | P0 | Not Run |
| M6-TC-005 | Actualizar perfil exitosamente | Perfil existente | 1. Modificar nombre o apellido 2. Click "Actualizar" | Notificación: "Perfil Actualizado Correctamente". Datos recargados. | P0 | Not Run |
| M6-TC-006 | Validación campos requeridos perfil | Tab perfil | 1. Borrar nombre (campo requerido) 2. Intentar guardar | Muestra: "Este campo es obligatorio" en nombre y/o apellido. | P1 | Not Run |
| M6-TC-007 | Email y rol no editables | Tab perfil | 1. Verificar campos email y rol | Ambos campos disabled (no editables por el usuario). | P1 | Not Run |
| M6-TC-008 | Teléfono y cargo opcionales | Tab perfil | 1. Dejar teléfono y cargo vacíos 2. Guardar | Perfil se actualiza sin error. | P2 | Not Run |

### Empresa

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-009 | Ver datos de empresa | Empresa existente, rol Admin | 1. Navegar a tab "Empresa" | Muestra: nombre (editable), NIT (disabled), departamento (disabled), ciudad (disabled), sector (editable), cuenta bancaria (tipo, banco, número), estado activo (disabled), fecha creación (disabled). | P0 | Not Run |
| M6-TC-010 | Actualizar empresa exitosamente | Tab empresa | 1. Modificar nombre o sector 2. Guardar | Empresa actualizada. Notificación de éxito. | P0 | Not Run |
| M6-TC-011 | Validación nombre empresa requerido | Tab empresa | 1. Borrar nombre de empresa 2. Guardar | Muestra: "Este campo es obligatorio". | P1 | Not Run |
| M6-TC-012 | Campos de cuenta bancaria opcionales | Tab empresa | 1. Completar/borrar tipo cuenta, banco, número de cuenta 2. Guardar | Se guardan correctamente. Número de cuenta máximo 50 caracteres. | P1 | Not Run |

### Logo de empresa

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-013 | Subir logo exitosamente | Tab empresa | 1. Seleccionar imagen PNG/JPG/WebP (≤2MB) | Logo subido y mostrado. URL firmada generada. | P1 | Not Run |
| M6-TC-014 | Error logo mayor a 2MB | Tab empresa | 1. Seleccionar imagen >2MB | Error: "El logo no puede superar los 2 MB". | P1 | Not Run |

### Uso de suscripción

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-015 | Ver consumo de recursos | Tab empresa, suscripción activa | 1. Verificar sección de uso | Muestra 5 tarjetas con barras de progreso: Usuarios (usado/máx), Clientes, Estudios este mes, Análisis IA este mes, Extracciones PDF este mes. "ilimitado" si max = null. | P0 | Not Run |
| M6-TC-016 | Colores de barra de progreso según uso | Tab empresa | 1. Verificar colores | Verde < 70%, Amarillo 70-89%, Rojo ≥ 90%. | P2 | Not Run |
| M6-TC-017 | Ver features del plan | Tab empresa | 1. Verificar features | Muestra: dashboard level, support level, reportes Excel, notificaciones email, personalización tema. | P2 | Not Run |

### Sistema de invitaciones

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-018 | Invitar usuario exitosamente | Tab empresa, rol Admin | 1. Click "Invitar usuario" 2. Ingresar email válido 3. Confirmar | Invitación creada. Aparece en tabla de invitados con estado "Pendiente". | P0 | Not Run |
| M6-TC-019 | Validación email en invitación | Diálogo de invitación | 1. Ingresar email inválido | Muestra: "Ingresa un correo válido". | P1 | Not Run |
| M6-TC-020 | Validación email vacío en invitación | Diálogo de invitación | 1. Dejar email vacío | Muestra: "Este campo es obligatorio". | P1 | Not Run |
| M6-TC-021 | Tabla de invitaciones | Tab empresa | 1. Verificar tabla | Columnas: Email, Empresa, Invitado por, Estado (badge), Fecha. Severity: Pendiente=warn, Aceptada=success, Rechazada=danger, Cancelada=danger. | P1 | Not Run |
| M6-TC-022 | Reenviar invitación rechazada | Invitación con estado "Rechazada" | 1. Click icono reenviar (pi-replay) | Invitación reenviada. | P1 | Not Run |
| M6-TC-023 | Desactivar usuario aceptado | Invitación con estado "Aceptada" | 1. Click icono desactivar (pi-ban) 2. Confirmar en diálogo | Usuario desactivado. Estado cambia. | P1 | Not Run |
| M6-TC-024 | Reactivar usuario cancelado | Invitación con estado "Cancelado" | 1. Click icono activar (pi-check-circle) 2. Confirmar | Usuario reactivado. Estado cambia. | P1 | Not Run |
| M6-TC-025 | Acciones condicionales en invitaciones | Diferentes estados de invitación | 1. Verificar visibilidad de botones por estado | Reenviar: solo si "Rechazada". Desactivar: solo si "Aceptada". Activar: solo si "Cancelado". | P2 | Not Run |

### Plan y Facturación

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| M6-TC-026 | Ver planes disponibles | Tab Plan y Facturación | 1. Navegar al tab | Muestra planes con badge "Plan actual" en el plan activo. Botón deshabilitado en plan actual. | P1 | Not Run |
| M6-TC-027 | Botón "Cambiar a este plan" en otros planes | Tab Plan y Facturación | 1. Verificar planes no actuales | Botón "Cambiar a este plan" habilitado en planes diferentes al actual. | P2 | Not Run |
| M6-TC-028 | Badge "Plan actual" correcto | Tab Plan y Facturación | 1. Verificar badge | Solo el plan activo muestra badge "Plan actual" y botón deshabilitado. | P2 | Not Run |

---

## T - Pruebas Transversales

### Guards de navegación

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-001 | authGuard redirige a login sin sesión | No autenticado | 1. Intentar acceder a `/app` | Redirige a `/auth/iniciar-sesion?returnUrl=/app`. | P0 | Not Run |
| T-TC-002 | authGuard permite acceso con sesión | Autenticado | 1. Acceder a `/app` | Carga perfil si no está cargado. Permite acceso. | P0 | Not Run |
| T-TC-003 | noAuthGuard redirige a app si autenticado | Autenticado | 1. Intentar acceder a `/auth/iniciar-sesion` | Redirige a `/app`. | P0 | Not Run |
| T-TC-004 | noAuthGuard permite acceso sin sesión | No autenticado | 1. Acceder a `/auth/iniciar-sesion` | Permite acceso a la página de login. | P0 | Not Run |
| T-TC-005 | subscriptionGuard sin suscripción activa | Autenticado, sin suscripción | 1. Intentar acceder a `/app` | Redirige a `/suscripcion/registro`. | P0 | Not Run |
| T-TC-006 | subscriptionGuard - auxiliar en empresa inactiva | Rol auxiliar, empresa inactiva | 1. Intentar acceder a `/app` | Redirige a página de bloqueo. | P0 | Not Run |
| T-TC-007 | returnUrl se preserva tras login | No autenticado | 1. Ir a `/app/clientes` → redirigido a login con `?returnUrl=/app/clientes` 2. Login exitoso | Redirige a `/app/clientes` (no a `/app`). | P1 | Not Run |

### Interceptores

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-008 | Auth interceptor agrega token Bearer | Autenticado, request a API | 1. Realizar cualquier llamada API | Header `Authorization: Bearer {token}` presente en request. | P0 | Not Run |
| T-TC-009 | Auth interceptor omite Supabase URLs | Cualquier request a Supabase | 1. Request a supabaseUrl | No agrega header Authorization. | P1 | Not Run |
| T-TC-010 | Auth interceptor refresh en 401 | Token expirado | 1. Request retorna 401 | Intenta refresh de sesión. Si exitoso: reintenta request con nuevo token. Si falla: sign out + redirige a login. | P0 | Not Run |
| T-TC-011 | Error interceptor - error de red (status 0) | Autenticado, API caída | 1. API retorna status 0 (network error) | Redirige a `/servicio-no-disponible`. | P1 | Not Run |
| T-TC-012 | Error interceptor - mensajes por código | Diferentes errores HTTP | 1. Provocar errores 400, 403, 404, 409, 422, 500, 503 | Notificaciones con mensajes correctos: "Solicitud incorrecta", "Acceso denegado", "Recurso no encontrado", "Conflicto con el estado actual", "Datos no procesables", "Error interno del servidor", "Servicio no disponible". | P1 | Not Run |
| T-TC-013 | Error interceptor usa mensaje del backend | Error con message custom | 1. Backend retorna error con message personalizado | Notificación muestra el mensaje del backend (no el default). | P1 | Not Run |
| T-TC-014 | Error inesperado muestra mensaje genérico | Error con código no mapeado | 1. Error con status code no mapeado | Muestra: "Ocurrió un error inesperado". | P2 | Not Run |

### Páginas de error

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-015 | Página 404 - Not Found | Ninguna | 1. Navegar a URL inexistente (ej: `/ruta-random`) | Muestra: "PÁGINA NO ENCONTRADA", "Parece que estás perdido...", botón "Ir al Dashboard" → `/app`. | P1 | Not Run |
| T-TC-016 | Página servicio no disponible | Error de red | 1. Navegar a `/servicio-no-disponible` | Muestra icono pi-server rojo, "Servicio No Disponible", botón "Reintentar" recarga `/app`. | P1 | Not Run |

### Landing page

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-017 | Landing page carga completa | Ninguna | 1. Navegar a `/` | Muestra todas las secciones: Header, Hero, Stats, Features, Security, Testimonials, Pricing, FAQ, Join, Footer. | P1 | Not Run |
| T-TC-018 | Landing - usuario bloqueado ve diálogo | Autenticado, `?blocked=true` | 1. Navegar a `/?blocked=true` | Diálogo: "Tus permisos han sido revocados" con icono pi-lock rojo. Auto sign-out. Botón "Entendido". | P1 | Not Run |

### Páginas legales

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-019 | Página de privacidad accesible sin auth | Ninguna | 1. Navegar a ruta de privacidad | Página carga sin requerir autenticación. | P2 | Not Run |
| T-TC-020 | Página de términos accesible sin auth | Ninguna | 1. Navegar a ruta de términos | Página carga sin requerir autenticación. | P2 | Not Run |

### Componentes compartidos

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-021 | Notificaciones Toast | Cualquier acción que genera notificación | 1. Verificar notificaciones tipo: success (verde, "Éxito"), error (rojo, "Error"), info (azul, "Información"), warn (amarillo, "Advertencia") | Toast aparece con título y detalle correctos. Se puede cerrar. | P1 | Not Run |
| T-TC-022 | PhoneInput con código de país | Formulario con phone-input | 1. Verificar componente de teléfono | Muestra prefijo "+57" en addon. FloatLabel funciona. Acepta solo formato teléfono. | P2 | Not Run |

### UI general

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Prioridad | Estado |
|----|---------------|----------------|-------|-------------------|-----------|--------|
| T-TC-023 | Dark mode toggle | Cualquier página | 1. Activar dark mode desde configurador | Toda la UI cambia a tema oscuro. Gráficos, tablas y formularios se adaptan. | P3 | Not Run |
| T-TC-024 | Sidebar colapsado/expandido | Layout principal | 1. Colapsar sidebar 2. Expandir sidebar | Sidebar se colapsa y expande correctamente. Contenido se ajusta. | P3 | Not Run |
