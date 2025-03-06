import { pwPlugin } from 'pw-ct-vite-plugin';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  // This could be accomplished with a Nuxt plugin
  devServer: { port: 3100 },
  vite: {
    plugins: [pwPlugin()],
  }
})
