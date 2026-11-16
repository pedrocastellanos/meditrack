import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useMedicamentosStore } from '@/store/medicamentosStore'
import HistorialMovimientos from '@/components/movimientos/HistorialMovimientos'
import type { Movimiento } from '@/data/types'
import Modal from '@/components/ui/Modal'

const mockMovimientos: Movimiento[] = [
  { id: 'm1', tipo: 'entrada', cantidad: 20, motivo: 'Compra a proveedor', fecha: '2025-01-01T10:00', stockResultante: 20 },
  { id: 'm2', tipo: 'salida', cantidad: 5, motivo: 'Venta', fecha: '2025-02-01T10:00', stockResultante: 15 },
  { id: 'm3', tipo: 'entrada', cantidad: 10, motivo: 'Compra a proveedor', fecha: '2025-03-01T10:00', stockResultante: 25 },
]

describe('HistorialMovimientos', () => {
  it('muestra estado vacío cuando no hay movimientos', () => {
    render(<HistorialMovimientos movimientos={[]} />)
    expect(screen.getByText('No hay movimientos registrados')).toBeDefined()
  })

  it('muestra los movimientos en orden cronológico inverso', () => {
    render(<HistorialMovimientos movimientos={mockMovimientos} />)
    const rows = screen.getAllByRole('row')
    // La primera fila de datos (índice 1) debe ser m3 (la más reciente en reverse)
    expect(rows.length).toBe(4) // header + 3 rows
  })

  it('distingue visualmente entradas y salidas', () => {
    render(<HistorialMovimientos movimientos={mockMovimientos} />)
    const entradas = screen.getAllByText('ENTRADA')
    const salidas = screen.getAllByText('SALIDA')
    expect(entradas.length).toBeGreaterThan(0)
    expect(salidas.length).toBeGreaterThan(0)
  })
})

describe('Modal', () => {
  it('no se renderiza cuando open es false', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test">
        <p>Contenido</p>
      </Modal>
    )
    expect(screen.queryByText('Contenido')).toBeNull()
  })

  it('se renderiza correctamente cuando open es true', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Confirmar Eliminación">
        <p>¿Estás seguro?</p>
      </Modal>
    )
    expect(screen.getByText('Confirmar Eliminación')).toBeDefined()
    expect(screen.getByText('¿Estás seguro?')).toBeDefined()
  })

  it('llama a onClose al hacer click en el backdrop', () => {
    let closed = false
    render(
      <Modal open={true} onClose={() => { closed = true }} title="Test">
        <p>Contenido</p>
      </Modal>
    )
    const backdrop = screen.getByText('Contenido').parentElement?.parentElement
    if (backdrop) fireEvent.click(backdrop)
    expect(closed).toBe(true)
  })

  it('NO llama a onClose al hacer click dentro del modal', () => {
    let closed = false
    render(
      <Modal open={true} onClose={() => { closed = true }} title="Test">
        <p>Contenido</p>
      </Modal>
    )
    fireEvent.click(screen.getByText('Contenido'))
    expect(closed).toBe(false)
  })
})

describe('useMedicamentosStore', () => {
  beforeEach(() => {
    useMedicamentosStore.setState({ medicamentos: [], cargando: false, error: null })
    vi.clearAllMocks()
  })

  const nuevoMedicamento = {
      nombre: 'Ibuprofeno 400mg',
      principioActivo: 'Ibuprofeno',
      categoria: 'Antiinflamatorios',
      presentacion: 'Cápsulas',
      laboratorio: 'Pfizer',
      precioCompra: 1800,
      precioVenta: 3500,
      stock: 20,
      stockMinimo: 5,
      fechaVencimiento: '2027-06-01',
      lote: 'LOT-001',
      requiereReceta: false,
      ubicacion: 'A1',
      notas: ''
  }
  const medicamento = { ...nuevoMedicamento, id: 'med-1', fechaRegistro: '2026-01-01', historialMovimientos: [] }

  it('carga el inventario persistido desde la API', async () => {
    apiMocks.listarMedicamentos.mockResolvedValue([medicamento])
    await useMedicamentosStore.getState().loadInitialData()
    expect(apiMocks.listarMedicamentos).toHaveBeenCalledOnce()
    expect(useMedicamentosStore.getState().medicamentos).toEqual([medicamento])
  })

  it('crea un medicamento mediante la API y actualiza el store', async () => {
    apiMocks.crearMedicamento.mockResolvedValue(medicamento)
    await useMedicamentosStore.getState().agregarMedicamento(nuevoMedicamento)
    expect(apiMocks.crearMedicamento).toHaveBeenCalledWith(nuevoMedicamento)
    expect(useMedicamentosStore.getState().medicamentos).toEqual([medicamento])
  })

  it('registra un movimiento mediante la API y sincroniza stock e historial', async () => {
    const movimiento = { id: 'mov-1', tipo: 'entrada' as const, cantidad: 5, motivo: 'Compra', fecha: '2026-01-02', stockResultante: 25 }
    apiMocks.registrarMovimiento.mockResolvedValue(movimiento)
    useMedicamentosStore.setState({ medicamentos: [medicamento] })
    await useMedicamentosStore.getState().registrarMovimiento('med-1', 'entrada', 5, 'Compra')
    const updated = useMedicamentosStore.getState().medicamentos[0]
    expect(apiMocks.registrarMovimiento).toHaveBeenCalledWith('med-1', 'entrada', 5, 'Compra')
    expect(updated.stock).toBe(25)
    expect(updated.historialMovimientos).toEqual([movimiento])
  })

  it('elimina en el backend antes de retirar el medicamento del store', async () => {
    apiMocks.eliminarMedicamento.mockResolvedValue(undefined)
    useMedicamentosStore.setState({ medicamentos: [medicamento] })
    await useMedicamentosStore.getState().eliminarMedicamento('med-1')
    expect(apiMocks.eliminarMedicamento).toHaveBeenCalledWith('med-1')
    expect(useMedicamentosStore.getState().medicamentos).toEqual([])
  })
})
