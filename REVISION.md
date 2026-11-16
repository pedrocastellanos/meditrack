# Revisión del proyecto MediTrack

Revisión de código del repositorio `meditrack` (monorepo pnpm: Express 5 + Prisma + SQLite en `backend/`, React 19 + Vite + Zustand en `frontend/`). Todo lo que aparece aquí se ha comprobado leyendo el código (referencias `archivo:línea`). Las rutas son relativas a `meditrack/`.

Notas sobre el método:

- No se han instalado dependencias (no hay `node_modules`), así que **no se han ejecutado `tsc`, los tests ni `pnpm audit`**. Los fallos de la sección 3 se deducen del código. Dos de ellos (3.1 y 3.6) se han reproducido con scripts mínimos de Node, fuera del repo.
- Prioridades: **P1** = hacerlo antes de entregar o usar con datos reales; **P2** = siguiente iteración; **P3** = deseable.

---

## 0. Resumen

**Qué hace.** MediTrack controla el inventario de una farmacia pequeña. Ofrece catálogo de medicamentos (CRUD), movimientos de entrada y salida con historial, alertas (stock bajo, agotados, vencidos, próximos a vencer), un dashboard con indicadores financieros y exportación a CSV. El README delimita bien el alcance: no cubre ventas, proveedores ni pacientes.

**Stack.** React 19 + TypeScript + Vite + Tailwind 4 + Zustand + React Hook Form/Zod en el frontend. Express 5 + Zod + Prisma 6 + SQLite en el backend. Vitest en el frontend. Dockerfile y nginx solo para el frontend.

**Valoración general.** Buen proyecto académico: el dominio está acotado, el README es honesto (incluso lista sus propios límites de seguridad) y la migración de `localStorage` a una API real se hizo con criterio. Pero **no está listo para uso real**: no hay autenticación y hay varios bugs de integridad de datos (3.1 a 3.5). El backend no tiene ningún test y las reglas de negocio están duplicadas, y a veces contradichas, entre cliente y servidor.

**Puntos fuertes**

- El movimiento de stock es atómico: `prisma.$transaction` con comprobación de saldo en el servidor y respuesta 422 (`backend/src/routes/medicamentos.ts:68-80`).
- Zod valida el cuerpo y los parámetros en la API, y el esquema elimina campos desconocidos, así que no hay *mass assignment* sobre `id` ni `fechaRegistro` (`medicamentos.ts:8-16`). Prisma parametriza todas las consultas: no hay `$queryRaw` en el repo.
- Express 5 propaga los errores de handlers `async` al `errorHandler` central, que no filtra trazas al cliente (`backend/src/middleware/errors.ts`).
- Frontend limpio: store con actualización solo tras éxito del servidor, estados de carga/error con "Reintentar" en la carga inicial, Dashboard y Alertas (`App.tsx:42-46`, `Dashboard.tsx:17`), lazy loading de rutas, modo oscuro persistente, filtros combinables y confirmación antes de borrar.
- Documentación: README con problema, arquitectura, decisiones, retos y límites de seguridad. Migración Prisma versionada y seed reproducible.

---

## 1. Usabilidad

### 1.1 Flujos y validaciones de formularios

| # | Hallazgo | Dónde | Efecto | Recomendación |
|---|---|---|---|---|
| U1 | El formulario exige `stockMinimo <= stock` y fecha de vencimiento futura **también al editar**. | `components/medicamentos/MedicamentoForm.tsx:33,36` | No se puede editar un medicamento ya en "stock bajo" o ya vencido, justo los casos que más importan. Con el seed, "Paracetamol" (stock 5, mínimo 10) no se puede guardar sin cambiar el stock. Los valores por defecto del alta (stock 0, mínimo 5, líneas 82-83) ya hacen el formulario inválido. | Aplicar esas reglas solo en el alta, o quitar la de `stockMinimo <= stock`: tener stock por debajo del mínimo es un estado de negocio válido. |
| U2 | El botón Guardar se deshabilita con `disabled={!isValid}` sin explicar por qué. | `MedicamentoForm.tsx:237` | Con `mode:'onChange'` (`hooks/useForm.ts`) solo muestran error los campos que se han tocado. Un campo vacío sin tocar (por ejemplo "Categoría") deja el botón gris sin pista. | Dejar el botón activo, validar al enviar y enfocar el primer error. Añadir un resumen de errores. |
| U3 | Precio mínimo 1: `z.number().min(1,'Debe ser mayor a 0')`. | `MedicamentoForm.tsx:15-16` | Rechaza precios como 0,50, que el backend sí acepta (`medicamentos.ts:11-12`). El mensaje dice ">0" pero la regla es ">=1". | Usar `.positive()` o `.min(0.01)`. |
| U4 | Los criterios del cliente y del servidor no coinciden: nombre mín. 3 y lote mín. 4 en el cliente (`MedicamentoForm.tsx:10,20`), mín. 1 en el servidor (`medicamentos.ts:9,14`). El servidor no exige precio venta > compra ni fecha válida. | | Dos fuentes de verdad. Un cliente distinto de la SPA salta las reglas. | Un esquema Zod compartido (paquete `shared/` del workspace) y reglas de negocio en el servidor. |
| U5 | "Stock Inicial" en el formulario de **edición** cambia el stock real sin movimiento (ver 3.2). | `MedicamentoForm.tsx:197` | Confunde la edición con el ajuste de inventario. | Ocultar o deshabilitar `stock` en edición y llevar al usuario a "Registrar movimiento". |
| U6 | El campo cantidad fuerza `parseInt(...) \|\| 1`. | `components/movimientos/FormMovimiento.tsx:85` | No se puede borrar el campo para teclear otro número: al vaciarlo salta a 1. | Guardar el texto crudo y validar al enviar. |
| U7 | No hay protección contra doble envío ni estado "guardando…". Ni `isSubmitting` (RHF) ni un `disabled` durante el `await`. | `MedicamentoForm.tsx:105-120`, `FormMovimiento.tsx:22-42` | Un doble clic o doble Enter en "Registrar salida" crea **dos movimientos** reales. | Deshabilitar el botón y mostrar spinner mientras la petición está en curso. |
| U8 | Los movimientos solo ofrecen motivos de una lista fija y no admiten comentario libre ni lote. | `FormMovimiento.tsx:90-100` | "Ajuste de inventario" no permite ajustar a una cantidad absoluta ni explicar la diferencia. | Campo opcional "Observación". Ajuste por conteo físico (ver sección 2). |

### 1.2 Mensajes de error, carga y estados vacíos

| # | Hallazgo | Dónde | Recomendación |
|---|---|---|---|
| U9 | El toast de éxito al crear o editar **nunca se ve**: `notificar(...)` vive en el hook del formulario y justo después `onSubmitSuccess` navega (se desmonta el formulario). | `MedicamentoForm.tsx:113-119`, `pages/NuevoMedicamento.tsx`, `pages/EditarMedicamento.tsx` | Mover las notificaciones a un contexto o store global montado en `App`, y quitar los `ToastContainer` repetidos por página. |
| U10 | Al eliminar con éxito se muestra un toast de tipo `'error'` (rojo). | `pages/Inventario.tsx:75` | Usar un tipo neutro o de éxito. |
| U11 | Los errores 400 de validación del servidor muestran solo "Datos inválidos". El servidor envía `details`, pero el cliente solo lee `body.error`. | `utils/api.ts:17-18`, `middleware/errors.ts:10` | Mapear `details` (ruta y mensaje) a errores de campo con `setError` de RHF. |
| U12 | El estado de error de la carga inicial sustituye **todas** las rutas, también Dashboard y Alertas, que no dependen del store. Con `cargando` se desmonta toda la app. | `App.tsx:42-46` | Aislar el error por vista. |
| U13 | `EmptyState` muestra el texto "Ir a registrar" pero **sin acción** si no hay filtros: `accion && onAccion` y `onAccion` es `undefined`, por lo que el botón no se pinta. Con inventario vacío no hay llamada a la acción. | `Inventario.tsx:233-234`, `components/ui/EmptyState.tsx:19` | Pasar `onAccion={() => navigate('/inventario/nuevo')}` o un `Link`. |
| U14 | Filtro de precio: un texto inválido en "Mín" (por ejemplo `abc`) hace `precioMin = Infinity` y **vacía el listado** sin avisar. Además `inputMode="numeric"` impide teclear decimales en móvil. | `Inventario.tsx:25-35,177,188` | Validar el campo (borde rojo) y usar `inputMode="decimal"`. El hook `useFilter` ya tiene `precioMin/precioMax` (`useFilter.ts:11,85`), pero la página los duplica con estado propio. Consolidar. |
| U15 | El historial de movimientos sale en orden **incoherente**. El servidor devuelve `fecha desc` (`medicamentos.ts:17`) y `HistorialMovimientos` hace `.reverse()` (línea 30), así que al cargar queda cronológico ascendente. El store añade el nuevo movimiento **al final** (`store/medicamentosStore.ts:50`), y tras `.reverse()` queda el primero. | `HistorialMovimientos.tsx:30` | Resultado: lista ascendente más el último movimiento arriba. Ordenar por `fecha` explícitamente en un solo sitio. El test `components.test.tsx:20-25` dice "orden inverso" pero solo comprueba que hay 4 filas. |
| U16 | Fechas: `formatDate` hace `new Date('YYYY-MM-DD')`, que se interpreta en UTC. | `utils/formatters.ts:4-5` | En zonas UTC-5 (Cuba, Colombia…) la fecha se muestra **un día antes** (comprobado: `2026-12-01` se muestra como `30/11/2026` con `TZ=America/Havana`). Parsear como fecha local (`new Date(y, m-1, d)`) o formatear la cadena sin `Date`. |
| U17 | La moneda es incoherente: `formatCurrency` usa `CUP` (`formatters.ts:2`), las etiquetas del formulario dicen `($)`, el filtro muestra `$`. | | Decidir una moneda y centralizarla. |

### 1.3 Accesibilidad

| # | Hallazgo | Dónde | Recomendación |
|---|---|---|---|
| A1 | Casi todas las `<label>` no están asociadas a su control (sin `htmlFor`/`id`). Solo "Requiere receta" lo está. Los errores no se enlazan con `aria-describedby` ni `aria-invalid`. | `MedicamentoForm.tsx:140-215`, `FormMovimiento.tsx:80,91` | Asociar cada label, `aria-invalid` y `aria-describedby`. |
| A2 | Los filtros y el buscador de Inventario no tienen etiqueta (solo `placeholder` o texto del primer `<option>`). Los botones de ordenación no indican estado (`aria-sort`). | `Inventario.tsx:138-192,209-223` | `aria-label` en cada control. |
| A3 | `Modal` sin `role="dialog"`, `aria-modal`, `aria-labelledby`, cierre con Esc ni gestión de foco. El botón "×" no tiene nombre accesible. | `components/ui/Modal.tsx:14-21` | Usar `<dialog>` o una librería (Radix/Headless UI). `aria-label="Cerrar"`. |
| A4 | Los toasts no usan `role="status"`/`aria-live`. El botón "×" no tiene nombre accesible. | `components/notificaciones/ToastContainer.tsx:25` | Región `aria-live="polite"`. |
| A5 | Dos `<h1>` en la página de detalle: `PageContainer title=""` pinta un `<h1>` vacío y la página añade otro. | `App.tsx:101`, `PageContainer.tsx:13`, `DetalleMedicamento.tsx:41` | No renderizar el `<h1>` si no hay `title`. |
| A6 | `MedicamentoCard` baja la opacidad al 60% en productos vencidos, lo que puede reducir el contraste del texto por debajo de WCAG AA. | `MedicamentoCard.tsx:20` | Marcar con borde o icono en vez de opacidad. |
| A7 | Las fuentes se cargan de Google Fonts (`index.html:9-11`). | | Si la farmacia trabaja sin Internet, hay fallback y un parpadeo. Autoalojarlas (`@fontsource`). |

### 1.4 Responsive y rendimiento percibido

- En general bien resuelto: grids `sm/md/lg/xl`, navegación móvil secundaria (`Navbar.tsx`), tablas con `overflow-x-auto` (`HistorialMovimientos.tsx`).
- La barra de ordenación (`Inventario.tsx:208-224`) es una cuadrícula de 5 columnas con botones de texto pequeño y poco descubrible en móvil. Un `<select>` de ordenación sería más claro.
- La lista no está paginada ni virtualizada: se pintan todas las tarjetas y el backend devuelve **todos los medicamentos con todo su historial** (`medicamentos.ts:22-32`). Bien para decenas de productos, no para miles de movimientos.

---

## 2. Expansión de funcionalidades

El modelo actual (un medicamento = un lote = una fecha de vencimiento: `schema.prisma:16,18`) es la mayor limitación del dominio. Casi todo lo valioso depende de arreglar eso.

| Prio | Funcionalidad | Por qué | Esbozo técnico |
|---|---|---|---|
| **P1** | **Lotes por medicamento** | En una farmacia el mismo producto llega con varios lotes y fechas. Hoy "entrada" suma al único `stock` y la fecha de vencimiento no refleja el lote más antiguo, así que las alertas de vencimiento son poco fiables. | Tabla `Lote` (medicamentoId, código, fechaVencimiento, cantidad). El movimiento referencia un lote. Las salidas consumen por **FEFO** (primero el que vence antes). El `stock` pasa a ser la suma de los lotes. |
| **P1** | **Autenticación y roles** (admin / dependiente) | Es la brecha de seguridad principal (sección 4). Habilita la auditoría. | Login con JWT en cookie `httpOnly`, o sesión. Roles: solo admin borra o edita precios. `usuarioId` en `Movimiento`. |
| **P1** | **Ajuste por conteo físico** | La causa real de las diferencias es el recuento. Hoy solo hay entradas o salidas con "Ajuste de inventario". | Pantalla de conteo que calcula la diferencia y genera el movimiento de ajuste con observación. |
| **P1** | **Registro de la existencia inicial como movimiento** | El historial no cuadra (ver 3.3). | Crear el movimiento "Stock inicial" al dar de alta. |
| **P2** | Búsqueda, filtros, orden y **paginación en el servidor** | Hoy se carga todo el inventario y se filtra en el cliente. El `GET ?search&categoria` del backend ya existe, pero el frontend no lo usa (`utils/api.ts:25`). | `GET /medicamentos?search&categoria&estado&page&pageSize&sort`. Mantener el historial en un endpoint aparte (`/medicamentos/:id/movimientos`). |
| **P2** | **Proveedores y órdenes de compra** | La alerta de stock bajo debería llevar a "reponer". | Entidades `Proveedor` y `OrdenCompra`. Sugerir cantidad = mínimo × 2 − stock. Botón "Crear pedido" desde Alertas. |
| **P2** | **Ventas** (aunque sea un POS mínimo) y reporte de rotación | Sin ventas no hay rotación ni margen real. Hoy "Venta" es solo un motivo de salida. | Venta con líneas que genera varios movimientos en una transacción. Reportes: más y menos vendidos, medicamentos de baja rotación. |
| **P2** | Alertas configurables y notificaciones | El umbral de 30 días está fijo (`dashboard.ts:14,23`). | Parámetro por categoría. Resumen diario por correo. Insignia con el número de alertas en la barra de navegación. |
| **P2** | Importación masiva desde CSV/Excel | La carga inicial manual no escala. Ya existe exportación. | Subida con vista previa y errores por fila. |
| **P2** | Historial global de movimientos y auditoría | Hoy el historial solo se ve por producto. | Pantalla `/movimientos` con filtros por fecha, tipo, motivo y usuario. Exportable. |
| **P3** | Código de barras / escáner (EAN, cámara del móvil) | Agiliza las entradas y salidas. | `BarcodeDetector` o `@zxing/browser`. Campo `codigoBarras` único. |
| **P3** | Sugerencias de reposición con previsión simple | Aprovecha el historial de salidas. | Media móvil de las salidas de 30 días. |
| **P3** | Soft delete / archivado de medicamentos | Borrar elimina el historial en cascada (3.7). | Campo `archivadoEn`. |
| **P3** | Multi-sucursal, PWA offline | Ya lo anticipa el README (migrar a PostgreSQL). | Después de tener usuarios y lotes. |
| **P3** | Reportes imprimibles / PDF (vencimientos del mes, valoración) | Útil para inspecciones. | Vista de impresión CSS o `pdf-lib`. |

---

## 3. Errores y mejoras de arquitectura

### 3.1 Errores concretos

| # | Gravedad | Archivo:línea | Qué pasa | Efecto | Recomendación |
|---|---|---|---|---|---|
| 3.1 | Alta | `backend/src/routes/medicamentos.ts:15,52-55` | En `PUT`, `medicamentoData.partial()` conserva los `.default('')` de `ubicacion` y `notas`. **Comprobado con Zod 4.6.7**: `partial().parse({nombre:'x'})` devuelve `{nombre:'x', ubicacion:'', notas:''}`, y `parse({})` devuelve `{ubicacion:'', notas:''}`. Además la comprobación de "al menos un campo" (línea 55) **nunca se cumple**. | Cualquier `PUT` parcial (la API se documenta como "Actualización parcial") **borra ubicación y notas**. Un `PUT {}` también las borra y responde 200. La SPA no lo sufre porque envía el formulario completo. | Definir un esquema base sin `default` y derivar de él `create` (con defaults) y `update` (`.partial()`). |
| 3.2 | Alta | `medicamentos.ts:52-56`, `MedicamentoForm.tsx:105-112` | `PUT` acepta `stock` directamente y el formulario de edición lo envía siempre, con el valor que tenía al abrir la pantalla. | (a) El stock cambia **sin movimiento ni historial**. (b) *Lost update*: si entre la carga y el guardado otro usuario o pestaña registra un movimiento, el guardado devuelve el stock viejo y lo pisa. | Excluir `stock` del `PUT` (solo cambia por movimientos). Si se admite, versionado optimista (`updatedAt`/`version` en el `where`). |
| 3.3 | Alta | `medicamentos.ts:43-50` | El alta guarda `stock` pero no crea el movimiento inicial. | El historial no cuadra con el stock. El primer movimiento posterior tiene `stockResultante` sin una "entrada inicial" que lo explique. | Crear el `Movimiento` de entrada en la misma transacción. |
| 3.4 | Media | `middleware/errors.ts:8-26` | `errorHandler` no trata los errores de `body-parser` (`status` 400 o 413). | Un JSON mal formado o un cuerpo >1 MB (`app.ts:9`) llegan hasta la línea 25-26 y responden **500** `Error interno` y se loguean como fallo propio. Debería ser 400/413. | Respetar `error.status` (4xx) y `error.type === 'entity.parse.failed'`. |
| 3.5 | Media | `utils/validators.ts:17-19` vs `backend/src/routes/dashboard.ts:5,13-14` | El cliente calcula el vencimiento con `new Date('YYYY-MM-DD')` (UTC) y `venc < hoy`. El servidor usa `daysUntil` con hora local. | Un medicamento que vence **hoy** es "vencido" en la tarjeta y el filtro (comprobado) pero "próximo a vencer" en Alertas y Dashboard (`daysUntil = 0`). Los contadores no coinciden con lo que se ve. | Una sola definición, en el servidor (devolver `estadoVencimiento` y `diasParaVencer`), o `date-fns` comparando fechas locales sin hora. |
| 3.6 | Media | `utils/formatters.ts:4-5` | Parseo de fecha en UTC (ver U16). | Fechas desplazadas un día en UTC-5. | Parsear fechas ISO sin hora como locales. |
| 3.7 | Media | `medicamentos.ts:59-63`, `schema.prisma:39` | `DELETE` elimina el medicamento y su historial en cascada. | Se pierde la trazabilidad, que es la promesa del README. Un clic en "Eliminar" sin auth es irreversible. | Soft delete (`archivadoEn`) y `onDelete: Restrict`. |
| 3.8 | Media | `medicamentos.ts:13` | `fechaVencimiento: z.string().min(1)`: acepta cualquier texto. | Con `"hola"`, `daysUntil` da `NaN` y el medicamento **desaparece silenciosamente** de las alertas (`NaN < 0` y `NaN >= 0` son falsos). | `z.iso.date()` (Zod 4) o `regex(/^\d{4}-\d{2}-\d{2}$/)` más validación de fecha real. |
| 3.9 | Media | `medicamentos.ts:11-16,67` | Sin límites máximos: `precioCompra`, `stock`, `cantidad` y `notas` no tienen `.max()`. No se exige `precioVenta >= precioCompra` ni que `motivo` pertenezca a la lista del cliente. | Cantidades absurdas, textos enormes (hasta 1 MB) y precios con pérdida. Sin tope, un `stock` enorme puede superar el `Int` de 32 bits de Prisma (no probado). | `.max()` en todos los campos y `.refine` de negocio en el servidor. `z.enum` para los motivos. |
| 3.10 | Baja | `schema.prisma:11` y `MedicamentoForm.tsx:38-43` | `nombre @unique` es sensible a mayúsculas en SQLite. El cliente compara en minúsculas. | `Paracetamol` y `paracetamol` coexisten por API. El mismo nombre de producto con distinto laboratorio o presentación está prohibido. | Unicidad por (nombre, presentación, laboratorio) y normalización. |
| 3.11 | Baja | `utils/escaparCsV.ts:7` y `pages/Inventario.tsx:110` | El CSV se une con `;`, pero `escaparCSV` solo entrecomilla si hay `,`, `"` o `\n`. | Un nombre, lote o ubicación con `;` **rompe las columnas** del CSV. Tampoco se contempla `\r`. | Entrecomillar si contiene el separador o `\r`. Ver 4.5 (inyección de fórmulas). |
| 3.12 | Baja | `components/movimientos/FormMovimiento.tsx:20-25,29` | La validación de salida usa `stockActual` del store, que puede estar desactualizado. | El servidor lo corrige con 422, así que el mensaje correcto llega, pero tras otro cambio la UI sigue mostrando un stock viejo. | Tras 422, recargar el medicamento (`GET /medicamentos/:id`). |
| 3.13 | Baja | `hooks/useNotification.ts:21` | `id = notif-${Date.now()}` | Dos toasts en el mismo milisegundo comparten id y se borran juntos. | `crypto.randomUUID()`. |
| 3.14 | Baja | `utils/formatters.ts:13-14` y `data/types.ts:165-175` | `generarId`, `generarIdMovimiento` y el `FilterState` duplicado (con `precioMin/Max`) son código muerto o duplicado. | Confusión y mantenimiento doble. | Eliminar. |

### 3.2 Mejoras de arquitectura

**Capas y estructura (backend).** Las rutas hacen todo: validar, aplicar reglas, consultar con Prisma y dar forma a la respuesta. `dashboard.ts` trae toda la tabla a memoria y filtra en JS; las listas de stock bajo, agotados, vencidos y próximos a vencer están **copiadas** en `/alertas` (líneas 11-14) y `/dashboard` (líneas 21-24), y el cliente tiene una tercera copia (`validators.ts`). Propuesta:

- `routes/` (HTTP) → `services/` (reglas: movimientos, alertas, estados) → `repositories` o Prisma directamente.
- Mover estados de stock y vencimiento a un módulo único del servidor y **devolverlos ya calculados** en el JSON.
- Pasar los agregados del dashboard a SQL (`groupBy`, `aggregate`) en vez de `findMany()` completo. Quitar el `include: {historialMovimientos: false}` (`dashboard.ts:9`), que no hace nada.

**Validación y contrato.** Esquemas Zod duplicados entre `frontend/` y `backend/` (U4), y tipos duplicados a mano (`data/types.ts`). Crear un paquete `shared/` en el workspace (esquemas + tipos inferidos), o generar tipos desde Prisma. `backend/prisma/seed.ts:3` importa datos desde `../../frontend/src/data/initialData.ts`: acoplamiento backend→frontend que habría que invertir moviendo los datos de demo a `backend/prisma/` o a `shared/`.

**Manejo de errores.** `errors.ts` detecta errores por *duck typing* (`error?.code === 'P2025'`, `error?.status === 422`, líneas 13-21), y las rutas los fabrican a mano con `Object.assign(new Error(...), { code: 'P2025' })` (`medicamentos.ts:70`) para simular un error de Prisma. Mejor una clase `AppError(status, mensaje, codigo)` y comprobar los de Prisma con `Prisma.PrismaClientKnownRequestError`. El mensaje del `P2002` (línea 17-18) asume que el único índice único es `nombre`. Devolver un cuerpo de error estable (`{codigo, mensaje, detalles}`).

**Modelo de datos y migraciones** (`schema.prisma`):

- Dinero en `Float` (líneas 15-16): errores de redondeo en sumas y márgenes. Guardar **céntimos como `Int`** (SQLite no soporta `Decimal` en Prisma).
- Fechas como `String` (`fechaVencimiento`, `fechaRegistro`, `Movimiento.fecha`). Para `fechaVencimiento` es defendible (fecha sin hora), pero `fechaRegistro` y `fecha` deberían ser `DateTime` (ya hay `createdAt`, redundante con `fechaRegistro`). `tipo` y `categoria` son `String` libres en la base de datos: añadir `CHECK` o tablas de catálogo (`Categoria`).
- Faltan índices en `categoria`, `fechaVencimiento` y `(stock, stockMinimo)` para alertas y filtros.
- Una sola migración inicial (`migrations/20261110145537_initial_migration`). Falta `prisma migrate deploy` en los scripts (`backend/package.json:6-12`) para producción. El README manda `migrate dev --name init` aunque la migración ya existe (se aplica igual, pero el nombre induce a confusión). Conviene un script `db:deploy` (`prisma migrate deploy`) y documentar `db:generate` como paso previo al build.
- **El seed es destructivo**: `upsert` con `update` que ejecuta `historialMovimientos.deleteMany` y sobrescribe todos los campos de `med-001…` (`prisma/seed.ts:8-13`). Ejecutarlo contra una base con datos reales pisa stock e historial de esos ids. Bloquearlo con `NODE_ENV=production` o usar `create` solo si la tabla está vacía.

**Estado del frontend.**

- El store guarda un único `error` que solo la carga inicial usa (`medicamentosStore.ts:45,64`). Las mutaciones lanzan excepciones que cada componente captura por su cuenta (correcto, pero repetido). Un hook `useMutation` común o TanStack Query resolvería caché, reintentos, `isPending` e invalidación (el store y las páginas Dashboard/Alertas cargan datos del mismo origen por caminos distintos).
- Dashboard y Alertas hacen `fetch` directo con `useEffect` y `useState` (`Dashboard.tsx:12-15`, `Alertas.tsx:13`), sin cancelación (`AbortController`) ni vínculo con el store. Tras registrar un movimiento, esos datos solo se refrescan al volver a montar la página.
- `utils/api.ts` no tiene timeout ni `AbortController` (línea 8) y no prevé 401 ni 403 para cuando llegue la autenticación.
- `useFilter` mantiene `precioMin/Max` que nadie usa, y la página repite esa lógica (U14). Eliminar la duplicación.
- Tres notificaciones, tres `ToastContainer` (U9): crear un `NotificationProvider`.

**Tests.**

- Backend: **cero tests**. `pnpm test` solo ejecuta el frontend (`package.json:9`), así que el CI futuro no detectaría una regresión en la lógica de movimientos. Prioridad: Vitest + Supertest sobre `app` (ya se exporta sin `listen`, `app.ts:7`) con una base SQLite de prueba: salida mayor que el stock (422), alta duplicada (409), `PUT` parcial (bug 3.1), JSON mal formado (3.4), fecha inválida (3.8).
- Frontend (3 archivos, 333 líneas): bien para `useFilter`, `validators` y el store con la API simulada. Falta cubrir `MedicamentoForm` (validaciones y envío), `FormMovimiento`, `Inventario` (exportación CSV, filtros) y las páginas. Mejoras puntuales: `components.test.tsx:20-25` no comprueba el orden que promete su nombre (U15). `validators.test.ts:48-69` usa fecha UTC (`new Date('2025-06-01')`) y no cubre el caso "vence hoy" (3.5).
- No hay CI (sin `.github/workflows`), ni lint ni `tsc` del backend en el flujo. `pnpm test` en la raíz ignora el backend.

**Configuración y despliegue.**

- `frontend/Dockerfile`: no define `ARG VITE_API_URL` antes de `pnpm build` (línea 11), así que la imagen compila con el valor por defecto `http://localhost:3000/api` (`utils/api.ts:3`), que en producción apunta al navegador del usuario, no al servidor. `nginx.conf` no hace proxy a `/api`. Una opción: servir el frontend y proxificar `/api` al backend en el mismo origen, con `VITE_API_URL=/api`.
- No hay Dockerfile ni `docker-compose` para el backend.
- `frontend/pnpm-lock.yaml` duplica al lockfile del workspace (`pnpm-lock.yaml` en la raíz). Dos lockfiles pueden divergir. Construir la imagen desde la raíz con `pnpm --filter`.
- Versiones desalineadas entre paquetes: Zod `^4.1.12` (backend) vs `^4.4.3` (frontend), TypeScript `^5.9.3` vs `~6.0.2`. Unificar con `catalog:` de pnpm.
- `CORS_ORIGIN` se separa con `split(',')` sin `trim` (`app.ts:8`): `"a, b"` deja un origen con espacio. Un valor vacío genera `['']` y bloquea todo.
- `GET /api/health` no comprueba la base de datos.

---

## 4. Seguridad

| Sev. | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|
| 🔴 | **Sin autenticación ni autorización.** Cualquiera que alcance el puerto puede leer, crear, modificar y **borrar** todo el inventario, incluido el `DELETE` en cascada. El servidor escucha en **todas las interfaces** (`app.listen(port)` sin host), así que queda abierto a toda la red local. | `backend/src/app.ts:8-12`, `server.ts:6`, `medicamentos.ts:59-63`. El README lo reconoce (sección 10). | Login con sesión o JWT en cookie `httpOnly`+`SameSite`, middleware `requireAuth` y `requireRole('admin')` en `DELETE` y `PUT` de precios. Hasta entonces, `app.listen(port, '127.0.0.1')`. |
| 🟠 | **Sin rate limiting ni cabeceras de seguridad.** No hay `express-rate-limit` ni `helmet` en las dependencias, y `nginx.conf` tampoco añade CSP, `X-Frame-Options` ni `X-Content-Type-Options`. | `backend/package.json:15-21`, `frontend/nginx.conf` | `helmet()` y `express-rate-limit` (más estricto en login y escrituras). Cabeceras en nginx. |
| 🟠 | **Sin auditoría de usuario.** Los movimientos no registran quién los hizo, y se pueden borrar con el producto. | `schema.prisma:32-41` | `usuarioId` en `Movimiento` y borrado lógico. Requiere autenticación. |
| 🟠 | **Seed destructivo ejecutable contra producción**, sin guarda de entorno. Pisa stock e historial de los ids `med-001…`. | `prisma/seed.ts:8-13` | Comprobar `NODE_ENV` y/o tabla vacía. |
| 🟡 | **Inyección de fórmulas en CSV** (CSV injection). `escaparCSV` no neutraliza celdas que empiezan por `=`, `+`, `-`, `@`, tab o CR. Campos editables como `nombre`, `laboratorio`, `ubicacion` o `lote` se exportan tal cual (`Inventario.tsx:103-107`) y pueden ejecutar fórmulas al abrir el CSV en Excel. | `utils/escaparCsV.ts:2-9` | Prefijar con `'` esas celdas, o rechazar esos caracteres iniciales en el alta. |
| 🟡 | **Validación de entrada incompleta en el servidor**: sin `.max()`, fecha libre, sin reglas de negocio (3.8, 3.9). Con la API abierta, esto permite escribir basura masiva. | `medicamentos.ts:8-16,67` | Endurecer los esquemas y limitar el tamaño (`json({limit:'100kb'})` basta). |
| 🟡 | **CORS** correcto como control de navegador (lista blanca por `CORS_ORIGIN`, valor por defecto `localhost:5173`), pero no sustituye a la autenticación. Cuidado con `*` y con orígenes con espacios (`app.ts:8`). | `backend/.env.example:3` | Documentar que en producción se usa el mismo origen (proxy) o un dominio exacto con HTTPS. |
| 🟡 | **Errores expuestos.** El 400 de Zod devuelve `error.issues` completos (rutas y mensajes internos), útil en desarrollo pero verboso. Los 500 no filtran trazas (correcto: `errors.ts:25-26`). El 404 de ruta devuelve mensaje fijo. | `middleware/errors.ts:10` | Aceptable. Si se quiere minimizar, devolver solo `path` y `message`. |
| 🟡 | **Dependencias**: no se pudo ejecutar `pnpm audit` (sin `node_modules`). Rangos con caret en todo, y el Dockerfile fija `node:22-alpine` y `nginx:1.27-alpine`. Dos lockfiles (ver sección 3.2, Configuración y despliegue). | `backend/package.json`, `frontend/package.json`, `frontend/Dockerfile` | `pnpm audit` en CI, Dependabot/Renovate y un único lockfile. |
| 🟡 | **HTTPS y secretos.** La app no configura TLS (a delegar en un proxy inverso). `.env.example` solo contiene valores de muestra y `.env`/`*.db` están ignorados en `backend/.gitignore`; el `.gitignore` raíz no los cubre (si alguien crea `.env` en la raíz, se versionaría). | `backend/.gitignore`, `.gitignore` | Añadir `.env*` y `*.db` al `.gitignore` raíz. Cuando haya JWT, el secreto debe venir de variable de entorno y validarse al arrancar. |

**Lo que está bien en seguridad:** sin SQL concatenado (Prisma parametrizado; no hay `$queryRaw`), sin `dangerouslySetInnerHTML` (React escapa la salida: sin XSS por los campos de texto), sin secretos en el repo, límite de 1 MB en el body, `express.json` solo acepta `application/json` (los formularios cross-site no pueden hacer un `POST` simple), y el esquema de Zod impide manipular `id` o `fechaRegistro`.

---

## 5. Conclusión y próximos pasos

MediTrack tiene una base sólida y una documentación por encima de la media: el dominio está bien acotado, las transacciones de stock son correctas y el frontend es mantenible. Las debilidades son de **integridad de datos** (sobre todo el `PUT` y el stock editable), de **seguridad** (todo abierto) y de **calidad** (backend sin tests, reglas duplicadas y contradictorias). Ninguna es difícil de resolver.

**Orden recomendado**

1. **P1, bugs de datos (1 a 2 días).**
   - 3.1: corregir el esquema de `PUT` para que no borre `ubicacion` ni `notas`.
   - 3.2: sacar `stock` del `PUT` y del formulario de edición.
   - 3.3: crear el movimiento inicial al dar de alta.
   - 3.4: devolver 400/413 en vez de 500.
   - 3.8: validar `fechaVencimiento`.
   - 3.5 y 3.6: unificar el cálculo y el formato de fechas, comprobado con `TZ=America/Havana`.
2. **P1, formulario (medio día).** Quitar las reglas de `MedicamentoForm.tsx:33,36` en edición (U1), el precio mínimo 1 (U3), el doble envío (U7) y el toast perdido (U9).
3. **P1, seguridad básica (1 a 2 días).** Autenticación y roles mínimos, `helmet`, rate limit, `listen('127.0.0.1')` hasta tener login, y protección del seed.
4. **P1, tests del backend (1 día).** Vitest + Supertest para movimientos, alta, `PUT`, errores y validación. Añadir CI (`pnpm install`, `tsc`, tests del frontend y del backend, `pnpm audit`).
5. **P2, arquitectura.** Paquete `shared/` con esquemas y tipos, capa de servicios, estados de stock y vencimiento calculados solo en el servidor, dinero en céntimos, paginación y búsqueda en el servidor.
6. **P2, producto.** Lotes con FEFO, ajuste por conteo físico, historial global de movimientos, proveedores y órdenes de compra.
7. **P3.** Accesibilidad completa (A1 a A4), Dockerfile del backend y `docker-compose`, escáner de códigos de barras, previsiones.

**Para la próxima revisión.** Después de arreglar los P1, pasadnos un `pnpm install && pnpm test && pnpm build` limpio, con los tests del backend incluidos, y un `pnpm audit` sin avisos críticos.
