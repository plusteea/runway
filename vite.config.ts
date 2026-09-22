import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

function nbrbProxy(): Plugin {
  function handle(code: '431' | '451') {
    return async (_req: IncomingMessage, res: ServerResponse) => {
      try {
        const response = await fetch(`https://api.nbrb.by/exrates/rates/${code}`)
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
  }

  return {
    name: 'nbrb-proxy',
    configureServer(server) {
      server.middlewares.use('/api/nbrb/usd', handle('431'))
      server.middlewares.use('/api/nbrb/eur', handle('451'))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/nbrb/usd', handle('431'))
      server.middlewares.use('/api/nbrb/eur', handle('451'))
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/runway/' : '/',
  plugins: [react(), tailwindcss(), nbrbProxy()],
}))
