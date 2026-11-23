#!/usr/bin/env node
/**
 * Fabrique les images du site :
 *  - l'aperçu de partage (Open Graph), 1200 × 630 ;
 *  - la vignette du lecteur système (écran verrouillé), carrée, en trois tailles.
 *
 *   node scripts/images.mjs
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

const tmp = mkdtempSync(join(tmpdir(), 'images-'))

function rendre(gabarit, largeur, hauteur, sortie) {
  const shot = join(tmp, `${sortie}.png`)
  const r = spawnSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${largeur},${hauteur}`,
    '--virtual-time-budget=4000',
    `--screenshot=${shot}`,
    `file://${join(root, 'src', gabarit)}`,
  ], { stdio: ['ignore', 'ignore', 'inherit'] })
  if (r.status !== 0 || !existsSync(shot)) {
    console.error(`Le rendu de ${gabarit} a échoué.`)
    rmSync(tmp, { recursive: true, force: true })
    process.exit(1)
  }
  const dest = join(root, 'src', 'assets', `${sortie}.png`)
  copyFileSync(shot, dest)
  console.log(`✓ ${sortie}.png — ${(statSync(dest).size / 1024).toFixed(0)} Ko`)
  return dest
}

rendre('og.template.html', 1200, 630, 'og')
const carre = rendre('mr.template.html', 512, 512, 'mr-512')

// Les systèmes choisissent la taille la plus proche : on leur en donne trois.
for (const px of [256, 128]) {
  const petit = join(root, 'src', 'assets', `mr-${px}.png`)
  copyFileSync(carre, petit)
  spawnSync('sips', ['-z', String(px), String(px), petit], { stdio: ['ignore', 'ignore', 'inherit'] })
  console.log(`✓ mr-${px}.png — ${(statSync(petit).size / 1024).toFixed(0)} Ko`)
}
rmSync(tmp, { recursive: true, force: true })
