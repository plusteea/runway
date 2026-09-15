import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

function nbrbProxy(): Plugin {
  async function handle(_req: IncomingMessage, res: ServerResponse) {
    try {
      const response = await fetch('https://api.nbrb.by/exrates/rates/431')
      const body = await response.text()
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(body)
    } catch {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'nbrb_unavailable' }))
    }
  }

  return {
    name: 'nbrb-proxy',
    configureServer(server) {
      server.middlewares.use('/api/nbrb/usd', handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/nbrb/usd', handle)
    },
  }
}

export default defineConfig({
  base: process.env.BASE || '/',
  plugins: [react(), tailwindcss(), nbrbProxy()],
})
