-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "principioActivo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "presentacion" TEXT NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "precioCompra" REAL NOT NULL,
    "precioVenta" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "fechaVencimiento" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "requiereReceta" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion" TEXT NOT NULL DEFAULT '',
    "notas" TEXT NOT NULL DEFAULT '',
    "fechaRegistro" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicamentoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "stockResultante" INTEGER NOT NULL,
    CONSTRAINT "Movimiento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_nombre_key" ON "Medicamento"("nombre");

-- CreateIndex
CREATE INDEX "Movimiento_medicamentoId_fecha_idx" ON "Movimiento"("medicamentoId", "fecha");
