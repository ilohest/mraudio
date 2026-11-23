import { createApp } from 'vue'
// Polices auto-hébergées (pas d'appel à Google Fonts → RGPD).
// Archivo : axes graisse ET largeur, pour la typographie démesurée.
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './styles.css'
import App from './App.vue'

createApp(App).mount('#app')
