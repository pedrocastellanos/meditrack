import type { Medicamento, MedicamentoFormData, Movimiento } from '@/data/types'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers }
    })
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el backend esté iniciado.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Error de API (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  listarMedicamentos: () => request<Medicamento[]>('/medicamentos'),
  obtenerDashboard: () => request<{
    totalMedicamentos: number; totalUnidades: number; valorCompra: number; valorVenta: number
    stockBajo: number; agotados: number; vencidos: number; proximosVencer: number
    conteoCategorias: [string, number][]; categoriaMasPoblada: string; categoriaMayorValor: string
    porcentajeReceta: number; margenPromedio: number
    mayorMargen: { nombre: string; margen: number; margenPorcentaje: number }
    menorMargen: { nombre: string; margen: number; margenPorcentaje: number }
    inventarioRiesgo: number
  }>('/dashboard'),
  obtenerAlertas: () => request<{ stockBajo: Medicamento[]; agotados: Medicamento[]; vencidos: Medicamento[]; proximosVencer: Medicamento[] }>('/alertas'),
  crearMedicamento: (data: MedicamentoFormData) => request<Medicamento>('/medicamentos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarMedicamento: (id: string, data: Partial<MedicamentoFormData>) => request<Medicamento>(`/medicamentos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarMedicamento: (id: string) => request<void>(`/medicamentos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  registrarMovimiento: (id: string, tipo: Movimiento['tipo'], cantidad: number, motivo: string) =>
    request<Movimiento>(`/medicamentos/${encodeURIComponent(id)}/movimientos`, { method: 'POST', body: JSON.stringify({ tipo, cantidad, motivo }) })
}
