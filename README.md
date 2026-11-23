# Oracle audio — El Missatge Retrobat

Écouter un verset du *Message Retrouvé* (Louis Cattiaux) en catalan, espagnol ou français, en le choisissant
ou en le tirant au hasard avec le coupe-papier.

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # → dist/ (statique, à déposer tel quel)
```

## Préparer les audios

```bash
# catalan : dossier plat 01005.ogg …
npm run audio -- --lang ca --src "/chemin/EL MISSATGE RETROBAT EN AUDIO" --out ./audio-web --convert
# espagnol : un sous-dossier par livre
npm run audio -- --lang es --src "/chemin/AUDIOS MR" --out ./audio-web --convert
```

Le script écrit `src/data/manifest.<lang>.json` (la liste des versets, intégrée à l'app) et convertit tout en
AAC mono 64 kbps dans `audio-web/<lang>/<livre>/<id>.m4a`. Il faut ffmpeg (`brew install ffmpeg`).
On peut le relancer : ce qui est déjà converti est sauté. Refaire `npm run build` après un nouveau manifeste.

## Mise en ligne

Déposer le contenu de `dist/` (ex. dans `public_html/oracle/`) et le dossier `audio-web/` renommé `audio/` à côté
de `index.html`. Si les audios sont ailleurs, régler `VITE_AUDIO_BASE` (voir `.env.example`) avant le build.

Contexte complet, décisions et points ouverts : `CLAUDE.md`.
