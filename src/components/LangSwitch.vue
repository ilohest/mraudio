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
.langs {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.35);
}
button {
  appearance: none;
  border: 0;
  background: none;
  font: 500 0.72rem/1 var(--sans);
  letter-spacing: 0.12em;
  color: var(--muted);
  padding: 7px 11px 6px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.25s, color 0.25s;
}
button:hover { color: var(--ink); }
button.on { background: var(--ink); color: var(--paper); }
button:focus-visible { outline: 1px solid var(--gold); outline-offset: 2px; }
</style>
