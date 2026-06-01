# print-agent — impression auto KaïKaï

Petit démon Node qui tourne sur l'ordinateur de la cuisine, surveille la table
`orders` Supabase et imprime AUTOMATIQUEMENT chaque nouvelle commande sur la
TM-m30II en HTTP (pas de cert à approuver, pas de blocage mixed-content navigateur).

L'app React et l'admin en ligne ne sont pas modifiées. Le démon réutilise
`src/lib/eposPrint.js` tel quel — même XML, même tickets.

## Prérequis

- Node ≥ 20 (fetch global, modules ES)
- Imprimante TM-m30II joignable en HTTP sur le même Wi-Fi (par défaut `http://192.168.1.103`)
- Accès au projet Supabase (clé `service_role`)

## Installation

1. Copier le modèle d'env :

   ```sh
   cp print-agent/.env.agent.example print-agent/.env.agent
   ```

2. Éditer `print-agent/.env.agent` et remplir :
   - `SUPABASE_URL` — Supabase dashboard → Project Settings → API → Project URL
   - `SUPABASE_SERVICE_KEY` — Project Settings → API → service_role (⚠️ SECRET)
   - `PRINTER_URL` — l'URL ePOS-Print, par défaut l'IP locale de la TM-m30II
   - `POLL_MS` — intervalle de polling (5000 ms par défaut)

   ⚠️ Le fichier `.env.agent` est gitignoré : **ne jamais le committer**.

## Lancement

```sh
npm run print-agent
```

Logs attendus :

```
[print-agent] En attente de commandes…
[print-agent] Imprimante : http://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000
[print-agent] Polling    : toutes les 5000 ms
[print-agent] Watermark  : 2026-06-01T12:00:00.000Z
```

Quand une commande arrive :

```
[print-agent] Nouvelle commande #A1B2C3D4 — Marie Dupont (card, paid) — impression…
[print-agent] ✓ Ticket imprimé pour #A1B2C3D4
```

Arrêt propre avec `Ctrl+C`.

## État

L'agent écrit `print-agent/.state.json` (gitignoré) avec :

- `watermark` — ISO `created_at` de la dernière commande traitée
- `printedIds` — filet anti-doublon (500 dernières)

Au tout premier lancement, le watermark est mis à « maintenant » : l'agent
**n'imprime pas l'historique**. Aux redémarrages suivants, il reprend là où
il s'était arrêté.

## Comportement

- Polling toutes les `POLL_MS` ms, requête `orders` filtrée sur `created_at > watermark`, triée ASC.
- Pour chaque commande non encore imprimée → `printOrderTicket(order, PRINTER_URL)`.
- Succès → marquée imprimée + watermark avancé + state sauvegardé.
- Échec (imprimante injoignable, papier vide…) → log d'erreur, **state inchangé**,
  réessai automatique au prochain tour.
- Filtre de statut désactivé par défaut (toutes les nouvelles commandes
  impriment). Voir `STATUS_FILTER` en haut de `agent.mjs` pour restreindre.

## Test à blanc (sans imprimante)

```sh
node print-agent/smoke.mjs
```

Simule une commande factice, intercepte `fetch`, vérifie que `printOrderTicket`
est appelé avec l'URL HTTP attendue et qu'une même commande n'est pas
imprimée deux fois.
