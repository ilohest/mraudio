<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { t } from '../lib/i18n'
import { labelFor } from '../lib/labels'
import { parseBook, toRoman } from '../lib/roman'
import { FIRST_BOOK, LAST_BOOK, type Catalog, type Track } from '../lib/catalog'
import { formatTime, usePlayer, type Chain } from '../composables/usePlayer'
import Icon from './Icon.vue'
import Reel from './Reel.vue'

const props = defineProps<{
  catalog: Catalog
  track: Track | null
  drawn: boolean
  hasPrev: boolean
  hasNext: boolean
  chain: Chain
}>()
const emit = defineEmits<{ prev: []; next: []; chain: [Chain]; pick: [Track] }>()

const { playing, loading, error, current, duration, toggle, restart, seek } = usePlayer()

const label = computed(() => (props.track ? labelFor(props.track, t.value) : null))

/**
 * Le grand repère EST la saisie : on tape dans les chiffres qu'on lit. Ce qui n'a pas de
 * numéro — préliminaires, litanies, épigraphes — se nomme au-dessus, champs laissés vides.
 */
const standing = computed(() => {
  if (!props.track) return { kicker: '', name: t.value.chooseTitle }
  const l = label.value!
  if (!l.numeral) return { kicker: l.kicker, name: l.big }
  if (props.track.verse === 0) return { kicker: '', name: t.value.epigraphs }
  return null
})

const bookInput = ref('')
const verseInput = ref('')
const message = ref('')
const verseEl = ref<HTMLInputElement | null>(null)

function syncFromTrack() {
  const tr = props.track
  if (!tr || !label.value?.numeral) {
    bookInput.value = ''
    verseInput.value = ''
    return
  }
  bookInput.value = toRoman(tr.book)
  verseInput.value = tr.verse > 0 ? String(tr.verse) : ''
}

/* Tirage : deux rouleaux qui glissent et se posent l'un après l'autre. Le défilé est
   une seule transition de transform — le navigateur l'interpole, d'où la fluidité. */
const REEL = 20
const rolling = ref(false)
const bookReel = ref<string[]>([])
const verseReel = ref<string[]>([])
let timer: number | undefined
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ROMANS = Array.from({ length: LAST_BOOK }, (_, i) => toRoman(i + 1))

/** Valeurs intermédiaires de la largeur de la valeur finale : sinon la colonne tressaute. */
function reelOf(target: string, pool: string[]) {
  const same = pool.filter((s) => s.length === target.length && s !== target)
  const src = same.length >= 4 ? same : pool.filter((s) => s.length <= target.length)
  const out = Array.from({ length: REEL - 1 }, () => src[Math.floor(Math.random() * src.length)] ?? target)
  out.push(target)
  return out
}

/** Nombres du même nombre de chiffres que la cible, pour le rouleau des versets. */
function sameWidthNumbers(d: number) {
  const lo = d === 1 ? 1 : 10 ** (d - 1)
  const hi = 10 ** d - 1
  return Array.from({ length: Math.min(hi - lo + 1, 60) }, (_, i) => String(lo + i))
}

watch(
  () => props.track?.id,
  () => {
    clearTimeout(timer)
    syncFromTrack()
    message.value = ''
    rolling.value = false
    const tr = props.track
    if (!tr || !props.drawn || reduced || !label.value?.numeral || tr.verse < 1) return
    bookReel.value = reelOf(toRoman(tr.book), ROMANS)
    verseReel.value = reelOf(String(tr.verse), sameWidthNumbers(String(tr.verse).length))
    rolling.value = true
    timer = window.setTimeout(() => (rolling.value = false), 1600)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))

const book = computed(() => parseBook(bookInput.value))
const range = computed(() => (book.value !== null ? props.catalog.range(book.value) : null))
const bookOk = computed(
  () => book.value !== null && book.value >= FIRST_BOOK && book.value <= LAST_BOOK && !!range.value,
)
/**
 * XXXVIII est trois fois plus long que VII : la taille suit le nombre de signes, sinon le
 * chiffre romain se casse en deux lignes. Elle vaut pour **les deux cases** — c'est le
 * chiffre romain, le plus long des deux, qui décide. Si on ne l'appliquait qu'au livre,
 * les filets de champ et les lignes d'indication ne seraient plus à la même hauteur.
 */
const heroSize = computed(() => {
  const n = bookInput.value.trim().length
  return n >= 6 ? 'len-xl' : n >= 4 ? 'len-l' : ''
})

const bookHint = computed(() => {
  if (rolling.value || !bookInput.value.trim()) return ''
  if (!bookOk.value || !range.value) return '—'
  return `${toRoman(book.value!)} · ${t.value.versesIn(range.value[1])}`
})
const verseHint = computed(() => (rolling.value || !range.value ? '' : `${range.value[0]} – ${range.value[1]}`))

/* Le bouton n'apparaît que si la saisie ne décrit plus ce qui joue : il enseigne
   l'interaction au moment où on la découvre, sans encombrer le reste du temps. */
const dirty = computed(() => {
  if (rolling.value) return false
  const tr = props.track
  const raw = verseInput.value.trim()
  if (!tr || !label.value?.numeral) return !!bookInput.value.trim() || !!raw
  return book.value !== tr.book || (raw === '' ? 0 : parseInt(raw, 10)) !== tr.verse
})
const asking = computed(() => !props.track || dirty.value)

/** Collage « VII 56 », « 7,56 », « 07056 » dans le champ livre → répartit les deux champs. */
function splitCombined() {
  const raw = bookInput.value.trim()
  const compact = raw.match(/^(\d{2})(\d{3})$/)
  const pair = raw.match(/^([ivxlcdm]+|\d{1,2})[\s.,;:/-]+(\d{1,3})$/i)
  const m = compact ?? pair
  if (m) {
    bookInput.value = m[1].replace(/^0(\d)$/, '$1')
    verseInput.value = String(parseInt(m[2], 10))
    return true
  }
  return false
}

function onBookKey(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (splitCombined()) return submit()
  verseEl.value?.focus()
}
function onBookInput() {
  message.value = ''
  if (splitCombined()) verseEl.value?.focus()
}

/* Une erreur secoue le bloc : à l'écran, c'est plus clair qu'une ligne de texte de plus. */
const shaking = ref(false)
function fail(msg: string) {
  message.value = msg
  shaking.value = false
  requestAnimationFrame(() => (shaking.value = true))
  setTimeout(() => (shaking.value = false), 500)
}

function submit() {
  message.value = ''
  if (!bookInput.value.trim()) return fail(t.value.errEmptyBook)
  if (!bookOk.value) return fail(t.value.errBook(LAST_BOOK))
  const raw = verseInput.value.trim()
  const verse = raw === '' ? 0 : parseInt(raw, 10)
  const [min, max] = range.value!
  if (isNaN(verse) || verse < min || verse > max) return fail(t.value.errVerse(min, max))
  const tr = props.catalog.find(book.value!, verse)
  if (!tr) return fail(t.value.errMissing)
  emit('pick', tr)
}

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

/* Écoute suivie : trois états, libellés en toutes lettres plutôt qu'en symboles. */
const chainOpts = computed(() => [
  { v: 'stop' as const, label: t.value.chainStop },
  { v: 'next' as const, label: t.value.chainNext },
  { v: 'random' as const, label: t.value.chainRandom },
])
</script>

<template>
  <article class="now">
    <p v-if="standing" class="standing">
      <span v-if="standing.kicker" class="micro">{{ standing.kicker }}</span>
      <span class="name">{{ standing.name }}</span>
    </p>

    <!-- Le repère et la saisie sont le même objet : on tape dans les chiffres qu'on lit. -->
    <div class="hero" :class="{ shaking }">
      <label class="slot">
        <span class="micro">{{ t.book }}</span>
        <span class="field">
          <Reel v-if="rolling" class="mega" :class="heroSize" :items="bookReel" :duration="1000" />
          <input
            v-else
            v-model="bookInput"
            class="mega"
            :class="heroSize"
            type="text"
            inputmode="text"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            maxlength="9"
            placeholder="VII"
            :aria-label="t.book"
            :aria-invalid="!!bookInput.trim() && !bookOk"
            @input="onBookInput"
            @keydown="onBookKey"
          />
        </span>
        <span class="micro hint" :class="{ bad: !!bookInput.trim() && !bookOk }">{{ bookHint || '&nbsp;' }}</span>
      </label>

      <label class="slot verse">
        <span class="micro">{{ t.verse }}</span>
        <span class="field">
          <Reel v-if="rolling" class="mega accent" :class="heroSize" :items="verseReel" :duration="1300" :delay="110" />
          <input
            v-else
            ref="verseEl"
            v-model="verseInput"
            class="mega accent"
            :class="heroSize"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            maxlength="3"
            placeholder="56"
            :aria-label="t.verse"
            @input="message = ''"
            @keydown.enter.prevent="submit"
          />
        </span>
        <span class="micro hint">{{ verseHint || '&nbsp;' }}</span>
      </label>
    </div>

    <div class="reveal" :class="{ open: asking }">
      <div>
        <button class="go" type="button" @click="submit">
          <span>{{ t.listen }}</span>
          <Icon name="arrow" />
        </button>
      </div>
    </div>

    <p v-if="message" class="msg" role="status" aria-live="polite">{{ message }}</p>

    <template v-if="track">
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
          <Icon :name="playing ? 'pause' : 'play'" />
          <span>{{ playing ? t.pause : t.play }}</span>
        </button>
        <button type="button" :disabled="!hasPrev" @click="emit('prev')">
          <Icon name="prev" /><span>{{ t.prev }}</span>
        </button>
        <button type="button" @click="restart">
          <Icon name="restart" /><span>{{ t.replay }}</span>
        </button>
        <button type="button" :disabled="!hasNext" @click="emit('next')">
          <Icon name="next" /><span>{{ t.next }}</span>
        </button>
        <button type="button" :class="{ done: copied }" @click="share">
          <Icon :name="copied ? 'check' : 'link'" /><span>{{ copied ? t.copied : t.share }}</span>
        </button>
      </nav>

      <!-- Écoute suivie : un réglage, pas une action. Il reste en bas, en petit. -->
      <div class="chain" role="group" :aria-label="t.chainLabel">
        <span class="micro">{{ t.chainLabel }}</span>
        <div class="opts">
          <button
            v-for="o in chainOpts"
            :key="o.v"
            type="button"
            :class="{ on: chain === o.v }"
            :aria-pressed="chain === o.v"
            @click="emit('chain', o.v)"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
    </template>
  </article>
</template>

<style scoped>
.now { display: block; }

/* Ce qui joue mais n'a pas de numéro, ou l'invitation quand rien ne joue encore. */
.standing {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px 12px;
  margin: 0;
  padding: var(--pad) var(--pad) 0;
}
.standing .name {
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(1.5rem, 5cqi, 2.5rem);
  line-height: 1.1;
  letter-spacing: -0.012em;
}

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.hero.shaking { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60% { transform: translateX(7px); }
}

.slot {
  position: relative;
  display: block;
  padding: var(--pad);
  min-width: 0;
  cursor: text;
  animation: lift 0.62s cubic-bezier(0.22, 1.15, 0.3, 1) both;
}
.slot.verse { animation-delay: 0.07s; }
/* Le filet qui sépare les deux cases est en retrait égal en haut et en bas. */
.slot.verse::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--pad);
  bottom: var(--pad);
  width: 1px;
  background: var(--line);
}
@keyframes lift {
  from { opacity: 0; transform: translateY(18px) scale(0.965); }
  to { opacity: 1; transform: none; }
}

/* Le filet sous le nombre dit « ceci est un champ » — sans lui, un grand chiffre
   ne se laisse pas deviner comme saisissable. */
.field {
  display: block;
  margin-top: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
  transition: border-color 0.2s ease;
}
.slot:focus-within .field { border-bottom-color: var(--ink); }

/* Les tailles sont en cqi : elles suivent la carte, pas l'écran. */
.mega {
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ink);
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(3.2rem, 15cqi, 8.5rem);
  line-height: 0.95;
  letter-spacing: -0.012em;
  font-variant-numeric: lining-nums;
}
.mega:focus { outline: none; }
.mega::placeholder { color: var(--line); }
/* Plus le chiffre romain est long, plus on resserre : il doit tenir sur une ligne. */
.mega.len-l { font-size: clamp(2.6rem, 11.5cqi, 6.4rem); }
.mega.len-xl { font-size: clamp(2rem, 9cqi, 5rem); }
.mega.accent { color: var(--rubric); }
.mega[aria-invalid='true'] { color: var(--rubric-deep); }
.hint { font-size: 0.8rem; }
.hint.bad { color: var(--rubric-deep); }

/* Le bouton se déplie au lieu d'apparaître d'un coup. */
.reveal {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.34s cubic-bezier(0.22, 1, 0.3, 1);
}
.reveal.open { grid-template-rows: 1fr; }
.reveal > div { overflow: hidden; }
.go {
  appearance: none;
  width: calc(100% - 2 * var(--pad));
  margin: 0 var(--pad) var(--pad);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid var(--ink);
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--ink);
  padding: 17px 20px;
  font: 400 1.05rem/1.2 var(--sans);
  cursor: pointer;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.5, 0.64, 1),
    background 0.2s ease,
    color 0.2s ease;
}
.go:hover { background: var(--ink); color: var(--bg); transform: translateY(-3px); }
.go:active { transform: scale(0.98); }
.go:focus-visible { outline: 3px solid var(--rubric-deep); outline-offset: 3px; }

.msg {
  margin: 0;
  padding: 0 var(--pad) var(--pad);
  font: 400 0.95rem/1.4 var(--sans);
  color: var(--rubric-deep);
}

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
  flex: 1 1 168px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--ink);
  font: 400 0.96rem/1.3 var(--sans);
  padding: 16px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
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
  flex: 2 1 260px;
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

.chain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: calc(var(--pad) - 6px) var(--pad) var(--pad);
  border-top: 1px solid var(--line);
  margin-top: -6px;
}
.opts { display: flex; flex-wrap: wrap; gap: 6px; }
.opts button {
  appearance: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--dim);
  font: 400 0.86rem/1.2 var(--sans);
  padding: 8px 14px;
  cursor: pointer;
  transition:
    transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}
.opts button:hover { color: var(--ink); border-color: var(--ink); transform: translateY(-2px); }
.opts button:active { transform: scale(0.95); }
.opts button.on { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.opts button:focus-visible { outline: 2px solid var(--rubric-deep); outline-offset: 2px; }

@container (max-width: 620px) {
  .hero { grid-template-columns: 1fr; }
  .slot.verse::before {
    left: var(--pad);
    right: var(--pad);
    top: 0;
    bottom: auto;
    width: auto;
    height: 1px;
  }
  .controls .primary { flex-basis: 100%; }
}
</style>
