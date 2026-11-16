import type { Movimiento } from '@/data/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  movimientos: Movimiento[]
}

export default function HistorialMovimientos({ movimientos }: Props) {
  if (movimientos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        No hay movimientos registrados
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2 font-medium">Fecha</th>
            <th className="pb-2 font-medium">Tipo</th>
            <th className="pb-2 font-medium">Cantidad</th>
            <th className="pb-2 font-medium">Motivo</th>
            <th className="pb-2 font-medium">Stock resultante</th>
          </tr>
        </thead>
        <tbody>
          {[...movimientos].reverse().map((m) => (
            <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-2 text-gray-900 dark:text-gray-200">{formatDateTime(m.fecha)}</td>
              <td className="py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  m.tipo === 'entrada'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                }`}>
                  {m.tipo === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                </span>
              </td>
              <td className="py-2 font-medium text-gray-900 dark:text-gray-200">{m.cantidad}</td>
              <td className="py-2 text-gray-600 dark:text-gray-400">{m.motivo}</td>
              <td className="py-2 font-medium text-gray-900 dark:text-gray-200">{m.stockResultante}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
