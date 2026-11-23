import type { Track } from './catalog'
import { LITANIES_BOOK, PRELIM_BOOK } from './catalog'
import { toRoman } from './roman'
import { lang, type Lang, type t as tRef } from './i18n'

type Messages = (typeof tRef)['value']

/**
 * Noms propres des pistes du « livre 0 » (préliminaires), donnés par la cliente.
 * ES / FR : à compléter quand les audios arriveront ; sans nom, on retombe sur « Préliminaires · Partie n ».
 */
const PRELIM_NAMES: Partial<Record<Lang, Record<string, string>>> = {
  ca: { '00000b': 'Pare Daurat', '00000c': 'Mare Brilant', '00000d': 'La llum' },
}

/** Grand repère (« XXIII »), son étiquette (« Llibre ») et la ligne du verset. */
export function labelFor(tr: Track, t: Messages) {
  if (tr.book === PRELIM_BOOK) {
    const name = PRELIM_NAMES[lang.value]?.[tr.id]
    if (name) return { kicker: t.preliminary, big: name, numeral: false, verseLabel: '', verse: '' }
    const n = tr.part ? tr.part.charCodeAt(0) - 96 : 1
    return { kicker: t.work, big: t.preliminary, numeral: false, verseLabel: t.part, verse: String(n) }
  }
  if (tr.book === LITANIES_BOOK) {
    return { kicker: t.work, big: t.litanies, numeral: false, verseLabel: '', verse: '' }
  }
  if (tr.verse === 0) {
    return { kicker: t.book, big: toRoman(tr.book), numeral: true, verseLabel: '', verse: t.epigraphs }
  }
  return { kicker: t.book, big: toRoman(tr.book), numeral: true, verseLabel: t.verse, verse: String(tr.verse) }
}

/** Libellé court pour aria / titre d'onglet : « Llibre VII · Verset 56 ». */
export function shortLabel(tr: Track, t: Messages) {
  const l = labelFor(tr, t)
  const head = l.numeral ? `${t.book} ${l.big}` : l.big
  const tail = l.verseLabel ? `${l.verseLabel} ${l.verse}` : l.verse
  return tail ? `${head} · ${tail}` : head
}
