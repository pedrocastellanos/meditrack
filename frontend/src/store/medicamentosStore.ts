import { create } from 'zustand'
import type { Medicamento, Movimiento, MedicamentoFormData } from '@/data/types'
import { api } from '@/utils/api'

interface MedicamentosState {
  medicamentos: Medicamento[]
  cargando: boolean
  error: string | null
  loadInitialData: () => Promise<void>
  agregarMedicamento: (data: MedicamentoFormData) => Promise<void>
  actualizarMedicamento: (id: string, data: Partial<MedicamentoFormData>) => Promise<void>
  eliminarMedicamento: (id: string) => Promise<void>
  registrarMovimiento: (medicamentoId: string, tipo: Movimiento['tipo'], cantidad: number, motivo: string) => Promise<void>
}

export const useMedicamentosStore = create<MedicamentosState>((set, get) => ({
  medicamentos: [],
  cargando: false,
  error: null,

  loadInitialData: async () => {
    if (get().cargando) return
    set({ cargando: true, error: null })
    try {
      set({ medicamentos: await api.listarMedicamentos(), cargando: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudo cargar el inventario', cargando: false })
    }
  },

  agregarMedicamento: async (data) => {
    const nuevo = await api.crearMedicamento(data)
    set((state) => ({ medicamentos: [...state.medicamentos, nuevo], error: null }))
  },

  actualizarMedicamento: async (id, data) => {
    const actualizado = await api.actualizarMedicamento(id, data)
    set((state) => ({ medicamentos: state.medicamentos.map((m) => m.id === id ? actualizado : m), error: null }))
  },

  eliminarMedicamento: async (id) => {
    await api.eliminarMedicamento(id)
    set((state) => ({ medicamentos: state.medicamentos.filter((m) => m.id !== id), error: null }))
  },

  registrarMovimiento: async (medicamentoId, tipo, cantidad, motivo) => {
    const movimiento = await api.registrarMovimiento(medicamentoId, tipo, cantidad, motivo)
    set((state) => ({
      medicamentos: state.medicamentos.map((m) => m.id === medicamentoId
        ? { ...m, stock: movimiento.stockResultante, historialMovimientos: [...m.historialMovimientos, movimiento] }
        : m),
      error: null
    }))
  }
}))
