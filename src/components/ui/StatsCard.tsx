interface Props {
  titulo: string
  valor: string | number
  icono?: string
  color?: string
}

export default function StatsCard({ titulo, valor, icono, color = 'blue' }: Props) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'
  }

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-3">
        {icono && <span className="text-3xl">{icono}</span>}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{titulo}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{valor}</p>
        </div>
      </div>
    </div>
  )
}
