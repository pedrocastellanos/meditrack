import { useState, useCallback } from 'react'

export type TipoNotificacion = 'exito' | 'advertencia' | 'error'

export interface Notificacion {
  id: string
  mensaje: string
  tipo: TipoNotificacion
}

const colores: Record<TipoNotificacion, string> = {
  exito: 'bg-green-500 text-white',
  advertencia: 'bg-yellow-500 text-black',
  error: 'bg-red-500 text-white'
}

export function useNotification() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const notificar = useCallback((mensaje: string, tipo: TipoNotificacion) => {
    const id = `notif-${Date.now()}`
    setNotificaciones((prev) => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }, [])

  const eliminar = useCallback((id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notificaciones, notificar, eliminar, colores }
}
