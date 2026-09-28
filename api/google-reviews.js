// api/google-reviews.js — Avis Google de la fiche KaïKaï (Google Places API New)
//
// Le navigateur n'appelle QUE cette route : la clé Google reste côté serveur
// (GOOGLE_PLACES_API_KEY, variable Vercel). Réponse : note moyenne, nombre
// d'avis, jusqu'à 5 avis (ceux que Google fournit), lien vers la fiche.
//
// Fiche : celle de RESTAURANT_INFO (src/data/restaurant.js). L'identifiant de
// lieu vient de GOOGLE_PLACE_ID si défini, sinon d'une recherche textuelle
// (nom + adresse, biaisée sur les coordonnées du restaurant), faite une fois
// puis mémorisée.
//
// Cache 24 h, à deux niveaux :
//   · Cache-Control s-maxage=86400 → le CDN de Vercel sert la réponse à tous
//     les visiteurs pendant 24 h sans rappeler la fonction ;
//   · mémoire de l'instance (Fluid Compute) en second rideau, avec repli sur
//     la dernière réponse connue si Google échoue.
//
// Sans clé, ou en cas d'erreur sans réponse en réserve : 204, et le client
// masque la section. Rien ne casse.
//
// Attribution Google : la réponse transporte le nom, la photo et le lien de
// chaque auteur (authorAttribution) ainsi que le lien Google Maps de la fiche ;
// le client les affiche tels quels, comme l'exigent les conditions de Places.

import { RESTAURANT_INFO } from '../src/data/restaurant.js';

const TTL_MS = 24 * 60 * 60 * 1000;
const PLACES = 'https://places.googleapis.com/v1';
const DETAIL_FIELDS = 'id,displayName,rating,userRatingCount,googleMapsUri,reviews';

let cache = { at: 0, body: null, placeId: process.env.GOOGLE_PLACE_ID || RESTAURANT_INFO.google_place_id || null };

async function google(path, key, init = {}) {
  const res = await fetch(`${PLACES}${path}`, {
    ...init,
    headers: { 'X-Goog-Api-Key': key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Places ${res.status} ${path.split('?')[0]} ${text.slice(0, 160)}`);
  }
  return res.json();
}

// Recherche textuelle → identifiant de lieu de la fiche KaïKaï.
async function resolvePlaceId(key) {
  const { lat, lng } = RESTAURANT_INFO.coordinates || {};
  const body = {
    textQuery: `${RESTAURANT_INFO.name}, ${RESTAURANT_INFO.address}`,
    languageCode: 'fr',
    regionCode: 'CH',
    maxResultCount: 1,
    ...(lat && lng ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 500 } } } : {}),
  };
  const data = await google('/places:searchText', key, {
    method: 'POST',
    headers: { 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress' },
    body: JSON.stringify(body),
  });
  const place = (data.places || [])[0];
  if (!place?.id) throw new Error('place_not_found');
  console.info('[KaïKaï google-reviews] fiche résolue :', place.displayName?.text, '—', place.formattedAddress, '—', place.id);
  return place.id;
}

// Détails de la fiche : note, nombre d'avis, avis (5 max), lien Google Maps.
async function fetchDetails(key, placeId) {
  const p = await google(`/places/${encodeURIComponent(placeId)}?languageCode=fr&regionCode=CH`, key, {
    headers: { 'X-Goog-FieldMask': DETAIL_FIELDS },
  });
  const reviews = (p.reviews || []).map((r, i) => ({
    id: r.name || String(i),
    author: r.authorAttribution?.displayName || 'Client Google',
    authorUri: r.authorAttribution?.uri || null,
    photo: r.authorAttribution?.photoUri || null,
    rating: Number(r.rating) || 0,
    when: r.relativePublishTimeDescription || '',
    time: r.publishTime || null,
    text: (r.text?.text || r.originalText?.text || '').trim(),
  }));
  return {
    provider: 'Google',
    placeId: p.id,
    name: p.displayName?.text || RESTAURANT_INFO.name,
    rating: Number(p.rating) || 0,
    count: Number(p.userRatingCount) || 0,
    mapsUri: p.googleMapsUri || RESTAURANT_INFO.google_page,
    reviews,
    fetchedAt: new Date().toISOString(),
  };
}

const cdnCache = (res) => res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    // Non configuré : le client masque la section. Le CDN garde ce 204 dix
    // minutes pour ne pas rappeler la fonction à chaque visite.
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    return res.status(204).end();
  }

  if (cache.body && Date.now() - cache.at < TTL_MS) {
    cdnCache(res);
    return res.status(200).json(cache.body);
  }

  try {
    if (!cache.placeId) cache.placeId = await resolvePlaceId(key);
    const body = await fetchDetails(key, cache.placeId);
    cache = { ...cache, at: Date.now(), body };
    cdnCache(res);
    return res.status(200).json(body);
  } catch (err) {
    console.error('[KaïKaï google-reviews]', err.message);
    if (cache.body) {
      // Google indisponible : on sert la dernière réponse connue.
      cdnCache(res);
      return res.status(200).json(cache.body);
    }
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(204).end();
  }
}
