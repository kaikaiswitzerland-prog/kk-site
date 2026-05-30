# 🚀 AUDIT PRÉ-LANCEMENT — KaïKaï

> Audit **read-only** réalisé sur la branche `main` (commit `a98a243`). Aucun fichier de code modifié.
> Date : 2026-05-22. Lancement visé : semaine suivante.
> ⚠️ Certains points (Vercel, DNS, réglages projet Supabase) ne sont **pas vérifiables sans accès** : ils sont marqués **« À VÉRIFIER »**.

---

## 🧭 RÉSUMÉ EXÉCUTIF

**Total : 33 findings** — 🔴 **4 P0** · 🟠 **11 P1** · 🟡 **18 P2**

### Verdict global : ⛔ **RISQUE SÉRIEUX — NE PAS LANCER EN L'ÉTAT**

Le tunnel de commande, le paiement (recompute serveur + webhook re-fetch) et l'admin sont **fonctionnellement solides et bien pensés**. Mais il existe **une faille de contrôle d'accès critique** (n'importe quel compte authentifié peut lire/modifier/supprimer **toutes** les commandes et toutes les données clients) et **un bug de fuseau horaire** qui casse le paiement carte pendant les heures de service réelles. Ces deux points sont bloquants. S'y ajoutent des manques légaux (politique de confidentialité) et SEO/perf (58 Mo d'images, favicon absent) à traiter avant d'ouvrir au public.

### 🔝 Top 5 risques bloquants

| # | Risque | Sév. |
|---|--------|------|
| 1 | **RLS `orders` ouverte** : tout utilisateur authentifié lit/modifie/supprime TOUTES les commandes (fuite PII massive + sabotage). | 🔴 P0 |
| 2 | **Aucun contrôle de rôle admin** : le dashboard `/admin` et les endpoints sensibles (refund, toggle cuisine/stock) acceptent n'importe quel compte authentifié. | 🔴 P0 |
| 3 | **Garde-fou horaires serveur en UTC** : le paiement carte est refusé pendant ~1h30–2h de chaque service (été/CEST) et accepté après fermeture. | 🔴 P0 |
| 4 | **À VÉRIFIER : migrations Supabase prod + signup public désactivé** : si le signup public Supabase est actif (défaut), le risque #1 est exploitable immédiatement ; si la migration corbeille n'est pas appliquée, corbeille/suppression cassent. | 🔴 P0 |
| 5 | **Aucune politique de confidentialité / CGV** (collecte nom, tél, adresse, email + paiement) — exposition légale Suisse (revDSG/nLPD). | 🟠 P1 |

### ✅ Points sains notables
- Aucun secret serveur fuité dans le bundle client (seule la clé `anon` publique, by design).
- Recompute du **total** côté serveur (anti price-tampering sur le total).
- Webhook SumUp : re-fetch du vrai statut → un faux webhook « PAID » ne marche pas.
- Idempotence paiement + email de confirmation complet (HTML+texte, n° commande, récap).
- Service worker v3 sain (pas de cache de bundles périmés).
- `.env.local` bien gitignored et non commité.

---

## 1. PARCOURS CLIENT (tunnel commande)

Globalement robuste. Le tunnel home → menu → panier → checkout → paiement → succès fonctionne, avec garde-fous (NPA hors zone, restaurant fermé, rupture stock côté carte) et messages d'erreur de repli soignés.

### 🟡 P2 — Pas de page 404 (soft-404 généralisé)
- 📍 [src/main.jsx:9,22](src/main.jsx#L9), [vercel.json:2-4](vercel.json#L2)
- ❓ Le rewrite SPA `/(.*) → /index.html` + le routing `pathname.startsWith('/admin')` font que **toute URL inconnue renvoie la home en HTTP 200**.
- 💥 Mauvaise UX (pas de « page introuvable ») et duplicate content potentiel pour Google.
- 🔧 Ajouter une vraie page 404 (route fallback) renvoyée pour les chemins non reconnus.

### 🟡 P2 — Commandes `pending_payment` orphelines
- 📍 [src/App.jsx:776-820](src/App.jsx#L776)
- ❓ Si l'INSERT réussit mais `create-checkout` échoue (ou l'utilisateur abandonne), la commande reste `pending_payment` pour toujours, invisible de l'admin (`isAdminVisible` l'exclut).
- 💥 Accumulation de lignes fantômes en base ; difficile de réconcilier les paiements.
- 🔧 Job de nettoyage (ou statut `expired` après X min) pour les `pending_payment` sans transaction.

### 🟡 P2 — Garde anti double-soumission non verrouillé par ref
- 📍 [src/App.jsx:2856-2864](src/App.jsx#L2856)
- ❓ Le bouton « Commander » se désactive via le state `submitting`, posé avant l'`await`. Sous double-tap très rapide (avant re-render), deux INSERT pourraient théoriquement passer.
- 💥 Risque (faible) de commande dupliquée.
- 🔧 Verrou via `useRef` synchrone en plus du state.

✅ Mode Île désactivé proprement (`MODE_ILE_ENABLED=false`) → pas de remise -10%, pas de points : cohérent et intentionnel pour le lancement.

---

## 2. ADMIN DASHBOARD

Fonctionnellement complet et cohérent : realtime, toutes les transitions de statut, refus avec motifs, remboursements, compta (KPIs/transactions/CSV excluant la corbeille), corbeille (single + masse), print ticket, toggle cuisine. ✅

### 🔴 P0 — Aucun gate de rôle admin sur `/admin`
- 📍 [src/hooks/useAdminAuth.js:8-17](src/hooks/useAdminAuth.js#L8)
- ❓ L'accès admin n'est conditionné qu'à l'**existence d'une session Supabase** (`session?.user`). Aucun contrôle « cet utilisateur est-il staff ? ».
- 💥 N'importe quel compte authentifié (cf. §3) ouvre le tableau de bord, voit toutes les commandes et agit dessus.
- 🔧 Gater l'accès sur un rôle/claim admin (allowlist d'emails, `app_metadata.role='admin'`, ou table `admins`).

### 🟡 P2 — Bottom-nav mobile admin à 5 items
- 📍 [src/pages/admin/Sidebar.jsx](src/pages/admin/Sidebar.jsx)
- ❓ L'ajout de « Corbeille » porte la barre du bas à 5 items répartis en `flex-1`.
- 💥 Possiblement serré à 375px (labels tronqués).
- 🔧 Vérifier sur device réel ; éventuellement icône seule sous un seuil.

---

## 3. SÉCURITÉ & DONNÉES  ⚠️ section la plus critique

### 🔴 P0 — RLS `orders` : lecture/écriture/suppression ouverte à tout authentifié
- 📍 [supabase/migrations/orders_table.sql:35-47](supabase/migrations/orders_table.sql#L35), [supabase/migrations/20260522_corbeille.sql:24-28](supabase/migrations/20260522_corbeille.sql#L24)
- ❓ Les policies `orders` accordent au rôle `authenticated` : `SELECT USING(true)`, `UPDATE USING(true) WITH CHECK(true)`, `DELETE USING(true)`. Le modèle suppose « authenticated = admin », or **tout client qui crée un compte est `authenticated`**.
- 💥 **Fuite RGPD/revDSG massive** : un compte lambda peut faire `select('*')` sur `orders` et exfiltrer nom, téléphone, adresse, email, contenu et montant de **toutes** les commandes. Il peut aussi modifier les statuts et **supprimer** n'importe quelle commande.
- 🔧 Restreindre ces policies à un admin réel (claim/role/allowlist) et faire passer l'admin par le service_role ou un rôle dédié. La clé `anon` étant publique (dans le bundle), c'est la RLS qui est la seule barrière.

### 🔴 P0 — Endpoints admin sans contrôle de rôle (juste « token valide »)
- 📍 [api/sumup-refund.js:28](api/sumup-refund.js#L28), [api/admin/toggle-kitchen.js:23](api/admin/toggle-kitchen.js#L23), [api/admin/toggle-item-stock.js:21](api/admin/toggle-item-stock.js#L21), [api/admin/send-refusal-email.js:27](api/admin/send-refusal-email.js#L27)
- ❓ Tous valident `supabaseAdmin.auth.getUser(token)` (token Supabase valide) mais **pas** que l'utilisateur est admin. Le commentaire de `toggle-kitchen.js` l'admet explicitement.
- 💥 N'importe quel authentifié peut : **fermer la cuisine** (DoS commercial → 0 commande), **passer des plats en rupture**, **envoyer des emails de refus**, et **déclencher des remboursements SumUp** sur des commandes existantes (sabotage financier/opérationnel).
- 🔧 Ajouter un contrôle de rôle admin dans chaque endpoint (allowlist email ou claim), idéalement via un helper partagé.

### 🟠 P1 — Manipulation des prix unitaires (price tampering résiduel)
- 📍 [api/create-checkout.js:33-38](api/create-checkout.js#L33)
- ❓ Le serveur recalcule le **total** depuis `items[]`, mais fait confiance à `item.price` (l'INSERT anon n'est pas validé). Un client peut insérer une commande avec des prix unitaires falsifiés puis payer le total (faux) recalculé.
- 💥 Perte de revenu / fraude : payer un plat à 0,01 CHF.
- 🔧 Dupliquer le MENU côté serveur et recalculer les prix unitaires à partir des IDs, ignorer `item.price` du client.

### 🟠 P1 — INSERT `orders` ouvert anon, sans validation ni rate-limit
- 📍 [supabase/migrations/orders_table.sql:28-32](supabase/migrations/orders_table.sql#L28)
- ❓ `INSERT ... TO anon, authenticated WITH CHECK(true)` : aucune validation de contenu, pas de captcha, pas de limite.
- 💥 Spam de fausses commandes → pollue le dashboard, déclenche toasts/notifications/sons en boucle, fausse la compta avant tri.
- 🔧 Rate-limiting (Vercel/edge), validation de schéma, éventuellement un challenge léger anti-bot au checkout.

### 🟠 P1 — `send-order-confirmation` public → email-bombing
- 📍 [api/send-order-confirmation.js](api/send-order-confirmation.js) (aucun `Bearer`/getUser), couplé à l'INSERT anon ci-dessus
- ❓ Endpoint public ; il lit la commande et envoie un email à `customer_email`. Combiné à l'INSERT ouvert, un attaquant insère une commande avec l'email d'une victime puis spamme l'envoi.
- 💥 Abus d'envoi d'emails (réputation domaine Resend, quota, harcèlement).
- 🔧 Rate-limit + lier l'envoi à un secret/flux serveur, ou idempotence stricte par commande (déjà partielle).

### 🟠 P1 — Policy `profiles` UPDATE sans `WITH CHECK`
- 📍 [supabase/schema.sql:28-29](supabase/schema.sql#L28)
- ❓ `for update using (auth.uid() = id)` sans `WITH CHECK` ni restriction de colonnes : un user peut écrire n'importe quelle valeur sur son profil, dont `points`.
- 💥 Auto-attribution de points illimités quand le programme membre reviendra (latent — Mode Île OFF aujourd'hui).
- 🔧 Ajouter `WITH CHECK (auth.uid() = id)` et retirer `points` des colonnes modifiables côté client (le créditer via service_role uniquement).

### 🟡 P2 — `envPrefix` expose `NEXT_PUBLIC_` **et** `VITE_`
- 📍 [vite.config.js:18](vite.config.js#L18)
- ❓ Deux préfixes exposés au client. Les secrets actuels (`SUPABASE_SERVICE_ROLE_KEY`, `SUMUP_SECRET_KEY`, `RESEND_API_KEY`) ne les portent pas → OK.
- 💥 Tout futur secret nommé par erreur avec ces préfixes fuiterait dans le bundle.
- 🔧 Documenter la règle de nommage ; idéalement réduire à un seul préfixe.

✅ Bundle client scanné : **aucun** `service_role` / `SUMUP_SECRET` / `RESEND_API` ; seule la clé `anon` publique présente (attendu).
✅ `supabaseServer.js` (service_role, bypass RLS) bien isolé sous `api/_lib/` (non exposé comme Function).

### À VÉRIFIER (sans accès projet)
- **Signup public Supabase activé ?** S'il l'est (défaut), le P0 RLS est exploitable par tout le monde *immédiatement* (le signup UI est désactivé, mais l'API anon reste appelable). À désactiver si le programme membre n'est pas lancé.
- Refresh tokens / expiration : gérés par `supabase-js` par défaut (autoRefresh côté client). RAS au niveau code.

---

## 4. PAIEMENT & FACTURATION

### 🔴 P0 — Garde-fou horaires serveur en UTC (casse le paiement carte)
- 📍 [api/_lib/restaurantHours.js:21-22,29-30](api/_lib/restaurantHours.js#L21), utilisé par [api/create-checkout.js:99-108](api/create-checkout.js#L99)
- ❓ `getRestaurantStatus()` serveur utilise `date.getHours()/getDay()` = heure **locale du runtime = UTC sur Vercel** (aucun `Europe/Zurich`, aucun `TZ` configuré). Genève = UTC+2 en été (CEST, période de lancement).
- 💥 Exemple à 18h00 Genève (service du soir ouvert) → serveur voit 16h00 UTC < 17h30 → **refuse les paiements carte** pendant ~17h30–19h30 réelles ; et accepte des commandes carte jusqu'à ~minuit (après fermeture). Cash/Twint non affectés (check uniquement côté client, en heure navigateur correcte). Mitigation possible : l'admin force l'ouverture (`kitchen_open=true` bypass).
- 🔧 Calculer l'heure en `Europe/Zurich` côté serveur (TZ explicite / `Intl` avec `timeZone`) dans la copie miroir.

### 🟡 P2 — TVA / facturation
- 📍 Aucune mention TVA dans le code (grep `tva/vat/8.1/2.6` → néant)
- ❓ Prix affichés TTC sans ventilation TVA ni numéro TVA. La restauration **à emporter** en Suisse est à **2,6 %** (taux réduit), pas 8,1 %.
- 💥 Si KaïKaï est assujetti TVA, les reçus/factures pourraient devoir mentionner le n° TVA et le taux ; risque comptable/légal.
- 🔧 Valider le besoin avec la fiduciaire ; le cas échéant ajouter n° TVA + ventilation sur la confirmation.

### 🟡 P2 — Total Cash/Twint non recalculé serveur
- 📍 [src/App.jsx:776-793](src/App.jsx#L776) (insert), recompute serveur uniquement pour la carte
- ❓ Pour Cash/Twint, le `total` stocké est celui calculé côté client.
- 💥 Compta faussée si tampering ; impact réel limité (encaissement en personne par le staff).
- 🔧 Recalculer aussi pour Cash/Twint (ou au moins valider à l'affichage admin).

### 🟡 P2 — N° de commande : casse incohérente
- 📍 [src/lib/admin/orderHelpers.js:38-39](src/lib/admin/orderHelpers.js#L38) (uppercase) vs email `shortId`
- ❓ Admin affiche les 8 premiers car. en MAJUSCULES, l'email utilise `shortId` (potentiellement minuscule).
- 💥 Cosmétique ; un client lisant « #a1b2c3d4 » et un staff voyant « #A1B2C3D4 » peuvent douter.
- 🔧 Uniformiser la casse entre email et admin.

✅ Recompute du total serveur (anti-tamper) — [api/create-checkout.js:53-54](api/create-checkout.js#L53).
✅ Webhook re-fetch du vrai statut SumUp + idempotence + statuts protégés — [api/sumup-webhook.js:44-141](api/sumup-webhook.js#L44).
✅ Email de confirmation complet (HTML+texte, n° commande, récap items, total) — [api/_lib/emails/orderConfirmation.js](api/_lib/emails/orderConfirmation.js).
✅ Gestion échec/expiration/remboursement présente et idempotente.

---

## 5. PERFORMANCE & BUILD

### 🟠 P1 — 58 Mo d'images non optimisées dans `public/`
- 📍 `public/*.jpg` (ex : [public/chaud-kaifan.jpg] 3,1 Mo, `chaud-boeuf` 2,9 Mo, ~20 fichiers à 2–3 Mo)
- ❓ Images servies **brutes** (dans `public/`, donc non traitées par Vite), JPEG lourds. Une seule directive `loading="lazy"` dans [src/App.jsx](src/App.jsx) pour ~30 références image.
- 💥 LCP catastrophique sur mobile/3G, conversion en chute, mauvais Lighthouse/SEO, surcoût bande passante.
- 🔧 Convertir en WebP/AVIF, redimensionner aux tailles d'affichage réelles, compresser, et généraliser le lazy-loading. (Les `hero-*-v2.jpg` ~240 Ko montrent que c'est faisable.)

### 🟠 P1 — `favicon.png` référencé mais **absent**
- 📍 [index.html:5,18](index.html#L5), [public/manifest.json](public/manifest.json), [public/sw.js:16](public/sw.js#L16), [src/hooks/useOrders.js:31](src/hooks/useOrders.js#L31)
- ❓ Aucun `favicon.png` (ni `.ico`) dans `public/` ni `dist/`. Le fichier est référencé partout.
- 💥 Icône d'onglet cassée (404), icône PWA cassée, icône des notifications push cassée — image de marque dégradée dès l'ouverture.
- 🔧 Ajouter `favicon.png` (+ `apple-touch-icon` 180×180 et icônes PWA 192/512) dans `public/`.

### 🟡 P2 — Bundle JS monolithique (~690 Ko / 199 Ko gzip)
- 📍 `dist/assets/index-*.js`
- ❓ Public + admin + `motion` + `supabase` dans un seul chunk, pas de code-splitting.
- 💥 Coût de chargement initial plus élevé que nécessaire.
- 🔧 Lazy-load `/admin` (déjà séparable), import dynamique de `motion`.

### 🟡 P2 — Vulnérabilités npm (dev-only)
- 📍 `npm audit` : 11 vulnérabilités (6 high) sur `vite`, `tar`, `ws`.
- ❓ Toutes dans des dépendances **de build/dev** (serveur de dev Vite, tar), non embarquées dans le client.
- 💥 Risque réel en prod faible (statique servi par Vercel), mais à assainir.
- 🔧 `npm audit fix` + bump `vite`/`@supabase/supabase-js` (cf. `npm outdated`).

### 🟡 P2 — Google Fonts chargées globalement
- 📍 [index.html:21-26](index.html#L21)
- ❓ 3 familles de polices chargées en `<head>` global alors que le commentaire dit « utilisées uniquement sur /admin ».
- 💥 CSS de police render-blocking sur la home publique (perf inutile).
- 🔧 Charger ces polices uniquement sur `/admin`.

✅ Service worker v3 : ne cache plus HTML/JS/CSS (évite les bundles périmés) — [public/sw.js:1-61](public/sw.js#L1).

---

## 6. SEO & META

### 🟠 P1 — Pas de meta description ni Open Graph / Twitter Card
- 📍 [index.html:1-32](index.html#L1)
- ❓ Seuls `<title>` + `theme-color` présents. Pas de `description`, pas de `og:title/description/image`, pas de `twitter:card`.
- 💥 Snippet Google pauvre ; **aperçu vide/moche** quand le lien est partagé (WhatsApp/Insta/FB) — handicap direct pour le marketing de lancement.
- 🔧 Ajouter description FR, balises OG complètes + une image `og-image` (1200×630).

### 🟠 P1 — Pas de `robots.txt` ni `sitemap.xml`
- 📍 `public/` (absents)
- ❓ Aucun fichier d'indexation.
- 💥 Crawl/indexation non maîtrisés au lancement.
- 🔧 Ajouter `robots.txt` (+ lien sitemap) et un `sitemap.xml` minimal.

### 🟡 P2 — Pas de données structurées Schema.org `Restaurant`
- ❓ Aucun JSON-LD (`Restaurant`/`Menu`/`openingHours`/`address`).
- 💥 Pas de rich snippets Google (horaires, adresse, étoiles).
- 🔧 Ajouter un bloc JSON-LD `Restaurant`.

### 🟡 P2 — Pas de canonical + soft-404 (duplicate content)
- 📍 [index.html](index.html), [vercel.json:2-4](vercel.json#L2)
- ❓ Pas de `<link rel="canonical">` ; toutes les URLs renvoient la home (cf. §1).
- 🔧 Canonical + vraie 404.

✅ `<title>` présent, `lang="fr"`, `viewport-fit=cover`.

---

## 7. MOBILE & RESPONSIVE

Difficile à valider exhaustivement en statique — **test device réel recommandé** (iPhone 375px + Android).

✅ `viewport-fit=cover` ([index.html:6](index.html#L6)) et `env(safe-area-inset-*)` gérés (bottom-nav admin, barres flottantes corbeille/sélection).
✅ Touch targets globalement ≥44px (boutons `py-2.5/py-3`).

### 🟡 P2 — Bottom-nav admin 5 items à 375px
- 📍 [src/pages/admin/Sidebar.jsx](src/pages/admin/Sidebar.jsx) — cf. §2.
- 🔧 Vérifier le rendu réel.

### 🟡 P2 — Overflow horizontal / rendu 375px du site public non vérifiable en statique
- 📍 [src/App.jsx](src/App.jsx) (2800+ lignes, beaucoup d'inline styles)
- 💥 Risque de débordement non détecté.
- 🔧 Passe manuelle 375px (menu, formules, checkout, modales allergènes).

---

## 8. EDGE CASES & ROBUSTESSE

✅ **Supabase down en plein checkout** : capturé, message client clair avec n° de tél + WhatsApp + rassurance paiement — [src/App.jsx:850-853](src/App.jsx#L850).
✅ **Échec email** : non bloquant (fire-and-forget / best-effort) — [src/App.jsx:827-835](src/App.jsx#L827), [api/sumup-webhook.js:157-197](api/sumup-webhook.js#L157).
✅ **Refresh pendant paiement** : `order_id` en URL (`replaceState`) + en state, page succès qui poll — [src/App.jsx:837-847](src/App.jsx#L837).

### 🟠 P1 — Pas de rate-limiting (création commande / email)
- 📍 cf. §3 (INSERT anon ouvert, `send-order-confirmation` public).
- 💥 Spam commandes + email-bombing.
- 🔧 Rate-limit edge + validation.

### 🟡 P2 — Double-clic / orphelins / 404
- 📍 cf. §1 — garde double-submit non ref-locké, `pending_payment` orphelins, pas de page 404.

---

## 9. LÉGAL & CONFORMITÉ

### 🟠 P1 — Aucune politique de confidentialité
- 📍 Recherche `confidentialité/RGPD/privacy` dans `src/` → **néant**.
- ❓ Le site collecte nom, téléphone, adresse, email et traite des paiements, sans politique de confidentialité.
- 💥 Non-conformité **revDSG/nLPD** (Suisse) ; risque légal et de réputation dès l'ouverture.
- 🔧 Rédiger et publier une politique de confidentialité (données collectées, finalité, sous-traitants : Supabase/SumUp/Resend/Vercel, durée, droits).

### 🟠 P1 — Pas de CGV / conditions de vente
- 📍 Idem (néant)
- ❓ Vente de repas en ligne sans conditions générales (prix, livraison, annulation, remboursement).
- 💥 Litiges clients sans cadre ; exposition légale (CO).
- 🔧 Publier des CGV (zones/frais de livraison, délais, politique d'annulation/remboursement).

### 🟡 P2 — Pas de mentions légales / imprint
- ❓ Pas d'identification de l'exploitant (raison sociale, adresse, contact, n° IDE/TVA).
- 🔧 Ajouter une page mentions légales.

### 🟡 P2 — Bannière cookies / consentement
- ❓ Aucune bannière. La Suisse n'impose pas l'opt-in cookies (pas d'ePrivacy), et **aucun tracker tiers détecté** → risque faible aujourd'hui.
- 🔧 À ajouter uniquement si analytics/marketing tiers est introduit.

✅ **Allergènes** : système présent et câblé ([src/data/allergens.js](src/data/allergens.js), [src/App.jsx:1074-1153](src/App.jsx#L1074)), avec gestion des plats composites/formules. → **À vérifier manuellement** que le contenu correspond bien à `Tableau_Allergenes_KaiKai_v3.pdf`.
✅ Labels **HALAL** et **HEALTHY FOOD** visibles — [src/App.jsx:375-376,2212-2217](src/App.jsx#L375).
✅ Infos restaurant (email `contact@kaikai.ch`, tél `+41 76 519 76 70`, horaires source unique) présentes.

---

## 10. DEPLOY & INFRA  (majoritairement À VÉRIFIER — pas d'accès Vercel/Supabase/DNS)

### 🔴 P0 — À VÉRIFIER : migrations Supabase appliquées en prod
- 📍 [supabase/migrations/](supabase/migrations/) (8 fichiers, exécution **manuelle** d'après les en-têtes)
- ❓ Les migrations sont notées « à exécuter manuellement dans Supabase ». Rien ne garantit que la prod est à jour, en particulier `20260522_corbeille.sql` (colonnes `is_trashed`/`trashed_at` + **policy DELETE**).
- 💥 Si non appliquée : corbeille + suppression (single & masse) cassent en prod ; chantiers paiement/email/horaires potentiellement incomplets.
- 🔧 Vérifier/rejouer toutes les migrations en prod avant lancement.

### 🟠 P1 — Aucun header de sécurité dans `vercel.json`
- 📍 [vercel.json:5-12](vercel.json#L5) (seul un `Content-Type` pour Apple Pay)
- ❓ Pas de HSTS, `X-Content-Type-Options`, `X-Frame-Options`/CSP `frame-ancestors`, `Referrer-Policy`, ni `Cache-Control` pour les images.
- 💥 Site de paiement sans durcissement HTTP (clickjacking, sniffing) ; images re-téléchargées (pas de cache long).
- 🔧 Ajouter les headers de sécurité + `Cache-Control: immutable` sur les assets hashés/images.

### 🟡 P2 — Rewrite SPA vs Apple Pay `.well-known`
- 📍 [vercel.json:2-4](vercel.json#L2), [public/.well-known/apple-developer-merchantid-domain-association](public/.well-known/)
- ❓ Le catch-all `/(.*)` pourrait masquer le fichier de vérification (en pratique Vercel sert le statique d'abord).
- 🔧 Confirmer que l'URL `.well-known/...` renvoie bien le fichier (et pas `index.html`).

### 🟡 P2 — `test.html` résiduel à la racine
- 📍 [test.html](test.html) (utilise Tailwind CDN)
- ❓ Fichier de test commité à la racine. Non déployé (hors `public/`), mais traîne dans le repo.
- 🔧 Supprimer.

### À VÉRIFIER (sans accès)
- Variables d'env Vercel (Prod **et** Preview) : `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUMUP_SECRET_KEY`, `SUMUP_MERCHANT_CODE`, `RESEND_API_KEY` toutes définies.
- DNS Infomaniak : A record + CNAME `www` ; redirection www ↔ non-www cohérente ; canonicalisation du domaine.
- Webhook SumUp : `return_url` pointant bien vers le domaine de prod.
- Domaine vérifié côté Resend (SPF/DKIM) pour la délivrabilité des emails.
- Logs Vercel récents (erreurs runtime).

✅ HTTPS automatique via Vercel.

---

## 📋 PLAN D'ACTION SUGGÉRÉ (ordre de priorité)

**Avant lancement (P0) :**
1. Corriger la RLS `orders` (restreindre à un admin réel) + ajouter un gate de rôle admin sur `/admin` et tous les endpoints `api/admin/*` + `sumup-refund`.
2. Désactiver le signup public Supabase (tant que Mode Île est OFF).
3. Corriger le fuseau horaire serveur (`Europe/Zurich`) dans `api/_lib/restaurantHours.js`.
4. Vérifier/rejouer toutes les migrations Supabase en prod.

**Cette semaine (P1) :**
5. Politique de confidentialité + CGV.
6. Optimiser les images (WebP/redim/lazy) + ajouter `favicon.png`.
7. Meta description + Open Graph + `robots.txt`/`sitemap.xml`.
8. Recompute des prix unitaires serveur ; rate-limit INSERT/email ; `WITH CHECK` sur `profiles` ; headers de sécurité Vercel.

**Post-launch acceptable (P2) :** page 404, Schema.org, code-splitting, `npm audit fix`, nettoyage `test.html`, TVA, etc.
