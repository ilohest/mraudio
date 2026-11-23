# Oracle audio — El Missatge Retrobat / El Mensaje Reencontrado / Le Message Retrouvé (Louis Cattiaux)

Interface web pour écouter les versets audio du *Message Retrouvé* :
- taper un numéro de livre (1–40, chiffres ou romains) + un verset → lecture ;
- toucher le coupe-papier d'ivoire → tirage d'un verset au hasard (animation « tranche » + numéros qui défilent).
Trilingue CA / ES / FR (UI + jeu d'audios par langue). Site cible : louiscattiaux.com (WordPress chez Hostinger).

Reprise d'un prototype « La Quête / Oracle d'àudio V7 » (HTML + script PowerShell Windows, en catalan).

## Stack
Vue 3 + Vite + TypeScript, sans routeur ni lib i18n (petit dictionnaire maison). Polices auto-hébergées via @fontsource.
Build statique (`base: './'`) → se dépose dans n'importe quel sous-dossier.
`npm run build:single` → un seul HTML (vite-plugin-singlefile), pratique pour aperçu / iframe.

## Design — « brutalisme éditorial » (23/11/2026)
Le premier design (ivoire, Cormorant Garamond, coupe-papier en photo) a été **remplacé à la demande d'Isaure**.
Il reste accessible dans git, commit `bc9b8dd`.

Principes, à respecter pour toute évolution :
- **Aucun arrondi, nulle part** (`border-radius: 0` est posé sur `*` dans `styles.css`). Pas d'ombre portée.
- Filets d'un pixel comme seul séparateur ; les sections sont des bandes à pleine largeur (`.band`).
- **Une seule couleur d'accent**, le vermillon `#ff3b00` : numéro du verset, progression, états actifs. Rien d'autre.
- Papier `#efeee9`, encre `#121211`, plus un **mode sombre** automatique (`prefers-color-scheme`).
- Deux familles : **Archivo Variable** (axes graisse *et* largeur) pour la typo démesurée, **JetBrains Mono Variable**
  pour toute la signalétique (libellés, boutons, minutages) — toujours en capitales, interlettrage large.
- Le survol **inverse** le bloc (fond encre, texte papier) ; le clic passe à l'accent. Transitions linéaires, 0,12 s.
- Les repères (`VII`, `56`) sont l'élément visuel principal : il n'y a pas d'illustration.

Détails à ne pas casser :
- La taille du chiffre romain suit sa longueur (`len-l`, `len-xl` dans `NowPlaying.vue`) : sans ça `XXXVIII` se coupe
  en deux lignes. Les chiffres sont en `white-space: nowrap`, mais les **noms** (« Pare Daurat ») gardent le droit
  de passer à la ligne.
- La barre de commandes est en **flex**, pas en grille : en grille, la dernière rangée laissait une case vide grise
  sur mobile.
- Raccourcis clavier : espace (lecture), ← → (verset), R (tirage). Annoncés en pied de page via `t.shortcuts`.

## Structure
- `src/lib/catalog.ts` — charge `src/data/manifest.<lang>.json` (embarqués au build), URL audio, voisins, tirage.
- `src/lib/i18n.ts` — textes CA/ES/FR, langue via hash > localStorage > navigateur.
- `src/lib/labels.ts` — libellés (Llibre VII · Verset 56, Epígrafs, Preliminars, Lletanies).
- `src/composables/usePlayer.ts` — un seul `Audio()` global, état réactif.
- `src/components/` — DrawBar (bande de tirage), VersePicker (saisie), NowPlaying (repère + lecteur), LangSwitch.
- `scripts/audio.mjs` — génère le manifeste et convertit les audios (ffmpeg).
- `scripts/screens.py` — captures Playwright de vérification (serveur sur :4173).

Liens directs : `#ca/7/56`, `#ca/0/0b` (Pare Daurat), `#ca/41/0` (litanies).
Ils ne sont lus qu'au chargement : changer le hash à la main ne rafraîchit pas l'affichage, il faut recharger.

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
- Nouveau design vérifié en clair et en sombre, en 1149 px et en 375 px. Build : 444 Ko, 13 fichiers.
- **Pas encore vérifié sur Safari** (ni l'ancien design, ni le nouveau).
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
