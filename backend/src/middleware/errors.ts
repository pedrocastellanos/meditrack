import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Datos inválidos', details: error.issues })
    return
  }
  if (error?.code === 'P2025') {
    res.status(404).json({ error: 'Recurso no encontrado' })
    return
  }
  if (error?.code === 'P2002') {
    res.status(409).json({ error: 'Ya existe un medicamento con ese nombre' })
    return
  }
  if (error?.status === 422) {
    res.status(422).json({ error: error.message })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Error interno del servidor' })
}
