<script setup lang="ts">
import { ref } from 'vue'
import { t } from '../lib/i18n'

const emit = defineEmits<{ draw: [] }>()
defineProps<{ disabled?: boolean }>()

/* Flash de rubrique au clic : la confirmation que le geste est parti. */
const firing = ref(false)
function onClick() {
  firing.value = false
  requestAnimationFrame(() => (firing.value = true))
  setTimeout(() => (firing.value = false), 420)
  emit('draw')
}
</script>

<template>
  <button class="draw" :class="{ firing }" type="button" :aria-label="t.drawAria" :disabled="disabled" @click="onClick">
    <span class="label">{{ t.drawAria }}</span>
    <span class="arrow" aria-hidden="true">→</span>
  </button>
</template>

<style scoped>
/* L'action principale du site : pleine largeur, imprimée en plein, grande cible.
   Le public est âgé — rien ici ne dépend du survol ni d'une petite zone de clic. */
.draw {
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  border: 0;
  border-radius: var(--r);
  background: var(--ink);
  color: var(--bg);
  cursor: pointer;
  padding: clamp(20px, min(3.6vw, 3.2svh), 40px) var(--pad);
  text-align: left;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.5, 0.64, 1),
    background 0.22s ease;
}
.label {
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(1.3rem, min(3.6vw, 3.1svh), 2.3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
}
.arrow {
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(1.4rem, min(3.8vw, 3.3svh), 2.4rem);
  line-height: 1;
  transition: transform 0.34s cubic-bezier(0.34, 1.5, 0.64, 1);
}

/* Sur un écran tactile, l'état de survol se colle après un appui et n'en repart plus :
   le bouton reste allumé. Tout ce qui réagit au survol est donc réservé aux pointeurs
   qui survolent vraiment. L'appui, lui, garde son retour par :active. */
@media (hover: hover) {
  .draw:hover:not(:disabled) { background: var(--rubric); transform: translateY(-3px); }
  .draw:hover:not(:disabled) .arrow { transform: translateX(16px); }
}
.draw:active:not(:disabled) { transform: scale(0.985); }
.draw.firing { animation: fire 0.42s cubic-bezier(0.34, 1.6, 0.64, 1); }
.draw.firing .arrow { animation: fly 0.42s cubic-bezier(0.34, 1.6, 0.64, 1); }
@keyframes fire {
  0% { background: var(--rubric); transform: scale(0.985); }
  40% { background: var(--rubric); transform: scale(1.012); }
  100% { background: var(--ink); transform: none; }
}
@keyframes fly {
  0% { transform: translateX(0); }
  45% { transform: translateX(26px); opacity: 0.2; }
  46% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
.draw:disabled { background: var(--card); color: var(--dim); cursor: default; }
.draw:focus-visible { outline: 3px solid var(--rubric-deep); outline-offset: 3px; }
</style>
