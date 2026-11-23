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
  // L'espagnol n'a qu'une piste préliminaire, qui porte son titre en toutes lettres.
  es: { '00000b': 'Oraciones del Padre y de la Madre' },
}

/**
 * Litanies : le catalan tient en une seule piste, l'espagnol est découpé en quatre plages de
 * versets. Les bornes viennent des noms de fichiers reçus et n'existent nulle part ailleurs —
 * le manifeste ne garde que les identifiants.
 */
const LITANY_RANGES: Partial<Record<Lang, Record<string, string>>> = {
  es: { '41000a': '1 – 48', '41000b': '49 – 65', '41000c': '66 – 105', '41000d': '106 – 144' },
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
    const range = LITANY_RANGES[lang.value]?.[tr.id]
    const big = range ? `${t.litanies} ${range}` : t.litanies
    return { kicker: t.work, big, numeral: false, verseLabel: '', verse: '' }
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
