import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 1. OBLIGAR A ESCUCHAR EN TODAS LAS REDES
    host: '0.0.0.0', 
    port: 5173,
    
    // 2. PERMITIR QUE CLOUDFLARE ENTRE (Vital para evitar el error 1033)
    allowedHosts: true, 

    // 3. PUENTE HACIA EL BACKEND (Vital para evitar "Error al conectar")
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // Usamos IP numérica explícita
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})