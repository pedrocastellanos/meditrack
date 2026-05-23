import { useMemo, useState, useCallback } from 'react'
import type { Medicamento, SortField, SortDirection } from '../data/types'
import { calcularEstadoStock, calcularEstadoVencimiento } from '../utils/validators'

const initialState = {
  texto: '',
  categoria: '',
  estadoStock: '',
  estadoVencimiento: '',
  requiereReceta: '',
  precioMin: 0,
  precioMax: Infinity,
  sortField: 'nombre' as SortField,
  sortDirection: 'asc' as SortDirection
}

export function useFilter(medicamentos: Medicamento[]) {
  const [filtros, setFiltros] = useState(initialState)

  // useCallback: estabiliza la referencia de setFilter a través de renders.
  // Evita que componentes hijos que reciben setFilter como prop se re-rendericen
  // cuando el padre cambia por razones no relacionadas con los filtros.
  const setFilter = useCallback(<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }, [])

  // useCallback: referencia estable para limpiarFiltros.
  // Se pasa a componentes de UI (botón limpiar) sin causar re-renderizados por recreación.
  const limpiarFiltros = useCallback(() => {
    setFiltros(initialState)
  }, [])

  // useMemo: el filtrado y ordenamiento son operaciones O(n log n) que se ejecutan
  // sobre el arreglo completo de medicamentos. Sin memoización, cualquier cambio de estado
  // ajeno (tema, notificaciones) forzaría un recálculo completo. Se memoiza contra
  // [medicamentos, filtros] para solo re-ejecutar cuando los datos o los criterios cambian.
  const resultados = useMemo(() => {
    let items = [...medicamentos]

    if (filtros.texto) {
      const t = filtros.texto.toLowerCase()
      items = items.filter((m) =>
        m.nombre.toLowerCase().includes(t) ||
        m.principioActivo.toLowerCase().includes(t) ||
        m.laboratorio.toLowerCase().includes(t)
      )
    }

    if (filtros.categoria) {
      items = items.filter((m) => m.categoria === filtros.categoria)
    }

    if (filtros.estadoStock) {
      items = items.filter((m) => calcularEstadoStock(m.stock, m.stockMinimo) === filtros.estadoStock)
    }

    if (filtros.estadoVencimiento) {
      items = items.filter((m) => calcularEstadoVencimiento(m.fechaVencimiento) === filtros.estadoVencimiento)
    }

    if (filtros.requiereReceta) {
      items = items.filter((m) => m.requiereReceta === (filtros.requiereReceta === 'true'))
    }

    if (filtros.precioMin > 0) {
      items = items.filter((m) => m.precioVenta >= filtros.precioMin)
    }

    if (filtros.precioMax < Infinity) {
      items = items.filter((m) => m.precioVenta <= filtros.precioMax)
    }

    items.sort((a, b) => {
      let cmp = 0
      const field = filtros.sortField
      if (field === 'nombre') cmp = a.nombre.localeCompare(b.nombre)
      else if (field === 'precioVenta') cmp = a.precioVenta - b.precioVenta
      else if (field === 'stock') cmp = a.stock - b.stock
      else if (field === 'fechaVencimiento') cmp = new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
      else if (field === 'fechaRegistro') cmp = new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime()
      return filtros.sortDirection === 'asc' ? cmp : -cmp
    })

    return items
  }, [medicamentos, filtros])

  return { filtros, setFilter, limpiarFiltros, resultados }
}
