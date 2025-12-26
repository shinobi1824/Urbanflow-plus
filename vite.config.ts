import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno basadas en el modo actual (development/production)
  // El tercer parámetro '' le dice a Vite que cargue todas las variables, no solo las que empiezan por VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Mapeamos la variable segura VITE_GEMINI_API_KEY a process.env.API_KEY
      // Esto cumple con los requisitos del código fuente sin exponer la clave en el repositorio
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})