#!/usr/bin/env node
/**
 * Prépare les audios d'une langue pour le web.
 *
 *   node scripts/audio.mjs --lang ca --src "/chemin/EL MISSATGE RETROBAT EN AUDIO" --out ./audio-web [--convert]
 *   node scripts/audio.mjs --lang es --src "/chemin/AUDIOS MR" --out ./audio-web --convert
 *
 * - Parcourt --src récursivement (structure plate « 01005.ogg » OU sous-dossiers « 01/01005.ogg »).
 * - Nom attendu : 2 chiffres (livre) + 3 chiffres (verset) [+ 1 lettre optionnelle], ex. 07056.ogg, 00000a.m4a.
 *   « 41000Lletanies.m4a » → 41000. Les copies « 28004(1).ogg » sont ignorées.
 * - Écrit src/data/manifest.<lang>.json (embarqué dans l'app au build).
 * - Avec --convert : convertit tout en AAC mono 64 kbps → <out>/<lang>/<livre>/<id>.m4a (ffmpeg requis).
 *   Les fichiers déjà convertis sont sautés : on peut relancer sans risque.
 */
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { join, extname, basename, dirname, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { cpus } from 'node:os'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true])
    return acc
  }, []),
)
const lang = args.lang
const src = args.src && resolve(args.src)
if (!lang || !src) {
  console.error('Usage: node scripts/audio.mjs --lang <ca|es|fr> --src <dossier> [--out <dossier>] [--convert]')
  process.exit(1)
}
const out = resolve(args.out || 'audio-web')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const AUDIO_EXT = new Set(['.mp3', '.m4a', '.ogg', '.oga', '.wav', '.aac', '.flac', '.opus', '.webm', '.mp4'])

/** Pistes écartées à la demande de la cliente : « 00000a » ne doit pas apparaître. */
const DROP = new Set(['00000a'])

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.') || name.startsWith('_')) return []
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/** "07056.ogg" → "07056" · "00000a.m4a" → "00000a" · "41000Lletanies.m4a" → "41000" · "28004(1).ogg" → null */
function toId(file) {
  const stem = basename(file, extname(file))
  if (stem.includes('(')) return null
  const m = stem.match(/^(\d{5})([a-z]?)(.*)$/i)
  if (!m) return null
  const letter = m[3] ? '' : m[2] // une lettre seule = sous-partie ; sinon c'est un libellé
  return (m[1] + letter).toLowerCase()
}

const found = new Map()
const skipped = []
const dropped = []
for (const file of walk(src).sort()) {
  if (!AUDIO_EXT.has(extname(file).toLowerCase())) continue
  const id = toId(file)
  if (!id) { skipped.push(file.slice(src.length + 1)); continue }
  if (DROP.has(id)) { dropped.push(file.slice(src.length + 1)); continue }
  if (!found.has(id)) found.set(id, file)
}

const books = {}
for (const id of [...found.keys()].sort()) {
  const book = String(parseInt(id.slice(0, 2), 10))
  ;(books[book] ||= []).push(id)
}

const manifest = { lang, ext: 'm4a', count: found.size, books }
const dataDir = join(root, 'src', 'data')
mkdirSync(dataDir, { recursive: true })
writeFileSync(join(dataDir, `manifest.${lang}.json`), JSON.stringify(manifest))
console.log(`✓ ${found.size} audios → src/data/manifest.${lang}.json (${Object.keys(books).length} livres)`)
if (skipped.length) console.log(`  ignorés (${skipped.length}) : ${skipped.slice(0, 12).join(', ')}${skipped.length > 12 ? '…' : ''}`)
if (dropped.length) console.log(`  écartés volontairement (${dropped.length}) : ${dropped.join(', ')}`)

if (args.convert) {
  const jobs = [...found.entries()]
  let done = 0, failed = 0
  // Un fichier minuscule = conversion interrompue (disque plein) : on le refait au lieu de le sauter.
  const MIN_BYTES = 1024
  const run = (id, file) => new Promise((res) => {
    const dest = join(out, lang, id.slice(0, 2), `${id}.m4a`)
    if (existsSync(dest) && statSync(dest).size >= MIN_BYTES) return res(true)
    mkdirSync(dirname(dest), { recursive: true })
    const tmp = dest + '.part.m4a'
    const p = spawn('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-i', file, '-vn', '-ac', '1', '-ar', '44100',
      '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', tmp], { stdio: ['ignore', 'ignore', 'inherit'] })
    p.on('error', () => res(false))
    p.on('close', (code) => {
      const ok = code === 0 && existsSync(tmp) && statSync(tmp).size >= MIN_BYTES
      if (ok) renameSync(tmp, dest)
      res(ok)
    })
  })
  // ffmpeg encode l'AAC sur un seul cœur : plusieurs processus en parallèle.
  const queue = [...jobs]
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      ;(await run(...job)) ? done++ : (failed++, console.error(`\n✗ ${job[0]}`))
      process.stdout.write(`\r  ${done + failed}/${jobs.length}`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, cpus().length) }, worker))
  console.log(`\n✓ conversion : ${done} ok, ${failed} échec(s) → ${join(out, lang)}`)
}
