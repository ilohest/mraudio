import { createApp } from 'vue'
// Polices auto-hébergées (pas d'appel à Google Fonts → RGPD).
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import './styles.css'
import App from './App.vue'

createApp(App).mount('#app')
