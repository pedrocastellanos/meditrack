interface Props {
  mensaje: string
  accion?: string
  onAccion?: () => void
  icono?: string
}

export default function EmptyState({ mensaje, accion, onAccion, icono = '📭' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl mb-4">{icono}</span>
      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{mensaje}</p>
      {accion && onAccion && (
        <button
          onClick={onAccion}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {accion}
        </button>
      )}
    </div>
  )
}
