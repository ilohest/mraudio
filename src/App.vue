<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import LetterOpener from './components/LetterOpener.vue'
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

/* Lien direct : #ca/7/56 · #es/0/0a · #ca/41/0 */
onMounted(() => {
  const [, b, v] = location.hash.replace('#', '').split('/')
  if (!b || !catalog.value) return
  const m = (v ?? '0').match(/^(\d+)([a-z]?)$/)
  if (!m) return
  const id = String(parseInt(b, 10)).padStart(2, '0') + m[1].padStart(3, '0') + m[2]
  const tr = catalog.value.tracks.find((x) => x.id === id)
  if (tr) open(tr, { autoplay: false })
})

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'BUTTON' || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.code === 'Space' && player.track.value) { e.preventDefault(); player.toggle() }
}
onMounted(() => addEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <header class="top">
      <p class="brand">
        <span class="mark" aria-hidden="true">✦</span>
        <span>{{ t.author }}</span>
      </p>
      <LangSwitch />
    </header>

    <main class="main">
      <section class="intro">
        <h1 class="title">{{ t.work }}</h1>
        <p class="tagline">{{ t.tagline }}</p>
      </section>

      <template v-if="catalog">
        <LetterOpener @draw="draw" />

        <div ref="stage" class="stage">
          <Transition name="fade" mode="out-in">
            <NowPlaying
              v-if="player.track.value"
              :key="lang"
              :track="player.track.value"
              :drawn="drawn"
              :has-prev="hasPrev"
              :has-next="hasNext"
              @prev="step(-1)"
              @next="step(1)"
              @again="draw"
            />
          </Transition>
        </div>

        <div class="or" aria-hidden="true"><span>{{ t.or }}</span></div>

        <VersePicker :catalog="catalog" @pick="(tr) => open(tr)" />
      </template>

      <p v-else class="soon">{{ t.soon }}</p>
    </main>

    <footer class="foot">
      <span>{{ t.work }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ catalog ? t.tracks(catalog.tracks.length) : '—' }}</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 0 20px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 0 0;
}
.brand {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font: 500 0.72rem/1 var(--sans);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
.mark { color: var(--gold); font-size: 0.9rem; letter-spacing: 0; }

.main {
  display: grid;
  align-content: start;
  gap: 18px;
  padding: clamp(28px, 7vh, 64px) 0 40px;
}
.intro { text-align: center; }
.title {
  margin: 0;
  font: 400 clamp(2.3rem, 7vw, 3.6rem)/1.02 var(--serif);
  letter-spacing: -0.01em;
  color: var(--ink);
}
.tagline {
  margin: 12px auto 0;
  max-width: 36ch;
  text-wrap: balance;
  font: italic 400 clamp(1.05rem, 2.6vw, 1.22rem)/1.4 var(--serif);
  color: var(--muted);
}
.stage { display: grid; min-height: 0; scroll-margin: 24px; }
.stage:empty { display: none; }

.or {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px auto 4px;
  width: min(360px, 80%);
  font: italic 0.95rem var(--serif);
  color: var(--muted);
}
.or::before, .or::after { content: ''; flex: 1; height: 1px; background: var(--line); }

.soon {
  margin: 40px auto;
  max-width: 34ch;
  text-wrap: balance;
  text-align: center;
  font: italic 1.2rem/1.5 var(--serif);
  color: var(--muted);
}

.foot {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 18px 0 26px;
  font: 0.7rem var(--sans);
  letter-spacing: 0.08em;
  color: rgb(122 108 85 / 0.7);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
