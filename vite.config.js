import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext', // permite top-level await al pre-empaquetar dependencias
    },
  },
  build: {
    target: 'esnext', // permite top-level await en el build de producción también
  },
})