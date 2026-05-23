import { useMemo, useState, useCallback } from 'react'
import { useMedicamentosStore } from '../store/medicamentosStore'
import { useFilter } from '../hooks/useFilter'
import { useNotification } from '../hooks/useNotification'
import { CATEGORIAS } from '../data/constants'
import MedicamentoCard from '../components/medicamentos/MedicamentoCard'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ToastContainer from '../components/notificaciones/ToastContainer'
import type { SortField } from '../data/types'

export default function Inventario() {
  const medicamentos = useMedicamentosStore((s) => s.medicamentos)
  const eliminarMedicamento = useMedicamentosStore((s) => s.eliminarMedicamento)
  const { filtros, setFilter, limpiarFiltros, resultados } = useFilter(medicamentos)
  const { notificaciones, notificar, eliminar } = useNotification()
  const [eliminarId, setEliminarId] = useState<string | null>(null)

  const hayFiltrosActivos = useMemo(() =>
    filtros.texto !== '' || filtros.categoria !== '' || filtros.estadoStock !== '' ||
    filtros.estadoVencimiento !== '' || filtros.requiereReceta !== '' ||
    filtros.precioMin > 0 || filtros.precioMax < Infinity,
    [filtros]
  )

  const handleDelete = useCallback((id: string) => {
    setEliminarId(id)
  }, [])

  const confirmarEliminar = useCallback(() => {
    if (eliminarId) {
      eliminarMedicamento(eliminarId)
      notificar('Medicamento eliminado permanentemente', 'error')
      setEliminarId(null)
    }
  }, [eliminarId, eliminarMedicamento, notificar])

  const handleSort = (field: SortField) => {
    if (filtros.sortField === field) {
      setFilter('sortDirection', filtros.sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setFilter('sortField', field)
      setFilter('sortDirection', 'asc')
    }
  }

  const exportCSV = useCallback(() => {
    const headers = ['Nombre', 'Principio Activo', 'Categoría', 'Presentación', 'Laboratorio',
      'Precio Compra', 'Precio Venta', 'Stock', 'Stock Mínimo', 'Vencimiento', 'Lote', 'Receta', 'Ubicación']
    const rows = resultados.map((m) => [
      m.nombre, m.principioActivo, m.categoria, m.presentacion, m.laboratorio,
      m.precioCompra, m.precioVenta, m.stock, m.stockMinimo,
      m.fechaVencimiento, m.lote, m.requiereReceta ? 'Sí' : 'No', m.ubicacion
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar por nombre, principio activo o laboratorio..."
            value={filtros.texto}
            onChange={(e) => setFilter('texto', e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filtros.categoria} onChange={(e) => setFilter('categoria', e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtros.estadoStock} onChange={(e) => setFilter('estadoStock', e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs">
            <option value="">Todo stock</option>
            <option value="normal">Stock normal</option>
            <option value="bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>
          <select value={filtros.estadoVencimiento} onChange={(e) => setFilter('estadoVencimiento', e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs">
            <option value="">Todo vencimiento</option>
            <option value="vigente">Vigente</option>
            <option value="próximo a vencer">Próximo a vencer</option>
            <option value="vencido">Vencido</option>
          </select>
          <select value={filtros.requiereReceta} onChange={(e) => setFilter('requiereReceta', e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs">
            <option value="">Receta: Todos</option>
            <option value="true">Con receta</option>
            <option value="false">Sin receta</option>
          </select>
          <input type="number" placeholder="Precio min" value={filtros.precioMin || ''}
            onChange={(e) => setFilter('precioMin', Number(e.target.value))}
            className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs" />
          <input type="number" placeholder="Precio max" value={filtros.precioMax === Infinity ? '' : filtros.precioMax}
            onChange={(e) => setFilter('precioMax', e.target.value ? Number(e.target.value) : Infinity)}
            className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs" />
          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Limpiar Filtros
            </button>
          )}
          <button onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 transition-colors ml-auto">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
        <button onClick={() => handleSort('nombre')} className="text-left hover:text-blue-600 dark:hover:text-blue-400">
          Nombre{sortIndicator('nombre')}
        </button>
        <button onClick={() => handleSort('precioVenta')} className="text-left hover:text-blue-600 dark:hover:text-blue-400">
          Precio{sortIndicator('precioVenta')}
        </button>
        <button onClick={() => handleSort('stock')} className="text-left hover:text-blue-600 dark:hover:text-blue-400">
          Stock{sortIndicator('stock')}
        </button>
        <button onClick={() => handleSort('fechaVencimiento')} className="text-left hover:text-blue-600 dark:hover:text-blue-400">
          Vencimiento{sortIndicator('fechaVencimiento')}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {resultados.length} de {medicamentos.length} medicamentos encontrados
      </p>

      {resultados.length === 0 ? (
        <EmptyState
          mensaje="No se encontraron medicamentos con los filtros aplicados"
          accion={hayFiltrosActivos ? 'Limpiar filtros' : 'Ir a registrar'}
          onAccion={hayFiltrosActivos ? limpiarFiltros : undefined}
          icono={hayFiltrosActivos ? '🔍' : '💊'}
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
