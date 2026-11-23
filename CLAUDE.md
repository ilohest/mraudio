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
- **« Escoltar » et « Reproduir » ne font qu'un bouton.** Tant qu'un verset joue, le bouton
  principal des commandes devient « Escoltar » dès que la saisie ne décrit plus ce qui joue
  (`dirty`), puis redevient « Reproduir / Pausa ». Le bouton séparé ne subsiste que lorsque rien
  ne joue, là où il n'y a pas encore de commandes. Deux raisons, dans cet ordre : deux gros
  boutons empilés promettaient tous deux du son, ce qui trompe ; et un bloc qui se déplie dans
  une carte déjà pleine comprimait le repère sous sa propre hauteur, dont le contenu débordait
  alors de sa case et passait sous le bouton. Ne pas réintroduire de bloc dépliant ici sans
  rendre au repère la hauteur correspondante.
- Les préliminaires et les litanies n'ont pas de numéro : leur nom s'affiche au-dessus des
  champs, laissés vides.
- **Structure d'un livre** (indiquée par Isaure le 23/11/2026) : le verset 0 en est l'épigraphe
  et le dernier verset l'hypographe. L'épigraphe s'écrit **en toutes lettres à la place du
  numéro** — « 0 » ne dit rien à personne — tandis que l'hypographe **garde son numéro**, qui
  lui veut dire quelque chose, et c'est la ligne d'indication qui le nomme. La saisie accepte
  le mot comme le chiffre, accents et casse indifférents (`readVerse`).
  ⚠ Les mots **« Hipògrafs » (CA) et « Hipógrafes » (ES) sont des constructions par analogie**
  avec « Epígrafs » / « Epígrafes » : à faire confirmer. Seul « Hypographes » (FR) est sûr.
- **Flèches haut et bas dans un champ** : elles font défiler le numéro, avec un pas de dix si
  Majuscule est enfoncée. Gauche et droite restent au curseur, sans quoi on ne pourrait plus
  corriger « XXXVIII ». Rien ne bouge si le champ est vide.

**Écoute suivie** (« podcast »), demandée le 23/11/2026 : un réglage, pas une action. « En acabar
el verset : s'arrêter / suivre dans l'ordre / un autre au hasard », en bas de la carte du lecteur.
Le choix se garde dans `localStorage` sous `mr-chain`. L'enchaînement passe par `usePlayer.onEnded`,
dont **App.vue est le seul abonné**. « Suivre dans l'ordre » marche sur la liste à plat, donc il
franchit les livres et lit aussi les épigraphes : c'est une lecture continue de l'œuvre.

**Tirage** : il couvre les versets des livres I–XL, **plus les préliminaires et les litanies** —
c'est leur seul accès depuis que la ligne « També » a été retirée. Attention : cela ne fait que
4 pistes sur 2 809 : à chances égales elles ne sortiraient qu'un tirage sur sept cents. Le tirage
est donc **pondéré** (`SPECIAL_ODDS = 50` dans `catalog.ts`) : on tire d'abord le genre — une fois
sur cinquante, ce sera l'une d'elles — puis la piste dans son propre lot. Les épigraphes restent
hors du tirage. N'ayant pas de numéro, ces pistes n'ont pas de rouleau : leur nom arrive avec la
même animation que les deux cases.

**La vue tient exactement l'écran** (≥ 340 × 620), téléphone compris : `.screen` fait `100svh`, la carte du lecteur
prend ce qui reste (`flex: 1`), et ses grands chiffres se calibrent sur la hauteur de la carte
(`cqh`, d'où `container-type: size`). En dessous de ces tailles — mobile — la page redevient un
document qui défile. Deux pièges :
- la règle `container-type: size` de la media query doit venir **après** `.pane { container-type:
  inline-size }`, sinon celle-ci l'écrase (même spécificité) et `cqh` retombe sur la hauteur du
  viewport, donc les chiffres ne rapetissent plus ;
- les blocs fixes du lecteur (rail, minutages, commandes, écoute suivie) portent `flex: none`,
  sinon le repère les comprime au lieu d'absorber seul le surplus.
Seul le pied de page passe sous la ligne de flottaison : Isaure l'autorise explicitement.
Sur téléphone, deux choses rendent la tenue possible — le repère **reste sur deux colonnes**
(empilé, il coûtait à lui seul une demi-hauteur d'écran) et les quatre commandes secondaires
se réduisent à leur **icône seule**, en une rangée. Leur libellé disparaît de l'écran mais pas
de la page : `aria-label` et `title` le gardent pour les lecteurs d'écran et l'appui long, et
« Reproduir » garde le sien — c'est la commande qu'il ne faut pas deviner.

**Pied de page** : une carte comme les autres, posée sous la ligne de flottaison. Elle porte la
légende du clavier, puis un colophon en deux colonnes sous un filet — les
voix de la langue écoutée à gauche, la signature d'Isaure (lien vers isaure-lohest.com) à droite.
Les voix sont dans `i18n.ts` (`voices`, `voiceNames`) parce qu'elles changent avec le jeu d'audios :
CA Jeanne & Jean-Christophe Lohest, Josep-Maria Sagrera · ES Esther & Adrés Molero ·
FR Jeanne & Jean-Christophe Lohest. La légende du clavier disparaît sous `pointer: coarse`,
le colophon reste.

**Animation du tirage** (`Reel.vue`) : une colonne de valeurs qui glisse et décélère, et non un
texte remplacé toutes les 50 ms — c'est ce qui faisait saccader la première version. Une seule
transition de `transform`, interpolée par le navigateur. Deux points comptent : les valeurs
intermédiaires ont **la largeur de la valeur finale** (sinon la colonne tressaute et déborde de
sa fenêtre), et les deux rouleaux ne se posent pas ensemble (le verset a 160 ms de retard).
La courbe se termine au-dessus de 1, donc le rouleau dépasse d'un cran et revient : d'où les deux
valeurs **en réserve** sous la bonne (`SPARES`) et `landAt`, qui n'est pas le dernier élément.
Piège de performance : le flou va sur la **fenêtre** du rouleau, jamais sur la colonne — celle-ci
fait plusieurs milliers de pixels de haut, et la tramer floue retardait le départ d'une seconde
entière (mesuré).

**Icônes** (`Icon.vue`) : dessinées à la main, sauf la reprise. Celle-là vient de Lucide
(`rotate-ccw`, licence ISC) après deux tentatives ratées — flèche à l'envers, puis illisible.
Leçon générale : **regarder une icône en grand avant de la livrer**, un gabarit servi par le
serveur de dev suffit. Et sur une flèche circulaire, la pointe se place à l'arrivée du tracé,
pas à son départ, sinon elle désigne le sens inverse de la rotation.

**Favicon** : une oreille au trait, encre sur crème `#fff5bb`, dessinée à la main et vérifiée
à 32 et 16 px.

**Taille du repère** (`--fit` dans `NowPlaying.vue`) : elle se calcule sur la hauteur que le
repère reçoit vraiment, pas sur celle de toute la carte — sinon le rail, les minutages, les
commandes et l'écoute suivie ne sont pas déduits, le contenu déborde de sa case, se centre, et
vient coller au rail (sur certaines hauteurs seulement, d'où un défaut intermittent).
Deux pièges s'y cachent :
- **un champ de saisie ne fait pas la hauteur de son interligne** : il suit les métriques de la
  fonte, ici 1,42 fois le corps contre 0,95 demandé. D'où `input.mega { height: 1.12em }`, la
  même que celle d'une case de rouleau — ce qui supprime aussi le décalage de mise en page
  quand le rouleau laisse la place au champ à la fin d'un tirage ;
- `container-type: size` sur le repère ne vaut **que** quand un verset joue. Tant que rien ne
  joue, la carte suit son contenu : lui demander de mesurer sa hauteur revient à la lui retirer,
  et le repère s'effondre à zéro.

**État vide** : la carte ne s'étire pas (`.pane.idle`). L'étirer laissait les deux champs flotter
au milieu d'un grand vide et donnait au filet qui les sépare une longueur sans rapport avec ce
qu'il sépare. Le bouton « Escoltar » y est en plein, comme le tirage.

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
- l'indication sous le champ du livre quand elle est redondante : le chiffre romain est déjà
  écrit en grand au-dessus et le nombre de versets est dans la plage d'en face. Elle ne subsiste
  que pour confirmer une saisie en chiffres arabes (« 32 » → « XXXII ») ;
- le bouton « Obrir-ne un altre » de la barre de commandes : il appelait le même `draw()` que le
  grand bouton de tirage, qui est juste au-dessus.

## Structure
- `src/lib/catalog.ts` — charge `src/data/manifest.<lang>.json` (embarqués au build), URL audio, voisins, tirage.
- `src/lib/i18n.ts` — textes CA/ES/FR. La langue vient du hash, sinon de `localStorage`
  (`mr-lang`, écrit à chaque clic sur le sélecteur), sinon de la langue du navigateur.
  Arriver par un lien partagé affiche bien la langue du lien **sans** écraser la préférence
  enregistrée : un visiteur français qui ouvre un lien catalan retrouve le français à sa
  prochaine visite sur l'adresse nue. C'est voulu.
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
- ES : dossier `~/Downloads/Audios MR 2`, un sous-dossier par livre, **autre nommage** (voir plus bas).
  2 810 fichiers, 1,9 Go → 2 807 pistes au manifeste.
- FR : à traiter plus tard.

Particularités (ES), relevées le 23/11/2026 sur `~/Downloads/Audios MR 2` (2 810 mp3, 1,9 Go) :
- **Le nommage n'est pas celui du catalan** : 2 787 fichiers sur 4 chiffres, `0765` = livre 7
  verset 65, le verset n'étant pas rempli à trois chiffres. Au-delà de 99 il en prend trois
  (`03100`, `36100`–`36109`), ce qui retombe par chance sur la forme catalane. Un sous-dossier
  par livre, `LIBRO I` … `LIBRO XXXVIII`, `LIBRO XXXIX`, et **`LIBRO XXXX` pour le quarantième**.
  `scripts/audio.mjs` recoupe le livre lu dans le nom avec celui du dossier et refuse les
  désaccords ; il n'y en a aucun.
- Les **litanies sont découpées en quatre plages** (`Letanias 1-48`, `Letanías 49-65`,
  `Letanías 66-105`, `Letanías 106-144`) là où le catalan tient en une piste → `41000a`…`41000d`,
  dans l'ordre des plages. Les bornes sont dans `LITANY_RANGES` (`src/lib/labels.ts`) : elles
  viennent des noms de fichiers et ne survivent nulle part ailleurs, le manifeste ne gardant
  que les identifiants.
- Un seul **préliminaire**, `Oraciones del Padre y de la Madre.mp3`, à la racine → `00000b`.
  Le catalan en a trois (Pare Daurat, Mare Brilant, La llum) ; l'espagnol n'a donc ni la
  séparation père / mère ni « La llum ». 83,6 s contre 61,2 + 50,0 s en catalan : ce n'est pas
  la simple somme des deux, **à vérifier avec la cliente** (manque-t-il des fichiers ?).
- **Trois versets manquent** par rapport au catalan : livre 3 verset 78, livre 12 verset 79,
  livre 37 verset 70. **Deux d'entre eux sont le dernier verset de leur livre** (12 et 37),
  donc des hypographes — le genre de pièce enregistrée à part, et oubliée à part. Inversement le livre 38 a des épigraphes en espagnol, pas en catalan, et
  `04000T` n'existe qu'en catalan.
- **`0333(1)` et `0344(1)` ne sont pas des doublons** : leurs vingt premières secondes diffèrent,
  ce sont de vraies secondes prises. **Isaure a écouté le 23/11/2026 et choisi les deux secondes
  prises** (42,6 s et 31,7 s, contre 40,7 et 30,8). D'où la liste `PREFER` dans
  `scripts/audio.mjs` : elle fait exception à la règle qui écarte tout fichier « (1) », juste
  pour ces deux identifiants. `1507(1)`, lui, est bien une copie à l'identique et reste écarté.
  Les premières prises sont laissées dans le dossier source, qui partira entier.
- Piège macOS : les accents sont stockés en forme décomposée, donc « Letanías » lu sur le disque
  ne ressemble pas à « Letanías » écrit dans le script. Les noms sont normalisés en NFC avant
  toute comparaison, sans quoi le dossier des litanies passait à la trappe en silence.

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
- Le livre 38 commence au verset 1 : **c'est probablement un fichier manquant, pas une
  particularité.** Vérifié le 23/11/2026 : les 40 livres espagnols ont tous leur verset 0, et
  le catalan n'en manque qu'un seul, celui du livre 38. À demander à la cliente.
- Beaucoup de `.ogg` contiennent en fait de l'AAC ; le livre IV est en WAV 4 canaux 16 kHz.
  → tout est converti en AAC mono 64 kbps `.m4a` (+faststart) : `<out>/<lang>/<LL>/<id>.m4a`.
- Le tirage exclut verset 0, livre 0 et livre 41.

Commandes :
```
npm run audio -- --lang ca --src "~/Downloads/EL MISSATGE RETROBAT EN AUDIO" --out ./audio-web --convert
npm run audio -- --lang es --src "~/Downloads/Audios MR 2" --out ./audio-web --convert
```
Relançable : les fichiers déjà convertis sont sautés. Sans `--convert` : seulement le manifeste.

## État au 23/11/2026
- Projet installé sur le Mac dans `~/Documents/workspace/Audio MR` (il n'existait que zippé dans
  « EL MISSATGE RETROBAT EN AUDIO/Claude outputs/oracle-missatge-retrobat.zip »). Dépôt git local,
  pas de remote : `bc9b8dd` l'ivoire d'origine, `1287a0c` le brutalisme, puis le design « spécimen ».
- **Conversion CA terminée** : 2 809 pistes (2 810 moins `00000a`), 803 Mo dans
  `audio-web/ca`. Les 2 809 fichiers passent `ffprobe` (AAC mono 64 kbps, 44,1 kHz).
- **Conversion ES terminée** (23/11/2026) : 2 807 pistes, 706 Mo dans `audio-web/es`, aucun échec.
  Contrôle complet et non pas par sondage : le manifeste a été recoupé avec une dérivation
  indépendante des identifiants, puis **chaque piste comparée à sa source** — toutes existent,
  sont en AAC mono, et leur durée correspond à moins d'une demi-seconde près. Zéro anomalie.
  Lecture vérifiée dans l'app : verset, préliminaire, une plage de litanies (3 min 30),
  tirage, enchaînement, et le passage ES → CA qui conserve le verset.
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
- Les audios convertis vivent dans **`audio-web/`, à la racine du projet** (ignoré par git).
  Ils étaient dans `~/Downloads/EL MISSATGE RETROBAT EN AUDIO/_web`, c'est-à-dire **à l'intérieur
  du dossier des sources** : vider Downloads aurait emporté l'audio du site. Déplacés le
  23/11/2026. `public/audio/ca` et `public/audio/es` sont des liens symboliques relatifs vers
  `audio-web/`, pour le serveur de développement ; `public/audio` est dans `.gitignore`.
  `vite.config.ts` met `publicDir: false` au build : les audios ne peuvent plus se retrouver
  dans `dist/` par accident, ce qui est arrivé une fois et coûtait 800 Mo de copie.
- **Disque du Mac serré** : 3,3 Gio libres sur 228. Les caches régénérables ont été vidés
  (0,9 Go). Restent, à la main de la cliente : les sources catalanes (1,19 Go) et espagnoles
  (1,9 Go) dans Downloads — ce sont les masters, et deux questions en dépendent encore
  (`04000T`, et le choix entre les deux prises de `0333` / `0344`).
- Sur le serveur Hostinger, `wp-content/uploads/audios/` (FR/CAT/ES, ~3 Go de MP3 de livres entiers) a été créé
  lors d'une tâche précédente : sans rapport avec cette app, peut être supprimé.

## Mise en ligne

Cible : **Cloudflare Workers en site statique** (pas de code, seulement des fichiers), domaine
**mraudio.app**, déjà sur les serveurs de noms Cloudflare. Tout tient dans le forfait gratuit :
5 621 fichiers pour une limite de 20 000 par version, le plus gros à 6,7 Mo pour une limite de
25 Mo. Aucune limite de poids total n'est documentée.

```
npm run deploy:build     # assemble deploy/ : l'app construite + les audios
npx wrangler deploy      # envoie deploy/ (ou : npm run deploy, qui enchaîne les deux)
```

`scripts/deploy.mjs` ajoute les audios en **liens durs** (`cp -al`) : 1,5 Go apparents pour zéro
octet consommé, ce qui compte sur un disque serré. Il les prend dans `audio-web/`.

Les audios restent servis en relatif (`./audio/`), donc tout vit sous le même domaine : pas de
R2, pas de CORS, pas de second réglage. `VITE_AUDIO_BASE` reste disponible si on veut un jour
les sortir ailleurs.

Le compte à utiliser est le compte **personnel** d'Isaure. Si `npx wrangler whoami` en affiche un
autre — elle est membre de comptes de clientes — il faut refaire `npx wrangler login` et n'autoriser
que le sien : rien ne doit partir sur le compte d'un tiers.

## Ce qui n'a pas été vérifié

- Que le verset 0 soit bien l'épigraphe d'un livre est une **convention héritée du prototype**
  (`labels.ts`, ce fichier), pas une vérification. Personne ici n'a écouté les pistes.
  Les durées ne tranchent pas : le verset 0 fait 0,87 fois la médiane du corps du livre et le
  dernier verset 0,97 fois — aucune signature distinctive. Seule la cliente peut confirmer.

## À faire
- Le français, quand les audios arriveront.
- Lui signaler les trois versets espagnols manquants (3/78, 12/79, 37/70) et l'unique
  préliminaire espagnol, au cas où des fichiers manqueraient.
- Récupérer les noms ES / FR du livre 0 (l'espagnol n'a qu'une piste préliminaire).
- Faire confirmer l'orthographe de « Adrés Molero » dans les crédits ES (« Andrés » ?), et la
  formulation « Disseny i desenvolupament » pour la signature d'Isaure.
- Choisir l'hébergement : sous-dossier du site (ex. `louiscattiaux.com/oracle/`) avec `audio/` à côté,
  ou audios dans uploads et `VITE_AUDIO_BASE` (voir `.env.example`). Option : intégration WordPress par iframe.
- Rien n'est en ligne : aucune mise en ligne sans l'accord d'Isaure.
