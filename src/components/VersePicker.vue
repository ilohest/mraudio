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
    <p class="micro head">{{ t.chooseTitle }}</p>

    <div class="grid">
      <label class="cell">
        <span class="micro">{{ t.book }}</span>
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
        <span class="micro hint" :class="{ bad: !!bookInput.trim() && !bookOk }">{{ bookHint }}</span>
      </label>

      <label class="cell">
        <span class="micro">{{ t.verse }}</span>
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
        <span class="micro hint">{{ range ? `${range[0]} – ${range[1]}` : '&nbsp;' }}</span>
      </label>

      <button class="cell go" type="submit" :aria-label="t.listen">
        <span>{{ t.listen }}</span>
        <span class="arrow" aria-hidden="true">⟶</span>
      </button>
    </div>

    <p class="msg" role="status" aria-live="polite">{{ message }}</p>

    <p v-if="hasPrelim || hasLitanies" class="also">
      <span class="micro">{{ t.also }}</span>
      <button v-if="hasPrelim" type="button" class="btn chip" @click="pickSpecial(PRELIM_BOOK)">{{ t.preliminary }}</button>
      <button v-if="hasLitanies" type="button" class="btn chip" @click="pickSpecial(LITANIES_BOOK)">{{ t.litanies }}</button>
    </p>
  </form>
</template>

<style scoped>
.picker { padding: clamp(20px, 3.5vw, 32px) 0 clamp(22px, 4vw, 36px); }
.head { padding: 0 var(--gutter) 16px; }

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1px;
  background: var(--hair);
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}
.cell {
  display: grid;
  gap: 8px;
  align-content: start;
  background: var(--paper);
  padding: 14px var(--gutter) 13px;
  min-width: 0;
}

.num {
  width: 100%;
  min-width: 0;
  font-family: var(--display);
  font-weight: 700;
  font-stretch: 112%;
  font-size: clamp(2.2rem, 7vw, 3.6rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--ink);
  background: transparent;
  border: 0;
  padding: 0;
  font-variant-numeric: tabular-nums lining-nums;
}
.num::placeholder { color: var(--hair); }
.num:focus { outline: none; }
.cell:focus-within { background: color-mix(in srgb, var(--accent) 7%, var(--paper)); }
.num[aria-invalid='true'] { color: var(--accent); }
.hint { font-size: 0.6rem; }
.hint.bad { color: var(--accent); }

.go {
  appearance: none;
  border: 0;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 14px clamp(18px, 3vw, 32px);
  font: 600 0.7rem/1 var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.12s linear;
}
.go .arrow { font-size: 1.2rem; transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }
.go:hover { background: var(--accent); color: #fff; }
.go:hover .arrow { transform: translateX(8px); }
.go:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }

.msg {
  margin: 0;
  min-height: 1.4em;
  padding: 12px var(--gutter) 0;
  font: 500 0.68rem/1.4 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

.also {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0 0;
  padding: 0 var(--gutter);
}
.chip { padding: 10px 14px; }

@media (max-width: 620px) {
  .grid { grid-template-columns: 1fr 1fr; }
  .go { grid-column: 1 / -1; }
}
</style>
