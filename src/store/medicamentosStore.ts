import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Medicamento, Movimiento, MedicamentoFormData } from '../data/types'
import { medicamentosIniciales } from '../data/initialData'
import { generarId, generarIdMovimiento } from '../utils/formatters'

interface MedicamentosState {
  medicamentos: Medicamento[]
  loadInitialData: () => void
  agregarMedicamento: (data: MedicamentoFormData) => void
  actualizarMedicamento: (id: string, data: Partial<MedicamentoFormData>) => void
  eliminarMedicamento: (id: string) => void
  registrarMovimiento: (medicamentoId: string, tipo: 'entrada' | 'salida', cantidad: number, motivo: string) => void
}

export const useMedicamentosStore = create<MedicamentosState>()(
  persist(
    (set, get) => ({
      medicamentos: [],

      loadInitialData: () => {
        if (get().medicamentos.length === 0) {
          set({ medicamentos: medicamentosIniciales })
        }
      },

      agregarMedicamento: (data) => {
        const nuevo: Medicamento = {
          ...data,
          id: generarId(),
          fechaRegistro: new Date().toISOString(),
          historialMovimientos: []
        }
        set((state) => ({
          medicamentos: [...state.medicamentos, nuevo]
        }))
      },

      actualizarMedicamento: (id, data) => {
        set((state) => ({
          medicamentos: state.medicamentos.map((m) =>
            m.id === id ? { ...m, ...data } : m
          )
        }))
      },

      eliminarMedicamento: (id) => {
        set((state) => ({
          medicamentos: state.medicamentos.filter((m) => m.id !== id)
        }))
      },

      registrarMovimiento: (medicamentoId, tipo, cantidad, motivo) => {
        set((state) => ({
          medicamentos: state.medicamentos.map((m) => {
            if (m.id !== medicamentoId) return m
            const stockResultante = tipo === 'entrada'
              ? m.stock + cantidad
              : m.stock - cantidad
            const movimiento: Movimiento = {
              id: generarIdMovimiento(),
              tipo,
              cantidad,
              motivo,
              fecha: new Date().toISOString(),
              stockResultante
            }
            return {
              ...m,
              stock: stockResultante,
              historialMovimientos: [...m.historialMovimientos, movimiento]
            }
          })
        }))
      }
    }),
    {
      name: 'meditrack-storage',
      partialize: (state) => ({ medicamentos: state.medicamentos })
    }
  )
)
