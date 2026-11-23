import { createApp } from 'vue'
// Les deux fontes (Ortica Linear Light, Ronzino Regular) sont auto-hébergées et
// déclarées en @font-face dans styles.css — aucun appel à un service extérieur.
import './styles.css'
import App from './App.vue'

createApp(App).mount('#app')
