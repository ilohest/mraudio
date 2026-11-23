<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import DrawBar from './components/DrawBar.vue'
import NowPlaying from './components/NowPlaying.vue'
import { lang, t } from './lib/i18n'
import { getCatalog, type Track } from './lib/catalog'
import { shortLabel } from './lib/labels'
import { usePlayer, type Chain } from './composables/usePlayer'

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

/* Écoute suivie : ce qu'on fait quand un verset se termine. Le choix se garde d'une
   visite à l'autre — on vient écouter une suite, pas le réarmer à chaque fois. */
const chain = ref<Chain>('stop')
try {
  const saved = localStorage.getItem('mr-chain')
  if (saved === 'next' || saved === 'random') chain.value = saved
} catch { /* stockage indisponible */ }
watch(chain, (v) => {
  try { localStorage.setItem('mr-chain', v) } catch { /* stockage indisponible */ }
})
player.onEnded(() => {
  if (chain.value === 'next') step(1)
  else if (chain.value === 'random') draw()
})

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
    <div class="screen">
      <header class="card cream masthead">
        <div class="idbar">
          <p class="imprint">{{ t.author }}</p>
          <LangSwitch />
        </div>
        <h1 class="title">{{ t.work }}</h1>
      </header>

      <DrawBar v-if="catalog" @draw="draw" />

      <main ref="stage" class="card pane">
      <NowPlaying
        v-if="catalog"
        :key="`${lang}-${player.track.value?.id ?? 'buit'}`"
        :catalog="catalog"
        :track="player.track.value"
        :drawn="drawn"
        :has-prev="hasPrev"
        :has-next="hasNext"
        :chain="chain"
        @prev="step(-1)"
        @next="step(1)"
        @chain="(c) => (chain = c)"
        @pick="(tr) => open(tr)"
      />
        <p v-else class="soon">{{ t.soon }}</p>
      </main>
    </div>

    <footer class="foot">
      <!-- Légende du clavier : la touche dessinée comme une touche, puis ce qu'elle fait. -->
      <p class="keys">
        <span class="item"><kbd>{{ t.keySpace }}</kbd>{{ t.keyPlay }}</span>
        <span class="item"><kbd>←</kbd><kbd>→</kbd>{{ t.keyVerse }}</span>
        <span class="item"><kbd>R</kbd>{{ t.keyDraw }}</span>
      </p>

      <!-- Colophon : les voix de la langue écoutée, et la signature. -->
      <div class="colophon">
        <p v-if="catalog" class="credit">
          <span class="tag">{{ t.voices }}</span>
          <span class="names">{{ t.voiceNames }}</span>
        </p>
        <p class="credit end">
          <span class="tag">{{ t.madeBy }}</span>
          <a class="link" href="https://isaure-lohest.com/" target="_blank" rel="noopener noreferrer">
            Isaure Lohest
            <svg class="out" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M7.5 16.5 16.5 7.5M9.6 7.5h6.9v6.9"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}
.screen {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  padding: var(--gap);
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
  margin: clamp(22px, min(7vw, 5.6svh), 84px) 0 0;
  max-width: 20ch;
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(2.3rem, min(10vw, 9svh), 7rem);
  line-height: 1;
  letter-spacing: -0.022em;
  animation: settle 0.7s cubic-bezier(0.22, 1, 0.3, 1) both;
}
@keyframes settle {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to { opacity: 1; transform: none; }
}

/* La carte mesure sa propre largeur : les tailles internes sont en cqi. */
.pane { container-type: inline-size; }

/* Dès qu'il y a la place, la vue tient exactement dans la hauteur de l'écran : la carte
   du lecteur absorbe ce qui reste, et ses grands chiffres se calibrent dessus (cqh).
   Seule la légende du clavier passe sous la ligne de flottaison — Isaure l'autorise.
   Vaut aussi sur téléphone : c'est pour ça que le repère reste sur deux colonnes et que les
   commandes secondaires y perdent leur libellé. Sur un écran vraiment court, la page redevient
   un document qui défile. */
@media (min-width: 340px) and (min-height: 620px) {
  .screen { height: 100svh; }
  .pane {
    flex: 1 1 auto;
    min-height: 0;
    container-type: size;
  }
}

.soon {
  margin: 0;
  padding: var(--pad);
  max-width: 38ch;
  font: 400 1.05rem/1.55 var(--sans);
  color: var(--dim);
}

.foot {
  padding: 12px var(--gap) calc(var(--gap) + 8px);
  font: 400 0.84rem/1.45 var(--sans);
  color: var(--dim);
}
.keys {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px 24px;
  margin: 0 0 16px;
}
.item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

/* Colophon : deux colonnes sous un filet, l'intitulé en gris, le nom en encre. */
.colophon {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px 40px;
  padding-top: 15px;
  border-top: 1px solid var(--line);
}
.credit {
  display: grid;
  gap: 2px;
  margin: 0;
  min-width: 0;
}
.credit.end {
  margin-left: auto;
  text-align: right;
  justify-items: end;
}
.tag { font-size: 0.78rem; }
.names { color: var(--ink); }
.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid var(--line);
  padding-bottom: 2px;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.link:hover { color: var(--rubric-deep); border-bottom-color: var(--rubric-deep); }
.link:focus-visible { outline: 2px solid var(--rubric-deep); outline-offset: 3px; }
.out {
  width: 0.9em;
  height: 0.9em;
  flex: none;
}
/* Le filet du bas donne le relief d'une touche, sans ombre portée. */
kbd {
  font: inherit;
  line-height: 1;
  padding: 5px 7px;
  min-width: 2.2em;
  text-align: center;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 5px;
}

/* Sans clavier, la légende n'a rien à dire ; le colophon, lui, reste. */
@media (pointer: coarse) {
  .keys { display: none; }
}
</style>
