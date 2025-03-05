import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pwPlugin } from 'pw-ct-vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  server: { port: 3100 },
  plugins: [react(), pwPlugin()],
})
