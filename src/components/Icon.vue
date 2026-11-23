<script setup lang="ts">
/**
 * Icônes dessinées à la main : cinq suffisent, une dépendance n'en valait pas la peine.
 * Les commandes de transport sont pleines (c'est la convention des lecteurs et ça se lit
 * d'un coup d'œil), le reste est au trait, à la même graisse que les filets de la page.
 */
defineProps<{ name: 'play' | 'pause' | 'prev' | 'next' | 'restart' | 'link' | 'check' | 'arrow' }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path v-if="name === 'play'" d="M7.8 4.8 19.4 12 7.8 19.2Z" fill="currentColor" />
    <g v-else-if="name === 'pause'" fill="currentColor">
      <rect x="7" y="5" width="3.4" height="14" rx="0.7" />
      <rect x="13.6" y="5" width="3.4" height="14" rx="0.7" />
    </g>
    <g v-else-if="name === 'prev'" fill="currentColor">
      <rect x="4.6" y="5" width="2.6" height="14" rx="0.7" />
      <path d="M19.4 4.8 19.4 19.2 8.9 12Z" />
    </g>
    <g v-else-if="name === 'next'" fill="currentColor">
      <path d="M4.6 4.8 4.6 19.2 15.1 12Z" />
      <rect x="16.8" y="5" width="2.6" height="14" rx="0.7" />
    </g>
    <g
      v-else-if="name === 'restart'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- Cercle ouvert en haut, parcouru dans le sens inverse des aiguilles ; la pointe
           est à l'arrivée du tracé, pas à son départ, sinon la flèche désigne l'envers. -->
      <path d="M10.1 4.8A7.5 7.5 0 1 0 13.9 4.8" />
      <path d="M16.1 7.1 13.9 4.8 17 3.8" />
    </g>
    <g
      v-else-if="name === 'link'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
    >
      <path d="M10.4 13.6a3.7 3.7 0 0 0 5.2 0l3-3a3.7 3.7 0 1 0-5.2-5.2l-1.3 1.3" />
      <path d="M13.6 10.4a3.7 3.7 0 0 0-5.2 0l-3 3a3.7 3.7 0 1 0 5.2 5.2l1.3-1.3" />
    </g>
    <g
      v-else-if="name === 'arrow'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3.8 12h16.4" />
      <path d="M14.2 6 20.2 12 14.2 18" />
    </g>
    <path
      v-else
      d="M4.8 12.5 9.6 17.3 19.2 7.1"
      fill="none"
      stroke="currentColor"
      stroke-width="2.1"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.icon {
  width: 1.45em;
  height: 1.45em;
  flex: none;
  display: block;
}
</style>
