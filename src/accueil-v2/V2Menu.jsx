// src/accueil-v2/V2Menu.jsx
//
// La carte de l'accueil v2 : chips de catégories, sections en grille de
// cartes, composeur de woks (instance passée par KaiKaiApp) intercalé après
// les entrées, note, « Notre histoire », « Livraison & à emporter ».
//
// Composant PRÉSENTATIONNEL : les plats, prix, photos et ruptures viennent de
// `sections`, `catalog` et `isUnavailable` (menuCatalog dans App.jsx). Les
// zones de livraison viennent de src/lib/deliveryZones.js, les allergènes de
// src/data/allergens.js — sources de vérité, rien n'est recopié ici.

import { Fragment, useEffect, useState } from 'react';
import { DELIVERY_ZONES } from '../lib/deliveryZones.js';
import { getAllergensForItem, getAllAllergens, formatAllergenNamesShort } from '../data/allergens.js';
// Photos, cadrage et descriptions courtes : les MÊMES que la peau refonte (/),
// lus dans src/refonte/productMeta.js — rien n'est recopié ici.
import { getProductMeta } from '../refonte/productMeta.js';
import V2Reviews from './V2Reviews.jsx';
import { chf, SECTIONS, WOK_ANCHOR, CHIPS, badgesFor } from './v2Helpers.js';
import { scrollToId } from './useScrollSpy.js';

// Cascade d'images identique à ProductCard.jsx (refonte) : PNG détouré → JPG
// actuel → rien. Tant que les PNG ne sont pas livrés, ce sont les JPG.
function useImageFallback(meta) {
  const chain = [
    meta.png ? { src: meta.png, kind: 'png' } : null,
    meta.jpg ? { src: meta.jpg, kind: 'jpg' } : null,
  ].filter(Boolean);
  const [step, setStep] = useState(0);
  useEffect(() => { setStep(0); }, [meta.png, meta.jpg]);
  return { current: chain[step] || null, onError: () => setStep((s) => s + 1) };
}

// Ligne allergènes d'une carte : les MÊMES trois cas que MenuItem (App.jsx,
// peau historique) — « selon votre composition » pour les formules et les
// plats composites, « Sans allergène majeur », ou « Contient : … » avec les
// traces, cliquable vers le détail (AllergensModal, ouverte par KaiKaiApp).
function AllergenLine({ item, isFormula, onShow }) {
  const allergens = getAllergensForItem(item.id);
  const all = getAllAllergens(allergens);
  const none = all.length === 0 && allergens.traces.length === 0;
  if (isFormula || allergens.isComposite) {
    return <div className="allerg static">Allergènes : selon votre composition</div>;
  }
  return (
    <button
      type="button"
      className={`allerg${none ? ' none' : ''}`}
      onClick={(e) => { e.preventDefault(); if (onShow) onShow(item); }}
      title="Voir le détail des allergènes"
    >
      {none ? 'Sans allergène majeur' : (
        <>
          Contient : {formatAllergenNamesShort(all)}
          {allergens.traces.length > 0 && all.length > 0 && (
            <span className="traces">Traces : {formatAllergenNamesShort(allergens.traces)}</span>
          )}
        </>
      )}
    </button>
  );
}

function Card({ item, qty, out, isFormula, onAdd, onRemove, onShowAllergens }) {
  const meta = getProductMeta(item.id);
  const { current, onError } = useImageFallback(meta);
  const badges = badgesFor(item.id);
  // Même règle à trois cas que ProductCard.jsx : `short` absent → description
  // officielle du plat (App.jsx) ; `short: ''` → aucune ligne.
  const desc = meta.short != null ? meta.short : (item.desc || '');
  const add = (e) => { e.preventDefault(); if (!out) onAdd(item); };
  return (
    <article className={`card${out ? ' out' : ''}`}>
      <a className="pic" href="#" onClick={add} aria-hidden="true" tabIndex={-1}>
        {current && (
          <img
            key={current.src}
            src={current.src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={onError}
            className={`pic-img pic-img--${current.kind}`}
            /* Recadrage du JPG quand le sujet n'est pas au centre (jpgPos de
               productMeta.js) — exactement comme sur /. */
            style={current.kind === 'jpg' && meta.jpgPos ? { objectPosition: meta.jpgPos } : undefined}
          />
        )}
        {/* Les badges vivent sur la photo : dans le corps, ils décalaient le
            titre des cartes qui les portent et cassaient l'alignement de la
            grille. Déclarés dans v2Helpers.js (PRODUCT_BADGES), côte à côte. */}
        {badges.length > 0 && (
          <span className="badges">
            {badges.map((b) => <span key={b.key} className={`badge ${b.key}`}>{b.label}</span>)}
          </span>
        )}
      </a>
      <div className="body">
        <h3>{item.name}</h3>
        {desc && <p title={desc}>{desc}</p>}
        <AllergenLine item={item} isFormula={isFormula} onShow={onShowAllergens} />
        <div className="foot">
          <span className="price">{chf(item.price)}</span>
          {qty > 0 ? (
            /* Au panier : sélecteur « − n + » aux couleurs Nature, boutons ronds
               de 44 px à taille fixe. « + » repasse par les options du plat. */
            <div className="qtyctl" role="group" aria-label={`Quantité de ${item.name}`}>
              <button type="button" className="qbtn" onClick={() => onRemove(item)} aria-label="Un de moins">−</button>
              <span className="qn">{qty}</span>
              <button type="button" className="qbtn" onClick={add} disabled={out} aria-label="Un de plus">+</button>
            </div>
          ) : (
            <button type="button" className="add" onClick={add} disabled={out}>
              {out ? 'En rupture' : 'Commander'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Section({ id, title, note = null, items, cart, isUnavailable, isFormula = false, onAdd, onRemove, onShowAllergens, extraClass = '' }) {
  return (
    <section className={`cat${extraClass}`} id={id}>
      <div className="wrap">
        <h2>{title}</h2>
        {note && <p className="sub">{note}</p>}
        <div className={`cards n${items.length}`}>
          {items.map((item) => (
            <Card
              key={item.id}
              item={item}
              qty={cart[item.id] || 0}
              out={isUnavailable(item)}
              isFormula={isFormula}
              onAdd={onAdd}
              onRemove={onRemove}
              onShowAllergens={onShowAllergens}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function V2Menu({
  sections = {},
  wokComposer = null,
  cart = {},
  isUnavailable = () => false,
  catalog,
  onAdd,
  onRemove,
  onShowAllergens,
  onShowZones,
  onShowAbout,
  restaurant,
  chipsRef,
  activeChip,
}) {
  const zones = Object.values(DELIVERY_ZONES);

  return (
    <main>
      <div id="menu" />
      <nav className="chips" aria-label="Catégories du menu" ref={chipsRef}>
        {/* data-scroll-x : défilement horizontal voulu (l'audit de débordement l'ignore). */}
        <div className="wrap" data-scroll-x="">
          {CHIPS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-current={activeChip === c.id ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); scrollToId(c.id); }}
            >
              {c.label}
            </a>
          ))}
        </div>
      </nav>

      {SECTIONS.map((s) => (
        <Fragment key={s.key}>
          <Section
            id={s.id}
            title={s.title}
            note={s.note}
            items={sections[s.key] || []}
            cart={cart}
            isUnavailable={isUnavailable}
            // Les formules affichent « selon votre composition », comme sur
            // /classique (prop isFormula de MenuItem).
            isFormula={s.key === 'formules'}
            onAdd={onAdd}
            onRemove={onRemove}
            onShowAllergens={onShowAllergens}
          />

          {/* Le composeur s'intercale juste après les entrées, comme dans le
              HTML. Il est instancié par KaiKaiApp et passé tel quel ; le
              wrapper `wok-slot` porte les surcharges CSS de présentation. */}
          {s.key === 'entrees' && wokComposer && (
            <section className="cat wok" id={WOK_ANCHOR.id}>
              <div className="wrap">
                <h2>{WOK_ANCHOR.title}</h2>
                <p className="lead">Votre base, vos légumes, votre garniture — le prix s'ajuste à votre composition.</p>
                <div className="wok-slot">{wokComposer}</div>
              </div>
            </section>
          )}
        </Fragment>
      ))}

      <section className="infos" id="livraison">
        <div className="wrap">
          <h2>Livraison &amp; à emporter</h2>
          <div className="zones">
            {zones.map((z) => (
              <div className="zone" key={z.id}>
                <h3>{z.name}</h3>
                <span className="fee">{chf(z.fee)}</span>
                <p>{z.description}</p>
              </div>
            ))}
          </div>
          {/* Liste complète des NPA desservis : la modale des zones partagée,
              celle du lien « voir les zones » du pied de page de /classique. */}
          {onShowZones && (
            <p className="zoneslink">
              <button type="button" className="linkbtn" onClick={onShowZones}>Voir les zones desservies</button>
            </p>
          )}
          <div className="practical">
            <div>
              <h3>Livraison</h3>
              <p>
                Genève uniquement, dans un rayon d'environ 8 km. Comptez <strong>{restaurant.deliveryTime} min</strong> ;
                dès <strong>{chf(catalog.minimumDelivery)}</strong> de commande. Le frais exact s'affiche à la saisie de votre code postal.
              </p>
            </div>
            <div>
              <h3>À emporter</h3>
              <p>Prêt en <strong>{restaurant.prepTime} min</strong>. Paiement <strong>par carte</strong> en ligne ou <strong>en espèces</strong> au retrait.</p>
            </div>
            <a
              className="mapcard"
              href={restaurant.google_page}
              rel="noopener noreferrer"
              target="_blank"
              title="Ouvrir dans Google Maps"
            >
              {/* Plan stylisé — teintes Fraîcheur, épingle Évasion, point Nature. */}
              <svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="320" height="120" fill="#eaefeb" />
                <path d="M0 62 H320" stroke="#fff" strokeWidth="14" />
                <path d="M118 0 V120 M230 0 V120" stroke="#fff" strokeWidth="9" />
                <path d="M0 22 H320 M0 100 H320" stroke="#fff" strokeWidth="5" />
                <path d="M40 0 V120 M290 0 V120" stroke="#fff" strokeWidth="4" />
                <rect x="52" y="30" width="56" height="24" rx="3" fill="#d2dcd6" />
                <rect x="128" y="70" width="90" height="22" rx="3" fill="#d2dcd6" />
                <rect x="240" y="30" width="40" height="24" rx="3" fill="#d2dcd6" />
                <path d="M160 24c-13 0-22 9.6-22 21.5C138 62 160 86 160 86s22-24 22-40.5C182 33.6 173 24 160 24z" fill="#0D3B36" />
                <circle cx="160" cy="45" r="8" fill="#B7D94C" />
              </svg>
              <div>
                <h3>Où nous trouver</h3>
                <p><strong>{restaurant.address}</strong><br />Plainpalais · Bring Kitchens</p>
                <span className="maplink">Ouvrir dans Google Maps</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Tout en bas de la page, juste avant le pied de page : les avis Google
          (src/data/reviews.js ; masqués si la liste est vide), puis « Notre
          histoire ». */}
      <V2Reviews restaurant={restaurant} />

      <section className="about" id="apropos">
        <div className="wrap">
          <div>
            <h2>Notre histoire</h2>
            <p>KaïKaï est né de la passion pour la cuisine tahitienne authentique. Notre mission est de vous faire voyager à travers les saveurs des îles du Pacifique, en utilisant des produits frais et de qualité.</p>
            {/* La modale « À propos » partagée (engagement halal, allergènes et
                liste des 14, livraison et zones, plan, réseaux) — celle du
                bouton Info de /classique. */}
            {onShowAbout && (
              <button type="button" className="linkbtn" onClick={onShowAbout}>À propos de KaïKaï</button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
