import { useState, useCallback } from 'react'
import { useMedicamentosStore } from '@/store/medicamentosStore'
import { useFilter } from '@/hooks/useFilter'
import { useNotification } from '@/hooks/useNotification'
import { CATEGORIAS } from '@/data/constants'
import MedicamentoCard from '@/components/medicamentos/MedicamentoCard'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import ToastContainer from '@/components/notificaciones/ToastContainer'
import type { SortField } from '@/data/types'
import { escaparCSV } from '@/utils/escaparCsV'

export default function Inventario() {
  const medicamentos = useMedicamentosStore((s) => s.medicamentos)
  const eliminarMedicamento = useMedicamentosStore((s) => s.eliminarMedicamento)
  const { filtros, setFilter, limpiarFiltros, resultados: resultadosBase } = useFilter(medicamentos)
  const { notificaciones, notificar, eliminar } = useNotification()
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [precioMin, setPrecioMin] = useState(0)
  const [precioMax, setPrecioMax] = useState(Infinity)
  const [precioMinInput, setPrecioMinInput] = useState('')
  const [precioMaxInput, setPrecioMaxInput] = useState('')

  const parsePrecio = (raw: string): number => {
    if (raw === '') return Infinity
    const normalizado = raw.replace(/,/g, '.')
    const num = Number(normalizado)
    return isNaN(num) || num < 0 ? Infinity : num
  }

  const handlePrecioMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setPrecioMinInput(raw)
    setPrecioMin(raw === '' ? 0 : parsePrecio(raw))
  }, [])

  const handlePrecioMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setPrecioMaxInput(raw)
    setPrecioMax(parsePrecio(raw))
  }, [])

  const resultados = (() => {
    let items = resultadosBase
    if (precioMin > 0) {
      items = items.filter((m) => m.precioVenta >= precioMin)
    }
    if (precioMax < Infinity) {
      items = items.filter((m) => m.precioVenta <= precioMax)
    }
    return items
  })()

  const hayFiltrosActivos = filtros.texto !== '' || filtros.categoria !== '' || filtros.estadoStock !== '' ||
    filtros.estadoVencimiento !== '' || filtros.requiereReceta !== '' ||
    precioMin > 0 || precioMax < Infinity

  // useCallback: estabiliza la referencia de la función pasada a MedicamentoCard,
  // previniendo re-renderizados innecesarios en cada tarjeta del grid al no depender de estado volátil
  const handleDelete = useCallback((id: string) => {
    setEliminarId(id)
  }, [])

  // useCallback: la dependencia eliminarId cambia al abrir/cerrar el modal;
  // estabilizar esta función evita que el Modal se re-renderice en cada cambio de filtros o resultados
  const confirmarEliminar = useCallback(() => {
    if (eliminarId) {
      eliminarMedicamento(eliminarId)
      notificar('Medicamento eliminado permanentemente', 'error')
      setEliminarId(null)
    }
  }, [eliminarId, eliminarMedicamento, notificar])

  const handleLimpiarFiltros = useCallback(() => {
    limpiarFiltros()
    setPrecioMinInput('')
    setPrecioMaxInput('')
    setPrecioMin(0)
    setPrecioMax(Infinity)
  }, [limpiarFiltros])

  const handleSort = (field: SortField) => {
    if (filtros.sortField === field) {
      setFilter('sortDirection', filtros.sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setFilter('sortField', field)
      setFilter('sortDirection', 'asc')
    }
  }

  // useCallback: estabiliza la función exportCSV que se pasa como handler del botón.
  // Depende de resultados (que ya usa useMemo internamente), evitando recreaciones en renders sin cambios
  const exportCSV = useCallback(() => {
    const headers = ['Nombre', 'Principio Activo', 'Categoría', 'Presentación', 'Laboratorio',
      'Precio Compra', 'Precio Venta', 'Stock', 'Stock Mínimo', 'Vencimiento', 'Lote', 'Receta', 'Ubicación']

    const rows = resultados.map((m) => [
      escaparCSV(m.nombre), escaparCSV(m.principioActivo), escaparCSV(m.categoria), escaparCSV(m.presentacion), escaparCSV(m.laboratorio),
      escaparCSV(m.precioCompra), escaparCSV(m.precioVenta), escaparCSV(m.stock), escaparCSV(m.stockMinimo),
      escaparCSV(m.fechaVencimiento), escaparCSV(m.lote), escaparCSV(m.requiereReceta ? 'Sí' : 'No'), escaparCSV(m.ubicacion)
    ])

    // Crear CSV con separador punto y coma para Excel (evita conflictos con comas)
    const csvRows = [headers.join(';'), ...rows.map(r => r.join(';'))]
    const csvContent = csvRows.join('\n')

    // Agregar BOM explícitamente
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meditrack-inventario-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    notificar('Reporte CSV descargado', 'exito')
  }, [resultados, notificar])

  const sortIndicator = (field: SortField) => {
    if (filtros.sortField !== field) return ''
    return filtros.sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <>
      <ToastContainer notificaciones={notificaciones} onEliminar={eliminar} />

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, principio activo o laboratorio..."
              value={filtros.texto}
              onChange={(e) => setFilter('texto', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filtros.categoria} onChange={(e) => setFilter('categoria', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtros.estadoStock} onChange={(e) => setFilter('estadoStock', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow">
            <option value="">Todo stock</option>
            <option value="normal">Stock normal</option>
            <option value="bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>
          <select value={filtros.estadoVencimiento} onChange={(e) => setFilter('estadoVencimiento', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow">
            <option value="">Todo vencimiento</option>
            <option value="vigente">Vigente</option>
            <option value="próximo a vencer">Próximo a vencer</option>
            <option value="vencido">Vencido</option>
          </select>
          <select value={filtros.requiereReceta} onChange={(e) => setFilter('requiereReceta', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow">
            <option value="">Receta: Todos</option>
            <option value="true">Con receta</option>
            <option value="false">Sin receta</option>
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Mín"
              value={precioMinInput}
              onChange={handlePrecioMinChange}
              className="w-24 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Máx"
              value={precioMaxInput}
              onChange={handlePrecioMaxChange}
              className="w-24 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {hayFiltrosActivos && (
            <button onClick={handleLimpiarFiltros}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Limpiar Filtros
            </button>
          )}
          <button onClick={exportCSV}
            className="px-3 py-2 rounded-lg bg-teal-600 text-white text-xs hover:bg-teal-700 transition-colors shadow-sm hover:shadow-md ml-auto">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
        <button onClick={() => handleSort('nombre')} className="text-left hover:text-teal-600 dark:hover:text-teal-400">
          Nombre{sortIndicator('nombre')}
        </button>
        <button onClick={() => handleSort('precioVenta')} className="text-left hover:text-teal-600 dark:hover:text-teal-400">
          Precio{sortIndicator('precioVenta')}
        </button>
        <button onClick={() => handleSort('stock')} className="text-left hover:text-teal-600 dark:hover:text-teal-400">
          Stock{sortIndicator('stock')}
        </button>
        <button onClick={() => handleSort('fechaVencimiento')} className="text-left hover:text-teal-600 dark:hover:text-teal-400">
          Vencimiento{sortIndicator('fechaVencimiento')}
        </button>
        <button onClick={() => handleSort('fechaRegistro')} className="text-left hover:text-teal-600 dark:hover:text-teal-400">
          Registro{sortIndicator('fechaRegistro')}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {resultados.length} de {medicamentos.length} medicamentos encontrados
      </p>

      {resultados.length === 0 ? (
        <EmptyState
          mensaje="No se encontraron medicamentos con los filtros aplicados"
          accion={hayFiltrosActivos ? 'Limpiar filtros' : 'Ir a registrar'}
          onAccion={hayFiltrosActivos ? handleLimpiarFiltros : undefined}
          icono={hayFiltrosActivos ? 'search' : 'empty-box'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resultados.map((m) => (
            <MedicamentoCard key={m.id} medicamento={m} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal
        open={!!eliminarId}
        onClose={() => setEliminarId(null)}
        title="Confirmar Eliminación"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          ¿Estás seguro de eliminar este medicamento? Esta acción es irreversible.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setEliminarId(null)}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Cancelar
          </button>
          <button onClick={confirmarEliminar}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
            Eliminar
          </button>
        </div>
      </Modal>
    </>
  )
}
