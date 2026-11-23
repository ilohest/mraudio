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
    <header class="card cream masthead">
      <div class="idbar">
        <p class="imprint">{{ t.author }}</p>
        <LangSwitch />
      </div>
      <h1 class="title">{{ t.work }}</h1>
    </header>

    <DrawBar v-if="catalog" @draw="draw" />

    <main class="grid" :class="{ solo: !(catalog && player.track.value) }">
      <section v-if="catalog && player.track.value" ref="stage" class="card pane stage">
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

      <div class="column">
        <section v-if="catalog" class="card pane">
          <VersePicker :catalog="catalog" @pick="(tr) => open(tr)" />
        </section>
        <section v-else class="card pane"><p class="soon">{{ t.soon }}</p></section>
      </div>
    </main>

    <footer class="foot">
      <span class="keys">{{ t.shortcuts }}</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
  padding: var(--gap);
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

/* La carte crème : la une. Tout le reste est gris. */
.masthead { padding: var(--pad); }
.idbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.imprint {
  margin: 0;
  font: 400 0.92rem/1 var(--sans);
  color: var(--ink);
}

/* Le titre en Ortica Light : la seule chose qui occupe vraiment la page. */
.title {
  margin: clamp(44px, 9vw, 120px) 0 0;
  max-width: 20ch;
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(2.7rem, 10vw, 7rem);
  line-height: 1;
  letter-spacing: -0.022em;
  animation: settle 0.7s cubic-bezier(0.22, 1, 0.3, 1) both;
}
@keyframes settle {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to { opacity: 1; transform: none; }
}

/* Deux colonnes dès qu'il y a la place : le repère à gauche, les commandes à droite. */
.grid {
  display: grid;
  gap: var(--gap);
  grid-template-columns: 1fr;
  align-items: start;
}
.column {
  display: grid;
  gap: var(--gap);
  align-content: start;
}
/* Les cartes mesurent leur propre largeur : les tailles internes sont en cqi,
   donc la colonne étroite ne reçoit pas des chiffres calibrés pour la page entière. */
.pane { container-type: inline-size; }

@media (min-width: 1000px) {
  .grid { grid-template-columns: minmax(0, 1fr) 400px; }
  .grid.solo { grid-template-columns: 1fr; }
}

.soon {
  margin: 0;
  padding: var(--pad);
  max-width: 38ch;
  font: 400 1.05rem/1.55 var(--sans);
  color: var(--dim);
}

.foot {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding: 4px 6px 2px;
  font: 400 0.82rem/1.4 var(--sans);
  color: var(--dim);
}

@media (max-width: 620px) {
  .keys { display: none; }
}
</style>
