import express from 'express'
import cors from 'cors'
import apiRouter from './routes'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Use consolidated API routes
app.use('/api', apiRouter)

// 404 handler — always return JSON, never HTML
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler — always return JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[backend] Unhandled error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

export function startServer() {
  app.listen(port, () => {
    console.log(`🚀 Express server running locally on http://localhost:${port}`)
  })
}
