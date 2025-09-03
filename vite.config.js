import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/docfront/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    copyPublicDir: true,
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    host: true,
    open: true
  }
}))
