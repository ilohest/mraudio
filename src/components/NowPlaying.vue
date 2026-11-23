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

/* Le rail porte la mesure : c'est lui qu'on interroge, pas la zone de clic qui l'entoure. */
const bar = ref<HTMLElement | null>(null)
const rail = ref<HTMLElement | null>(null)
const scrubbing = ref(false)
let dragging = false
function seekFrom(e: PointerEvent) {
  const r = (rail.value ?? bar.value)!.getBoundingClientRect()
  seek((e.clientX - r.left) / r.width)
}
function down(e: PointerEvent) {
  dragging = true
  scrubbing.value = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  seekFrom(e)
}
function move(e: PointerEvent) { if (dragging) seekFrom(e) }
function up() { dragging = false; scrubbing.value = false }
function barKey(e: KeyboardEvent) {
  if (!duration.value) return
  const step = 5 / duration.value
  if (e.key === 'ArrowRight') { e.preventDefault(); seek(progress.value + step) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); seek(progress.value - step) }
}

/* Petite détente sur le bouton de lecture à chaque bascule. */
const pulse = ref(false)
function onToggle() {
  pulse.value = false
  requestAnimationFrame(() => (pulse.value = true))
  setTimeout(() => (pulse.value = false), 420)
  toggle()
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

    <!-- Progression : un rail qui s'épaissit et sort sa tête dès qu'on l'approche. -->
    <div
      ref="bar"
      class="scrub"
      :class="{ busy: loading && !error, live: scrubbing }"
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
      <span ref="rail" class="rail">
        <span class="elapsed" :style="{ width: `${progress * 100}%` }">
          <i class="knob"></i>
        </span>
      </span>
    </div>

    <p class="times">
      <span>{{ formatTime(current) }}</span>
      <span v-if="error" class="err" role="alert">{{ t.errAudio }}</span>
      <span>{{ formatTime(duration) }}</span>
    </p>

    <nav class="controls">
      <button type="button" class="primary" :class="{ pulse }" :disabled="error" @click="onToggle">
        {{ playing ? t.pause : t.play }}
      </button>
      <button type="button" :disabled="!hasPrev" @click="emit('prev')">{{ t.prev }}</button>
      <button type="button" @click="restart">{{ t.replay }}</button>
      <button type="button" :disabled="!hasNext" @click="emit('next')">{{ t.next }}</button>
      <button type="button" @click="emit('again')">{{ t.again }}</button>
      <button type="button" :class="{ done: copied }" @click="share">{{ copied ? t.copied : t.share }}</button>
    </nav>
  </article>
</template>

<style scoped>
.now { display: block; }

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.hero.solo { grid-template-columns: 1fr; }

.slot {
  padding: var(--pad);
  min-width: 0;
  animation: lift 0.62s cubic-bezier(0.22, 1.15, 0.3, 1) both;
}
/* La seconde case entre juste après la première : le repère se compose en deux temps. */
.slot.verse {
  border-left: 1px solid var(--line);
  animation-delay: 0.07s;
}
@keyframes lift {
  from { opacity: 0; transform: translateY(18px) scale(0.965); }
  to { opacity: 1; transform: none; }
}

/* Le repère en Ortica Light. Les tailles sont en cqi : elles suivent la carte, pas l'écran. */
.mega {
  margin: 12px 0 0;
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(3.2rem, 18cqi, 9.5rem);
  line-height: 0.92;
  letter-spacing: -0.012em;
  font-variant-numeric: lining-nums;
  white-space: nowrap;
}
/* Plus le chiffre romain est long, plus on resserre : il doit tenir sur une ligne. */
.mega.len-l { font-size: clamp(2.6rem, 13.5cqi, 7rem); }
.mega.len-xl { font-size: clamp(2rem, 10.5cqi, 5.4rem); }

/* Un nom (« Pare Daurat ») ou un mot (« Epígrafs ») : même police, autre échelle. */
.mega.word {
  white-space: normal;
  font-size: clamp(1.7rem, 7cqi, 3.4rem);
  line-height: 1.05;
  letter-spacing: -0.01em;
}
.mega.accent { color: var(--rubric-deep); }
.mega.rolling { color: var(--dim); }

.scrub {
  position: relative;
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 var(--pad);
  cursor: ew-resize;
  touch-action: none;
}
.rail {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: var(--line);
  transition: height 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.elapsed {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: var(--rubric);
}
/* La tête ne sort qu'au survol, et elle sort en ressort. */
.knob {
  position: absolute;
  right: 0;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: -7px -7px 0 0;
  border-radius: 999px;
  background: var(--rubric);
  transform: scale(0);
  transition: transform 0.3s cubic-bezier(0.34, 1.7, 0.64, 1);
}
.scrub:hover .rail, .scrub:focus-visible .rail, .scrub.live .rail { height: 9px; }
.scrub:hover .knob, .scrub:focus-visible .knob { transform: scale(1); }
.scrub.live .knob { transform: scale(1.35); }
.scrub:focus-visible { outline: 2px solid var(--rubric-deep); outline-offset: -4px; border-radius: var(--r-sm); }
.scrub.busy .rail::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 22%;
  border-radius: 999px;
  background: var(--dim);
  animation: slide 1.2s ease-in-out infinite;
}
@keyframes slide { to { transform: translateX(355%); } }

.times {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
  padding: 2px var(--pad) 0;
  font: 400 0.86rem/1.3 var(--sans);
  color: var(--dim);
  font-variant-numeric: tabular-nums;
}
.err { color: var(--rubric-deep); }

/* Boutons blancs posés sur la carte grise. Flex : la dernière rangée s'étire au lieu
   de laisser une case vide. */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: var(--pad);
}
.controls button {
  appearance: none;
  flex: 1 1 132px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--ink);
  font: 400 0.96rem/1.3 var(--sans);
  padding: 16px 10px;
  cursor: pointer;
  transition:
    transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}
.controls button:hover:not(:disabled) {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--bg);
  transform: translateY(-2px);
}
.controls button:active:not(:disabled) { transform: scale(0.96); }
.controls button:disabled { color: var(--dim); background: transparent; cursor: default; }
.controls button:focus-visible { outline: 2px solid var(--rubric-deep); outline-offset: 2px; }
.controls button.done { background: var(--rubric); border-color: var(--rubric); color: var(--bg); }

/* La lecture est la seule commande imprimée en plein. */
.controls .primary {
  flex: 2 1 230px;
  background: var(--ink);
  border-color: var(--ink);
  color: var(--bg);
}
.controls .primary:hover:not(:disabled) { background: var(--rubric); border-color: var(--rubric); }
.controls .primary:disabled { background: transparent; border-color: var(--line); }
.controls .primary.pulse { animation: pop 0.42s cubic-bezier(0.34, 1.6, 0.64, 1); }
@keyframes pop {
  0% { transform: scale(1); }
  38% { transform: scale(1.045); }
  100% { transform: scale(1); }
}

@container (max-width: 620px) {
  .hero { grid-template-columns: 1fr; }
  .slot.verse { border-left: 0; border-top: 1px solid var(--line); }
  .controls .primary { flex-basis: 100%; }
}
</style>
