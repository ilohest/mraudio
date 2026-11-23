<script setup lang="ts">
import { ref } from 'vue'
import { t } from '../lib/i18n'

const emit = defineEmits<{ draw: [] }>()
defineProps<{ disabled?: boolean }>()

/* Court éclair d'accent au clic : le seul « effet » que s'autorise le brutalisme. */
const firing = ref(false)
function onClick() {
  firing.value = true
  setTimeout(() => (firing.value = false), 160)
  emit('draw')
}
</script>

<template>
  <button class="draw" :class="{ firing }" type="button" :aria-label="t.drawAria" :disabled="disabled" @click="onClick">
    <span class="label">{{ t.drawAria }}</span>
    <span class="arrow" aria-hidden="true">⟶</span>
  </button>
</template>

<style scoped>
.draw {
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  padding: clamp(22px, 4vw, 34px) var(--gutter);
  text-align: left;
  transition: background 0.12s linear, color 0.12s linear;
}
.label {
  font: 600 clamp(0.82rem, 2.2vw, 1.05rem)/1.1 var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.arrow { font-size: 1.5rem; line-height: 1; transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }

.draw:hover:not(:disabled) { background: var(--ink); color: var(--paper); }
.draw:hover:not(:disabled) .arrow { transform: translateX(12px); }
.draw.firing { background: var(--accent); color: #fff; }
.draw:disabled { color: var(--dim); cursor: default; }
.draw:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }
</style>
