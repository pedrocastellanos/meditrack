import express from 'express'
import cors from 'cors'
import { medicamentosRouter } from './routes/medicamentos.js'
import { dashboardRouter } from './routes/dashboard.js'
import { errorHandler, notFound } from './middleware/errors.js'

export const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/medicamentos', medicamentosRouter)
app.use('/api', dashboardRouter)
app.use(notFound)
app.use(errorHandler)
