export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))

export const formatDateTime = (date: string): string =>
  new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))

export const generarId = (): string => `med-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
export const generarIdMovimiento = (): string => `mov-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
