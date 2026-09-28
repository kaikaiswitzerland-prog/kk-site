import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Mode simulation du Checkout sur les déploiements PREVIEW de Vercel.
// Vercel expose VERCEL_ENV au build ('preview' | 'production' | 'development',
// réglage « Automatically expose System Environment Variables », actif sur le
// projet). La valeur est figée ICI, au build, en un littéral `true` / `false` :
// en production (VERCEL_ENV=production) comme en local (non défini) c'est
// `false`, et tout ce qui en dépend est éliminé du bundle. Aucune variable
// d'environnement ne peut l'activer en production.
const PREVIEW_DRY_RUN = process.env.VERCEL_ENV === 'preview';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __KK_PREVIEW_DRY_RUN__: JSON.stringify(PREVIEW_DRY_RUN),
  },
  build: {
    outDir: 'dist', // ← très important pour Vercel
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // Expose les variables d'environnement préfixées NEXT_PUBLIC_ au client
  // (en plus du préfixe Vite par défaut VITE_)
  // Dans Vercel : ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
