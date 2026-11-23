<script setup lang="ts">
import { onMounted, ref } from 'vue'

/**
 * Rouleau de machine à sous : une colonne de valeurs qui glisse vers le haut et
 * décélère pour se poser sur la dernière. Un seul `transform` animé par le navigateur —
 * d'où la fluidité : l'ancienne version remplaçait le texte toutes les 50 ms.
 * Les valeurs intermédiaires ont la largeur de la valeur finale, sinon la colonne
 * tressaute et déborde de sa fenêtre.
 */
const props = defineProps<{ items: string[]; duration?: number; delay?: number }>()
const landed = ref(false)

onMounted(() => {
  // Deux trames : la première pose la position de départ, la seconde lance la glissade.
  requestAnimationFrame(() => requestAnimationFrame(() => (landed.value = true)))
})
</script>

<template>
  <span class="reel">
    <span
      class="strip"
      :style="{
        transform: `translateY(-${landed ? ((items.length - 1) * 100) / items.length : 0}%)`,
        transitionDuration: `${duration ?? 1000}ms`,
        transitionDelay: `${delay ?? 0}ms`,
      }"
    >
      <span v-for="(it, i) in items" :key="i" class="cell">{{ it }}</span>
    </span>
    <!-- Seule la valeur finale est annoncée : le défilé n'a rien à dire. -->
    <span class="sr">{{ items[items.length - 1] }}</span>
  </span>
</template>

<style scoped>
.reel {
  display: block;
  width: 100%;
  height: 1.08em;
  overflow: hidden;
}
.strip {
  display: block;
  transition-property: transform;
  /* Départ vif, longue descente : la décélération fait tout le travail. */
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
.cell {
  display: flex;
  align-items: center;
  height: 1.08em;
  line-height: 1;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .strip { transition: none; }
}
</style>
