import { useMemo } from 'react'
import { Link } from 'react-router'
import { useMedicamentosStore } from '../store/medicamentosStore'
import { formatCurrency } from '../utils/formatters'
import { calcularEstadoStock, calcularEstadoVencimiento } from '../utils/validators'

import StatsCard from '../components/ui/StatsCard'

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
        <StatsCard titulo="Total Medicamentos" valor={stats.totalMedicamentos} icono="💊" color="blue" />
        <StatsCard titulo="Unidades en Almacén" valor={stats.totalUnidades} icono="📦" color="green" />
        <StatsCard titulo="Valor (Compra)" valor={formatCurrency(stats.valorCompra)} icono="💰" color="purple" />
        <StatsCard titulo="Valor (Venta)" valor={formatCurrency(stats.valorVenta)} icono="🏷️" color="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/alertas" className="block">
          <StatsCard titulo="Stock Bajo" valor={stats.stockBajo} icono="⚠️" color="yellow" />
        </Link>
        <Link to="/alertas" className="block">
          <StatsCard titulo="Agotados" valor={stats.agotados} icono="🚫" color="red" />
        </Link>
        <Link to="/alertas" className="block">
          <StatsCard titulo="Vencidos" valor={stats.vencidos} icono="🗑️" color="red" />
        </Link>
        <Link to="/alertas" className="block">
          <StatsCard titulo="Próximos a Vencer" valor={stats.proximosVencer} icono="⏰" color="yellow" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Categoría</h2>
          {stats.conteoCategorias.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {stats.conteoCategorias.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-40 truncate">{cat}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${(count / stats.totalMedicamentos) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Análisis Financiero</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Margen de ganancia promedio</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.margenPromedio.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Mayor margen</span>
              <span className="font-semibold text-green-600">{stats.mayorMargen.nombre} ({stats.mayorMargen.margenPorcentaje.toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Menor margen</span>
              <span className="font-semibold text-red-600">{stats.menorMargen.nombre} ({stats.menorMargen.margenPorcentaje.toFixed(0)}%)</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Categoría más poblada</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.categoriaMasPoblada}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500 dark:text-gray-400">Categoría mayor valor</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.categoriaMayorValor}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500 dark:text-gray-400">Requieren receta</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.porcentajeReceta}%</span>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-red-500 font-medium">Inventario en riesgo</span>
                <span className="font-semibold text-red-600">{formatCurrency(stats.inventarioRiesgo)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Valor de compra de productos vencidos o próximos a vencer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
