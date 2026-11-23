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

/* Petit effet « roue » : pendant un tirage, les numéros défilent avant de se poser. */
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
      if (performance.now() - start > 650) {
        clearInterval(timer)
        rolling.value = false
      }
    }, 55)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(timer))

const big = computed(() => (rolling.value ? rollBig.value : label.value.big))
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
  if (e.key === 'ArrowRight') seek(progress.value + step)
  if (e.key === 'ArrowLeft') seek(progress.value - step)
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
  <article class="card" :class="{ drawn }">
    <header class="ref">
      <p class="kicker">{{ label.kicker }}</p>
      <p class="big" :class="{ numeral: label.numeral, rolling }">{{ big }}</p>
      <p v-if="verse" class="verse">
        <span v-if="label.verseLabel" class="vl">{{ label.verseLabel }}</span>
        <span class="vn" :class="{ word: !label.verseLabel, rolling }">{{ verse }}</span>
      </p>
    </header>

    <div class="player">
      <button
        class="play"
        type="button"
        :class="{ loading: loading && !error }"
        :aria-label="playing ? t.pause : t.play"
        :disabled="error"
        @click="toggle"
      >
        <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5.5" width="3.2" height="13" rx="1" /><rect x="13.8" y="5.5" width="3.2" height="13" rx="1" /></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.7-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7Z" /></svg>
      </button>

      <div class="track">
        <div
          ref="bar"
          class="bar"
          role="slider"
          tabindex="0"
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
          <span class="fill" :style="{ transform: `scaleX(${progress})` }"></span>
          <span class="knob" :style="{ left: `${progress * 100}%` }"></span>
        </div>
        <div class="times">
          <span>{{ formatTime(current) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>

    <p v-if="error" class="err" role="alert">{{ t.errAudio }}</p>

    <nav class="actions">
      <button type="button" class="icon" :disabled="!hasPrev" :aria-label="t.prev" :title="t.prev" @click="emit('prev')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
      </button>
      <button type="button" class="icon" :aria-label="t.replay" :title="t.replay" @click="restart">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v3.5H8" /></svg>
      </button>
      <button type="button" class="icon" :disabled="!hasNext" :aria-label="t.next" :title="t.next" @click="emit('next')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
      </button>
      <span class="divider" aria-hidden="true"></span>
      <button type="button" class="text" @click="emit('again')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.5c4 0 5 10 9 10H21m0 0-3-3m3 3-3 3M3 17h3.5c1.4 0 2.4-1.2 3.3-2.8M21 7h-5.5c-1.4 0-2.4 1.2-3.3 2.8M21 7l-3-3m3 3-3 3" /></svg>
        {{ t.again }}
      </button>
      <button type="button" class="icon" :aria-label="t.share" :title="copied ? t.copied : t.share" @click="share">
        <svg v-if="!copied" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </button>
    </nav>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  width: min(520px, 100%);
  margin: 0 auto;
  padding: 30px 28px 18px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.25)),
    var(--paper-2);
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.7) inset, 0 24px 50px -28px rgb(60 42 18 / 0.45);
  animation: rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.card.drawn { animation: unseal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } }
@keyframes unseal {
  from { opacity: 0; clip-path: inset(50% 0 50% 0 round 22px); }
  to { opacity: 1; clip-path: inset(0 0 0 0 round 22px); }
}

.ref { text-align: center; }
.kicker {
  margin: 0;
  font: 500 0.68rem/1 var(--sans);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--muted);
}
.big {
  margin: 8px 0 0;
  font: 400 clamp(2.4rem, 8vw, 3.4rem)/1 var(--serif);
  color: var(--ink);
}
.big.numeral {
  font-size: clamp(3.6rem, 14vw, 5.4rem);
  letter-spacing: 0.06em;
  font-variant-numeric: lining-nums;
}
.rolling { color: var(--gold); filter: blur(0.3px); }
.verse {
  margin: 10px 0 0;
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.vl {
  font: 500 0.68rem/1 var(--sans);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--muted);
}
.vn {
  font: italic 400 2rem/1 var(--serif);
  color: var(--rust);
  min-width: 2ch;
  font-variant-numeric: tabular-nums;
}
.vn.word { font-size: 1.5rem; }

.player {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 26px;
}
.play {
  flex: none;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
  position: relative;
  transition: transform 0.2s, background 0.25s;
}
.play svg { width: 24px; height: 24px; fill: currentColor; }
.play:hover:not(:disabled) { background: #3d352a; transform: scale(1.04); }
.play:active:not(:disabled) { transform: scale(0.96); }
.play:disabled { opacity: 0.35; cursor: default; }
.play:focus-visible { outline: 1px solid var(--gold); outline-offset: 3px; }
.play.loading::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  border-top-color: var(--gold);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(1turn); } }

.track { flex: 1; min-width: 0; }
.bar {
  position: relative;
  height: 22px;
  cursor: pointer;
  touch-action: none;
}
.bar::before, .fill {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  border-radius: 2px;
  background: var(--line);
}
.fill { background: var(--ink); transform-origin: left; }
.knob {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  transition: transform 0.2s;
}
.bar:hover .knob, .bar:focus-visible .knob { transform: scale(1.25); }
.bar:focus-visible { outline: none; }
.times {
  display: flex;
  justify-content: space-between;
  font: 0.72rem var(--sans);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.err {
  margin: 12px 0 0;
  text-align: center;
  font: italic 0.95rem var(--serif);
  color: var(--rust);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.actions button {
  appearance: none;
  border: 0;
  background: none;
  color: var(--ink);
  cursor: pointer;
  border-radius: 999px;
  transition: background 0.2s, opacity 0.2s;
}
.actions button:hover:not(:disabled) { background: rgb(47 41 31 / 0.06); }
.actions button:focus-visible { outline: 1px solid var(--gold); outline-offset: 1px; }
.actions button:disabled { opacity: 0.25; cursor: default; }
.actions svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.icon { width: 38px; height: 38px; display: grid; place-items: center; }
.text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  font: 500 0.78rem/1 var(--sans);
  letter-spacing: 0.04em;
}
.divider { width: 1px; height: 18px; background: var(--line); margin: 0 6px; }

@media (max-width: 480px) {
  .card { padding: 26px 18px 14px; border-radius: 18px; }
  .divider { display: none; }
  .actions { gap: 0; }
  .icon { width: 36px; }
  .text { padding: 9px 10px; }
}
</style>
