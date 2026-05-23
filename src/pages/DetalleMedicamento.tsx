import { useParams, Link } from 'react-router'
import { useMedicamentosStore } from '@/store/medicamentosStore'
import { formatCurrency } from '@/utils/formatters'
import { calcularEstadoStock, calcularEstadoVencimiento } from '@/utils/validators'
import FormMovimiento from '@/components/movimientos/FormMovimiento'
import HistorialMovimientos from '@/components/movimientos/HistorialMovimientos'
import EmptyState from '@/components/ui/EmptyState'

export default function DetalleMedicamento() {
  const { id } = useParams<{ id: string }>()
  const medicamento = useMedicamentosStore((s) => s.medicamentos.find((m) => m.id === id))

  if (!medicamento) {
    return (
      <EmptyState
        mensaje="Medicamento no encontrado"
        accion="Volver al inventario"
        icono="search"
      />
    )
  }

  const estadoStock = calcularEstadoStock(medicamento.stock, medicamento.stockMinimo)
  const estadoVenc = calcularEstadoVencimiento(medicamento.fechaVencimiento)

  const stockBadge = estadoStock === 'agotado' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    : estadoStock === 'bajo' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'

  const vencBadge = estadoVenc === 'vencido' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    : estadoVenc === 'próximo a vencer' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/inventario" className="text-sm text-teal-600 dark:text-teal-400 hover:underline mb-1 block font-medium">
            ← Volver al inventario
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-headline)]">{medicamento.nombre}</h1>
          <p className="text-gray-500 dark:text-gray-400">{medicamento.principioActivo}</p>
        </div>
        <Link
          to={`/inventario/${medicamento.id}/editar`}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm text-center shadow-sm hover:shadow-md"
        >
          Editar Medicamento
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información General</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Categoría</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.categoria}</p>
              </div>
              <div>
                <span className="text-gray-400">Presentación</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.presentacion}</p>
              </div>
              <div>
                <span className="text-gray-400">Laboratorio</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.laboratorio}</p>
              </div>
              <div>
                <span className="text-gray-400">Lote</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.lote}</p>
              </div>
              <div>
                <span className="text-gray-400">Ubicación</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.ubicacion || 'Sin especificar'}</p>
              </div>
              <div>
                <span className="text-gray-400">Receta médica</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.requiereReceta ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información de Inventario</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Stock actual</span>
                <p className="font-bold text-xl text-gray-900 dark:text-white">{medicamento.stock} uds</p>
              </div>
              <div>
                <span className="text-gray-400">Stock mínimo</span>
                <p className="font-medium text-gray-900 dark:text-white">{medicamento.stockMinimo} uds</p>
              </div>
              <div>
                <span className="text-gray-400">Precio compra</span>
                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(medicamento.precioCompra)}</p>
              </div>
              <div>
                <span className="text-gray-400">Precio venta</span>
                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(medicamento.precioVenta)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${stockBadge}`}>
                {estadoStock === 'agotado' ? 'Agotado' : estadoStock === 'bajo' ? 'Stock bajo' : 'Stock normal'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${vencBadge}`}>
                {estadoVenc === 'vencido' ? 'Vencido' : estadoVenc === 'próximo a vencer' ? 'Próximo a vencer' : 'Vigente'}
              </span>
            </div>
          </div>

          {medicamento.notas && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notas</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{medicamento.notas}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historial de Movimientos</h2>
            <HistorialMovimientos movimientos={medicamento.historialMovimientos} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <FormMovimiento
            medicamentoId={medicamento.id}
            stockActual={medicamento.stock}
          />
        </div>
      </div>
    </div>
  )
}
