// src/accueil-v2/V2Footer.jsx
//
// Pied de page Évasion de l'accueil v2. Logo K « TAHITIAN FOOD »
// (public/logo_kaikai_k_texte.png, extrait du HTML fourni). Coordonnées,
// réseaux et horaires lus dans RESTAURANT_INFO (src/data/restaurant.js),
// jamais recopiés. Les liens « À propos » et « Voir les zones » ouvrent les
// modales partagées de KaiKaiApp (les mêmes que sur /classique).

import { hmm } from './v2Helpers.js';

export default function V2Footer({ restaurant, onShowAbout, onShowZones }) {
  const r = restaurant || {};
  const daily = r.hours?.daily;
  const saturday = r.hours?.saturday;

  return (
    <footer id="contact">
      <div className="wrap">
        <div>
          <img className="flogo" src="/logo_kaikai_k_texte.png" alt="KaïKaï — Tahitian food" width="550" height="600" />
          <p>Tahitian food · Genève</p>
          <p>{r.address}</p>
          <p><a href="https://kaikaifood.com">kaikaifood.com</a></p>
        </div>
        <div>
          <h3>Contact</h3>
          {r.phone && <p><a href={`tel:${r.phone}`}>{r.phoneDisplay || r.phone}</a></p>}
          {r.email && <p><a href={`mailto:${r.email}`}>{r.email}</a></p>}
          {r.instagram && <p><a href={r.instagram} rel="noopener noreferrer" target="_blank">Instagram @kaikaifood.ch</a></p>}
          {r.facebook && <p><a href={r.facebook} rel="noopener noreferrer" target="_blank">Facebook</a></p>}
        </div>
        <div>
          <h3>Horaires</h3>
          {daily && <p>Dimanche – vendredi : {hmm(daily.start)} – {hmm(daily.end)}</p>}
          {saturday && <p>Samedi : {hmm(saturday.start)} – {hmm(saturday.end)}</p>}
          {(onShowAbout || onShowZones) && (
            <p className="links">
              {onShowAbout && <button type="button" className="linkbtn" onClick={onShowAbout}>À propos</button>}
              {onShowAbout && onShowZones && ' · '}
              {onShowZones && <button type="button" className="linkbtn" onClick={onShowZones}>Voir les zones de livraison</button>}
            </p>
          )}
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} KaïKaï — Tous droits réservés.</span>
          <span>
            <a href="/mentions-legales">Mentions légales</a> · <a href="/confidentialite">Confidentialité</a> · <a href="/cgv">CGV</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
