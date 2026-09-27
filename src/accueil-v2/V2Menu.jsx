// src/accueil-v2/V2Menu.jsx
//
// La carte de l'accueil v2 : chips de catégories, sections en grille de
// cartes, composeur de woks (instance passée par KaiKaiApp) intercalé après
// les entrées, note, « Notre histoire », « Livraison & à emporter ».
//
// Composant PRÉSENTATIONNEL : les plats, prix, photos et ruptures viennent de
// `sections`, `catalog` et `isUnavailable` (menuCatalog dans App.jsx). Les
// zones de livraison viennent de src/lib/deliveryZones.js, source de vérité.

import { Fragment } from 'react';
import { DELIVERY_ZONES } from '../lib/deliveryZones.js';
import { chf, SECTIONS, WOK_ANCHOR, CHIPS, SIGNATURE_IDS } from './v2Helpers.js';
import { scrollToId } from './useScrollSpy.js';

function Card({ item, qty, out, photo, photoPos, onAdd, onRemove }) {
  const add = (e) => { e.preventDefault(); if (!out) onAdd(item); };
  return (
    <article className={`card${out ? ' out' : ''}`}>
      <a className="pic" href="#" onClick={add} aria-hidden="true" tabIndex={-1}>
        {photo && (
          <img src={photo} alt="" loading="lazy" decoding="async" style={{ objectPosition: photoPos || 'center' }} />
        )}
        {/* Le badge vit sur la photo : dans le corps, il décalait le titre des
            trois cartes qui le portent et cassait l'alignement de la grille. */}
        {SIGNATURE_IDS.has(String(item.id)) && <span className="badge">Signature</span>}
      </a>
      <div className="body">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <div className="foot">
          <span className="price">{chf(item.price)}</span>
          <div className={`qty${qty > 0 ? ' has' : ''}`}>
            <button type="button" className="qb minus" onClick={() => onRemove(item)} aria-label="Retirer">−</button>
            <span className="qn">{qty}</span>
            <button type="button" className="add" onClick={add} disabled={out}>
              {out ? 'En rupture' : 'Commander'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Section({ id, title, items, cart, isUnavailable, catalog, onAdd, onRemove, extraClass = '' }) {
  return (
    <section className={`cat${extraClass}`} id={id}>
      <div className="wrap">
        <h2>{title}</h2>
        <div className={`cards n${items.length}`}>
          {items.map((item) => (
            <Card
              key={item.id}
              item={item}
              qty={cart[item.id] || 0}
              out={isUnavailable(item)}
              photo={catalog.getPhoto(item.id)}
              photoPos={catalog.getPhotoPos(item.id)}
              onAdd={onAdd}
              onRemove={onRemove}
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
            items={sections[s.key] || []}
            cart={cart}
            isUnavailable={isUnavailable}
            catalog={catalog}
            onAdd={onAdd}
            onRemove={onRemove}
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

      <p className="note">Tous nos plats sont accompagnés de riz et de salade.</p>

      <section className="about" id="apropos">
        <div className="wrap">
          <div>
            <h2>Notre histoire</h2>
            <p>KaïKaï est né de la passion pour la cuisine tahitienne authentique. Notre mission est de vous faire voyager à travers les saveurs des îles du Pacifique, en utilisant des produits frais et de qualité.</p>
          </div>
        </div>
      </section>

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
              aria-label="Où nous trouver — ouvrir dans Google Maps"
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
    </main>
  );
}
