<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { t } from '../lib/i18n'
import { labelFor } from '../lib/labels'
import { toRoman } from '../lib/roman'
import type { Track } from '../lib/catalog'
import { formatTime, usePlayer } from '../composables/usePlayer'

const props = defineProps<{ track: Track; drawn: boolean; hasPrev: boolean; hasNext: boolean }>()
const emit = defineEmits<{ prev: []; next: []; again: [] }>()

const { playing, loading, error, current, duration, toggle, restart, seek } = usePlayer()

const label = computed(() => labelFor(props.track, t.value))
/* « Epígrafs » n'est pas un nombre : il ne mérite pas la taille des chiffres. */
const verseIsWord = computed(() => !!label.value.verse && !/^\d+$/.test(label.value.verse))

/* Tirage : les chiffres défilent avant de se poser. Ici c'est la typo qui fait l'animation. */
const rolling = ref(false)
const rollBig = ref('')
const rollVerse = ref('')
let timer: number | undefined
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

watch(
  () => props.track.id,
  () => {
    clearInterval(timer)
    if (!props.drawn || reduced || !label.value.numeral) return (rolling.value = false)
    rolling.value = true
    const start = performance.now()
    timer = window.setInterval(() => {
      rollBig.value = toRoman(1 + Math.floor(Math.random() * 40))
      rollVerse.value = String(1 + Math.floor(Math.random() * 99))
      if (performance.now() - start > 620) {
        clearInterval(timer)
        rolling.value = false
      }
    }, 50)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(timer))

const big = computed(() => (rolling.value ? rollBig.value : label.value.big))
/* XXXVIII est trois fois plus long que VII : la taille suit le nombre de signes,
   sinon le chiffre romain se casse en deux lignes. */
const bigSize = computed(() => {
  if (!label.value.numeral) return ''
  const n = big.value.length
  return n >= 6 ? 'len-xl' : n >= 4 ? 'len-l' : ''
})
const verse = computed(() => (rolling.value ? rollVerse.value : label.value.verse))
const progress = computed(() => (duration.value ? current.value / duration.value : 0))

const bar = ref<HTMLElement | null>(null)
let dragging = false
function seekFrom(e: PointerEvent) {
  const r = bar.value!.getBoundingClientRect()
  seek((e.clientX - r.left) / r.width)
}
function down(e: PointerEvent) {
  dragging = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  seekFrom(e)
}
function move(e: PointerEvent) { if (dragging) seekFrom(e) }
function up() { dragging = false }
function barKey(e: KeyboardEvent) {
  if (!duration.value) return
  const step = 5 / duration.value
  if (e.key === 'ArrowRight') { e.preventDefault(); seek(progress.value + step) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); seek(progress.value - step) }
}

const copied = ref(false)
async function share() {
  try {
    await navigator.clipboard.writeText(location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch { /* presse-papiers indisponible */ }
}
</script>

<template>
  <article class="now">
    <!-- Le repère, en très grand : c'est lui le visuel. -->
    <div class="hero" :class="{ solo: !verse }">
      <div class="slot">
        <p class="micro">{{ label.kicker }}</p>
        <p class="mega" :class="[bigSize, { word: !label.numeral, rolling }]">{{ big }}</p>
      </div>
      <div v-if="verse" class="slot verse">
        <p class="micro">{{ label.verseLabel || '&nbsp;' }}</p>
        <p class="mega accent" :class="{ word: verseIsWord, rolling }">{{ verse }}</p>
      </div>
    </div>

    <!-- Progression : un filet qui traverse toute la page et s'épaissit quand on le vise. -->
    <div
      ref="bar"
      class="scrub"
      :class="{ busy: loading && !error }"
      role="slider"
      tabindex="0"
      :aria-label="t.verse"
      :aria-valuemin="0"
      :aria-valuemax="Math.round(duration)"
      :aria-valuenow="Math.round(current)"
      :aria-valuetext="formatTime(current)"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @keydown="barKey"
    >
      <span class="elapsed" :style="{ width: `${progress * 100}%` }"></span>
    </div>

    <p class="times">
      <span>{{ formatTime(current) }}</span>
      <span v-if="error" class="err" role="alert">{{ t.errAudio }}</span>
      <span>{{ formatTime(duration) }}</span>
    </p>

    <!-- Grille de commandes : les filets sont les gouttières, pas des bordures. -->
    <nav class="controls">
      <button type="button" class="primary" :disabled="error" @click="toggle">
        {{ playing ? t.pause : t.play }}
      </button>
      <button type="button" :disabled="!hasPrev" @click="emit('prev')">{{ t.prev }}</button>
      <button type="button" @click="restart">{{ t.replay }}</button>
      <button type="button" :disabled="!hasNext" @click="emit('next')">{{ t.next }}</button>
      <button type="button" @click="emit('again')">{{ t.again }}</button>
      <button type="button" @click="share">{{ copied ? t.copied : t.share }}</button>
    </nav>
  </article>
</template>

<style scoped>
.now { display: block; }

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  animation: cut 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.hero.solo { grid-template-columns: 1fr; }
@keyframes cut {
  from { opacity: 0; clip-path: inset(0 100% 0 0); }
  to { opacity: 1; clip-path: inset(0 0 0 0); }
}

.slot {
  padding: clamp(20px, 3.5vw, 34px) var(--gutter) clamp(14px, 2.5vw, 26px);
  min-width: 0;
}
.slot.verse { border-left: 1px solid var(--rule); }

.mega {
  margin: 10px 0 0;
  font-family: var(--display);
  font-weight: 700;
  font-stretch: 112%;
  font-size: clamp(3.6rem, 17vw, 11rem);
  line-height: 0.8;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums lining-nums;
  white-space: nowrap;
}
/* Plus le chiffre romain est long, plus on resserre : il doit tenir sur une ligne. */
.mega.len-l { font-size: clamp(2.8rem, 12vw, 7.5rem); }
.mega.len-xl { font-size: clamp(2.2rem, 9.5vw, 6rem); }

/* Un nom (« Pare Daurat ») ou un mot (« Epígrafs ») : même famille, autre échelle. */
.mega.word {
  white-space: normal;
  font-size: clamp(1.8rem, 6vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-stretch: 100%;
}
.mega.accent { color: var(--accent); }
.mega.rolling { color: var(--dim); }

.scrub {
  position: relative;
  height: 26px;
  border-top: 1px solid var(--rule);
  cursor: ew-resize;
  touch-action: none;
  display: flex;
  align-items: flex-start;
}
.scrub .elapsed {
  display: block;
  height: 3px;
  margin-top: -2px;
  background: var(--accent);
  transition: height 0.12s linear, margin-top 0.12s linear;
}
.scrub:hover .elapsed, .scrub:focus-visible .elapsed { height: 9px; margin-top: -5px; }
.scrub:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.scrub.busy::after {
  content: '';
  position: absolute;
  inset: -1px auto auto 0;
  height: 3px;
  width: 18%;
  background: var(--ink);
  animation: slide 1.1s ease-in-out infinite;
}
@keyframes slide { to { transform: translateX(455%); } }

.times {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
  padding: 9px var(--gutter) 16px;
  font: 500 0.68rem/1.2 var(--mono);
  letter-spacing: 0.1em;
  color: var(--dim);
  font-variant-numeric: tabular-nums;
}
.err { color: var(--accent); text-transform: uppercase; letter-spacing: 0.14em; }

/* Flex plutôt que grille : la dernière rangée s'étire au lieu de laisser une case vide. */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  background: var(--hair);
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}
.controls button {
  appearance: none;
  flex: 1 1 118px;
  min-width: 0;
  border: 0;
  background: var(--paper);
  color: var(--ink);
  font: 600 0.66rem/1.35 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 16px 10px;
  cursor: pointer;
  transition: background 0.12s linear, color 0.12s linear;
}
.controls button:hover:not(:disabled) { background: var(--ink); color: var(--paper); }
.controls button:active:not(:disabled) { background: var(--accent); color: #fff; }
.controls button:disabled { color: var(--dim); cursor: default; }
.controls button:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; }
.controls .primary { flex: 2 1 236px; background: var(--ink); color: var(--paper); }
.controls .primary:hover:not(:disabled) { background: var(--accent); color: #fff; }
.controls .primary:disabled { background: var(--hair); }

@media (max-width: 620px) {
  .hero { grid-template-columns: 1fr; }
  .slot.verse { border-left: 0; border-top: 1px solid var(--hair); }
  .controls .primary { flex-basis: 100%; }
}
</style>
