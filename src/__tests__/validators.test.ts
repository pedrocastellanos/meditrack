import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { validarNombreUnico, calcularEstadoStock, calcularEstadoVencimiento } from '../utils/validators'
import type { Medicamento } from '../data/types'

const mockMedicamentos: Medicamento[] = [
  {
    id: '1', nombre: 'Paracetamol', principioActivo: 'Paracetamol',
    categoria: 'Analgésicos', presentacion: 'Tabletas', laboratorio: 'Bayer',
    precioCompra: 1000, precioVenta: 2500, stock: 10, stockMinimo: 5,
    fechaVencimiento: '2027-12-31', lote: 'LOT-001', requiereReceta: false,
    ubicacion: 'A1', notas: '', fechaRegistro: '2024-01-01', historialMovimientos: []
  }
]

describe('validarNombreUnico', () => {
  it('retorna false si el nombre ya existe', () => {
    expect(validarNombreUnico('Paracetamol', mockMedicamentos)).toBe(false)
  })

  it('retorna true si el nombre es nuevo', () => {
    expect(validarNombreUnico('Ibuprofeno', mockMedicamentos)).toBe(true)
  })

  it('es case insensitive', () => {
    expect(validarNombreUnico('paracetamol', mockMedicamentos)).toBe(false)
    expect(validarNombreUnico('PARACETAMOL', mockMedicamentos)).toBe(false)
  })

  it('ignora el medicamento con el excludeId', () => {
    expect(validarNombreUnico('Paracetamol', mockMedicamentos, '1')).toBe(true)
  })
})

describe('calcularEstadoStock', () => {
  it('retorna agotado si stock es 0', () => {
    expect(calcularEstadoStock(0, 5)).toBe('agotado')
  })

  it('retorna bajo si stock es menor al mínimo', () => {
    expect(calcularEstadoStock(3, 5)).toBe('bajo')
  })

  it('retorna normal si stock >= mínimo', () => {
    expect(calcularEstadoStock(10, 5)).toBe('normal')
  })
})

describe('calcularEstadoVencimiento', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-01'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna vencido si la fecha ya pasó', () => {
    expect(calcularEstadoVencimiento('2025-05-01')).toBe('vencido')
  })

  it('retorna próximo a vencer si faltan 30 días o menos', () => {
    expect(calcularEstadoVencimiento('2025-06-20')).toBe('próximo a vencer')
    expect(calcularEstadoVencimiento('2025-06-15')).toBe('próximo a vencer')
  })

  it('retorna vigente si falta más de 30 días', () => {
    expect(calcularEstadoVencimiento('2025-12-31')).toBe('vigente')
  })
})
