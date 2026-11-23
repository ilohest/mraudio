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
## Design — « spécimen » (23/11/2026)

Deux designs ont précédé celui-ci, tous deux récupérables dans git :
l'ivoire d'origine (`bc9b8dd`) et un brutalisme éditorial (`1287a0c`), écartés par Isaure.
La référence actuelle est la page de spécimen d'Ortica chez Collletttivo :
<https://www.collletttivo.it/typefaces/ortica>.

Principes, à respecter pour toute évolution :
- **Fond blanc** `#fff`, contenu posé dans des **cartes** à fond clair `#f2f1f0`, **rayon 12 px**,
  gouttière de 16 px. Une seule carte crème `#fff5bb` : le titre. Aucune ombre portée.
- Palette « burnt peach », choisie par Isaure : crème `#fff5bb`, carte `#f2f1f0`, encre `#222`,
  accent `#e27960`. **Un seul rouge** sur la page : les aplats, le rail de progression, les survols
  et le grand numéro du verset. `--rubric-deep` `#c25434` est le même, assombri, et ne sert qu'aux
  petits corps — messages d'erreur, anneaux de focus — où la pêche claire tombe sous le contraste
  lisible (2,6:1 sur la carte grise).
- **Pas de mode sombre**, à la demande d'Isaure. `color-scheme: light` est posé sur `:root` pour
  que le navigateur n'assombrisse pas les champs. Ne pas réintroduire `prefers-color-scheme`.
- Deux fontes, **auto-hébergées**, toutes deux de Collletttivo et sous SIL Open Font License 1.1 :
  **Ortica Linear Light** (`--display`) pour les titres et les grands repères *uniquement*,
  **Ronzino Regular 400** (`--sans`) pour tout le reste — texte, signalétique, boutons.
  Les woff2 sont dans `src/assets/fonts/`, convertis depuis les `.otf` du Mac d'Isaure avec
  `woff2_compress`. **Les notices `OFL-Ortica.txt` et `OFL-Ronzino.txt` doivent accompagner les
  fontes** : la licence l'exige, ne pas les supprimer du dépôt.
- Les interactions sont « juicy » : courbes à rebond (`cubic-bezier(0.34, 1.5, 0.64, 1)`),
  survol qui soulève de 2–3 px, clic qui écrase à 0,96, tête du rail qui sort en ressort,
  secousse du bloc de saisie sur erreur, détente du bouton de lecture à chaque bascule.
  Tout est désactivé sous `prefers-reduced-motion`.

La carte du lecteur est **une seule chose à deux états**. Le grand repère *est* la saisie : on
tape dans les chiffres qu'on lit (`NowPlaying.vue`). Tant que rien ne joue, la carte n'est qu'un
formulaire ; dès qu'un verset est ouvert, le rail, les commandes et l'écoute suivie apparaissent
dessous. Il n'y a plus de composant `VersePicker` — il faisait doublon avec le repère.
- Un grand chiffre ne dit pas « je suis un champ » : le **filet sous le nombre** et la ligne
  d'indication en dessous sont ce qui le fait lire comme un formulaire. Ne pas les retirer.
- Le bouton « Escoltar » n'apparaît que si la saisie ne décrit plus ce qui joue (`dirty`), ou si
  rien ne joue. Il se déplie par `grid-template-rows: 0fr → 1fr`.
- Les préliminaires, les litanies et les épigraphes n'ont pas de numéro : leur nom s'affiche
  au-dessus des champs, laissés vides.

**Écoute suivie** (« podcast »), demandée le 23/11/2026 : un réglage, pas une action. « En acabar
el verset : s'arrêter / suivre dans l'ordre / un autre au hasard », en bas de la carte du lecteur.
Le choix se garde dans `localStorage` sous `mr-chain`. L'enchaînement passe par `usePlayer.onEnded`,
dont **App.vue est le seul abonné**. « Suivre dans l'ordre » marche sur la liste à plat, donc il
franchit les livres et lit aussi les épigraphes : c'est une lecture continue de l'œuvre.

**Tirage** : il couvre les versets des livres I–XL, **plus les préliminaires et les litanies** —
c'est leur seul accès depuis que la ligne « També » a été retirée. Attention : cela ne fait que
4 pistes sur 2 809, soit **à peu près un tirage sur sept cents**. Si la cliente veut vraiment
qu'on tombe dessus, il faudra les pondérer. Les épigraphes restent hors du tirage.

**Animation du tirage** (`Reel.vue`) : une colonne de valeurs qui glisse et décélère, et non un
texte remplacé toutes les 50 ms — c'est ce qui faisait saccader la première version. Une seule
transition de `transform`, interpolée par le navigateur. Deux points comptent : les valeurs
intermédiaires ont **la largeur de la valeur finale** (sinon la colonne tressaute et déborde de
sa fenêtre), et les deux rouleaux ne se posent pas ensemble (le verset a 110 ms de retard).

**Icônes** (`Icon.vue`) : dessinées à la main, pas de bibliothèque. Piège rencontré deux fois :
sur une flèche circulaire, **la pointe se place à l'arrivée du tracé, pas à son départ**, sinon
elle désigne le sens inverse de la rotation.

**Légende du clavier** : en pied de page, la touche dessinée comme une touche (`<kbd>`) suivie de
ce qu'elle fait. Elle disparaît sous `@media (pointer: coarse)` : sans clavier, elle n'a rien à
dire. L'ancienne ligne « Espai · lectura ←→ · verset R · atzar » était illisible.

Détails à ne pas casser :
- **Le tirage est l'action principale** : pleine largeur, imprimée en plein, juste sous le titre,
  grande cible, gros corps. Le public visé est âgé — ne jamais le reléguer dans une colonne,
  derrière un survol, ou dans une petite zone de clic.
- Les cartes `.pane` sont des **conteneurs** (`container-type: inline-size`) et leurs tailles
  internes sont en **`cqi`**, pas en `vw` : la colonne de droite fait 400 px sur une page de
  1400, donc une taille calibrée sur l'écran y serait énorme. Sortir un composant d'un `.pane`
  casse ses tailles. Les points de rupture internes sont en `@container`, pas en `@media`.
- La taille suit la longueur du chiffre romain (`heroSize` → `len-l`, `len-xl` dans
  `NowPlaying.vue`) : sans ça `XXXVIII` se coupe en deux lignes. Elle s'applique **aux deux
  cases** — si on ne la donnait qu'au livre, « XXXVIII » rapetisserait pendant que le verset
  resterait à pleine taille, et les filets de champ comme les lignes d'indication cesseraient
  d'être à la même hauteur.
- La barre de commandes est en **flex**, pas en grille : en grille, la dernière rangée laissait une
  case vide grise sur mobile.
- Le rail de progression porte la mesure du `seek` — c'est `rail`, pas `bar`, qu'on interroge.
  La zone de clic qui l'entoure est plus large, et sa marge fausserait le calcul.
- Raccourcis clavier : espace (lecture), ← → (verset), R (tirage). Annoncés en pied de page.

Retirés à la demande d'Isaure, ne pas remettre sans elle :
- l'accroche « Escolta allò que l'atzar… » ;
- le compte d'audios (« 2 809 àudios ») ;
- la ligne « També : Preliminars / Lletanies » — le livre 0 et les litanies passent désormais
  par le tirage (voir plus haut) et par lien direct (`#ca/0/0b`, `#ca/41/0`) ;
- l'indication « I – XL » sous le champ du livre ;
- le bouton « Obrir-ne un altre » de la barre de commandes : il appelait le même `draw()` que le
  grand bouton de tirage, qui est juste au-dessus.

## Structure
- `src/lib/catalog.ts` — charge `src/data/manifest.<lang>.json` (embarqués au build), URL audio, voisins, tirage.
- `src/lib/i18n.ts` — textes CA/ES/FR, langue via hash > localStorage > navigateur.
- `src/lib/labels.ts` — libellés (Llibre VII · Verset 56, Epígrafs, Preliminars, Lletanies).
- `src/composables/usePlayer.ts` — un seul `Audio()` global, état réactif.
- `src/components/` — DrawBar (le gros bouton de tirage), NowPlaying (repère saisissable + lecteur
  + écoute suivie), Reel (le rouleau du tirage), Icon (les pictogrammes), LangSwitch.
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
  « EL MISSATGE RETROBAT EN AUDIO/Claude outputs/oracle-missatge-retrobat.zip »). Dépôt git local,
  pas de remote : `bc9b8dd` l'ivoire d'origine, `1287a0c` le brutalisme, puis le design « spécimen ».
- **Conversion CA terminée** : 2 809 pistes (2 810 moins `00000a`), 803 Mo dans
  `EL MISSATGE RETROBAT EN AUDIO/_web/ca`. Les 2 809 fichiers passent `ffprobe` (AAC mono 64 kbps, 44,1 kHz).
- Un piège rencontré : l'arrêt « disque plein » avait laissé `02075.m4a` tronqué à 44 octets, et la reprise le
  **sautait** parce que le fichier existait. `scripts/audio.mjs` refait désormais tout fichier < 1 Ko, et ne
  renomme le `.part.m4a` que s'il dépasse cette taille. Fichier réparé.
- Testé en local avec les vrais audios (Chromium) : lecture, tirage, verset précédent / suivant, liens directs
  `#ca/7/56`, `#ca/0/0b`, livres récemment convertis (XL). Console propre.
- Design « spécimen » vérifié dans le panneau Chromium, en large et en 375 px : titre, tirage (animation
  des chiffres puis lecture), `XXXVIII` sur une ligne, livre 0 (« Preliminars / Pare Daurat »), lecture,
  rail de progression. Vérifié aussi que la page reste claire quand le système est en sombre.
  Écoute suivie vérifiée bout en bout : le verset 50 enchaîne bien sur le 51 et le réglage
  survit au rechargement. Build : **216 Ko, 5 fichiers**.
- **Pas encore vérifié sur Safari**, aucun des trois designs.
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
