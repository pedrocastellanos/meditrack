import type { Notificacion, TipoNotificacion } from '../../hooks/useNotification'

const coloresMap: Record<TipoNotificacion, string> = {
  exito: 'bg-green-500',
  advertencia: 'bg-yellow-500',
  error: 'bg-red-500'
}

interface Props {
  notificaciones: Notificacion[]
  onEliminar: (id: string) => void
}

export default function ToastContainer({ notificaciones, onEliminar }: Props) {
  if (notificaciones.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {notificaciones.map((n) => (
        <div
          key={n.id}
          className={`${coloresMap[n.tipo]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 animate-slide-in`}
        >
          <span className="text-sm">{n.mensaje}</span>
          <button
            onClick={() => onEliminar(n.id)}
            className="text-white/80 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
