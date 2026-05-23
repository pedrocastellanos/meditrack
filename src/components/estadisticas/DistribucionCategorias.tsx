interface Props {
  conteoCategorias: [string, number][]
  totalMedicamentos: number
}

export default function DistribucionCategorias({ conteoCategorias, totalMedicamentos }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-[family-name:var(--font-headline)]">Distribución por Categoría</h2>
      {conteoCategorias.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin datos</p>
      ) : (
        <div className="space-y-2">
          {conteoCategorias.map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 w-40 truncate">{cat}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-teal-500 h-3 rounded-full transition-all"
                  style={{ width: `${totalMedicamentos > 0 ? (count / totalMedicamentos) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
