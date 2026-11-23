import type { Lang } from './i18n'
import { toRoman } from './roman'

/** Livres « numérotés » du Message Retrouvé. 0 = préliminaires, 41 = litanies. */
export const FIRST_BOOK = 1
export const LAST_BOOK = 40
export const PRELIM_BOOK = 0
export const LITANIES_BOOK = 41

interface Manifest {
  lang: Lang
  ext: string
  count: number
  books: Record<string, string[]>
}

/** Une piste audio : id « 07056 » (livre 7, verset 56), « 00000a » (préliminaires, partie a). */
export interface Track {
  id: string
  book: number
  verse: number
  part: string
}

const manifests = import.meta.glob<Manifest>('../data/manifest.*.json', { eager: true, import: 'default' })

const AUDIO_BASE = (import.meta.env.VITE_AUDIO_BASE as string | undefined) ?? './audio/'

export function parseId(id: string): Track {
  return { id, book: parseInt(id.slice(0, 2), 10), verse: parseInt(id.slice(2, 5), 10), part: id.slice(5) }
}

export class Catalog {
  readonly lang: Lang
  readonly tracks: Track[]
  private byId = new Map<string, number>()
  private ext: string

  constructor(m: Manifest) {
    this.lang = m.lang
    this.ext = m.ext
    this.tracks = Object.values(m.books).flat().sort().map(parseId)
    this.tracks.forEach((tr, i) => this.byId.set(tr.id, i))
  }

  url(track: Track) {
    return `${AUDIO_BASE}${this.lang}/${track.id.slice(0, 2)}/${track.id}.${this.ext}`
  }

  versesOf(book: number) {
    return this.tracks.filter((tr) => tr.book === book)
  }

  /** Bornes de versets affichées pour un livre (épigraphes = 0). */
  range(book: number): [number, number] | null {
    const v = this.versesOf(book)
    return v.length ? [v[0].verse, v[v.length - 1].verse] : null
  }

  find(book: number, verse: number) {
    return this.tracks.find((tr) => tr.book === book && tr.verse === verse) ?? null
  }

  neighbour(track: Track, step: 1 | -1) {
    const i = this.byId.get(track.id)
    if (i === undefined) return null
    return this.tracks[i + step] ?? null
  }

  /** Tirage : uniquement de vrais versets (livres I–XL, verset ≥ 1). */
  random(exclude?: Track | null) {
    const pool = this.tracks.filter((tr) => tr.book >= FIRST_BOOK && tr.book <= LAST_BOOK && tr.verse > 0 && !tr.part)
    let pick: Track
    do pick = pool[Math.floor(Math.random() * pool.length)]
    while (pool.length > 1 && exclude && pick.id === exclude.id)
    return pick
  }
}

export function getCatalog(lang: Lang): Catalog | null {
  const m = manifests[`../data/manifest.${lang}.json`]
  return m ? new Catalog(m) : null
}

export { toRoman }
