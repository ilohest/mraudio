<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import DrawBar from './components/DrawBar.vue'
import VersePicker from './components/VersePicker.vue'
import NowPlaying from './components/NowPlaying.vue'
import { lang, t } from './lib/i18n'
import { getCatalog, type Track } from './lib/catalog'
import { shortLabel } from './lib/labels'
import { usePlayer } from './composables/usePlayer'

const catalog = computed(() => getCatalog(lang.value))
const player = usePlayer()
const drawn = ref(false)
const stage = ref<HTMLElement | null>(null)

function open(tr: Track, opts: { drawn?: boolean; autoplay?: boolean } = {}) {
  if (!catalog.value) return
  drawn.value = !!opts.drawn
  player.load(tr, catalog.value.url(tr), opts.autoplay ?? true)
  history.replaceState(null, '', `#${lang.value}/${tr.book}/${tr.verse}${tr.part}`)
  nextTick(() => {
    const el = stage.value
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function draw() {
  if (catalog.value) open(catalog.value.random(player.track.value), { drawn: true })
}

function step(dir: 1 | -1) {
  const tr = player.track.value
  const next = tr && catalog.value?.neighbour(tr, dir)
  if (next) open(next)
}

const hasPrev = computed(() => !!(player.track.value && catalog.value?.neighbour(player.track.value, -1)))
const hasNext = computed(() => !!(player.track.value && catalog.value?.neighbour(player.track.value, 1)))

/* Changement de langue : on garde le même verset s'il existe dans la nouvelle langue. */
watch(lang, () => {
  const tr = player.track.value
  const same = tr && catalog.value?.tracks.find((x) => x.id === tr.id)
  if (same) open(same, { autoplay: false })
  else {
    player.stop()
    history.replaceState(null, '', `#${lang.value}`)
  }
})

watch(
  [() => player.track.value, t],
  ([tr]) => (document.title = tr ? `${shortLabel(tr, t.value)} — ${t.value.work}` : t.value.work),
  { immediate: true },
)

/* Lien direct : #ca/7/56 · #ca/0/0b · #ca/41/0 */
onMounted(() => {
  const [, b, v] = location.hash.replace('#', '').split('/')
  if (!b || !catalog.value) return
  const m = (v ?? '0').match(/^(\d+)([a-z]?)$/)
  if (!m) return
  const id = String(parseInt(b, 10)).padStart(2, '0') + m[1].padStart(3, '0') + m[2]
  const tr = catalog.value.tracks.find((x) => x.id === id)
  if (tr) open(tr, { autoplay: false })
})

/* Raccourcis clavier, annoncés en pied de page. */
function onKey(e: KeyboardEvent) {
  const el = e.target as HTMLElement
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'BUTTON' || el.getAttribute('role') === 'slider') return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.code === 'Space' && player.track.value) { e.preventDefault(); player.toggle() }
  else if (e.key === 'ArrowLeft' && hasPrev.value) { e.preventDefault(); step(-1) }
  else if (e.key === 'ArrowRight' && hasNext.value) { e.preventDefault(); step(1) }
  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); draw() }
}
onMounted(() => addEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <header class="masthead">
      <div class="idbar">
        <p class="micro">{{ t.author }}</p>
        <LangSwitch />
      </div>
      <h1 class="title">{{ t.work }}</h1>
    </header>

    <template v-if="catalog">
      <section class="band"><DrawBar @draw="draw" /></section>

      <section v-if="player.track.value" ref="stage" class="band">
        <NowPlaying
          :key="`${lang}-${player.track.value.id}`"
          :track="player.track.value"
          :drawn="drawn"
          :has-prev="hasPrev"
          :has-next="hasNext"
          @prev="step(-1)"
          @next="step(1)"
          @again="draw"
        />
      </section>

      <section class="band"><VersePicker :catalog="catalog" @pick="(tr) => open(tr)" /></section>
    </template>

    <section v-else class="band"><p class="soon">{{ t.soon }}</p></section>

    <footer class="foot">
      <span>{{ catalog ? t.tracks(catalog.tracks.length) : '—' }}</span>
      <span class="keys">{{ t.shortcuts }}</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.idbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px var(--gutter);
  border-bottom: 1px solid var(--rule);
}

.masthead { padding-bottom: clamp(26px, 5vw, 56px); }

/* Le titre tient la page : capitales, graisse pleine, chasse resserrée. */
.title {
  margin: clamp(26px, 6vw, 60px) 0 0;
  padding: 0 var(--gutter);
  font-family: var(--display);
  font-weight: 700;
  font-stretch: 112%;
  font-size: clamp(2.6rem, 11.5vw, 8.5rem);
  line-height: 0.85;
  letter-spacing: -0.045em;
  text-transform: uppercase;
}
.band { border-top: 1px solid var(--rule); }

.soon {
  margin: 0;
  padding: clamp(40px, 9vw, 90px) var(--gutter);
  max-width: 34ch;
  font: 500 0.8rem/1.7 var(--mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
}

.foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px var(--gutter);
  border-top: 1px solid var(--rule);
  font: 500 0.62rem/1.4 var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dim);
}
.keys { text-transform: none; letter-spacing: 0.1em; }

@media (max-width: 620px) {
  .keys { display: none; }
}
</style>
