# MediTrack API

API REST para el inventario de medicamentos. Está implementada con Express 5, Prisma y SQLite, y utiliza los mismos nombres de campos del frontend.

## Preparación

Desde la raíz, cuando estén instaladas las dependencias:

```bash
pnpm install
Copy-Item backend/.env.example backend/.env
pnpm --filter @meditrack/backend db:generate
pnpm --filter @meditrack/backend exec prisma migrate dev --name init
pnpm --filter @meditrack/backend db:seed
pnpm dev:backend
```

Para iniciar la interfaz junto a la API, usa `pnpm dev` desde la raíz. El frontend usa `VITE_API_URL` (ejemplo en `frontend/.env.example`); por defecto apunta a `http://localhost:3000/api`.

La API escucha en `http://localhost:3000`. Configure `DATABASE_URL`, `PORT` y `CORS_ORIGIN` en `backend/.env` según el entorno. La base SQLite se crea al ejecutar la migración.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/medicamentos?search=&categoria=` | Listado, búsqueda y filtro por categoría; incluye historial |
| GET | `/api/medicamentos/:id` | Detalle e historial cronológico |
| POST | `/api/medicamentos` | Alta de medicamento |
| PUT | `/api/medicamentos/:id` | Actualización parcial |
| DELETE | `/api/medicamentos/:id` | Baja y eliminación de su historial asociado |
| POST | `/api/medicamentos/:id/movimientos` | Registrar entrada o salida atómica |
| GET | `/api/alertas` | Listas de stock bajo, agotados, vencidos y próximos a vencer |
| GET | `/api/dashboard` | Indicadores, distribución por categoría y métricas financieras |

Las altas y actualizaciones usan los campos definidos en `MedicamentoFormData`. El movimiento recibe `{ "tipo": "entrada" | "salida", "cantidad": 1, "motivo": "..." }`; las salidas sin stock suficiente responden con HTTP 422. Los errores de validación usan HTTP 400 y los recursos inexistentes HTTP 404.

El seed carga de forma repetible los 15 medicamentos y sus movimientos demostrativos desde `frontend/src/data/initialData.ts`.
