import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilter } from '@/hooks/useFilter'
import type { Medicamento } from '@/data/types'

const mockMedicamentos: Medicamento[] = [
  {
    id: '1', nombre: 'Paracetamol', principioActivo: 'Paracetamol',
    categoria: 'Analgésicos', presentacion: 'Tabletas', laboratorio: 'Bayer',
    precioCompra: 1000, precioVenta: 2500, stock: 10, stockMinimo: 5,
    fechaVencimiento: '2027-12-31', lote: 'LOT-001', requiereReceta: false,
    ubicacion: 'A1', notas: '', fechaRegistro: '2024-01-01', historialMovimientos: []
  },
  {
    id: '2', nombre: 'Amoxicilina', principioActivo: 'Amoxicilina',
    categoria: 'Antibióticos', presentacion: 'Cápsulas', laboratorio: 'Roche',
    precioCompra: 2500, precioVenta: 5000, stock: 0, stockMinimo: 5,
    fechaVencimiento: '2026-06-15', lote: 'LOT-002', requiereReceta: true,
    ubicacion: 'B1', notas: '', fechaRegistro: '2024-02-01', historialMovimientos: []
  },
  {
    id: '3', nombre: 'Ibuprofeno', principioActivo: 'Ibuprofeno',
    categoria: 'Antiinflamatorios', presentacion: 'Cápsulas', laboratorio: 'Pfizer',
    precioCompra: 1800, precioVenta: 3500, stock: 3, stockMinimo: 8,
    fechaVencimiento: '2025-05-01', lote: 'LOT-003', requiereReceta: false,
    ubicacion: 'A2', notas: '', fechaRegistro: '2024-03-01', historialMovimientos: []
  }
]

describe('useFilter', () => {
  it('retorna todos los medicamentos sin filtros', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    expect(result.current.resultados).toHaveLength(3)
  })

  it('filtra por texto en nombre (case insensitive)', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('texto', 'paracetamol'))
    expect(result.current.resultados).toHaveLength(1)
    expect(result.current.resultados[0].nombre).toBe('Paracetamol')
  })

  it('filtra por texto en principio activo', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('texto', 'amoxi'))
    expect(result.current.resultados).toHaveLength(1)
    expect(result.current.resultados[0].nombre).toBe('Amoxicilina')
  })

  it('filtra por texto en laboratorio', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('texto', 'pfizer'))
    expect(result.current.resultados).toHaveLength(1)
  })

  it('filtra por categoría', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('categoria', 'Analgésicos'))
    expect(result.current.resultados).toHaveLength(1)
  })

  it('filtra por estado de stock agotado (stock 0)', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('estadoStock', 'agotado'))
    expect(result.current.resultados).toHaveLength(1)
    expect(result.current.resultados[0].nombre).toBe('Amoxicilina')
  })

  it('filtra por requiere receta', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('requiereReceta', 'true'))
    expect(result.current.resultados).toHaveLength(1)
    expect(result.current.resultados[0].nombre).toBe('Amoxicilina')
  })

  it('ordena por nombre ascendente', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    expect(result.current.resultados[0].nombre).toBe('Amoxicilina')
    expect(result.current.resultados[2].nombre).toBe('Paracetamol')
  })

  it('ordena por nombre descendente', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('sortDirection', 'desc'))
    expect(result.current.resultados[0].nombre).toBe('Paracetamol')
    expect(result.current.resultados[2].nombre).toBe('Amoxicilina')
  })

  it('limpia todos los filtros', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('texto', 'paracetamol'))
    act(() => result.current.setFilter('categoria', 'Analgésicos'))
    act(() => result.current.limpiarFiltros())
    expect(result.current.resultados).toHaveLength(3)
  })

  it('retorna arreglo vacío si no hay coincidencias', () => {
    const { result } = renderHook(() => useFilter(mockMedicamentos))
    act(() => result.current.setFilter('texto', 'xyz123'))
    expect(result.current.resultados).toHaveLength(0)
  })
})
