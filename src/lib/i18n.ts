import { ref, computed } from 'vue'

export type Lang = 'ca' | 'es' | 'fr'
export const LANGS: Lang[] = ['ca', 'es', 'fr']

const messages = {
  ca: {
    work: 'El Missatge Retrobat',
    author: 'Louis Cattiaux',
    drawHint: 'Prem el tallapapers per obrir un verset a l’atzar',
    drawAria: 'Obrir un verset a l’atzar',
    or: 'o bé',
    chooseTitle: 'Tria un verset',
    book: 'Llibre',
    verse: 'Verset',
    listen: 'Escoltar',
    epigraphs: 'Epígrafs',
    preliminary: 'Preliminars',
    litanies: 'Lletanies',
    part: 'Part',
    also: 'També :',
    play: 'Reproduir',
    pause: 'Pausa',
    replay: 'Tornar a començar',
    prev: 'Verset anterior',
    next: 'Verset següent',
    again: 'Obrir-ne un altre',
    share: 'Copiar l’enllaç',
    copied: 'Enllaç copiat',
    versesIn: (n: number) => `${n} versets`,
    errEmptyBook: 'Escriu el número del llibre.',
    errBook: (max: number) => `El llibre ha d’anar de I a ${max}.`,
    errVerse: (min: number, max: number) => `Aquest llibre té els versets ${min} a ${max}.`,
    errMissing: 'Aquest verset no té àudio.',
    errAudio: 'No s’ha pogut reproduir l’àudio.',
    soon: 'Els àudios en aquesta llengua arribaran aviat.',
    tracks: (n: number) => `${n} àudios`,
    shortcuts: 'Espai · lectura   ←→ · verset   R · atzar',
    langName: 'Català',
  },
  es: {
    work: 'El Mensaje Reencontrado',
    author: 'Louis Cattiaux',
    drawHint: 'Pulsa el abrecartas para abrir un versículo al azar',
    drawAria: 'Abrir un versículo al azar',
    or: 'o bien',
    chooseTitle: 'Elige un versículo',
    book: 'Libro',
    verse: 'Versículo',
    listen: 'Escuchar',
    epigraphs: 'Epígrafes',
    preliminary: 'Preliminares',
    litanies: 'Letanías',
    part: 'Parte',
    also: 'También:',
    play: 'Reproducir',
    pause: 'Pausa',
    replay: 'Volver a empezar',
    prev: 'Versículo anterior',
    next: 'Versículo siguiente',
    again: 'Abrir otro',
    share: 'Copiar el enlace',
    copied: 'Enlace copiado',
    versesIn: (n: number) => `${n} versículos`,
    errEmptyBook: 'Escribe el número del libro.',
    errBook: (max: number) => `El libro debe ir de I a ${max}.`,
    errVerse: (min: number, max: number) => `Este libro tiene los versículos ${min} a ${max}.`,
    errMissing: 'Este versículo no tiene audio.',
    errAudio: 'No se ha podido reproducir el audio.',
    soon: 'Los audios en este idioma llegarán pronto.',
    tracks: (n: number) => `${n} audios`,
    shortcuts: 'Espacio · lectura   ←→ · versículo   R · azar',
    langName: 'Español',
  },
  fr: {
    work: 'Le Message Retrouvé',
    author: 'Louis Cattiaux',
    drawHint: 'Touche le coupe-papier pour ouvrir un verset au hasard',
    drawAria: 'Ouvrir un verset au hasard',
    or: 'ou bien',
    chooseTitle: 'Choisis un verset',
    book: 'Livre',
    verse: 'Verset',
    listen: 'Écouter',
    epigraphs: 'Épigraphes',
    preliminary: 'Préliminaires',
    litanies: 'Litanies',
    part: 'Partie',
    also: 'Aussi :',
    play: 'Lecture',
    pause: 'Pause',
    replay: 'Recommencer',
    prev: 'Verset précédent',
    next: 'Verset suivant',
    again: 'En ouvrir un autre',
    share: 'Copier le lien',
    copied: 'Lien copié',
    versesIn: (n: number) => `${n} versets`,
    errEmptyBook: 'Indique le numéro du livre.',
    errBook: (max: number) => `Le livre doit aller de I à ${max}.`,
    errVerse: (min: number, max: number) => `Ce livre contient les versets ${min} à ${max}.`,
    errMissing: 'Ce verset n’a pas d’audio.',
    errAudio: 'Impossible de lire l’audio.',
    soon: 'Les audios dans cette langue arrivent bientôt.',
    tracks: (n: number) => `${n} audios`,
    shortcuts: 'Espace · lecture   ←→ · verset   R · hasard',
    langName: 'Français',
  },
} as const

function initialLang(): Lang {
  const fromHash = location.hash.replace('#', '').split('/')[0]
  if ((LANGS as string[]).includes(fromHash)) return fromHash as Lang
  try {
    const saved = localStorage.getItem('mr-lang')
    if (saved && (LANGS as string[]).includes(saved)) return saved as Lang
  } catch { /* stockage indisponible */ }
  const nav = navigator.language.slice(0, 2)
  return nav === 'es' ? 'es' : nav === 'fr' ? 'fr' : 'ca'
}

export const lang = ref<Lang>(initialLang())
export const t = computed(() => messages[lang.value])

export function setLang(l: Lang) {
  lang.value = l
  document.documentElement.lang = l
  try { localStorage.setItem('mr-lang', l) } catch { /* ignore */ }
}
document.documentElement.lang = lang.value
