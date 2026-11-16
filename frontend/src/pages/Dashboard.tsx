import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '@/utils/api'
import { formatCurrency } from '@/utils/formatters'

import StatsCard from '@/components/ui/StatsCard'
import Icon from '@/components/ui/Icon'
import DistribucionCategorias from '@/components/estadisticas/DistribucionCategorias'
import AnalisisFinanciero from '@/components/estadisticas/AnalisisFinanciero'

export default function Dashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.obtenerDashboard>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cargarDashboard = useCallback(() => { void api.obtenerDashboard().then((result) => { setStats(result); setError(null) }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las estadísticas')) }, [])
  useEffect(cargarDashboard, [])

  if (error) return <div className="py-8 text-center text-sm text-red-600">{error} <button onClick={cargarDashboard} className="underline">Reintentar</button></div>
  if (!stats) return <p className="py-8 text-center text-sm text-gray-500">Cargando estadísticas…</p>

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
