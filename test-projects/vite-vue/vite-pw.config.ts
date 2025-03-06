import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { pwPlugin } from 'pw-ct-vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), pwPlugin()],
})
