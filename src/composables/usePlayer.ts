import { ref, shallowRef } from 'vue'
import type { Track } from '../lib/catalog'

const audio = new Audio()
audio.preload = 'auto'

const track = shallowRef<Track | null>(null)
const playing = ref(false)
const loading = ref(false)
const error = ref(false)
const current = ref(0)
const duration = ref(0)

audio.addEventListener('play', () => (playing.value = true))
audio.addEventListener('pause', () => (playing.value = false))
audio.addEventListener('ended', () => (playing.value = false))
audio.addEventListener('waiting', () => (loading.value = true))
audio.addEventListener('playing', () => (loading.value = false))
audio.addEventListener('canplay', () => (loading.value = false))
audio.addEventListener('timeupdate', () => (current.value = audio.currentTime))
audio.addEventListener('loadedmetadata', () => (duration.value = audio.duration || 0))
audio.addEventListener('error', () => {
  if (!audio.src) return
  error.value = true
  loading.value = false
  playing.value = false
})

export function usePlayer() {
  function load(next: Track, url: string, autoplay = true) {
    track.value = next
    error.value = false
    current.value = 0
    duration.value = 0
    loading.value = true
    audio.src = url
    audio.load()
    if (autoplay) audio.play().catch(() => (loading.value = false))
  }
  function toggle() {
    if (!track.value || error.value) return
    audio.paused ? audio.play().catch(() => {}) : audio.pause()
  }
  function restart() {
    if (!track.value) return
    audio.currentTime = 0
    audio.play().catch(() => {})
  }
  function seek(ratio: number) {
    if (!duration.value) return
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * duration.value
  }
  function stop() {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    track.value = null
  }
  return { track, playing, loading, error, current, duration, load, toggle, restart, seek, stop }
}

export function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
