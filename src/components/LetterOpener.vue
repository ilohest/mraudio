<script setup lang="ts">
import { ref } from 'vue'
import knife from '../assets/paper-knife.webp'
import { t } from '../lib/i18n'

const emit = defineEmits<{ draw: [] }>()
const props = defineProps<{ disabled?: boolean }>()
const cutting = ref(false)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function onClick() {
  if (cutting.value || props.disabled) return
  if (reduced) return emit('draw')
  cutting.value = true
  // Le tirage se déclenche au moment où la lame « tranche » le papier.
  setTimeout(() => emit('draw'), 520)
  setTimeout(() => (cutting.value = false), 1100)
}
</script>

<template>
  <div class="opener" :class="{ cutting }">
    <button class="knife-btn" type="button" :aria-label="t.drawAria" :disabled="disabled" @click="onClick">
      <img class="knife" :src="knife" alt="" width="973" height="148" draggable="false" />
    </button>
    <span class="slit" aria-hidden="true"></span>
    <p class="hint">{{ t.drawHint }}</p>
  </div>
</template>

<style scoped>
.opener {
  position: relative;
  display: grid;
  justify-items: center;
  padding: 8px 0 0;
}
.knife-btn {
  appearance: none;
  border: 0;
  background: none;
  padding: 18px 8px 22px;
  cursor: pointer;
  width: min(460px, 86vw);
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}
.knife-btn:focus-visible {
  outline: 1px solid var(--gold);
  outline-offset: 4px;
}
.knife-btn:disabled { cursor: default; opacity: 0.5; }
.knife {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  filter: drop-shadow(0 10px 10px rgb(60 42 18 / 0.18)) drop-shadow(0 2px 2px rgb(60 42 18 / 0.2));
  transform: rotate(-3deg);
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s;
  animation: idle 6s ease-in-out infinite;
}
.knife-btn:hover:not(:disabled) .knife {
  transform: rotate(-1deg) translateY(-4px) scale(1.015);
  filter: drop-shadow(0 18px 16px rgb(60 42 18 / 0.2)) drop-shadow(0 2px 2px rgb(60 42 18 / 0.2));
}
.knife-btn:active:not(:disabled) .knife { transform: rotate(-1deg) translateY(-1px) scale(0.99); }

@keyframes idle {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -3px; }
}

/* Le geste : la lame recule, puis traverse la page de gauche à droite. */
.cutting .knife { animation: cut 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
@keyframes cut {
  0% { transform: rotate(-3deg) translateX(0); opacity: 1; }
  28% { transform: rotate(-6deg) translateX(-7%); }
  55% { transform: rotate(0deg) translateX(16%); opacity: 1; }
  56% { opacity: 0; transform: rotate(0deg) translateX(16%); }
  57% { transform: rotate(-3deg) translateX(-6%); opacity: 0; }
  100% { transform: rotate(-3deg) translateX(0); opacity: 1; }
}

/* Fente dorée laissée par la lame. */
.slit {
  position: absolute;
  left: 50%;
  top: 56%;
  width: min(520px, 90vw);
  height: 1px;
  translate: -50% 0;
  background: linear-gradient(90deg, transparent, var(--gold) 20%, #fff8e0 50%, var(--gold) 80%, transparent);
  transform: scaleX(0);
  opacity: 0;
  pointer-events: none;
}
.cutting .slit { animation: slit 1.05s ease-out forwards; }
@keyframes slit {
  0%, 35% { transform: scaleX(0); opacity: 0; transform-origin: left; }
  55% { transform: scaleX(1); opacity: 1; transform-origin: left; }
  100% { transform: scaleX(1); opacity: 0; transform-origin: left; box-shadow: 0 0 18px 2px rgb(201 162 90 / 0.5); }
}

.hint {
  margin: 0;
  font-family: var(--sans);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: var(--muted);
}

@media (prefers-reduced-motion: reduce) {
  .knife { animation: none; }
}
</style>
