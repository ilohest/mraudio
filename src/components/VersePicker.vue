<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { t, lang } from '../lib/i18n'
import { parseBook, toRoman } from '../lib/roman'
import { FIRST_BOOK, LAST_BOOK, type Catalog, type Track } from '../lib/catalog'

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
  const verse = verseInput.value.trim() === '' ? 0 : parseInt(verseInput.value, 10)
  const [min, max] = range.value!
  if (isNaN(verse) || verse < min || verse > max) return fail(t.value.errVerse(min, max))
  const tr = props.catalog.find(book.value!, verse)
  if (!tr) return fail(t.value.errMissing)
  emit('pick', tr)
}
</script>

<template>
  <form class="picker" @submit.prevent="submit" novalidate>
    <p class="head">{{ t.chooseTitle }}</p>

    <div class="grid" :class="{ shaking }">
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
    </div>

    <button class="go" type="submit">
      <span>{{ t.listen }}</span>
      <span class="arrow" aria-hidden="true">→</span>
    </button>

    <p class="msg" role="status" aria-live="polite">{{ message }}</p>
  </form>
</template>

<style scoped>
.picker { padding: var(--pad); }

/* Intitulé de section, souligné d'un filet : la ligne de notice du spécimen. */
.head {
  margin: 0 0 16px;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--line);
  font: 400 1.06rem/1.3 var(--sans);
  color: var(--ink);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.grid.shaking { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60% { transform: translateX(7px); }
}

/* Chaque champ est une petite carte blanche posée sur la carte grise. */
.cell {
  display: grid;
  gap: 6px;
  align-content: start;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 12px 14px 10px;
  min-width: 0;
  transition: border-color 0.2s ease, transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cell:focus-within { border-color: var(--ink); transform: translateY(-2px); }

.num {
  width: 100%;
  min-width: 0;
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(1.9rem, 13cqi, 3.1rem);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--ink);
  background: transparent;
  border: 0;
  padding: 0;
  font-variant-numeric: lining-nums;
}
.num::placeholder { color: var(--line); }
.num:focus { outline: none; }
.num[aria-invalid='true'] { color: var(--rubric-deep); }
.hint { font-size: 0.8rem; }
.hint.bad { color: var(--rubric-deep); }

/* Deuxième action de la page : large, cerclée d'encre, jamais cachée. */
.go {
  appearance: none;
  width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
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
.go .arrow {
  font-family: var(--display);
  font-size: 1.3rem;
  transition: transform 0.34s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.go:hover { background: var(--ink); color: var(--bg); transform: translateY(-3px); }
.go:hover .arrow { transform: translateX(10px); }
.go:active { transform: scale(0.98); }
.go:focus-visible { outline: 3px solid var(--rubric-deep); outline-offset: 3px; }

.msg {
  margin: 0;
  min-height: 1.5em;
  padding-top: 12px;
  font: 400 0.95rem/1.4 var(--sans);
  color: var(--rubric-deep);
}
</style>
