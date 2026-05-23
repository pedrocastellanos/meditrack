import { useMemo } from 'react'
import { Link } from 'react-router'
import { useMedicamentosStore } from '@/store/medicamentosStore'
import { formatCurrency } from '@/utils/formatters'
import { calcularEstadoStock, calcularEstadoVencimiento } from '@/utils/validators'

import StatsCard from '@/components/ui/StatsCard'
import Icon from '@/components/ui/Icon'
import DistribucionCategorias from '@/components/estadisticas/DistribucionCategorias'
import AnalisisFinanciero from '@/components/estadisticas/AnalisisFinanciero'

export default function Dashboard() {
  const medicamentos = useMedicamentosStore((s) => s.medicamentos)

  // useMemo: todos los cálculos estadísticos (reduces, filtros, sorts) se agrupan aquí.
  // Sin useMemo, estos se re-ejecutarían en cada render del Dashboard incluso si los datos
  // del inventario no cambiaron (por ejemplo, al cambiar de tema o al navegar). Dado que
  // son operaciones O(n) sobre el arreglo completo de medicamentos, memoizar evita
  // recomputaciones costosas en renders no relacionados con cambios de datos.
  const stats = useMemo(() => {
    const totalMedicamentos = medicamentos.length
    const totalUnidades = medicamentos.reduce((sum, m) => sum + m.stock, 0)
    const valorCompra = medicamentos.reduce((sum, m) => sum + m.precioCompra * m.stock, 0)
    const valorVenta = medicamentos.reduce((sum, m) => sum + m.precioVenta * m.stock, 0)

    const stockBajo = medicamentos.filter((m) => calcularEstadoStock(m.stock, m.stockMinimo) === 'bajo')
    const agotados = medicamentos.filter((m) => calcularEstadoStock(m.stock, m.stockMinimo) === 'agotado')
    const vencidos = medicamentos.filter((m) => calcularEstadoVencimiento(m.fechaVencimiento) === 'vencido')
    const proximosVencer = medicamentos.filter((m) => calcularEstadoVencimiento(m.fechaVencimiento) === 'próximo a vencer')

    const conteoCategorias: Record<string, number> = {}
    for (const m of medicamentos) {
      conteoCategorias[m.categoria] = (conteoCategorias[m.categoria] || 0) + 1
    }
    const categoriaMasPoblada = Object.entries(conteoCategorias).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    const valorPorCategoria: Record<string, number> = {}
    for (const m of medicamentos) {
      valorPorCategoria[m.categoria] = (valorPorCategoria[m.categoria] || 0) + m.precioVenta * m.stock
    }
    const categoriaMayorValor = Object.entries(valorPorCategoria).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    const conReceta = medicamentos.filter((m) => m.requiereReceta).length
    const porcentajeReceta = totalMedicamentos > 0 ? Math.round((conReceta / totalMedicamentos) * 100) : 0

    const margenes = medicamentos.map((m) => ({
      nombre: m.nombre,
      margen: m.precioVenta - m.precioCompra,
      margenPorcentaje: m.precioCompra > 0 ? ((m.precioVenta - m.precioCompra) / m.precioCompra) * 100 : 0
    }))
    const margenPromedio = margenes.length > 0
      ? margenes.reduce((sum, m) => sum + m.margenPorcentaje, 0) / margenes.length
      : 0
    const mayorMargen = margenes.reduce((max, m) => m.margen > max.margen ? m : max, margenes[0] || { nombre: 'N/A', margen: 0, margenPorcentaje: 0 })
    const menorMargen = margenes.reduce((min, m) => m.margen < min.margen ? m : min, margenes[0] || { nombre: 'N/A', margen: 0, margenPorcentaje: 0 })

    const inventarioRiesgo = [...vencidos, ...proximosVencer].reduce((sum, m) => sum + m.precioCompra * m.stock, 0)

    return {
      totalMedicamentos, totalUnidades, valorCompra, valorVenta,
      stockBajo: stockBajo.length, agotados: agotados.length,
      vencidos: vencidos.length, proximosVencer: proximosVencer.length,
      conteoCategorias: Object.entries(conteoCategorias).sort((a, b) => b[1] - a[1]),
      categoriaMasPoblada, categoriaMayorValor, porcentajeReceta,
      margenPromedio, mayorMargen, menorMargen, inventarioRiesgo
    }
  }, [medicamentos])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard titulo="Total Medicamentos" valor={stats.totalMedicamentos} icono={<Icon name="pill" className="w-5 h-5" />} color="teal" />
        <StatsCard titulo="Unidades en Almacén" valor={stats.totalUnidades} icono={<Icon name="box" className="w-5 h-5" />} color="green" />
        <StatsCard titulo="Valor (Compra)" valor={formatCurrency(stats.valorCompra)} icono={<Icon name="dollar" className="w-5 h-5" />} color="purple" />
        <StatsCard titulo="Valor (Venta)" valor={formatCurrency(stats.valorVenta)} icono={<Icon name="tag" className="w-5 h-5" />} color="teal" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/alertas" className="block">
          <StatsCard titulo="Stock Bajo" valor={stats.stockBajo} icono={<Icon name="warning" className="w-5 h-5" />} color="yellow" />
        </Link>
        <Link to="/alertas" className="block">
          <StatsCard titulo="Agotados" valor={stats.agotados} icono={<Icon name="x-circle" className="w-5 h-5" />} color="red" />
        </Link>
        <Link to="/alertas" className="block">
          <StatsCard titulo="Vencidos" valor={stats.vencidos} icono={<Icon name="trash" className="w-5 h-5" />} color="red" />
        </Link>
        <Link to="/alertas" className="block">
          <StatsCard titulo="Próximos a Vencer" valor={stats.proximosVencer} icono={<Icon name="clock" className="w-5 h-5" />} color="yellow" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistribucionCategorias
          conteoCategorias={stats.conteoCategorias}
          totalMedicamentos={stats.totalMedicamentos}
        />

        <AnalisisFinanciero
          margenPromedio={stats.margenPromedio}
          mayorMargen={stats.mayorMargen}
          menorMargen={stats.menorMargen}
          categoriaMasPoblada={stats.categoriaMasPoblada}
          categoriaMayorValor={stats.categoriaMayorValor}
          porcentajeReceta={stats.porcentajeReceta}
          inventarioRiesgo={stats.inventarioRiesgo}
        />
      </div>
    </div>
  )
}
