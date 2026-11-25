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
    hypographs: 'Hipògrafs',
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
    chainLabel: 'En acabar el verset',
    chainStop: 'Aturar-se',
    chainNext: 'Seguir en ordre',
    chainRandom: 'Un altre a l’atzar',
    versesIn: (n: number) => `${n} versets`,
    errEmptyBook: 'Escriu el número del llibre.',
    errBook: (max: number) => `El llibre ha d’anar de I a ${max}.`,
    errVerse: (min: number, max: number) => `Aquest llibre té els versets ${min} a ${max}.`,
    errMissing: 'Aquest verset no té àudio.',
    errAudio: 'No s’ha pogut reproduir l’àudio.',
    soon: 'Els àudios en aquesta llengua arribaran aviat.',
    tracks: (n: number) => `${n} àudios`,
    voices: 'Veus',
    voiceNames: 'Jeanne & Jean-Christophe Lohest, Josep-Maria Sagrera',
    madeBy: 'Disseny i desenvolupament',
    keySpace: 'Espai',
    keyPlay: 'Reproduir o pausar',
    keyVerse: 'Verset anterior o següent',
    keyDraw: 'Obrir-ne un altre a l’atzar',
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
    hypographs: 'Hipógrafes',
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
    chainLabel: 'Al terminar el versículo',
    chainStop: 'Parar',
    chainNext: 'Seguir en orden',
    chainRandom: 'Otro al azar',
    versesIn: (n: number) => `${n} versículos`,
    errEmptyBook: 'Escribe el número del libro.',
    errBook: (max: number) => `El libro debe ir de I a ${max}.`,
    errVerse: (min: number, max: number) => `Este libro tiene los versículos ${min} a ${max}.`,
    errMissing: 'Este versículo no tiene audio.',
    errAudio: 'No se ha podido reproducir el audio.',
    soon: 'Los audios en este idioma llegarán pronto.',
    tracks: (n: number) => `${n} audios`,
    voices: 'Voces',
    voiceNames: 'Esther & Adrés Molero',
    madeBy: 'Diseño y desarrollo',
    keySpace: 'Espacio',
    keyPlay: 'Reproducir o pausar',
    keyVerse: 'Versículo anterior o siguiente',
    keyDraw: 'Abrir otro al azar',
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
    hypographs: 'Hypographes',
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
    chainLabel: 'À la fin du verset',
    chainStop: 'S’arrêter',
    chainNext: 'Suivre dans l’ordre',
    chainRandom: 'Un autre au hasard',
    versesIn: (n: number) => `${n} versets`,
    errEmptyBook: 'Indique le numéro du livre.',
    errBook: (max: number) => `Le livre doit aller de I à ${max}.`,
    errVerse: (min: number, max: number) => `Ce livre contient les versets ${min} à ${max}.`,
    errMissing: 'Ce verset n’a pas d’audio.',
    errAudio: 'Impossible de lire l’audio.',
    soon: 'Les audios dans cette langue arrivent bientôt.',
    tracks: (n: number) => `${n} audios`,
    voices: 'Voix',
    voiceNames: 'Jeanne & Jean-Christophe Lohest',
    madeBy: 'Conception et développement',
    keySpace: 'Espace',
    keyPlay: 'Lecture ou pause',
    keyVerse: 'Verset précédent ou suivant',
    keyDraw: 'En ouvrir un autre au hasard',
    langName: 'Français',
  },
} as const

/**
 * L'adresse a deux formes, et c'est voulu.
 *
 * La langue vit désormais dans le **chemin** : `/fr`, `/fr#7/56`. Un fragment n'est jamais
 * envoyé au serveur — WhatsApp, Signal, Slack et les autres ne demandent que `mraudio.app/`
 * et ne voient donc pas `#fr`. Tant que la langue était dans le fragment, l'aperçu d'un lien
 * partagé ne pouvait pas être dans la langue partagée : c'est la même page pour tout le monde.
 *
 * L'ancienne forme (`#fr/7/56`) reste **lue**, parce que des liens ont déjà circulé ; elle ne
 * s'écrit plus. Le premier affichage réécrit l'adresse dans la forme actuelle.
 */
function langFromPath(): Lang | null {
  const seg = location.pathname.replace(/^\/+|\/+$/g, '')
  return (LANGS as string[]).includes(seg) ? (seg as Lang) : null
}

/** Le verset demandé par l'adresse, quelle que soit sa forme : [livre, verset]. */
export function verseFromUrl(): [string | undefined, string | undefined] {
  const parts = location.hash.replace('#', '').split('/').filter(Boolean)
  if ((LANGS as string[]).includes(parts[0])) parts.shift()
  return [parts[0], parts[1]]
}

/** L'adresse à écrire : la langue dans le chemin, le verset dans le fragment. */
export function urlFor(l: Lang, verse?: string) {
  return `/${l}${verse ? `#${verse}` : ''}`
}

function initialLang(): Lang {
  const fromPath = langFromPath()
  if (fromPath) return fromPath
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
