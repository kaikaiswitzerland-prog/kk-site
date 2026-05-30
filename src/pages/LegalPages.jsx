// src/pages/LegalPages.jsx
// 3 pages légales standalone : mentions légales, politique de confidentialité,
// CGV. Branchées dans src/main.jsx au même niveau que /admin (court-circuite
// App.jsx pour rester sobre et indépendant du state machine du checkout).
//
// Ajouter une 4e page = ajouter une entrée à LEGAL_ROUTES + le composant.

import { ArrowLeft } from 'lucide-react';

const LEGAL_ROUTES = {
  '/mentions-legales': 'mentions',
  '/confidentialite':  'privacy',
  '/cgv':              'cgv',
};

export function isLegalRoute(pathname) {
  return Object.prototype.hasOwnProperty.call(LEGAL_ROUTES, pathname);
}

// ─── Layout commun ──────────────────────────────────────────────────────────
function LegalLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </a>
          <span className="font-display text-lg">KaïKaï</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-white/60">{subtitle}</p>
        )}
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-white/85">
          {children}
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-sm text-white/50">
          Dernière mise à jour : 30 mai 2026 — © {new Date().getFullYear()} KaïKaï
        </div>
      </main>
    </div>
  );
}

// Petit helper pour les sections, qui évite de répéter le même rythme partout.
function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-xl text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

// ─── Page 1 : Mentions légales ──────────────────────────────────────────────
function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <Section title="Éditeur du site">
        <p>Le site kaikaifood.com est édité par :</p>
        <p>
          Enzo Cousin — exploitant indépendant, cuisine tahitienne « KaïKaï »
          <br />Boulevard de la Tour 1, 1205 Genève, Suisse
          <br />E-mail : <a href="mailto:kaikaiswitzerland@gmail.com" className="underline hover:text-white">kaikaiswitzerland@gmail.com</a>
        </p>
        <p>
          KaïKaï est une marque commerciale exploitée par Enzo Cousin en raison
          individuelle. L'entreprise n'est pas assujettie à la TVA (chiffre
          d'affaires inférieur au seuil légal de 100'000 CHF).
        </p>
      </Section>

      <Section title="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut,
          CA 91789, États-Unis — vercel.com
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus du site (textes, photographies des plats,
          logo, identité visuelle, mise en page) est protégé par le droit
          d'auteur. Toute reproduction, même partielle, sans autorisation
          écrite préalable est interdite.
        </p>
      </Section>

      <Section title="Responsabilité">
        <p>
          Les informations figurant sur ce site (menu, prix, horaires, zones
          de livraison) sont fournies à titre indicatif et peuvent être
          modifiées à tout moment. Enzo Cousin met tout en œuvre pour assurer
          l'exactitude des informations mais ne saurait être tenu responsable
          d'éventuelles erreurs ou omissions.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ─── Page 2 : Politique de confidentialité ──────────────────────────────────
function Confidentialite() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      subtitle="Conforme à la Loi fédérale sur la protection des données (nLPD)."
    >
      <Section title="Responsable du traitement">
        <p>
          Enzo Cousin — Boulevard de la Tour 1, 1205 Genève —
          {' '}
          <a href="mailto:kaikaiswitzerland@gmail.com" className="underline hover:text-white">
            kaikaiswitzerland@gmail.com
          </a>
        </p>
      </Section>

      <Section title="Quelles données nous collectons">
        <p>
          Lorsque vous passez commande, nous collectons uniquement les données
          nécessaires au traitement de votre commande : nom, numéro de
          téléphone, adresse de livraison (en cas de livraison), adresse
          e-mail, instructions de commande que vous transmettez
          volontairement, et le détail de la commande (plats, montant). Nous
          ne collectons aucune donnée bancaire : les paiements par carte sont
          traités exclusivement par notre prestataire SumUp ; nous n'avons
          jamais accès à vos numéros de carte.
        </p>
      </Section>

      <Section title="Pourquoi nous utilisons ces données">
        <p>
          Vos données servent uniquement à : traiter et préparer votre
          commande, assurer la livraison ou le retrait, vous envoyer la
          confirmation et le statut de la commande, gérer un éventuel
          remboursement, répondre à vos questions. Nous n'utilisons pas vos
          données pour de la publicité ciblée et nous ne les vendons à
          personne.
        </p>
      </Section>

      <Section title="Avec qui vos données sont partagées">
        <p>
          Prestataires techniques qui traitent certaines données pour notre
          compte : Supabase (base de données des commandes), SumUp (paiements
          par carte), Resend (e-mails de confirmation), Vercel (hébergement).
          Ils n'accèdent qu'aux données nécessaires à leur prestation.
          Certains peuvent être hors de Suisse ; le transfert est alors
          encadré par des garanties appropriées.
        </p>
      </Section>

      <Section title="Combien de temps nous conservons vos données">
        <p>
          Aussi longtemps que nécessaire à la gestion de la relation client et
          au respect de nos obligations légales (notamment comptables).
          Au-delà, les données sont supprimées ou anonymisées.
        </p>
      </Section>

      <Section title="Vos droits">
        <p>
          Conformément à la nLPD, vous disposez des droits d'accès, de
          rectification, de suppression et d'opposition. Pour les exercer,
          écrivez à{' '}
          <a href="mailto:kaikaiswitzerland@gmail.com" className="underline hover:text-white">
            kaikaiswitzerland@gmail.com
          </a>.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Le site utilise uniquement les cookies techniques nécessaires à son
          fonctionnement (ex : mémoriser votre panier). Aucun cookie
          publicitaire ni traceur tiers marketing.
        </p>
      </Section>

      <Section title="Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger vos données.
        </p>
      </Section>

      <Section title="Modifications">
        <p>
          Cette politique peut être mise à jour. La version en vigueur est
          celle publiée sur cette page.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ─── Page 3 : CGV ───────────────────────────────────────────────────────────
function CGV() {
  return (
    <LegalLayout title="Conditions Générales de Vente">
      <Section title="1. Champ d'application">
        <p>
          Les présentes CGV régissent toute commande passée sur kaikaifood.com
          auprès de Enzo Cousin — KaïKaï, Boulevard de la Tour 1, 1205 Genève,
          {' '}
          <a href="mailto:kaikaiswitzerland@gmail.com" className="underline hover:text-white">
            kaikaiswitzerland@gmail.com
          </a>
          . Toute commande implique l'acceptation pleine et entière des
          présentes CGV.
        </p>
      </Section>

      <Section title="2. Produits">
        <p>
          KaïKaï propose des plats de cuisine tahitienne préparés sur
          commande. Les photographies sont non contractuelles. Les
          informations sur les allergènes sont disponibles sur le site ; il
          appartient au client de signaler toute allergie ou intolérance
          avant de commander. Nos plats sont préparés dans une cuisine où
          sont manipulés divers allergènes.
        </p>
      </Section>

      <Section title="3. Prix">
        <p>
          Les prix sont en francs suisses (CHF), toutes taxes comprises.
          KaïKaï n'étant pas assujetti à la TVA, aucune TVA n'est facturée.
          Les frais de livraison éventuels sont indiqués séparément avant
          validation. Les commandes sont facturées au prix en vigueur au
          moment de leur validation.
        </p>
      </Section>

      <Section title="4. Commande">
        <p>
          La commande est passée en ligne. Elle est définitive après
          confirmation et, pour les paiements carte, après validation du
          paiement. KaïKaï peut refuser ou annuler une commande en cas
          d'indisponibilité, de commande hors zone, hors horaires, ou en cas
          de doute légitime. En cas de refus d'une commande déjà payée, le
          client est intégralement remboursé.
        </p>
      </Section>

      <Section title="5. Paiement">
        <p>
          Paiement par carte via SumUp (au moment de la commande), en espèces
          à la livraison/au retrait, ou par TWINT le cas échéant. KaïKaï n'a
          jamais accès aux données bancaires du client.
        </p>
      </Section>

      <Section title="6. Livraison et retrait">
        <p>
          Livraison dans certaines zones de Genève et retrait sur place
          (click &amp; collect) au Boulevard de la Tour 1, 1205 Genève. Les
          zones et frais sont indiqués lors de la commande. Les délais sont
          estimatifs et varient selon l'affluence. Les commandes ne sont
          possibles que pendant les horaires d'ouverture affichés. Le client
          est responsable de l'exactitude de l'adresse communiquée.
        </p>
      </Section>

      <Section title="7. Droit de rétractation / annulation">
        <p>
          Nos plats sont des denrées alimentaires périssables préparées à la
          commande. Conformément à la pratique applicable en Suisse, ils ne
          bénéficient d'aucun droit de rétractation une fois la commande
          confirmée et la préparation lancée. Une annulation n'est possible
          que si elle est formulée immédiatement après la commande et avant
          le début de la préparation, en nous contactant sans délai par
          téléphone ou e-mail.
        </p>
      </Section>

      <Section title="8. Réclamations">
        <p>
          Pour toute réclamation (erreur, qualité, retard), contactez-nous dès
          que possible à{' '}
          <a href="mailto:kaikaiswitzerland@gmail.com" className="underline hover:text-white">
            kaikaiswitzerland@gmail.com
          </a>{' '}
          ou au numéro indiqué sur le site. Chaque réclamation est traitée
          avec attention pour trouver une solution équitable.
        </p>
      </Section>

      <Section title="9. Responsabilité">
        <p>
          La responsabilité de KaïKaï est limitée au montant de la commande
          concernée. KaïKaï n'est pas responsable des conséquences d'une
          information erronée fournie par le client (adresse, allergie non
          signalée, etc.).
        </p>
      </Section>

      <Section title="10. Droit applicable et for">
        <p>
          Les présentes CGV sont soumises au droit suisse. En cas de litige,
          à défaut de résolution amiable, le for est à Genève, sous réserve
          des dispositions impératives protégeant le consommateur.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ─── Router ─────────────────────────────────────────────────────────────────
export default function LegalRouter() {
  const route = LEGAL_ROUTES[window.location.pathname];
  if (route === 'mentions') return <MentionsLegales />;
  if (route === 'privacy')  return <Confidentialite />;
  if (route === 'cgv')      return <CGV />;
  // Sécurité : si appelé hors d'une route connue (ne devrait pas arriver via
  // main.jsx), on redirige doucement vers l'accueil.
  if (typeof window !== 'undefined') window.location.replace('/');
  return null;
}
