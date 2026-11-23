#!/usr/bin/env node
/**
 * Assemble le dossier à mettre en ligne : l'application construite, puis les audios ajoutés
 * en **liens durs**. 1,5 Go qu'on ne peut pas se permettre de recopier — le disque du Mac est
 * serré — et que Cloudflare lira comme des fichiers ordinaires.
 *
 *   node scripts/deploy.mjs [--audio <dossier _web>] [--out deploy]
 *
 * Sans --audio, le dossier est déduit du lien symbolique public/audio/ca utilisé en
 * développement, pour n'avoir le chemin écrit qu'à un seul endroit.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, statSync } from 'node:fs'
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
  const lien = join(root, 'public', 'audio', 'ca')
  if (existsSync(lien) && lstatSync(lien).isSymbolicLink()) return dirname(resolve(readlinkSync(lien)))
  console.error('Impossible de deviner le dossier des audios : passe --audio <dossier _web>.')
  process.exit(1)
}

const audio = audioRoot()
const out = resolve(args.out || join(root, 'deploy'))

const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(join(root, 'dist'), out, { recursive: true })

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
