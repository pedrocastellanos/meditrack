import Icon from '@/components/ui/Icon'
import type { IconName } from '@/components/ui/Icon'

interface Props {
  mensaje: string
  accion?: string
  onAccion?: () => void
  icono?: IconName
}

export default function EmptyState({ mensaje, accion, onAccion, icono = 'empty-inbox' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
        <Icon name={icono} className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{mensaje}</p>
      {accion && onAccion && (
        <button
          onClick={onAccion}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm hover:shadow-md font-medium"
        >
          {accion}
        </button>
      )}
    </div>
  )
}
