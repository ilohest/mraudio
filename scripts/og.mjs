#!/usr/bin/env node
/**
 * Fabrique l'image d'aperçu de partage (Open Graph), 1200 × 630.
 *
 *   node scripts/og.mjs
 *
 * Le rendu passe par Chrome sans interface : c'est le seul moyen sûr d'obtenir les vraies
 * fontes du site et des dimensions exactes. Le résultat est versionné dans src/assets/og.png,
 * de sorte qu'un déploiement n'a jamais besoin de Chrome.
 */
import { copyFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) {
  console.error("Chrome est introuvable : l'image d'aperçu ne peut pas être refaite ici.")
  process.exit(1)
}

const dest = join(root, 'src', 'assets', 'og.png')
const tmp = mkdtempSync(join(tmpdir(), 'og-'))
const shot = join(tmp, 'og.png')

const r = spawnSync(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--virtual-time-budget=4000',
  `--screenshot=${shot}`,
  `file://${join(root, 'src', 'og.template.html')}`,
], { stdio: ['ignore', 'ignore', 'inherit'] })

if (r.status !== 0 || !existsSync(shot)) {
  console.error('Le rendu a échoué.')
  rmSync(tmp, { recursive: true, force: true })
  process.exit(1)
}
copyFileSync(shot, dest)
rmSync(tmp, { recursive: true, force: true })
console.log(`✓ ${dest} — ${(statSync(dest).size / 1024).toFixed(0)} Ko`)
