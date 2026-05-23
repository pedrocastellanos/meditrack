import { useMemo } from 'react'
import { useMedicamentosStore } from '@/store/medicamentosStore'
import { calcularEstadoStock, calcularEstadoVencimiento } from '@/utils/validators'
import { formatDate } from '@/utils/formatters'
import { Link } from 'react-router'

export default function Alertas() {
  const medicamentos = useMedicamentosStore((s) => s.medicamentos)

  const alertas = useMemo(() => {
    const stockBajo = medicamentos.filter((m) => calcularEstadoStock(m.stock, m.stockMinimo) === 'bajo')
    const agotados = medicamentos.filter((m) => calcularEstadoStock(m.stock, m.stockMinimo) === 'agotado')
    const vencidos = medicamentos.filter((m) => calcularEstadoVencimiento(m.fechaVencimiento) === 'vencido')
    const proximosVencer = medicamentos.filter((m) => calcularEstadoVencimiento(m.fechaVencimiento) === 'próximo a vencer')

    return { stockBajo, agotados, vencidos, proximosVencer }
  }, [medicamentos])

  const secciones = [
    { titulo: 'Stock Bajo', items: alertas.stockBajo, color: 'yellow', icono: '⚠️' },
    { titulo: 'Agotados', items: alertas.agotados, color: 'red', icono: '🚫' },
    { titulo: 'Vencidos', items: alertas.vencidos, color: 'red', icono: '🗑️' },
    { titulo: 'Próximos a Vencer', items: alertas.proximosVencer, color: 'yellow', icono: '⏰' }
  ]

  const totalAlertas = secciones.reduce((s, sec) => s + sec.items.length, 0)

  if (totalAlertas === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-6xl mb-4">✅</span>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No hay alertas activas. ¡Todo en orden!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {secciones.filter((s) => s.items.length > 0).map((seccion) => (
        <div key={seccion.titulo}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>{seccion.icono}</span>
            {seccion.titulo}
            <span className="text-sm font-normal text-gray-500">({seccion.items.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {seccion.items.map((m) => (
              <Link
                key={m.id}
                to={`/inventario/${m.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{m.nombre}</p>
                    <p className="text-sm text-gray-500">{m.categoria} - {m.presentacion}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-400">Stock: <strong className="text-gray-900 dark:text-white">{m.stock}</strong></span>
                  <span className="text-gray-400">Vence: <strong className="text-gray-900 dark:text-white">{formatDate(m.fechaVencimiento)}</strong></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
