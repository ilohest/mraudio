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
.langs { display: flex; }
button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--dim);
  font: 500 0.66rem/1 var(--mono);
  letter-spacing: 0.2em;
  padding: 6px 9px;
  cursor: pointer;
  transition: color 0.12s linear, background 0.12s linear;
}
button:hover { color: var(--ink); }
button.on { background: var(--ink); color: var(--paper); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
</style>
