# MediTrack — Gestión de inventario de farmacia

MediTrack es una aplicación web para registrar y controlar el inventario de medicamentos de una farmacia. El proyecto busca que el personal pueda conocer con rapidez qué productos tiene, cuántas unidades quedan, cuáles necesitan reposición y cuáles están vencidos o próximos a vencer.

## 1. Problema que resuelve

En una farmacia pequeña, el inventario puede llevarse en hojas de cálculo, registros en papel o en la memoria del personal. Esto dificulta mantener datos consistentes y responder preguntas cotidianas: ¿qué productos están agotados?, ¿qué medicamentos deben retirarse por vencimiento?, ¿cuánto capital está inmovilizado en existencias?, ¿cómo cambió el stock y por qué?

La falta de una fuente central puede provocar reposiciones tardías o duplicadas, pérdidas por vencimiento y poca trazabilidad al corregir cantidades. MediTrack concentra el catálogo, los niveles de stock, las fechas de vencimiento y el historial de entradas y salidas; el dashboard resume las métricas necesarias para supervisar el inventario.

El alcance actual es el **control de inventario**. No gestiona recetas, pacientes, ventas, proveedores ni órdenes de compra, y no sustituye los controles profesionales o regulatorios aplicables a una farmacia.

## 2. Arquitectura

Se utiliza una arquitectura cliente-servidor con una SPA React que consume una API REST, y un backend modular desplegado como una sola aplicación (monolito modular):

```text
Navegador (React + TypeScript)
        │ HTTP/JSON (/api)
        ▼
API REST (Express + Zod)
        │ Prisma Client
        ▼
SQLite (archivo local)
```

El frontend presenta las vistas y gestiona el estado de interfaz. Express expone los recursos, valida las entradas, ejecuta las reglas de negocio y usa Prisma para acceder a SQLite. Los cambios que combinan actualización de stock y creación de movimiento se ejecutan en una transacción.

## 3. Por qué esta arquitectura es adecuada

- **Separación clara de responsabilidades:** presentación, reglas y persistencia pueden evolucionar sin mezclar el acceso a datos con los componentes visuales.
- **Adecuada para una SPA pequeña o mediana:** la API JSON permite mantener navegación y filtros ágiles en el cliente, a la vez que centraliza las mutaciones persistentes.
- **Prisma con TypeScript:** proporciona un esquema explícito, consultas tipadas y migraciones reproducibles.
- **SQLite:** evita administrar un servidor de base de datos para desarrollo y una instalación local de una farmacia. Para despliegues concurrentes o con múltiples sucursales, convendría migrar a una base servidor como PostgreSQL.
- **Monolito modular:** mantiene simple la operación y el despliegue en este alcance, sin la sobrecarga de microservicios.

## 4. Bloques del sistema

### Frontend

Ubicación: `frontend/`. React 19, TypeScript y Vite implementan dashboard, inventario, formularios, detalle del medicamento, historial y alertas. React Router gestiona las rutas. Zustand conserva el inventario cargado en memoria y se actualiza tras las respuestas exitosas de la API. `frontend/src/utils/api.ts` centraliza las peticiones HTTP; `VITE_API_URL` permite configurar su prefijo.

React Hook Form y Zod validan los formularios en el cliente para dar feedback inmediato. Los filtros avanzados, ordenamiento y exportación CSV se aplican en el frontend sobre el listado recibido.

### Backend

Ubicación: `backend/`. Express sirve la API bajo `/api`, Zod valida parámetros y cuerpos de las solicitudes, y Prisma conecta el dominio con SQLite. Las rutas se organizan en `src/routes/medicamentos.ts` y `src/routes/dashboard.ts`; el middleware centraliza respuestas de error. El seed de Prisma importa los datos demostrativos del frontend.

Endpoints principales:

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Comprobación de disponibilidad |
| GET | `/api/medicamentos` | Listado, búsqueda y filtro por categoría; incluye movimientos |
| GET | `/api/medicamentos/:id` | Detalle e historial |
| POST | `/api/medicamentos` | Alta |
| PUT | `/api/medicamentos/:id` | Actualización parcial |
| DELETE | `/api/medicamentos/:id` | Eliminación del medicamento y su historial relacionado |
| POST | `/api/medicamentos/:id/movimientos` | Entrada o salida de stock |
| GET | `/api/alertas` | Stock bajo, agotados, vencidos y próximos a vencer |
| GET | `/api/dashboard` | Indicadores generales, categorías y resumen financiero |

### Base de datos

SQLite almacena los medicamentos y movimientos en un archivo local administrado por Prisma. El esquema es `backend/prisma/schema.prisma`; las migraciones se generan y mantienen con Prisma CLI. La relación entre medicamento y movimiento conserva el historial mientras el producto existe.

## 5. Esquema de datos

### `Medicamento`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String, PK | Identificador generado por la API; el seed usa identificadores `med-*` |
| `nombre` | String, único | Nombre comercial |
| `principioActivo` | String | Principio activo |
| `categoria`, `presentacion`, `laboratorio` | String | Clasificación y datos descriptivos |
| `precioCompra`, `precioVenta` | Float | Precios por unidad de inventario |
| `stock`, `stockMinimo` | Int | Cantidad disponible y umbral de reposición |
| `fechaVencimiento` | String | Fecha de vencimiento en formato ISO `YYYY-MM-DD` |
| `lote` | String | Código del lote registrado |
| `requiereReceta` | Boolean | Indicador informativo de receta |
| `ubicacion`, `notas` | String | Ubicación física y observaciones |
| `fechaRegistro` | String | Fecha de creación en ISO |
| `createdAt`, `updatedAt` | DateTime | Marcas de auditoría técnica |

### `Movimiento`

Cada movimiento contiene `id`, `medicamentoId`, `tipo` (`entrada` o `salida`), `cantidad`, `motivo`, `fecha` y `stockResultante`. Existe una relación muchos-a-uno con `Medicamento` y un índice por medicamento y fecha. La creación del movimiento y la actualización de `stock` se confirman juntas o se revierten juntas.

## 6. Decisiones técnicas

1. **React + TypeScript + Vite:** desarrollo rápido de la SPA con tipado estático y compilación optimizada.
2. **Express y REST/JSON:** interfaz HTTP sencilla para separar cliente y servidor y facilitar futuros clientes.
3. **Prisma + SQLite:** esquema declarativo, migraciones y consultas tipadas con una base local fácil de iniciar.
4. **Zod en formularios y API:** validación próxima a la captura en el cliente y validación independiente en el servidor, que nunca debe confiar en datos del navegador.
5. **Zustand en memoria:** comparte el inventario entre vistas y sincroniza el estado solo después de que el backend confirme la operación; la persistencia real reside en SQLite.
6. **Transacciones para movimientos:** evita que el stock se actualice sin registrar su historial o viceversa; las salidas que superan el stock disponible se rechazan con HTTP 422.
7. **Carga demostrativa vía seed:** los datos de ejemplo se cargan explícitamente en la base de datos; el frontend ya no los toma como fuente de datos.
8. **Cálculos de inventario:** filtros detallados y CSV permanecen en el cliente; dashboard y alertas usan endpoints agregados del backend.

## 7. Flujos principales

### Inicio y lectura

1. La SPA solicita `GET /api/medicamentos` al iniciar.
2. Express obtiene medicamentos e historial mediante Prisma.
3. Zustand mantiene la respuesta para que inventario, detalle y edición la compartan.
4. Dashboard y alertas consultan adicionalmente `GET /api/dashboard` y `GET /api/alertas`.

### Alta o edición

1. El formulario valida campos y reglas de negocio en el navegador.
2. Envía `POST` o `PUT` en JSON.
3. La API vuelve a validar la entrada y ejecuta la operación con Prisma.
4. El cliente refleja el resultado devuelto por el servidor o informa el error sin simular éxito.

### Movimiento de inventario

1. El usuario selecciona entrada o salida, cantidad y motivo.
2. El cliente envía `POST /api/medicamentos/:id/movimientos`.
3. El backend comprueba la existencia del medicamento y que la salida no exceda el stock.
4. En una transacción actualiza el stock e inserta el movimiento con su stock resultante.
5. La API responde con el movimiento y el frontend actualiza stock e historial.

### Eliminación

La interfaz pide confirmación, el backend elimina el registro y SQLite aplica la relación configurada para borrar sus movimientos asociados. Si la petición falla, el estado local no se elimina.

## 8. Retos del proceso

- **Conservar un contrato común entre frontend y API:** los nombres, tipos y fechas del JSON deben coincidir con los usados en componentes y formularios.
- **Evitar divergencia del stock:** se requiere que movimiento e inventario cambien atómicamente y que el servidor, no solo la vista, impida salidas imposibles.
- **Migrar desde persistencia local/datos de muestra:** el navegador no debe considerarse fuente de verdad; el seed permite iniciar una base coherente y repetible.
- **Fechas de vencimiento:** se representan como fechas ISO sin hora para evitar desplazamientos de zona horaria al comparar días.
- **Experiencia ante fallos de red:** la carga inicial presenta reintento y las mutaciones solo actualizan el estado tras éxito; dashboard y alertas muestran su estado de carga/error.
- **Escala de consultas:** la lista completa funciona para el volumen esperado de una farmacia de barrio; para catálogos grandes se debería añadir paginación y mover filtros al servidor.

## 9. Calidad

- TypeScript en frontend y backend con opciones estrictas en la configuración del servidor.
- Esquemas Zod para validar los datos que entran a la API y formularios del cliente.
- Reglas centrales para cantidades no negativas, valores requeridos y movimientos positivos; saldo insuficiente devuelve 422.
- Operaciones relacionadas con el stock dentro de transacciones Prisma.
- Manejo de errores HTTP consistente: 400 para validación, 404 para inexistentes, 409 para conflictos de unicidad y 422 para stock insuficiente.
- Suite frontend con Vitest y Testing Library; las pruebas del store sustituyen la capa HTTP para comprobar sincronización del estado.
- Comandos pnpm del workspace para desarrollo, construcción, pruebas, migraciones y seed.

Para ejecutar la suite: `pnpm test`. Las pruebas y build requieren haber instalado previamente las dependencias.

## 10. Seguridad

- El backend valida y limita las entradas JSON; los identificadores y cantidades no se aceptan como confiables por provenir del navegador.
- La API restringe CORS mediante `CORS_ORIGIN`, configurable en `backend/.env`.
- Los mensajes al cliente evitan exponer detalles internos de errores de base de datos; el detalle técnico se registra en el servidor.
- SQLite y el archivo `.env` deben permanecer fuera del control de versiones. `backend/.gitignore` excluye la base local y credenciales; `.env.example` solo contiene valores de muestra.
- Prisma consulta mediante parámetros en lugar de concatenar SQL manualmente.

**Límites de seguridad actuales:** no hay autenticación, autorización por roles, HTTPS configurado por la aplicación, rate limiting, auditoría de usuario ni gestión de secretos para producción. El servidor debe exponerse únicamente en una red controlada hasta añadir esos controles. `CORS_ORIGIN` restringe orígenes del navegador, pero no reemplaza autenticación ni constituye un control de acceso para clientes no navegador.

## Instalación y ejecución

Requisitos: Node.js compatible con las dependencias y pnpm.

```bash
pnpm install

# Copiar backend/.env.example a backend/.env; ajustar valores si es necesario
pnpm --filter @meditrack/backend db:generate
pnpm --filter @meditrack/backend exec prisma migrate dev --name init
pnpm --filter @meditrack/backend db:seed

# Ejecutar frontend y backend en paralelo
pnpm dev

# Pruebas y build
pnpm test
pnpm build
```

El frontend utiliza `VITE_API_URL` (por defecto `http://localhost:3000/api`); se puede copiar `frontend/.env.example` a `frontend/.env.local`. El backend usa `PORT`, `CORS_ORIGIN` y `DATABASE_URL`, documentados en `backend/.env.example`.

## Estructura

```text
meditrack/
├── frontend/
│   └── src/              # SPA, vistas, componentes, store, API client y pruebas
├── backend/
│   ├── prisma/           # Esquema y seed
│   └── src/              # Aplicación Express, rutas, middleware y Prisma client
├── package.json          # Scripts del workspace pnpm
└── pnpm-workspace.yaml
```
