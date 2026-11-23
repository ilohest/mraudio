import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` produit un seul fichier HTML (aperçu, intégration en iframe).
export default defineConfig(({ command, mode }) => ({
  base: './',
  // `public/` ne contient que les liens symboliques vers les 1,5 Go d'audios, pour le
  // serveur de développement. Le build ne doit jamais les recopier dans dist/ : les audios
  // sont assemblés à part, en liens durs, par scripts/deploy.mjs.
  publicDir: command === 'serve' ? 'public' : false,
  plugins: [vue(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000 } : {},
}))
