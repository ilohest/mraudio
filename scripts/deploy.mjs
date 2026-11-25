#!/usr/bin/env node
/**
 * Assemble le dossier à mettre en ligne : l'application construite, puis les audios ajoutés
 * en **liens durs**. 1,5 Go qu'on ne peut pas se permettre de recopier — le disque du Mac est
 * serré — et que Cloudflare lira comme des fichiers ordinaires.
 *
 *   node scripts/deploy.mjs [--audio <dossier _web>] [--out deploy]
 *
 * Sans --audio : le dossier `audio-web` du projet, sinon celui que désigne le lien
 * symbolique public/audio/ca utilisé en développement.
 */
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  realpathSync, rmSync, statSync, writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true])
    return acc
  }, []),
)

function audioRoot() {
  if (args.audio) return resolve(args.audio)
  const local = join(root, 'audio-web')
  if (existsSync(local)) return local
  // Repli : le lien de développement, que son chemin soit relatif ou absolu.
  const lien = join(root, 'public', 'audio', 'ca')
  if (existsSync(lien) && lstatSync(lien).isSymbolicLink()) return dirname(realpathSync(lien))
  console.error('Dossier des audios introuvable : passe --audio <dossier>.')
  process.exit(1)
}

const audio = audioRoot()
const out = resolve(args.out || join(root, 'deploy'))

const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(join(root, 'dist'), out, { recursive: true })

/**
 * La page 404 est servie à la place de n'importe quelle adresse inconnue, y compris sous un
 * chemin profond où les liens relatifs ne résoudraient pas. On l'assemble donc en un seul
 * fichier : la fonte d'affichage et l'icône y sont embarquées, elle ne demande rien d'autre.
 */
// Les images d'aperçu sont versionnées : les refaire demande Chrome (voir scripts/images.mjs).
for (const nom of ['og.png', 'og-ca.png', 'og-es.png', 'og-fr.png']) {
  const img = join(root, 'src', 'assets', nom)
  if (existsSync(img)) cpSync(img, join(out, nom))
}

/**
 * Une page d'entrée par langue : /ca, /es, /fr.
 *
 * L'aperçu d'un lien partagé est fabriqué par un serveur distant qui ne reçoit **jamais le
 * fragment** — `mraudio.app/#fr` lui arrive comme `mraudio.app/`. Tant que la langue vivait
 * dans le fragment, partager la version française montrait donc l'aperçu trilingue de la
 * racine. La langue est passée dans le chemin, et chaque chemin reçoit ici sa propre tête :
 * titre, description, langue déclarée et image.
 *
 * Deux précautions :
 * - `<base href="/">` est posé en tête, parce que l'application est construite avec des
 *   adresses relatives (`./assets/…`, `./audio/…`). Servie sous /fr, elle les résoudrait
 *   autrement selon que l'adresse porte ou non une barre finale. Avec cette base, plus de
 *   question : tout part de la racine.
 * - la racine `/` garde son aperçu trilingue : qui partage le domaine nu ne partage pas une
 *   langue, et son visiteur verra la sienne.
 */
const PAGES = {
  ca: {
    locale: 'ca_ES',
    work: 'El Missatge Retrobat',
    desc: 'Escolta un verset a l’atzar. Louis Cattiaux, llegit en veu alta.',
    alt: '« Louis Cattiaux — El Missatge Retrobat » sobre fons crema, al costat d’una orella dibuixada a la línia.',
  },
  es: {
    locale: 'es_ES',
    work: 'El Mensaje Reencontrado',
    desc: 'Escucha un versículo al azar. Louis Cattiaux, leído en voz alta.',
    alt: '«Louis Cattiaux — El Mensaje Reencontrado» sobre fondo crema, junto a una oreja dibujada a línea.',
  },
  fr: {
    locale: 'fr_FR',
    work: 'Le Message Retrouvé',
    desc: 'Écoutez un verset au hasard. Louis Cattiaux, lu à voix haute.',
    alt: '« Louis Cattiaux — Le Message Retrouvé » sur fond crème, à côté d’une oreille dessinée au trait.',
  },
}

const SITE = 'https://mraudio.app'
const souche = readFileSync(join(out, 'index.html'), 'utf8')

/**
 * Remplace une valeur d'attribut, et refuse de continuer si la balise a changé de forme — une
 * page d'entrée muette serait pire qu'absente. On vérifie que le motif **trouve** la balise, et
 * non que le texte change : pour le français, le titre posé est le même que celui de la racine.
 */
function poser(html, motif, valeur, quoi) {
  if (!motif.test(html)) {
    console.error(`La balise « ${quoi} » est introuvable dans index.html : la page d'entrée serait fausse.`)
    process.exit(1)
  }
  return html.replace(motif, (m, avant) => avant + valeur)
}

for (const [l, p] of Object.entries(PAGES)) {
  const autres = Object.entries(PAGES).filter(([k]) => k !== l).map(([, v]) => v.locale)
  let page = souche
    .replace('<html lang="ca">', `<html lang="${l}">`)
    .replace('<head>', `<head>\n    <base href="/" />`)
  page = poser(page, /(<title>)[^<]*/, `${p.work} — Louis Cattiaux`, 'title')
  page = poser(page, /(<meta name="description" content=")[^"]*/, p.desc, 'description')
  page = poser(page, /(<meta property="og:url" content=")[^"]*/, `${SITE}/${l}`, 'og:url')
  page = poser(page, /(<meta property="og:title" content=")[^"]*/, `${p.work} — Louis Cattiaux`, 'og:title')
  page = poser(page, /(<meta property="og:description" content=")[^"]*/, p.desc, 'og:description')
  page = poser(page, /(<meta property="og:image" content=")[^"]*/, `${SITE}/og-${l}.png`, 'og:image')
  page = poser(page, /(<meta property="og:image:alt" content=")[^"]*/, p.alt, 'og:image:alt')
  page = poser(page, /(<meta property="og:locale" content=")[^"]*/, p.locale, 'og:locale')
  // Les deux autres langues restent annoncées : la page les offre, elle ne les cache pas.
  let i = 0
  page = page.replace(/(<meta property="og:locale:alternate" content=")[^"]*/g, (m, avant) => avant + autres[i++])
  writeFileSync(join(out, `${l}.html`), page)
}
console.log(`  pages d'entrée : ${Object.keys(PAGES).map((l) => `/${l}`).join(', ')}`)

const gabarit = join(root, 'src', '404.template.html')
if (existsSync(gabarit)) {
  const fonte = readFileSync(join(root, 'src', 'assets', 'fonts', 'OrticaLinear-Light.woff2')).toString('base64')
  const icone = readFileSync(join(root, 'index.html'), 'utf8').match(/<link rel="icon" href="([^"]+)"/)?.[1] ?? ''
  const page = readFileSync(gabarit, 'utf8').replace('{{FONT_ORTICA}}', fonte).replace('{{FAVICON}}', icone)
  writeFileSync(join(out, '404.html'), page)
  console.log(`  404.html : ${(page.length / 1024).toFixed(0)} Ko, autonome`)
}

const langues = readdirSync(audio).filter((d) => /^[a-z]{2}$/.test(d) && statSync(join(audio, d)).isDirectory())
if (!langues.length) {
  console.error(`Aucune langue trouvée dans ${audio}`)
  process.exit(1)
}
mkdirSync(join(out, 'audio'), { recursive: true })
for (const l of langues) {
  // -a préserve l'arborescence, -l pose des liens durs : zéro octet copié.
  const r = spawnSync('cp', ['-al', join(audio, l), join(out, 'audio', l)], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const compte = spawnSync('sh', ['-c', `find ${JSON.stringify(out)} -type f | wc -l`], { encoding: 'utf8' })
console.log(`\n✓ ${out}`)
console.log(`  langues : ${langues.join(', ')}`)
console.log(`  fichiers : ${compte.stdout.trim()} (limite Cloudflare : 20 000 par version)`)
