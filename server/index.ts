import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { mpesaApiRouter } from './routes/mpesaApi.js'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mpesa-local-api' })
})

app.use('/api/mpesa', mpesaApiRouter)

const port = Number(process.env.MPESA_API_PORT || 8787)
app.listen(port, '127.0.0.1', () => {
  console.log(`M-Pesa B2C API listening on http://127.0.0.1:${port}`)
})
