<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

/**
 * Rouleau de machine à sous : une colonne de valeurs qui glisse vers le haut, décélère,
 * dépasse d'un cran et se cale. Une seule transition de `transform` — c'est le navigateur
 * qui interpole, d'où la fluidité ; la première version remplaçait le texte toutes les 50 ms.
 *
 * Trois choses font l'effet :
 * - la courbe se termine au-dessus de 1, donc le rouleau dépasse la valeur et revient ;
 *   d'où `landAt`, qui n'est pas le dernier élément : il faut des valeurs en réserve
 *   sous la bonne, sinon le dépassement découvre du vide ;
 * - un flou qui se dissipe aux deux tiers de la course : à pleine vitesse l'œil ne lit
 *   rien de toute façon, et le net qui revient annonce l'arrivée ;
 * - un dégradé qui estompe le haut et le bas pendant la course, comme le tambour d'une
 *   machine. Il est retiré à l'arrivée, sinon la valeur finale resterait voilée.
 *
 * Le flou est sur la **fenêtre**, jamais sur la colonne : la colonne fait plusieurs milliers
 * de pixels de haut, et la tramer floue retardait le départ de l'animation d'une seconde.
 */
const props = defineProps<{
  items: string[]
  /** Index de la valeur sur laquelle se poser. Il doit rester des éléments après elle. */
  landAt: number
  duration?: number
  delay?: number
}>()

const landed = ref(false)
const done = ref(false)

onMounted(() => {
  // Deux trames : la première pose la position de départ, la seconde lance la glissade.
  requestAnimationFrame(() => requestAnimationFrame(() => (landed.value = true)))
})

const vars = computed(() => ({
  '--dur': `${props.duration ?? 1500}ms`,
  '--delay': `${props.delay ?? 0}ms`,
  '--land': `${(props.landAt * 100) / props.items.length}%`,
}))
</script>

<template>
  <span class="reel" :class="{ landed, done }" :style="vars">
    <span class="strip" @transitionend.self="done = true">
      <span v-for="(it, i) in items" :key="i" class="cell">{{ it }}</span>
    </span>
    <!-- Seule la valeur finale est annoncée : le défilé n'a rien à dire. -->
    <span class="sr">{{ items[landAt] }}</span>
  </span>
</template>

<style scoped>
.reel {
  display: block;
  width: 100%;
  height: 1.08em;
  overflow: hidden;
  filter: blur(3px);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 74%, transparent 100%);
  transition: filter calc(var(--dur) * 0.62) ease-out var(--delay);
}
.reel.landed { filter: blur(0); }
.reel.done { mask-image: none; }

.strip {
  display: block;
  transform: translateY(0);
  will-change: transform;
  transition: transform var(--dur) cubic-bezier(0.12, 0.88, 0.2, 1.12) var(--delay);
}
.reel.landed .strip { transform: translateY(calc(-1 * var(--land))); }

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
  .reel { filter: none; mask-image: none; transition: none; }
}
</style>
