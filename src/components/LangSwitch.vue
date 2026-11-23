<script setup lang="ts">
import { LANGS, lang, setLang } from '../lib/i18n'
</script>

<template>
  <nav class="langs" aria-label="Language">
    <button
      v-for="l in LANGS"
      :key="l"
      type="button"
      :class="{ on: l === lang }"
      :aria-pressed="l === lang"
      @click="setLang(l)"
    >
      {{ l.toUpperCase() }}
    </button>
  </nav>
</template>

<style scoped>
.langs { display: flex; gap: 2px; }
/* La langue courante prend la pastille blanche, comme l'onglet actif du spécimen. */
button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  opacity: 0.55;
  font: 400 0.85rem/1 var(--sans);
  letter-spacing: 0.04em;
  padding: 8px 13px;
  cursor: pointer;
  transition:
    transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.2s ease,
    opacity 0.2s ease;
}
@media (hover: hover) {
  button:hover { opacity: 1; transform: translateY(-1px); }
}
button:active { transform: scale(0.94); }
button.on { background: var(--bg); opacity: 1; }
button:focus-visible { outline: 2px solid var(--rubric-deep); outline-offset: 2px; }
</style>
