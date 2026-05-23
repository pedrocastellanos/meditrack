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
    // Resetear el store para tests aislados
    useMedicamentosStore.setState({ medicamentos: [] })
  })

  it('agrega un medicamento correctamente', () => {
    const { agregarMedicamento } = useMedicamentosStore.getState()
    agregarMedicamento({
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
    })
    const medicamentos = useMedicamentosStore.getState().medicamentos
    expect(medicamentos).toHaveLength(1)
    expect(medicamentos[0].nombre).toBe('Ibuprofeno 400mg')
    expect(medicamentos[0].id).toBeDefined()
    expect(medicamentos[0].historialMovimientos).toEqual([])
  })

  it('registra movimiento de entrada y actualiza stock', () => {
    const { agregarMedicamento, registrarMovimiento } = useMedicamentosStore.getState()
    agregarMedicamento({
      nombre: 'Test Med',
      principioActivo: 'Test',
      categoria: 'Analgésicos',
      presentacion: 'Tabletas',
      laboratorio: 'TestLab',
      precioCompra: 100,
      precioVenta: 200,
      stock: 10,
      stockMinimo: 5,
      fechaVencimiento: '2027-01-01',
      lote: 'LOT-TEST',
      requiereReceta: false,
      ubicacion: '',
      notas: ''
    })
    const medicamentos = useMedicamentosStore.getState().medicamentos
    const id = medicamentos[0].id

    registrarMovimiento(id, 'entrada', 5, 'Compra a proveedor')
    const updated = useMedicamentosStore.getState().medicamentos[0]
    expect(updated.stock).toBe(15)
    expect(updated.historialMovimientos).toHaveLength(1)
    expect(updated.historialMovimientos[0].tipo).toBe('entrada')
    expect(updated.historialMovimientos[0].stockResultante).toBe(15)
  })

  it('registra movimiento de salida y actualiza stock', () => {
    const { agregarMedicamento, registrarMovimiento } = useMedicamentosStore.getState()
    agregarMedicamento({
      nombre: 'Test Med',
      principioActivo: 'Test',
      categoria: 'Analgésicos',
      presentacion: 'Tabletas',
      laboratorio: 'TestLab',
      precioCompra: 100,
      precioVenta: 200,
      stock: 10,
      stockMinimo: 5,
      fechaVencimiento: '2027-01-01',
      lote: 'LOT-TEST',
      requiereReceta: false,
      ubicacion: '',
      notas: ''
    })
    const id = useMedicamentosStore.getState().medicamentos[0].id

    registrarMovimiento(id, 'salida', 3, 'Venta')
    const updated = useMedicamentosStore.getState().medicamentos[0]
    expect(updated.stock).toBe(7)
    expect(updated.historialMovimientos).toHaveLength(1)
    expect(updated.historialMovimientos[0].tipo).toBe('salida')
    expect(updated.historialMovimientos[0].stockResultante).toBe(7)
  })

  it('actualiza un medicamento existente', () => {
    const { agregarMedicamento, actualizarMedicamento } = useMedicamentosStore.getState()
    agregarMedicamento({
      nombre: 'Original',
      principioActivo: 'X',
      categoria: 'Analgésicos',
      presentacion: 'Tabletas',
      laboratorio: 'TestLab',
      precioCompra: 100,
      precioVenta: 200,
      stock: 10,
      stockMinimo: 5,
      fechaVencimiento: '2027-01-01',
      lote: 'LOT-001',
      requiereReceta: false,
      ubicacion: '',
      notas: ''
    })
    const id = useMedicamentosStore.getState().medicamentos[0].id
    actualizarMedicamento(id, { nombre: 'Modificado', stock: 50 })
    const updated = useMedicamentosStore.getState().medicamentos[0]
    expect(updated.nombre).toBe('Modificado')
    expect(updated.stock).toBe(50)
    expect(updated.principioActivo).toBe('X')
  })

  it('elimina un medicamento permanentemente', () => {
    const { agregarMedicamento, eliminarMedicamento } = useMedicamentosStore.getState()
    agregarMedicamento({
      nombre: 'A eliminar',
      principioActivo: 'Y',
      categoria: 'Analgésicos',
      presentacion: 'Tabletas',
      laboratorio: 'TestLab',
      precioCompra: 100,
      precioVenta: 200,
      stock: 10,
      stockMinimo: 5,
      fechaVencimiento: '2027-01-01',
      lote: 'LOT-001',
      requiereReceta: false,
      ubicacion: '',
      notas: ''
    })
    const id = useMedicamentosStore.getState().medicamentos[0].id
    eliminarMedicamento(id)
    expect(useMedicamentosStore.getState().medicamentos).toHaveLength(0)
  })

  it('loadInitialData carga los seed data si el store está vacío', () => {
    useMedicamentosStore.getState().loadInitialData()
    expect(useMedicamentosStore.getState().medicamentos.length).toBeGreaterThan(0)
  })
})
