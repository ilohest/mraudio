# Oracle audio — El Missatge Retrobat / El Mensaje Reencontrado / Le Message Retrouvé (Louis Cattiaux)

Interface web pour écouter les versets audio du *Message Retrouvé* :
- taper un numéro de livre (1–40, chiffres ou romains) + un verset → lecture ;
- toucher le coupe-papier d'ivoire → tirage d'un verset au hasard (animation « tranche » + numéros qui défilent).
Trilingue CA / ES / FR (UI + jeu d'audios par langue). Site cible : louiscattiaux.com (WordPress chez Hostinger).

Reprise d'un prototype « La Quête / Oracle d'àudio V7 » (HTML + script PowerShell Windows, en catalan).

## Stack
Vue 3 + Vite + TypeScript, sans routeur ni lib i18n (petit dictionnaire maison). Polices auto-hébergées via @fontsource
(Cormorant Garamond + Jost). Build statique (`base: './'`) → se dépose dans n'importe quel sous-dossier.
`npm run build:single` → un seul HTML (vite-plugin-singlefile), pratique pour aperçu / iframe.

## Structure
- `src/lib/catalog.ts` — charge `src/data/manifest.<lang>.json` (embarqués au build), URL audio, voisins, tirage.
- `src/lib/i18n.ts` — textes CA/ES/FR, langue via hash > localStorage > navigateur.
- `src/lib/labels.ts` — libellés (Llibre VII · Verset 56, Epígrafs, Preliminars, Lletanies).
- `src/composables/usePlayer.ts` — un seul `Audio()` global, état réactif.
- `src/components/` — LetterOpener (bouton tirage), VersePicker (saisie), NowPlaying (carte + lecteur), LangSwitch.
- `scripts/audio.mjs` — génère le manifeste et convertit les audios (ffmpeg).
- `scripts/screens.py` — captures Playwright de vérification (serveur sur :4173).

Liens directs : `#ca/7/56`, `#ca/0/0a` (préliminaires partie a), `#ca/41/0` (litanies).

## Audios
Nommage : `LLVVV` = livre (2 chiffres) + verset (3 chiffres). Verset 000 = épigraphes.
- CA : dossier plat « EL MISSATGE RETROBAT EN AUDIO » (2 837 fichiers, 1,2 Go, formats mélangés).
- ES : dossier « AUDIOS MR » avec un sous-dossier par livre, même nommage. **Pas encore reçu.**
- FR : à traiter plus tard.

Particularités (CA) :
- `28004(1).ogg`, `31014(2).ogg`… = copies identiques (même MD5) → ignorées.
- « Livre 0 » = préliminaires, réglé avec la cliente le 23/11/2026 :
  `00000a` **écarté** (liste `DROP` dans `scripts/audio.mjs`, absent du manifeste) ;
  `00000b` → « Pare Daurat », `00000c` → « Mare Brilant », `00000d` → « La llum »
  (`PRELIM_NAMES` dans `src/lib/labels.ts`). La carte affiche « Preliminars » en surtitre et le nom en grand.
  Les noms ES / FR restent à fournir : sans nom, on retombe sur « Préliminaires · Partie n ».
- `41000Lletanies.m4a` → id 41000, « Lletanies ».
- `04000T.wav` → id 04000t (10 s, contre 44 s pour `04000`) : rangé en 2e piste d'épigraphes du livre IV,
  **toujours à confirmer** — la cliente doit l'écouter.
- Le livre 38 commence au verset 1 (pas d'épigraphes).
- Beaucoup de `.ogg` contiennent en fait de l'AAC ; le livre IV est en WAV 4 canaux 16 kHz.
  → tout est converti en AAC mono 64 kbps `.m4a` (+faststart) : `<out>/<lang>/<LL>/<id>.m4a`.
- Le tirage exclut verset 0, livre 0 et livre 41.

Commandes :
```
npm run audio -- --lang ca --src "/Users/isaurelohest/Downloads/EL MISSATGE RETROBAT EN AUDIO" --out ./audio-web --convert
npm run audio -- --lang es --src "/chemin/AUDIOS MR" --out ./audio-web --convert
```
Relançable : les fichiers déjà convertis sont sautés. Sans `--convert` : seulement le manifeste.

## État au 23/11/2026
- Projet installé sur le Mac dans `~/Documents/workspace/Audio MR` (il n'existait que zippé dans
  « EL MISSATGE RETROBAT EN AUDIO/Claude outputs/oracle-missatge-retrobat.zip »). Pas encore de dépôt git.
- **Conversion CA terminée** : 2 809 pistes (2 810 moins `00000a`), 803 Mo dans
  `EL MISSATGE RETROBAT EN AUDIO/_web/ca`. Les 2 809 fichiers passent `ffprobe` (AAC mono 64 kbps, 44,1 kHz).
- Un piège rencontré : l'arrêt « disque plein » avait laissé `02075.m4a` tronqué à 44 octets, et la reprise le
  **sautait** parce que le fichier existait. `scripts/audio.mjs` refait désormais tout fichier < 1 Ko, et ne
  renomme le `.part.m4a` que s'il dépasse cette taille. Fichier réparé.
- Testé en local avec les vrais audios (Chromium) : lecture, tirage, verset précédent / suivant, liens directs
  `#ca/7/56`, `#ca/0/0b`, livres récemment convertis (XL). Console propre.
- Pour le test local, `public/audio/ca` est un **lien symbolique** vers `…/_web/ca` (évite de dupliquer 803 Mo).
  `public/audio` est dans `.gitignore`. Attention : `npm run build` copierait ces 803 Mo dans `dist/` —
  enlever le lien avant un build, ou garder les audios hors de `public/` et passer par `VITE_AUDIO_BASE`.
- **Disque du Mac serré** : 5,2 Go libres sur 228 (98 % plein). La source d'origine (1,2 Go) n'est plus
  nécessaire une fois `_web/ca` en ligne.
- Sur le serveur Hostinger, `wp-content/uploads/audios/` (FR/CAT/ES, ~3 Go de MP3 de livres entiers) a été créé
  lors d'une tâche précédente : sans rapport avec cette app, peut être supprimé.

## À faire
- Traiter les audios ES : dossier reçu, `~/Downloads/Audios MR 2` (42 sous-dossiers « LIBRO I » … ).
- Puis le français.
- Confirmer `04000T` (la cliente doit l'écouter) ; récupérer les noms ES / FR du livre 0.
- Choisir l'hébergement : sous-dossier du site (ex. `louiscattiaux.com/oracle/`) avec `audio/` à côté,
  ou audios dans uploads et `VITE_AUDIO_BASE` (voir `.env.example`). Option : intégration WordPress par iframe.
- Rien n'est en ligne : aucune mise en ligne sans l'accord d'Isaure.
