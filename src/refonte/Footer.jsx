// src/refonte/Footer.jsx
//
// Pied de page de la refonte. Même contenu que le footer actuel (adresse,
// téléphone, horaires, zones, réseaux, mentions légales) au thème noir/lime,
// plus l'accès à la matrice allergènes.
//
// Les coordonnées arrivent en prop `restaurant` (RESTAURANT_INFO, passé par
// KaiKaiApp) : rien n'est recopié en dur, et ce fichier n'importe pas
// App.jsx — voir la note d'en-tête de RefonteShell.jsx.

import { Instagram, Facebook } from 'lucide-react';

export default function Footer({ onShowZones, onShowAllergens, restaurant }) {
  const year = new Date().getFullYear();
  const r = restaurant || {};
  const hm = (h) => (h || '').replace(':', 'h');

  return (
    <footer className="rf-footer">
      <div className="rf-shell">
        <div className="rf-footer__brand">KaïKaï</div>
        {/* Volontairement PAS la tagline de site.json : elle annonce
            « Genève & Lausanne » alors que les zones servies (deliveryZones.js)
            sont exclusivement genevoises. */}
        <p className="rf-footer__tag">
          Cuisine tahitienne préparée sur commande. Livraison et à emporter à Genève.
        </p>

        <div className="rf-footer__social">
          {r.instagram && (
            <a href={r.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram KaïKaï">
              <Instagram size={18} />
            </a>
          )}
          {r.facebook && (
            <a href={r.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook KaïKaï">
              <Facebook size={18} />
            </a>
          )}
        </div>

        <div className="rf-footer__cols">
          <div>
            <span className="rf-footer__label">Adresse</span>
            <ul className="rf-footer__list">
              <li>{r.address}</li>
              {r.phone && <li><a href={`tel:${r.phone}`}>{r.phoneDisplay}</a></li>}
              {r.google_page && (
                <li>
                  <a href={r.google_page} target="_blank" rel="noopener noreferrer">
                    Voir sur Google Maps
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <span className="rf-footer__label">Horaires</span>
            <ul className="rf-footer__list">
              <li>Midi · {hm(r.hours?.lunch?.start)}–{hm(r.hours?.lunch?.end)}</li>
              <li>Soir · {hm(r.hours?.dinner?.start)}–{hm(r.hours?.dinner?.end)}</li>
              <li>Pré-commande dès 11h / 17h30</li>
              <li>Fermé le lundi</li>
            </ul>
          </div>

          <div>
            <span className="rf-footer__label">Livraison</span>
            <ul className="rf-footer__list">
              <li>Genève · centre, 1ère et 2ème couronnes</li>
              <li>Livraison en {r.deliveryTime} min</li>
              <li>À emporter en {r.prepTime} min</li>
              {onShowZones && (
                <li>
                  <button type="button" className="rf-footer__linkbtn" onClick={onShowZones}>
                    Voir les zones
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="rf-footer__legal">
          <span>© {year} KaïKaï — Tous droits réservés.</span>
          {onShowAllergens && (
            <button type="button" className="rf-footer__linkbtn" onClick={onShowAllergens}>
              Allergènes
            </button>
          )}
          <a href="/mentions-legales">Mentions légales</a>
          <a href="/confidentialite">Confidentialité</a>
          <a href="/cgv">CGV</a>
        </div>
      </div>
    </footer>
  );
}
