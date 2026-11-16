import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export const medicamentosRouter = Router()
const idParam = z.object({ id: z.string().min(1) })
const medicamentoData = z.object({
  nombre: z.string().trim().min(1), principioActivo: z.string().trim().min(1),
  categoria: z.string().trim().min(1), presentacion: z.string().trim().min(1),
  laboratorio: z.string().trim().min(1), precioCompra: z.number().nonnegative(),
  precioVenta: z.number().nonnegative(), stock: z.number().int().nonnegative(),
  stockMinimo: z.number().int().nonnegative(), fechaVencimiento: z.string().min(1),
  lote: z.string().trim().min(1), requiereReceta: z.boolean(),
  ubicacion: z.string().default(''), notas: z.string().default('')
})
const includeHistory = { historialMovimientos: { orderBy: { fecha: 'desc' as const } } }

medicamentosRouter.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined
  const medicamentos = await prisma.medicamento.findMany({
    where: {
      ...(categoria ? { categoria } : {}),
      ...(search ? { OR: [
        { nombre: { contains: search } }, { principioActivo: { contains: search } },
        { categoria: { contains: search } }, { laboratorio: { contains: search } }, { lote: { contains: search } }
      ] } : {})
    },
    include: includeHistory,
    orderBy: { nombre: 'asc' }
  })
  res.json(medicamentos)
})

medicamentosRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const medicamento = await prisma.medicamento.findUnique({ where: { id }, include: includeHistory })
  if (!medicamento) { res.status(404).json({ error: 'Medicamento no encontrado' }); return }
  res.json(medicamento)
})

medicamentosRouter.post('/', async (req, res) => {
  const data = medicamentoData.parse(req.body)
  const medicamento = await prisma.medicamento.create({
    data: { ...data, id: `med-${randomUUID()}`, fechaRegistro: new Date().toISOString() },
    include: includeHistory
  })
  res.status(201).json(medicamento)
})

medicamentosRouter.put('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const data = medicamentoData.partial().parse(req.body)
  if (Object.keys(data).length === 0) { res.status(400).json({ error: 'Debe enviar al menos un campo' }); return }
  res.json(await prisma.medicamento.update({ where: { id }, data, include: includeHistory }))
})

medicamentosRouter.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  await prisma.medicamento.delete({ where: { id } })
  res.status(204).end()
})

medicamentosRouter.post('/:id/movimientos', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const data = z.object({ tipo: z.enum(['entrada', 'salida']), cantidad: z.number().int().positive(), motivo: z.string().trim().min(1) }).parse(req.body)
  const movimiento = await prisma.$transaction(async (tx) => {
    const medicamento = await tx.medicamento.findUnique({ where: { id } })
    if (!medicamento) throw Object.assign(new Error('Medicamento no encontrado'), { code: 'P2025' })
    if (data.tipo === 'salida' && data.cantidad > medicamento.stock) {
      throw Object.assign(new Error('Stock insuficiente'), { status: 422 })
    }
    const stockResultante = data.tipo === 'entrada' ? medicamento.stock + data.cantidad : medicamento.stock - data.cantidad
    await tx.medicamento.update({ where: { id }, data: { stock: stockResultante } })
    return tx.movimiento.create({ data: {
      id: `mov-${randomUUID()}`, medicamentoId: id, ...data,
      fecha: new Date().toISOString(), stockResultante
    } })
  })
  res.status(201).json(movimiento)
})
