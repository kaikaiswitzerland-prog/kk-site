// src/refonte/Footer.jsx
//
// Pied de page de la refonte. Même contenu que le footer actuel (adresse,
// téléphone, horaires, réseaux, mentions légales) mis au thème noir/or et
// réparti en trois colonnes. Les coordonnées viennent de RESTAURANT_INFO —
// source unique, partagée avec le site live : rien n'est recopié en dur.

import { Instagram, Facebook } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurant.js';
import site from '../data/site.json';

export default function Footer({ onShowZones }) {
  const year = new Date().getFullYear();

  return (
    <footer className="rf-footer">
      <div className="rf-shell">
        <div className="rf-footer__brand">KaïKaï</div>
        <p className="rf-footer__tag">{site.tagline}</p>

        <div className="rf-footer__social">
          <a
            href={RESTAURANT_INFO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram KaïKaï"
          >
            <Instagram size={18} />
          </a>
          <a
            href={RESTAURANT_INFO.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook KaïKaï"
          >
            <Facebook size={18} />
          </a>
        </div>

        <div className="rf-footer__cols">
          <div>
            <span className="rf-footer__label">Adresse</span>
            <ul className="rf-footer__list">
              <li>{RESTAURANT_INFO.address}</li>
              <li>
                <a href={`tel:${RESTAURANT_INFO.phone}`}>{RESTAURANT_INFO.phoneDisplay}</a>
              </li>
              <li>
                <a href={RESTAURANT_INFO.google_page} target="_blank" rel="noopener noreferrer">
                  Voir sur Google Maps
                </a>
              </li>
            </ul>
          </div>

          <div>
            <span className="rf-footer__label">Horaires</span>
            <ul className="rf-footer__list">
              <li>
                Midi · {RESTAURANT_INFO.hours.lunch.start.replace(':', 'h')}–
                {RESTAURANT_INFO.hours.lunch.end.replace(':', 'h')}
              </li>
              <li>
                Soir · {RESTAURANT_INFO.hours.dinner.start.replace(':', 'h')}–
                {RESTAURANT_INFO.hours.dinner.end.replace(':', 'h')}
              </li>
              <li>Pré-commande dès 11h / 17h30</li>
              <li>Fermé le lundi</li>
            </ul>
          </div>

          <div>
            <span className="rf-footer__label">Livraison</span>
            <ul className="rf-footer__list">
              <li>Genève · centre, 1ère et 2ème couronnes</li>
              <li>Livraison en {RESTAURANT_INFO.deliveryTime} min</li>
              <li>À emporter en {RESTAURANT_INFO.prepTime} min</li>
              {onShowZones && (
                <li>
                  <button
                    type="button"
                    onClick={onShowZones}
                    style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Voir les zones
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="rf-footer__legal">
          <span>© {year} KaïKaï — Tous droits réservés.</span>
          <a href="/mentions-legales">Mentions légales</a>
          <a href="/confidentialite">Confidentialité</a>
          <a href="/cgv">CGV</a>
        </div>
      </div>
    </footer>
  );
}
