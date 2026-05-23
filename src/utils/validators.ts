import type { Medicamento } from '@/data/types'

export function validarNombreUnico(nombre: string, medicamentos: Medicamento[], excludeId?: string): boolean {
  const nombreLower = nombre.toLowerCase().trim()
  return !medicamentos.some(m =>
    m.nombre.toLowerCase().trim() === nombreLower && m.id !== excludeId
  )
}

export function calcularEstadoStock(stock: number, stockMinimo: number): 'normal' | 'bajo' | 'agotado' {
  if (stock <= 0) return 'agotado'
  if (stock < stockMinimo) return 'bajo'
  return 'normal'
}

export function calcularEstadoVencimiento(fechaVencimiento: string): 'vigente' | 'próximo a vencer' | 'vencido' {
  const hoy = new Date()
  const venc = new Date(fechaVencimiento)
  if (venc < hoy) return 'vencido'
  const diff = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'próximo a vencer'
  return 'vigente'
}
