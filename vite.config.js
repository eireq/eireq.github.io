import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

function spaFallback() {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const index = fileURLToPath(new URL('./dist/index.html', import.meta.url))
      const fallback = fileURLToPath(new URL('./dist/404.html', import.meta.url))
      if (existsSync(index)) copyFileSync(index, fallback)
    }
  }
}

export default defineConfig({
  plugins: [vue(), spaFallback()],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
