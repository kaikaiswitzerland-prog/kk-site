// src/refonte/AllergensMatrix.jsx
//
// Matrice allergènes COMPLÈTE, plat par plat, lue directement depuis
// src/data/allergens.js — aucune donnée recopiée ici.
//
// C'est le pendant global de ce que le site actuel affiche plat par plat sous
// chaque prix. Dans la refonte, la grille produits reste volontairement nue
// (photo, nom, prix, avis) : l'information allergènes est regroupée ici, et
// atteignable depuis le header comme depuis le footer.
//
// Mise en page : à 390 px, un vrai tableau de 14 colonnes est illisible. On
// garde donc l'intégralité de l'information mais en liste par plat, avec la
// légende des 14 allergènes en tête. C'est la même matrice, transposée.

import { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  ALLERGENS,
  getAllergensForItem,
  getAllAllergens,
  hasSaladSide,
} from '../data/allergens.js';
import { MENU_ITEMS, MENU_GROUPS } from '../data/menuMeta.js';

const ALLERGEN_KEYS = Object.keys(ALLERGENS);

export default function AllergensMatrix({ onClose, phone, phoneDisplay }) {
  // Escape pour fermer + verrou du scroll de fond, comme les bottom sheets
  // du site actuel.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const groups = MENU_GROUPS.map((g) => ({
    ...g,
    items: MENU_ITEMS.filter((it) => it.category === g.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="rf-modal" onClick={onClose} role="presentation">
      <div
        className="rf-modal__sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-allergens-title"
      >
        <header className="rf-modal__head">
          <div>
            <span className="rf-section__kicker">Information légale</span>
            <h2 id="rf-allergens-title" className="rf-modal__title">Allergènes</h2>
          </div>
          <button type="button" className="rf-iconbtn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <div className="rf-modal__body">
          <p className="rf-allerg__intro">
            Les 14 allergènes à déclaration obligatoire (UE / Suisse, OSAlEC art. 3).
            Cette liste couvre l'ensemble de la carte.
          </p>

          <ul className="rf-allerg__legend">
            {ALLERGEN_KEYS.map((k) => (
              <li key={k} className="rf-allerg__chip rf-allerg__chip--legend">
                {ALLERGENS[k].name}
              </li>
            ))}
          </ul>

          {groups.map((group) => (
            <section key={group.id} className="rf-allerg__group">
              <h3 className="rf-allerg__group-title">{group.label}</h3>
              <ul className="rf-allerg__list">
                {group.items.map((item) => {
                  const a = getAllergensForItem(item.id);
                  const all = getAllAllergens(a);
                  const salade = hasSaladSide(a);

                  return (
                    <li key={item.id} className="rf-allerg__row">
                      <span className="rf-allerg__dish">{item.name}</span>

                      {a.isComposite ? (
                        <span className="rf-allerg__none">Selon votre composition</span>
                      ) : all.length === 0 ? (
                        <span className="rf-allerg__ok">Sans allergène majeur</span>
                      ) : (
                        <ul className="rf-allerg__chips">
                          {all.map((k) => (
                            <li key={k} className="rf-allerg__chip">{ALLERGENS[k]?.name || k}</li>
                          ))}
                        </ul>
                      )}

                      {salade && (
                        <span className="rf-allerg__note">
                          Dont la salade d'accompagnement
                        </span>
                      )}
                      {a.traces?.length > 0 && (
                        <span className="rf-allerg__note">
                          Traces : {a.traces.map((k) => ALLERGENS[k]?.name || k).join(', ')}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <p className="rf-allerg__warning">
            Nos plats sont préparés dans une cuisine unique : une contamination
            croisée ne peut jamais être totalement exclue.
            {phone && (
              <>
                {' '}Pour toute allergie sévère, appelez-nous au{' '}
                <a href={`tel:${phone}`}>{phoneDisplay || phone}</a> avant de commander.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
