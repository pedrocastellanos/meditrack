import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const dashboardRouter = Router()
const daysUntil = (date: string) => Math.floor((new Date(`${date}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000)
const stockStatus = (stock: number, minimum: number) => stock <= 0 ? 'agotado' : stock < minimum ? 'bajo' : 'normal'

dashboardRouter.get('/alertas', async (_req, res) => {
  const meds = await prisma.medicamento.findMany({ include: { historialMovimientos: false } })
  res.json({
    stockBajo: meds.filter(m => stockStatus(m.stock, m.stockMinimo) === 'bajo'),
    agotados: meds.filter(m => stockStatus(m.stock, m.stockMinimo) === 'agotado'),
    vencidos: meds.filter(m => daysUntil(m.fechaVencimiento) < 0),
    proximosVencer: meds.filter(m => daysUntil(m.fechaVencimiento) >= 0 && daysUntil(m.fechaVencimiento) <= 30)
  })
})

dashboardRouter.get('/dashboard', async (_req, res) => {
  const meds = await prisma.medicamento.findMany()
  const stockBajo = meds.filter(m => stockStatus(m.stock, m.stockMinimo) === 'bajo')
  const agotados = meds.filter(m => stockStatus(m.stock, m.stockMinimo) === 'agotado')
  const vencidos = meds.filter(m => daysUntil(m.fechaVencimiento) < 0)
  const proximosVencer = meds.filter(m => daysUntil(m.fechaVencimiento) >= 0 && daysUntil(m.fechaVencimiento) <= 30)
  const countByCategory = new Map<string, number>()
  const valueByCategory = new Map<string, number>()
  for (const m of meds) {
    countByCategory.set(m.categoria, (countByCategory.get(m.categoria) ?? 0) + 1)
    valueByCategory.set(m.categoria, (valueByCategory.get(m.categoria) ?? 0) + m.precioVenta * m.stock)
  }
  const margins = meds.map(m => ({ nombre: m.nombre, margen: m.precioVenta - m.precioCompra, margenPorcentaje: m.precioCompra ? (m.precioVenta - m.precioCompra) / m.precioCompra * 100 : 0 }))
  const byMargin = [...margins].sort((a, b) => a.margenPorcentaje - b.margenPorcentaje)
  const sortedCount = [...countByCategory].sort((a, b) => b[1] - a[1])
  const sortedValue = [...valueByCategory].sort((a, b) => b[1] - a[1])
  res.json({
    totalMedicamentos: meds.length, totalUnidades: meds.reduce((s, m) => s + m.stock, 0),
    valorCompra: meds.reduce((s, m) => s + m.precioCompra * m.stock, 0),
    valorVenta: meds.reduce((s, m) => s + m.precioVenta * m.stock, 0),
    stockBajo: stockBajo.length, agotados: agotados.length, vencidos: vencidos.length, proximosVencer: proximosVencer.length,
    conteoCategorias: sortedCount, categoriaMasPoblada: sortedCount[0]?.[0] ?? 'N/A', categoriaMayorValor: sortedValue[0]?.[0] ?? 'N/A',
    porcentajeReceta: meds.length ? Math.round(meds.filter(m => m.requiereReceta).length / meds.length * 100) : 0,
    margenPromedio: margins.length ? margins.reduce((s, m) => s + m.margenPorcentaje, 0) / margins.length : 0,
    mayorMargen: byMargin.at(-1) ?? { nombre: 'N/A', margen: 0, margenPorcentaje: 0 },
    menorMargen: byMargin[0] ?? { nombre: 'N/A', margen: 0, margenPorcentaje: 0 },
    inventarioRiesgo: [...vencidos, ...proximosVencer].reduce((s, m) => s + m.precioCompra * m.stock, 0)
  })
})
