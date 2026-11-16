import type { ReactNode } from 'react'

interface Props {
  titulo: string
  valor: string | number
  icono?: ReactNode
  color?: 'teal' | 'green' | 'red' | 'yellow' | 'purple'
}

const colorClasses: Record<string, string> = {
  teal: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400',
  green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
  red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400',
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
}

export default function StatsCard({ titulo, valor, icono, color = 'teal' }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4">
        {icono && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
            {icono}
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
            {titulo}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight">
            {valor}
          </p>
        </div>
      </div>
    </div>
  )
}
