# KaïKaï — Dark kitchen tahitienne (Genève)

Site de commande pour KaïKaï, par ENDO&CO Sàrl.
Production : [kaikaifood.com](https://kaikaifood.com)

## Stack

- **Front** : React 19 + Vite + Tailwind 4
- **Backend** : Vercel Functions (Node)
- **DB** : Supabase (Postgres + Auth + RLS + Realtime)
- **Paiement carte** : SumUp Hosted Checkout (webhook → DB)
- **Emails** : Resend (confirmation + remboursement)
- **Déploiement** : Vercel (auto sur push `main`)

## Setup local

```bash
git clone https://github.com/kaikaiswitzerland-prog/kk-site
cd kk-site
npm install
cp .env.example .env.local   # puis remplir les valeurs (demander à Enzo)
npm run dev
```

Le site tourne sur `http://localhost:5173`. L'admin est sur `/admin`
(login Supabase auth requis).

## Structure

```
src/
├── App.jsx                 # Composant principal (menu, checkout)
├── lib/                    # Helpers partagés (front)
│   ├── supabase.js         # Client Supabase anon
│   ├── restaurantHours.js  # Source de vérité horaires
│   ├── deliveryZones.js    # Table NPA → zone livraison
│   └── admin/              # Helpers admin
├── hooks/                  # Hooks React
│   ├── useRestaurantOpen.js  # Statut ouverture (auto + flag admin)
│   ├── useOrders.js          # Liste commandes Realtime
│   └── useAdminAuth.js       # Session admin
├── pages/
│   ├── AdminApp.jsx        # PWA admin (orchestrateur)
│   ├── OrderSuccessPage.jsx
│   └── admin/              # Composants admin (cards, modals, etc.)
└── components/             # Auth, hero, mode île

api/
├── _lib/                   # Helpers serveur (miroirs de src/lib pour
│   │                         restaurantHours et deliveryZones)
│   ├── supabaseServer.js   # Client service_role (bypass RLS)
│   ├── resend.js
│   └── emails/             # Templates HTML
├── create-checkout.js      # POST → crée checkout SumUp + garde-fous
├── sumup-webhook.js        # POST ← SumUp confirme paiement
├── sumup-refund.js         # POST admin — rembourse
├── send-order-confirmation.js
└── admin/
    └── toggle-kitchen.js   # POST admin — stop commandes

supabase/migrations/        # Historique des migrations SQL (jouées à la
                            # main via Supabase Dashboard SQL Editor)
```

## Déploiement

- **Push `main`** → Vercel déploie automatiquement.
- **Migrations SQL** : à exécuter **manuellement** via
  Supabase Dashboard → SQL Editor. Les migrations sont idempotentes
  (peuvent être rejouées sans casser). Voir le dossier
  [supabase/migrations/](supabase/migrations/) pour l'ordre chronologique.

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète. Le projet
utilise le préfixe `NEXT_PUBLIC_*` pour les variables exposées au
client (configuré dans `vite.config.js` via `envPrefix`), pas `VITE_*`.
En production : Vercel → Settings → Environment Variables
(Production + Preview).

## Contact

ENDO&CO Sàrl — Genève
