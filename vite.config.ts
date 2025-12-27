
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false, // Desactivar sourcemaps en producción acelera el build
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar librerías pesadas en sus propios archivos para cacheo y velocidad
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
            'vendor-maps': ['mapbox-gl'],
            'vendor-ai': ['@google/genai'],
            'vendor-capacitor': ['@capacitor/core', '@capacitor/geolocation']
          }
        }
      }
    },
  }
})
