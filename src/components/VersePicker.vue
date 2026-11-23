<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { t, lang } from '../lib/i18n'
import { parseBook, toRoman } from '../lib/roman'
import { FIRST_BOOK, LAST_BOOK, LITANIES_BOOK, PRELIM_BOOK, type Catalog, type Track } from '../lib/catalog'

const props = defineProps<{ catalog: Catalog }>()
const emit = defineEmits<{ pick: [Track] }>()

const bookInput = ref('')
const verseInput = ref('')
const message = ref('')
const verseEl = ref<HTMLInputElement | null>(null)

watch(lang, () => (message.value = ''))

const book = computed(() => parseBook(bookInput.value))
const range = computed(() => (book.value !== null ? props.catalog.range(book.value) : null))
const bookOk = computed(() => book.value !== null && book.value >= FIRST_BOOK && book.value <= LAST_BOOK && !!range.value)

/** Indication vivante sous le champ livre : « VII · 0–65 ». */
const bookHint = computed(() => {
  if (!bookInput.value.trim()) return `I – ${toRoman(LAST_BOOK)}`
  if (!bookOk.value || !range.value) return '—'
  return `${toRoman(book.value!)} · ${t.value.versesIn(range.value[1])}`
})

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

function submit() {
  message.value = ''
  if (!bookInput.value.trim()) return (message.value = t.value.errEmptyBook)
  if (!bookOk.value) return (message.value = t.value.errBook(LAST_BOOK))
  const verse = verseInput.value.trim() === '' ? 0 : parseInt(verseInput.value, 10)
  const [min, max] = range.value!
  if (isNaN(verse) || verse < min || verse > max) return (message.value = t.value.errVerse(min, max))
  const tr = props.catalog.find(book.value!, verse)
  if (!tr) return (message.value = t.value.errMissing)
  emit('pick', tr)
}

function pickSpecial(b: number) {
  const tr = props.catalog.versesOf(b)[0]
  if (tr) emit('pick', tr)
}

const hasPrelim = computed(() => props.catalog.versesOf(PRELIM_BOOK).length > 0)
const hasLitanies = computed(() => props.catalog.versesOf(LITANIES_BOOK).length > 0)
</script>

<template>
  <form class="picker" @submit.prevent="submit" novalidate>
    <h2 class="eyebrow">{{ t.chooseTitle }}</h2>

    <div class="row">
      <label class="field">
        <span class="label">{{ t.book }}</span>
        <input
          v-model="bookInput"
          class="num"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="9"
          placeholder="VII"
          :aria-invalid="!!bookInput.trim() && !bookOk"
          @input="onBookInput"
          @keydown="onBookKey"
        />
        <span class="hint" :class="{ bad: !!bookInput.trim() && !bookOk }">{{ bookHint }}</span>
      </label>

      <span class="sep" aria-hidden="true">·</span>

      <label class="field">
        <span class="label">{{ t.verse }}</span>
        <input
          ref="verseEl"
          v-model="verseInput"
          class="num"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          maxlength="3"
          placeholder="56"
          @input="message = ''"
        />
        <span class="hint">{{ range ? `${range[0]} – ${range[1]}` : '&nbsp;' }}</span>
      </label>

      <button class="go" type="submit" :aria-label="t.listen">
        <span>{{ t.listen }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-6 6 6-6 6" /></svg>
      </button>
    </div>

    <p class="msg" role="status" aria-live="polite">{{ message }}</p>

    <p v-if="hasPrelim || hasLitanies" class="also">
      <span>{{ t.also }}</span>
      <button v-if="hasPrelim" type="button" class="chip" @click="pickSpecial(PRELIM_BOOK)">{{ t.preliminary }}</button>
      <button v-if="hasLitanies" type="button" class="chip" @click="pickSpecial(LITANIES_BOOK)">{{ t.litanies }}</button>
    </p>
  </form>
</template>

<style scoped>
.picker { display: grid; justify-items: center; gap: 4px; }
.eyebrow {
  margin: 0 0 14px;
  font: 500 0.72rem/1 var(--sans);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
.row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}
.field { display: grid; justify-items: center; gap: 4px; }
.label {
  font: 500 0.66rem/1 var(--sans);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.num {
  width: 5.2ch;
  font: 400 2.4rem/1.1 var(--serif);
  text-align: center;
  color: var(--ink);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 4px 0 6px;
  border-radius: 0;
  transition: border-color 0.25s;
}
.num::placeholder { color: rgb(47 41 31 / 0.18); }
.num:focus { outline: none; border-bottom-color: var(--gold); }
.num[aria-invalid='true'] { border-bottom-color: var(--rust); }
.hint {
  font: 0.72rem/1.2 var(--sans);
  color: var(--muted);
  min-height: 1.2em;
  font-variant-numeric: tabular-nums;
}
.hint.bad { color: var(--rust); }
.sep {
  align-self: center;
  margin-top: 6px;
  font: 1.6rem var(--serif);
  color: var(--gold);
}
.go {
  align-self: center;
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  appearance: none;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font: 500 0.78rem/1 var(--sans);
  letter-spacing: 0.08em;
  padding: 12px 16px 12px 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.25s, transform 0.2s;
}
.go svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; transition: transform 0.25s; }
.go:hover { background: #3d352a; }
.go:hover svg { transform: translateX(3px); }
.go:active { transform: scale(0.97); }
.go:focus-visible { outline: 1px solid var(--gold); outline-offset: 3px; }
.msg {
  margin: 6px 0 0;
  min-height: 1.3em;
  font: italic 0.95rem var(--serif);
  color: var(--rust);
}
.also {
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  font: 0.75rem var(--sans);
  color: var(--muted);
}
.chip {
  appearance: none;
  border: 1px solid var(--line);
  background: rgb(255 255 255 / 0.3);
  color: var(--ink);
  font: italic 0.95rem/1 var(--serif);
  padding: 6px 12px 7px;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.25s, background 0.25s;
}
.chip:hover { border-color: var(--gold); background: rgb(255 255 255 / 0.55); }
.chip:focus-visible { outline: 1px solid var(--gold); outline-offset: 2px; }

@media (max-width: 480px) {
  .row { gap: 10px; }
  .go { flex-basis: 100%; justify-content: center; margin-top: 10px; }
  .go span { display: inline; }
}
</style>
