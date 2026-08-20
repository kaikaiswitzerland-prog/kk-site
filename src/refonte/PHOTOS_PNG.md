# Brief photo — PNG détourés par plat

Grille refonte (branche `refonte-goiko`). La vignette est **carrée et dominante** :
c'est la photo qui vend, le texte ne fait que confirmer. Un sujet détouré sur fond
transparent, posé sur le halo doré de la carte, tient beaucoup mieux qu'un JPG
recadré — surtout à 170 px de large sur mobile.

## Spécifications techniques

| Point | Valeur |
|---|---|
| Format | PNG-24 avec canal alpha (transparence réelle, pas de fond blanc aplati) |
| Dimensions | **1400 × 1400 px**, carré strict |
| Sujet | centré, occupe **80–88 %** du cadre, marge homogène sur les 4 côtés |
| Fond | **100 % transparent** — aucun décor, aucune nappe, aucun couvert autour |
| Ombre | **aucune ombre cuite dans le PNG.** L'ombre portée est appliquée en CSS (`drop-shadow`), sinon elle apparaît en clair sur le fond noir |
| Poids | ≤ 300 Ko après compression (TinyPNG / ImageOptim) |
| Angle | le même pour toute la carte : **3/4 haut (≈ 35–45°)**, hauteur d'œil identique d'un plat à l'autre |
| Lumière | latérale douce, une seule source dominante, pas de reflet spéculaire dur sur les sauces |
| Vaisselle | même bol / même assiette dans toute la série — c'est ce qui fait tenir la grille |
| Dossier | `public/plats/` |

Optionnel mais recommandé : livrer aussi un **WebP** de chaque PNG (même nom,
extension `.webp`) — gain de poids ~60 % à qualité identique.

## Liste des 24 fichiers attendus

Le nom de fichier est **imposé** : il est déjà câblé dans
`src/refonte/productMeta.js`. Tant qu'un PNG est absent, la carte retombe
automatiquement sur le JPG actuel — la grille reste donc consultable pendant le
shooting, plat par plat.

### Entrées

| id | Plat | Fichier attendu | JPG de repli existant | Note de prise de vue |
|---|---|---|---|---|
| 1 | Velouté koko | `plats/entree-veloute.png` | `/entree-veloute.jpg` | Bol détouré entier ; laisser voir le tourbillon de crème coco en surface |
| 2 | Salade Tropicale | `plats/entree-salade-tropicale.png` | `/entree-avocat.jpg` | Dôme haut et structuré ; avocat et cacahuètes visibles sur le dessus |
| 3 | Salade de poulet | `plats/entree-salade-poulet.png` | `/entree-poulet.jpg` | Poulet en évidence, sinon elle est indistinguable de la Tropicale en vignette |
| 4 | Tartare de thon rouge | `plats/entree-tartare-thon.png` | `/entree-tartare.jpg` | **Badge Signature** — le rouge du thon doit primer, ne pas le noyer sous la garniture |

### Plats chauds

| id | Plat | Fichier attendu | JPG de repli existant | Note de prise de vue |
|---|---|---|---|---|
| 5 | Chao Men | `plats/chaud-chao-men.png` | `/chaud-chaomen.jpg` | Nouilles enroulées en volume ; quelques légumes qui dépassent pour la silhouette |
| 6 | Kai Fan | `plats/chaud-kai-fan.png` | `/chaud-kaifan.jpg` | Riz sauté en dôme net — le JPG actuel doit être zoomé à 125 % faute de cadrage, à corriger au shooting |
| 7 | Omelette Fu Young | `plats/chaud-omelette-fu-young.png` | `/chaud-omelette.jpg` | Omelette entière, bord doré visible |
| 8 | Wok de Bœuf | `plats/chaud-wok-boeuf.png` | `/chaud-boeuf.jpg` | **Badge Signature** — brillance de la sauce sésame, tranches de bœuf identifiables |

### Plats froids

Les 4 se ressemblent beaucoup en vignette : c'est **la sauce** qui doit les
distinguer visuellement, pas le nom.

| id | Plat | Fichier attendu | JPG de repli existant | Note de prise de vue |
|---|---|---|---|---|
| 9 | Tahiti | `plats/froid-tahiti.png` | `/froid-tahitien.jpg` | **Badge Signature** — sauce coco blanche bien lisible |
| 10 | Hawaï | `plats/froid-hawai.png` | `/froid-kaikai.jpg` | Mangue + ananas en surface, jaune franc |
| 11 | Samoa | `plats/froid-samoa.png` | `/froid-haka.jpg` | Sauce piment rouge apparente |
| 12 | Manoa | `plats/froid-manoa.png` | `/froid-mokai.jpg` | Guacamole vert + cacahuètes en surface |

### Formules

| id | Plat | Fichier attendu | JPG de repli existant | Note de prise de vue |
|---|---|---|---|---|
| 13 | Formule Découverte | `plats/formule-decouverte.png` | `/formule-decouverte.jpg` | Composition à 3 éléments (velouté + plat + boisson) groupés serré — le carré ne pardonne pas les compositions étalées |
| 14 | Formule Voyage | `plats/formule-voyage.png` | `/formule-voyage.jpg` | 5 éléments : superposer plutôt qu'aligner, sinon tout devient minuscule à 170 px |

### Desserts

| id | Plat | Fichier attendu | JPG de repli existant | Note de prise de vue |
|---|---|---|---|---|
| 15 | Coulant au chocolat | `plats/dessert-coulant-chocolat.png` | `/dessert-coulant.jpg` | Cœur coulant ouvert, coulée figée au moment du shoot |
| 16 | Crème Tropicale | `plats/dessert-creme-tropicale.png` | `/dessert-creme.jpg` | Verrine détourée ; coulis visible par transparence |
| 17 | Po'e Banane | `plats/dessert-poe-banane.png` | `/dessert-poe.jpg` | **Badge Signature** — texture translucide, crème de coco en filet |
| 18 | Cheesecake | `plats/dessert-cheesecake.png` | `/dessert-cheesecake.jpg` | Part nette, couches visibles de profil |

### Boissons

| id | Produit | Fichier attendu | JPG de repli existant | Note de prise de vue |
|---|---|---|---|---|
| 19 | Jus exotiques | `plats/boisson-jus-exotiques.png` | `/boisson-jus.jpg` | La bouteille/le verre détouré, packshot pur, aucun décor |
| 20 | Eau plate/gazeuse | `plats/boisson-eau.png` | `/boisson-eau.jpg` | Les deux bouteilles côte à côte, verticales, dans le carré |

### Bases du composeur de wok — **aucune photo n'existe aujourd'hui**

Ces 4 bases ont été ajoutées récemment et n'ont **ni PNG ni JPG**. Elles sont
donc les seules à ne pas avoir de repli : à shooter en priorité si le composeur
doit passer en vignettes.

| id | Base | Fichier attendu | Repli | Note de prise de vue |
|---|---|---|---|---|
| 21 | Nouilles sautées | `plats/wok-nouilles-sautees.png` | *aucun* | Base nature, **sans garniture** — c'est la garniture qui est choisie ensuite |
| 22 | Riz sauté curry | `plats/wok-riz-curry.png` | *aucun* | Jaune curry franc, à distinguer nettement du riz sauté nature |
| 23 | Riz sauté | `plats/wok-riz-saute.png` | *aucun* | Riz sauté tahitien nature |
| 24 | Riz blanc jasmin | `plats/wok-riz-blanc.png` | *aucun* | Riz blanc + légumes croquants ; le plus difficile à rendre appétissant, prévoir du temps |

## Récapitulatif

- **24 PNG** au total.
- **20** ont un JPG de repli exploitable pendant le shooting → la grille tourne déjà.
- **4** (bases wok, ids 21–24) n'ont **rien** → priorité 1.
- 5 plats portent un badge *Signature* (4, 8, 9, 17) ou *Nouveau* (21–24) : ce sont
  les vignettes les plus regardées, à shooter en premier dans chaque section.

## Point ouvert — badge *Halal*

Le badge existe dans le système (`BADGE_LABELS.halal`) mais n'est posé sur
**aucun plat** : la carte contient du porc et les plats partagent les mêmes woks.
Seul le restaurant peut dire quels plats sont réellement annonçables comme halal.
À trancher côté KaïKaï, puis à renseigner dans `src/refonte/productMeta.js`.
