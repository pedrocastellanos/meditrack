import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { medicamentosIniciales } from '../../frontend/src/data/initialData.ts'

const prisma = new PrismaClient()

async function main() {
  for (const { historialMovimientos, ...medicamento } of medicamentosIniciales) {
    await prisma.medicamento.upsert({
      where: { id: medicamento.id },
      update: { ...medicamento, historialMovimientos: { deleteMany: {}, create: historialMovimientos.map(m => ({ ...m })) } },
      create: { ...medicamento, historialMovimientos: { create: historialMovimientos.map(m => ({ ...m })) } }
    })
  }
  console.info(`Seed completado: ${medicamentosIniciales.length} medicamentos.`)
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
