import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import spaFallback from 'vite-plugin-spa-fallback'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    spaFallback()
  ],

  base: '/',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})