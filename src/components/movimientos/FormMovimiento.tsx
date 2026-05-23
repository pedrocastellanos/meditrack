import { useState } from 'react'
import { MOTIVOS_ENTRADA, MOTIVOS_SALIDA } from '../../data/constants'
import { useMedicamentosStore } from '../../store/medicamentosStore'
import { useNotification } from '../../hooks/useNotification'
import ToastContainer from '../notificaciones/ToastContainer'

interface Props {
  medicamentoId: string
  stockActual: number
  onSuccess?: () => void
}

type TipoMov = 'entrada' | 'salida'

export default function FormMovimiento({ medicamentoId, stockActual, onSuccess }: Props) {
  const [tipo, setTipo] = useState<TipoMov>('entrada')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState<string>(MOTIVOS_ENTRADA[0])
  const { notificaciones, notificar, eliminar } = useNotification()
  const registrarMovimiento = useMedicamentosStore((s) => s.registrarMovimiento)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tipo === 'salida' && cantidad > stockActual) {
      notificar('No hay suficiente stock disponible para esta salida', 'error')
      return
    }
    registrarMovimiento(medicamentoId, tipo, cantidad, motivo)
    notificar(
      tipo === 'entrada'
        ? `Entrada de ${cantidad} unidad(es) registrada`
        : `Salida de ${cantidad} unidad(es) registrada`,
      'exito'
    )
    setCantidad(1)
    onSuccess?.()
  }

  return (
    <>
      <ToastContainer notificaciones={notificaciones} onEliminar={eliminar} />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Registrar Movimiento</h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTipo('entrada'); setMotivo(MOTIVOS_ENTRADA[0]) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tipo === 'entrada'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            + Entrada
          </button>
          <button
            type="button"
            onClick={() => { setTipo('salida'); setMotivo(MOTIVOS_SALIDA[0]) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tipo === 'salida'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            - Salida
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Stock actual: <span className="font-bold text-gray-900 dark:text-white">{stockActual} unidades</span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(tipo === 'entrada' ? MOTIVOS_ENTRADA : MOTIVOS_SALIDA).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${
            tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Registrar {tipo === 'entrada' ? 'Entrada' : 'Salida'}
        </button>
      </form>
    </>
  )
}
