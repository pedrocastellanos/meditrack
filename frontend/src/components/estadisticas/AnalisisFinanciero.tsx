import { formatCurrency } from '@/utils/formatters'

interface MargenInfo {
  nombre: string
  margen: number
  margenPorcentaje: number
}

interface Props {
  margenPromedio: number
  mayorMargen: MargenInfo
  menorMargen: MargenInfo
  categoriaMasPoblada: string
  categoriaMayorValor: string
  porcentajeReceta: number
  inventarioRiesgo: number
}

export default function AnalisisFinanciero({
  margenPromedio,
  mayorMargen,
  menorMargen,
  categoriaMasPoblada,
  categoriaMayorValor,
  porcentajeReceta,
  inventarioRiesgo
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-[family-name:var(--font-headline)]">Análisis Financiero</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Margen de ganancia promedio</span>
          <span className="font-semibold text-gray-900 dark:text-white">{margenPromedio.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Mayor margen</span>
          <span className="font-semibold text-green-600">{mayorMargen.nombre} ({mayorMargen.margenPorcentaje.toFixed(0)}%)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Menor margen</span>
          <span className="font-semibold text-red-600">{menorMargen.nombre} ({menorMargen.margenPorcentaje.toFixed(0)}%)</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Categoría más poblada</span>
            <span className="font-semibold text-gray-900 dark:text-white">{categoriaMasPoblada}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Categoría mayor valor</span>
            <span className="font-semibold text-gray-900 dark:text-white">{categoriaMayorValor}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Requieren receta</span>
            <span className="font-semibold text-gray-900 dark:text-white">{porcentajeReceta}%</span>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-red-500 font-medium">Inventario en riesgo</span>
            <span className="font-semibold text-red-600">{formatCurrency(inventarioRiesgo)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Valor de compra de productos vencidos o próximos a vencer</p>
        </div>
      </div>
    </div>
  )
}
