import { Link } from 'react-router'
import type { Medicamento } from '@/data/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { calcularEstadoStock, calcularEstadoVencimiento } from '@/utils/validators'

interface Props {
  medicamento: Medicamento
  onDelete?: (id: string) => void
}

export default function MedicamentoCard({ medicamento, onDelete }: Props) {
  const estadoStock = calcularEstadoStock(medicamento.stock, medicamento.stockMinimo)
  const estadoVenc = calcularEstadoVencimiento(medicamento.fechaVencimiento)
  const esVencido = estadoVenc === 'vencido'
  const esProximoVencer = estadoVenc === 'próximo a vencer'
  const stockBajo = estadoStock === 'bajo'
  const agotado = estadoStock === 'agotado'

  const cardClass = esVencido
    ? 'opacity-60 border-red-300 dark:border-red-800'
    : 'border-gray-200 dark:border-gray-700'

  const stockBadge = agotado
    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    : stockBajo
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'

  const vencimientoBadge = esVencido
    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 line-through'
    : esProximoVencer
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${cardClass} card-enter`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link to={`/inventario/${medicamento.id}`} className="text-base font-semibold text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 truncate block font-[family-name:var(--font-headline)]">
            {esVencido ? <span className="line-through">{medicamento.nombre}</span> : medicamento.nombre}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{medicamento.principioActivo}</p>
        </div>
        {medicamento.requiereReceta && (
          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-medium shrink-0">Rx</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{medicamento.categoria}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{medicamento.presentacion}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{medicamento.laboratorio}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-400 text-xs">Stock</span>
          <p className={`font-semibold ${agotado ? 'text-red-600' : stockBajo ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}`}>
            {agotado ? 'Agotado' : `${medicamento.stock} uds`}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Precio</span>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(medicamento.precioVenta)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${stockBadge}`}>
          {agotado ? 'Agotado' : stockBajo ? 'Stock bajo' : 'Stock OK'}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${vencimientoBadge}`}>
          {esVencido ? 'Vencido' : esProximoVencer ? 'Próximo a vencer' : 'Vigente'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400">Vence: {formatDate(medicamento.fechaVencimiento)}</span>
        <div className="flex gap-2">
          <Link
            to={`/inventario/${medicamento.id}/editar`}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            Editar
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(medicamento.id)}
              className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
