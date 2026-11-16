export interface Movimiento {
  id: string
  tipo: 'entrada' | 'salida'
  cantidad: number
  motivo: string
  fecha: string
  stockResultante: number
}

export interface Medicamento {
  id: string
  nombre: string
  principioActivo: string
  categoria: string
  presentacion: string
  laboratorio: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo: number
  fechaVencimiento: string
  lote: string
  requiereReceta: boolean
  ubicacion: string
  notas: string
  fechaRegistro: string
  historialMovimientos: Movimiento[]
}

export interface MedicamentoFormData {
  nombre: string
  principioActivo: string
  categoria: string
  presentacion: string
  laboratorio: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo: number
  fechaVencimiento: string
  lote: string
  requiereReceta: boolean
  ubicacion: string
  notas: string
}

export type SortField = 'nombre' | 'precioVenta' | 'stock' | 'fechaVencimiento' | 'fechaRegistro'
export type SortDirection = 'asc' | 'desc'

export interface FilterState {
  texto: string
  categoria: string
  estadoStock: string
  estadoVencimiento: string
  requiereReceta: string
  precioMin: number
  precioMax: number
  sortField: SortField
  sortDirection: SortDirection
}
