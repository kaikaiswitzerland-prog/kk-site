import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist', // ← très important pour Vercel
  },
  // Expose les variables d'environnement préfixées NEXT_PUBLIC_ au client
  // (en plus du préfixe Vite par défaut VITE_)
  // Dans Vercel : ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
